const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireNotBanned, requireAccess } = require('../middlewares/status.middleware');
const controller = require('../controllers/message.controller');

const router = express.Router();

router.get('/conversations', authMiddleware, requireNotBanned, controller.listConversations);
router.get('/unread-count', authMiddleware, requireNotBanned, controller.getUnreadCount);
router.get('/:conversationId', authMiddleware, requireNotBanned, controller.listMessages);
router.post('/', authMiddleware, requireNotBanned, requireAccess('messages'), controller.createMessage);
router.put('/:id/read', authMiddleware, requireNotBanned, controller.markMessageAsRead);
router.put('/conversations/:conversationId/read-all', authMiddleware, requireNotBanned, controller.markConversationAsRead);

module.exports = router;
