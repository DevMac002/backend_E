const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireNotBanned } = require('../middlewares/status.middleware');
const controller = require('../controllers/group.controller');

const router = express.Router();

router.get('/', authMiddleware, requireNotBanned, controller.listGroups);
router.get('/discover', authMiddleware, requireNotBanned, controller.discoverGroups);
router.get('/:id', authMiddleware, requireNotBanned, controller.getGroup);
router.post('/', authMiddleware, requireNotBanned, controller.createGroup);
router.put('/:id', authMiddleware, requireNotBanned, controller.updateGroup);
router.delete('/:id', authMiddleware, requireNotBanned, controller.deleteGroup);
router.get('/:id/members', authMiddleware, requireNotBanned, controller.listMembers);
router.post('/:id/members', authMiddleware, requireNotBanned, controller.addMember);
router.delete('/:id/members/:userId', authMiddleware, requireNotBanned, controller.removeMember);
router.post('/:id/leave', authMiddleware, requireNotBanned, controller.leaveGroup);
router.put('/:id/members/:userId/role', authMiddleware, requireNotBanned, controller.updateMemberRole);

module.exports = router;
