const { Message, User, Group, Notification } = require('../models');

async function listConversations(req, res) {
  const conversations = await Message.findAll({
    where: { sender_id: req.user.id },
    include: [{ model: User, as: 'receiver', attributes: ['id', 'username', 'avatar_path'] }, { model: Group, attributes: ['id', 'nom'] }],
    order: [['created_at', 'DESC']],
  });
  res.json(conversations);
}

async function listMessages(req, res) {
  const messages = await Message.findAll({
    where: { group_id: req.params.conversationId },
    include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'avatar_path'] }],
    order: [['created_at', 'ASC']],
  });
  res.json(messages);
}

async function createMessage(req, res) {
  const message = await Message.create({
    group_id: req.body.group_id || null,
    sender_id: req.user.id,
    receiver_id: req.body.receiver_id || null,
    content: req.body.content || null,
    media_path: req.body.media_path || null,
  });
  if (req.body.receiver_id) {
    await Notification.create({ user_id: req.body.receiver_id, type: 'message', message: `${req.user.username} vous a envoyé un message`, payload: { messageId: message.id } });
  }
  res.status(201).json(message);
}

async function markMessageAsRead(req, res) {
  const message = await Message.findByPk(req.params.id);
  if (!message) return res.status(404).json({ message: 'Message introuvable' });
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
