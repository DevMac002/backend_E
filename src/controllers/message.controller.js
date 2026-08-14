const { Message, User, Group, GroupMember, Notification, Op, sequelize } = require('../models');
const { triggerRealtimeEvent, isRealtimeEnabled } = require('../config/realtime');

async function listConversations(req, res) {
  const currentUserId = req.user.id;

  const [rows] = await sequelize.query(`
    WITH ranked_messages AS (
      SELECT
        CASE
          WHEN m.sender_id = :currentUserId THEN m.receiver_id
          ELSE m.sender_id
        END AS other_user_id,
        m.id,
        m.content,
        m.created_at,
        ROW_NUMBER() OVER (
          PARTITION BY CASE
            WHEN m.sender_id = :currentUserId THEN m.receiver_id
            ELSE m.sender_id
          END
          ORDER BY m.created_at DESC, m.id DESC
        ) AS rn
      FROM messages m
      WHERE m.group_id IS NULL
        AND (m.sender_id = :currentUserId OR m.receiver_id = :currentUserId)
    )
    SELECT
      rm.other_user_id,
      u.username,
      u.avatar_path,
      rm.content AS last_message_content,
      rm.created_at AS last_message_created_at,
      COALESCE(unread.unread_count, 0) AS unread_count
    FROM ranked_messages rm
    JOIN users u ON u.id = rm.other_user_id
    LEFT JOIN (
      SELECT
        CASE
          WHEN m.sender_id = :currentUserId THEN m.receiver_id
          ELSE m.sender_id
        END AS other_user_id,
        COUNT(*) AS unread_count
      FROM messages m
      WHERE m.group_id IS NULL
        AND m.receiver_id = :currentUserId
        AND m.is_read = false
      GROUP BY CASE
        WHEN m.sender_id = :currentUserId THEN m.receiver_id
        ELSE m.sender_id
      END
    ) AS unread ON unread.other_user_id = rm.other_user_id
    WHERE rm.rn = 1
    ORDER BY rm.created_at DESC, rm.id DESC
  `, {
    replacements: { currentUserId },
  });

  const conversations = rows.map((row) => ({
    user: {
      id: Number(row.other_user_id),
      username: row.username,
      avatar_path: row.avatar_path,
    },
    lastMessage: {
      content: row.last_message_content,
      created_at: row.last_message_created_at,
    },
    unreadCount: Number(row.unread_count || 0),
  }));

  res.json({ conversations });
}

async function listMessages(req, res) {
  const group = await Group.findByPk(req.params.conversationId);
  if (group) {
    const membership = await GroupMember.findOne({ where: { group_id: group.id, user_id: req.user.id } });
    if (!membership) return res.status(403).json({ message: 'Vous devez être membre du groupe pour voir ses messages' });
    const messages = await Message.findAll({
      where: { group_id: group.id },
      include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'avatar_path'] }],
      order: [['created_at', 'ASC']],
    });
    return res.json(messages);
  }

  const otherUser = await User.findByPk(req.params.conversationId);
  if (!otherUser) return res.status(404).json({ message: 'Conversation introuvable' });
  const messages = await Message.findAll({
    where: {
      [Op.or]: [
        { sender_id: req.user.id, receiver_id: otherUser.id },
        { sender_id: otherUser.id, receiver_id: req.user.id },
      ],
    },
    include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'avatar_path'] }],
    order: [['created_at', 'ASC']],
  });
  res.json(messages);
}

async function createMessage(req, res) {
  const hasGroup = Boolean(req.body.group_id);
  const hasReceiver = Boolean(req.body.receiver_id);
  if (hasGroup === hasReceiver) return res.status(400).json({ message: 'Indiquez un groupe ou un destinataire, mais pas les deux' });

  if (hasGroup) {
    const membership = await GroupMember.findOne({ where: { group_id: req.body.group_id, user_id: req.user.id } });
    if (!membership) return res.status(403).json({ message: 'Vous devez être membre du groupe pour y envoyer un message' });
  } else {
    const receiver = await User.findByPk(req.body.receiver_id);
    if (!receiver || receiver.is_banned) return res.status(404).json({ message: 'Destinataire introuvable ou inaccessible' });
  }

  if (!req.body.content && !req.body.media_path) return res.status(400).json({ message: 'Le message ne peut pas être vide' });
  const message = await Message.create({
    group_id: req.body.group_id || null,
    sender_id: req.user.id,
    receiver_id: req.body.receiver_id || null,
    content: req.body.content || null,
    media_path: req.body.media_path || null,
  });
  if (req.body.receiver_id) {
    await Notification.create({ user_id: req.body.receiver_id, type: 'message', message: `${req.user.username} vous a envoyé un message`, payload: { messageId: message.id } });
    if (isRealtimeEnabled) {
      await triggerRealtimeEvent(`private-user-${req.body.receiver_id}`, 'message:receive', { messageId: message.id, senderId: req.user.id, content: message.content });
    }
  }
  res.status(201).json(message);
}

async function markMessageAsRead(req, res) {
  const message = await Message.findByPk(req.params.id);
  if (!message) return res.status(404).json({ message: 'Message introuvable' });
  if (message.receiver_id !== req.user.id) return res.status(403).json({ message: 'Seul le destinataire peut marquer ce message comme lu' });
  await message.update({ is_read: true });
  res.json(message);
}

async function markConversationAsRead(req, res) {
  await Message.update({ is_read: true }, { where: { group_id: req.params.conversationId, receiver_id: req.user.id } });
  res.json({ message: 'Conversation marquée comme lue' });
}

async function getUnreadCount(req, res) {
  const count = await Message.count({ where: { receiver_id: req.user.id, is_read: false } });
  res.json({ count });
}

module.exports = { listConversations, listMessages, createMessage, markMessageAsRead, markConversationAsRead, getUnreadCount };
