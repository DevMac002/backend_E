const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireNotBanned } = require('../middlewares/status.middleware');
const { Notification } = require('../models');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');

const router = express.Router();

router.get('/', authMiddleware, requireNotBanned, async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const [notifications, total] = await Promise.all([
    Notification.findAll({ where: { user_id: req.user.id }, order: [['created_at', 'DESC']], limit, offset }),
    Notification.count({ where: { user_id: req.user.id } }),
  ]);
  res.json(buildPaginatedResponse(notifications, total, page, limit));
});

router.put('/:id/read', authMiddleware, requireNotBanned, async (req, res) => {
  const notification = await Notification.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!notification) return res.status(404).json({ message: 'Notification introuvable' });
  await notification.update({ is_read: true });
  res.json(notification);
});

router.put('/read-all', authMiddleware, requireNotBanned, async (req, res) => {
  await Notification.update({ is_read: true }, { where: { user_id: req.user.id } });
  res.json({ message: 'Notifications marquées comme lues' });
});

router.delete('/:id', authMiddleware, requireNotBanned, async (req, res) => {
  const notification = await Notification.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!notification) return res.status(404).json({ message: 'Notification introuvable' });
  await notification.destroy();
  res.json({ message: 'Notification supprimée' });
});

router.get('/unread-count', authMiddleware, requireNotBanned, async (req, res) => {
  const count = await Notification.count({ where: { user_id: req.user.id, is_read: false } });
  res.json({ count });
});

module.exports = router;
