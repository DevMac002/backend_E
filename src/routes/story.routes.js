const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireNotBanned } = require('../middlewares/status.middleware');
const upload = require('../middlewares/upload.middleware');
const { listStories, getStory, createStory, deleteStory, markStoryViewed, listStoryViewers, listUserStories } = require('../controllers/story.controller');

const router = express.Router();

router.get('/', authMiddleware, requireNotBanned, listStories);
router.get('/user/:userId', authMiddleware, requireNotBanned, listUserStories);
router.get('/:id', authMiddleware, requireNotBanned, getStory);
router.post('/', authMiddleware, requireNotBanned, upload.single('media'), createStory);
router.post('/:id/view', authMiddleware, requireNotBanned, markStoryViewed);
router.get('/:id/viewers', authMiddleware, requireNotBanned, listStoryViewers);
router.delete('/:id', authMiddleware, requireNotBanned, deleteStory);

module.exports = router;
