const { Post, PollVote, User, Like, Comment, QuizAnswer, Notification, Op } = require('../models');
const { saveUploadedFile } = require('../utils/file');
const upload = require('../middlewares/upload.middleware');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');

async function listPosts(req, res) {
  const { page, limit, offset } = getPaginationParams(req.query);
  const where = { type: 'post' };
  if (req.query.search) where.content = { [Op.like]: `%${req.query.search}%` };
  const [posts, total] = await Promise.all([
    Post.findAll({
      where,
      include: [
        { model: User, attributes: ['id', 'username', 'avatar_path'] },
        { model: Like, attributes: ['user_id'] },
        { model: Comment, include: [{ model: User, attributes: ['id', 'username', 'avatar_path'] }] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    }),
    Post.count({ where }),
  ]);
  res.json(buildPaginatedResponse(posts, total, page, limit));
}

async function createPost(req, res) {
  try {
    const { content, type = 'post', visible_to = 'all', options, reponse_correcte, date_limite } = req.body;
    const isProtectedType = ['annonce', 'sondage', 'quiz', 'predication'].includes(type);
    if (isProtectedType && !['admin', 'superadmin'].includes(req.user.status)) {
      return res.status(403).json({ message: 'Seuls les admins peuvent créer ce type de post' });
    }
    let media_path = null;
    if (req.file) media_path = await saveUploadedFile(req.file);
    const post = await Post.create({ author_id: req.user.id, content, media_path, type, visible_to, options: options || null, reponse_correcte: reponse_correcte || null, date_limite: date_limite || null });
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function listPredications(req, res) {
  const { page, limit, offset } = getPaginationParams(req.query);
  const where = { type: ['annonce', 'sondage', 'quiz', 'predication'] };
  if (req.query.search) where.content = { [Op.like]: `%${req.query.search}%` };
  const [posts, total] = await Promise.all([
    Post.findAll({
      where,
      include: [{ model: User, attributes: ['id', 'username', 'avatar_path'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    }),
    Post.count({ where }),
  ]);
  res.json(buildPaginatedResponse(posts, total, page, limit));
}

async function getPost(req, res) {
  const post = await Post.findByPk(req.params.id, { include: [{ model: User, attributes: ['id', 'username', 'avatar_path'] }] });
  if (!post) return res.status(404).json({ message: 'Post introuvable' });
  res.json(post);
}

async function updatePost(req, res) {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post introuvable' });
  if (post.author_id !== req.user.id && !['admin', 'superadmin'].includes(req.user.status)) return res.status(403).json({ message: 'Accès refusé' });
  const { content, type } = req.body;
  await post.update({ content, type });
  res.json(post);
}

async function deletePost(req, res) {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post introuvable' });
  if (post.author_id !== req.user.id && !['admin', 'superadmin'].includes(req.user.status)) return res.status(403).json({ message: 'Accès refusé' });
  await post.destroy();
  res.json({ message: 'Post supprimé' });
}

async function likePost(req, res) {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post introuvable' });
  const existing = await Like.findOne({ where: { user_id: req.user.id, post_id: post.id } });
  if (existing) return res.status(409).json({ message: 'Vous avez déjà liké ce post' });
  await Like.create({ user_id: req.user.id, post_id: post.id });
  await Notification.create({ user_id: post.author_id, type: 'like', message: `${req.user.username} a aimé votre publication`, payload: { postId: post.id } });
  res.json({ message: 'Post liké' });
}

async function unlikePost(req, res) {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post introuvable' });
  await Like.destroy({ where: { user_id: req.user.id, post_id: post.id } });
  res.json({ message: 'Like retiré' });
}

async function listLikes(req, res) {
  const likes = await Like.findAll({ where: { post_id: req.params.id }, include: [{ model: User, attributes: ['id', 'username', 'avatar_path'] }] });
  res.json(likes);
}

async function listComments(req, res) {
  const comments = await Comment.findAll({ where: { post_id: req.params.id }, include: [{ model: User, attributes: ['id', 'username', 'avatar_path'] }], order: [['created_at', 'ASC']] });
  res.json(comments);
}

async function addComment(req, res) {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post introuvable' });
  const comment = await Comment.create({ post_id: post.id, author_id: req.user.id, content: req.body.content });
  await Notification.create({ user_id: post.author_id, type: 'comment', message: `${req.user.username} a commenté votre publication`, payload: { postId: post.id } });
  res.status(201).json(comment);
}

async function deleteComment(req, res) {
  const comment = await Comment.findByPk(req.params.commentId);
  if (!comment) return res.status(404).json({ message: 'Commentaire introuvable' });
  if (comment.author_id !== req.user.id && !['admin', 'superadmin'].includes(req.user.status)) return res.status(403).json({ message: 'Accès refusé' });
  await comment.destroy();
  res.json({ message: 'Commentaire supprimé' });
}

async function voteOnPost(req, res) {
  const post = await Post.findByPk(req.params.id);
  if (!post || post.type !== 'sondage') return res.status(404).json({ message: 'Sondage introuvable' });
  const { option_index } = req.body;
  await PollVote.create({ user_id: req.user.id, post_id: post.id, option_index });
  const votes = await PollVote.findAll({ where: { post_id: post.id } });
  res.json({ message: 'Vote enregistré', votes });
}

async function getPollResults(req, res) {
  const post = await Post.findByPk(req.params.id);
  if (!post || post.type !== 'sondage') return res.status(404).json({ message: 'Sondage introuvable' });
  const votes = await PollVote.findAll({ where: { post_id: post.id } });
  res.json({ postId: post.id, votes });
}

async function answerQuiz(req, res) {
  const post = await Post.findByPk(req.params.id);
  if (!post || post.type !== 'quiz') return res.status(404).json({ message: 'Quiz introuvable' });
  const { answer } = req.body;
  const existing = await QuizAnswer.findOne({ where: { user_id: req.user.id, post_id: post.id } });
  if (existing) return res.status(409).json({ message: 'Vous avez déjà répondu à ce quiz' });
  await QuizAnswer.create({ user_id: req.user.id, post_id: post.id, answer });
  const correct = answer === post.reponse_correcte;
  res.json({ correct, answer });
}

async function getQuizResults(req, res) {
  const post = await Post.findByPk(req.params.id);
  if (!post || post.type !== 'quiz') return res.status(404).json({ message: 'Quiz introuvable' });
  const answers = await QuizAnswer.findAll({ where: { post_id: post.id }, include: [{ model: User, attributes: ['id', 'username'] }] });
  res.json({ postId: post.id, answers });
}

module.exports = { listPosts, listPredications, createPost, getPost, updatePost, deletePost, likePost, unlikePost, listLikes, listComments, addComment, deleteComment, voteOnPost, getPollResults, answerQuiz, getQuizResults };
