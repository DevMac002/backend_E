const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireNotBanned, requireAccess } = require('../middlewares/status.middleware');
const upload = require('../middlewares/upload.middleware');
const controller = require('../controllers/post.controller');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const postLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });

router.get('/', authMiddleware, requireNotBanned, controller.listPosts);
router.get('/predications', authMiddleware, requireNotBanned, controller.listPredications);
router.post('/', authMiddleware, requireNotBanned, requireAccess('posts'), postLimiter, upload.single('file'), controller.createPost);
router.get('/:id', authMiddleware, requireNotBanned, controller.getPost);
router.put('/:id', authMiddleware, requireNotBanned, controller.updatePost);
router.delete('/:id', authMiddleware, requireNotBanned, controller.deletePost);
router.post('/:id/like', authMiddleware, requireNotBanned, controller.likePost);
router.delete('/:id/like', authMiddleware, requireNotBanned, controller.unlikePost);
router.get('/:id/likes', authMiddleware, requireNotBanned, controller.listLikes);
router.get('/:id/comments', authMiddleware, requireNotBanned, controller.listComments);
router.post('/:id/comments', authMiddleware, requireNotBanned, requireAccess('comments'), controller.addComment);
router.delete('/:id/comments/:commentId', authMiddleware, requireNotBanned, controller.deleteComment);
router.post('/:id/vote', authMiddleware, requireNotBanned, controller.voteOnPost);
router.get('/:id/results', authMiddleware, requireNotBanned, controller.getPollResults);
router.post('/:id/answer', authMiddleware, requireNotBanned, controller.answerQuiz);
router.get('/:id/quiz-results', authMiddleware, requireNotBanned, controller.getQuizResults);

module.exports = router;
