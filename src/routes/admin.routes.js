const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireNotBanned } = require('../middlewares/status.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { User, Post, Group, Message, sequelize } = require('../models');

const router = express.Router();

router.get('/stats', authMiddleware, requireNotBanned, requireRole('admin', 'superadmin'), async (req, res) => {
  const [totalUsers, totalPosts, totalGroups, totalMessages, bannedUsers, activeToday] = await Promise.all([
    User.count(),
    Post.count(),
    Group.count(),
    Message.count(),
    User.count({ where: { is_banned: true } }),
    User.count({ where: sequelize.where(sequelize.fn('date', sequelize.col('created_at')), sequelize.fn('current_date')) }),
  ]);

  const postsByType = await Post.findAll({ attributes: ['type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']], group: ['type'] });
  res.json({ total_users: totalUsers, total_posts: totalPosts, total_groups: totalGroups, total_messages: totalMessages, banned_users: bannedUsers, active_today: activeToday, posts_by_type: Object.fromEntries(postsByType.map((row) => [row.type, Number(row.get('count'))])) });
});

router.get('/stats/growth', authMiddleware, requireNotBanned, requireRole('admin', 'superadmin'), async (req, res) => {
  const rows = await sequelize.query(
    "SELECT DATE(created_at) AS day, COUNT(*) AS count FROM users GROUP BY DATE(created_at) ORDER BY day DESC LIMIT 30",
    { type: sequelize.QueryTypes.SELECT }
  );
  res.json(rows);
});

router.get('/logs', authMiddleware, requireNotBanned, requireRole('superadmin'), async (req, res) => {
  const logs = await require('../models').RoleChangeLog.findAll({ order: [['created_at', 'DESC']], limit: 100 });
  res.json(logs);
});

module.exports = router;
