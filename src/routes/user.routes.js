const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { requireNotBanned } = require('../middlewares/status.middleware');
const upload = require('../middlewares/upload.middleware');
const controller = require('../controllers/user.controller');

const router = express.Router();

router.get('/me', authMiddleware, requireNotBanned, controller.getMe);
router.put('/me', authMiddleware, requireNotBanned, controller.updateMe);
router.post('/me/avatar', authMiddleware, requireNotBanned, upload.single('file'), controller.uploadAvatar);
router.delete('/me', authMiddleware, requireNotBanned, controller.deleteMe);
router.get('/leaderboard/foi', authMiddleware, requireNotBanned, controller.getLeaderboard);
router.get('/logs/roles', authMiddleware, requireNotBanned, requireRole('superadmin'), controller.getRoleLogs);
router.get('/', authMiddleware, requireNotBanned, requireRole('admin', 'superadmin'), controller.listUsers);
router.get('/:id', authMiddleware, requireNotBanned, controller.getUserById);
router.get('/:id/rewards', authMiddleware, requireNotBanned, controller.getUserRewards);
router.put('/:id/role', authMiddleware, requireNotBanned, requireRole('admin', 'superadmin'), controller.updateUserRole);
router.put('/:id/status', authMiddleware, requireNotBanned, requireRole('superadmin'), controller.updateUserStatus);
router.put('/:id/ban', authMiddleware, requireNotBanned, requireRole('admin', 'superadmin'), controller.banUser);
router.post('/:id/reward', authMiddleware, requireNotBanned, requireRole('admin', 'superadmin'), controller.rewardUser);
router.delete('/:id/admin', authMiddleware, requireNotBanned, requireRole('superadmin'), controller.adminDeleteUser);

module.exports = router;
