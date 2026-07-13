const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireNotBanned } = require('../middlewares/status.middleware');
const { User, Post, Group, Op } = require('../models');

const router = express.Router();

router.get('/', authMiddleware, requireNotBanned, async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ users: [], posts: [], groups: [] });

  const [users, posts, groups] = await Promise.all([
    User.findAll({ where: { username: { [Op.like]: `%${q}%` } }, attributes: ['id', 'username', 'avatar_path'] }),
    Post.findAll({ where: { content: { [Op.like]: `%${q}%` } }, attributes: ['id', 'content', 'type'] }),
    Group.findAll({ where: { nom: { [Op.like]: `%${q}%` } }, attributes: ['id', 'nom', 'description'] }),
  ]);

  res.json({ users, posts, groups });
});

router.get('/users', authMiddleware, requireNotBanned, async (req, res) => {
  const q = (req.query.q || '').trim();
  const users = await User.findAll({ where: q ? { username: { [Op.like]: `%${q}%` } } : {}, attributes: ['id', 'username', 'avatar_path'] });
  res.json(users);
});

router.get('/groups', authMiddleware, requireNotBanned, async (req, res) => {
  const q = (req.query.q || '').trim();
  const groups = await Group.findAll({ where: q ? { nom: { [Op.like]: `%${q}%` } } : {}, attributes: ['id', 'nom', 'description'] });
  res.json(groups);
});

module.exports = router;
