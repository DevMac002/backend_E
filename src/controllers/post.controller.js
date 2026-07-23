const { Post, PollVote, User, Like, Comment, QuizAnswer, Notification, Op } = require('../models');
const { saveUploadedFile } = require('../utils/file');
const { triggerRealtimeEvent, isRealtimeEnabled } = require('../config/realtime');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');

const QUIZ_TYPES = ['true_false', 'single_choice', 'multiple_choice'];

function parseJsonValue(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return value;
  }
}

function normaliseQuizConfig(body) {
  const quizType = body.quiz_type || body.quizType;
  if (!QUIZ_TYPES.includes(quizType)) return { error: 'Type de quiz invalide' };

  let choices = parseJsonValue(body.choices ?? body.options);
  let correctAnswers = parseJsonValue(body.correct_answers ?? body.correctAnswers ?? body.reponse_correcte);
  const rawMaxSelections = body.max_selections ?? body.maxSelections;

  if (quizType === 'true_false') {
    choices = [
      { id: 'true', label: 'Vrai' },
      { id: 'false', label: 'Faux' },
    ];
  }

  if (!Array.isArray(choices) || choices.length < 2 || choices.length > 20) {
    return { error: 'Un quiz doit contenir entre 2 et 20 choix' };
  }

  const normalisedChoices = choices.map((choice, index) => ({
    id: String(typeof choice === 'object' && choice !== null ? choice.id ?? index : choice),
    label: String(typeof choice === 'object' && choice !== null ? choice.label ?? '' : choice).trim(),
  }));
  if (normalisedChoices.some((choice) => !choice.label) || new Set(normalisedChoices.map((choice) => choice.id)).size !== normalisedChoices.length) {
    return { error: 'Chaque choix doit avoir un identifiant unique et un libellé' };
  }

  if (!Array.isArray(correctAnswers)) correctAnswers = correctAnswers === undefined || correctAnswers === null ? [] : [correctAnswers];
  const normalisedAnswers = [...new Set(correctAnswers.map(String))];
  const choiceIds = new Set(normalisedChoices.map((choice) => choice.id));
  if (!normalisedAnswers.length || normalisedAnswers.some((answer) => !choiceIds.has(answer))) {
    return { error: 'Indiquez au moins une bonne réponse faisant partie des choix' };
  }

  const maxSelections = quizType === 'multiple_choice'
    ? Number(rawMaxSelections ?? normalisedChoices.length)
    : 1;
  if (!Number.isInteger(maxSelections) || maxSelections < 1 || maxSelections > normalisedChoices.length) {
    return { error: 'Le nombre maximal de choix est invalide' };
  }
  if ((quizType === 'true_false' || quizType === 'single_choice') && normalisedAnswers.length !== 1) {
    return { error: 'Ce type de quiz nécessite une seule bonne réponse' };
  }
  if (quizType === 'multiple_choice' && normalisedAnswers.length > maxSelections) {
    return { error: 'Le nombre de bonnes réponses ne peut pas dépasser le nombre maximal de choix' };
  }

  return {
    config: {
      quiz_type: quizType,
      choices: normalisedChoices,
      correct_answers: normalisedAnswers,
      max_selections: maxSelections,
    },
  };
}

function getQuizConfig(post) {
  const options = parseJsonValue(post.options);
  if (options && !Array.isArray(options) && QUIZ_TYPES.includes(options.quiz_type)) return options;

  // Compatibilité des quiz créés avant les formats structurés.
  const choices = Array.isArray(options) ? options.map((label) => ({ id: String(label), label: String(label) })) : [];
  return {
    quiz_type: 'single_choice',
    choices,
    correct_answers: post.reponse_correcte === null ? [] : [String(post.reponse_correcte)],
    max_selections: 1,
  };
}

function selectedAnswersFromRequest(body) {
  const rawAnswers = parseJsonValue(body.answers ?? body.answer);
  const answers = Array.isArray(rawAnswers) ? rawAnswers : [rawAnswers];
  return [...new Set(answers.filter((answer) => answer !== undefined && answer !== null).map(String))];
}

function postForViewer(post, viewer) {
  const plainPost = post.get ? post.get({ plain: true }) : { ...post };
  const canSeeSolutions = plainPost.author_id === viewer.id || ['admin', 'superadmin'].includes(viewer.status);
  if (plainPost.type !== 'quiz' || canSeeSolutions) return plainPost;

  delete plainPost.reponse_correcte;
  if (plainPost.options && !Array.isArray(plainPost.options)) {
    const { correct_answers: _correctAnswers, ...publicOptions } = plainPost.options;
    plainPost.options = publicOptions;
  }
  return plainPost;
}

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
  res.json(buildPaginatedResponse(posts.map((post) => postForViewer(post, req.user)), total, page, limit));
}

async function createPost(req, res) {
  try {
    const { content, type = 'post', visible_to = 'all', options, reponse_correcte, date_limite } = req.body;
    const isProtectedType = ['annonce', 'sondage', 'quiz', 'predication'].includes(type);
    if (isProtectedType && !['admin', 'superadmin'].includes(req.user.status)) {
      return res.status(403).json({ message: 'Seuls les admins peuvent créer ce type de post' });
    }
    const quiz = type === 'quiz' ? normaliseQuizConfig(req.body) : null;
    if (quiz?.error) return res.status(400).json({ message: quiz.error });
    if (type === 'quiz' && !String(content || '').trim()) return res.status(400).json({ message: 'La question du quiz est obligatoire' });
    if (type === 'post' && !String(content || '').trim() && !req.file) return res.status(400).json({ message: 'Le contenu du post ne peut pas être vide (texte ou média requis)' });
    let media_path = null;
    if (req.file) {
      try {
        media_path = await saveUploadedFile(req.file, req.user.id, 'post');
      } catch (uploadError) {
        return res.status(400).json({ message: 'Erreur lors du téléversement du fichier média', error: uploadError.message });
      }
    }
    const post = await Post.create({
      author_id: req.user.id,
      content,
      media_path,
      type,
      visible_to,
      options: quiz?.config || parseJsonValue(options) || null,
      reponse_correcte: quiz?.config.correct_answers[0] || reponse_correcte || null,
      date_limite: date_limite || null,
    });
    if (isRealtimeEnabled) {
      await triggerRealtimeEvent('public', 'post:new', { postId: post.id, authorId: req.user.id, type: post.type });
    }
    res.status(201).json(post);
  } catch (error) {
    console.error('[post:create]', error.message);
    res.status(500).json({ message: 'Erreur serveur lors de la création du post', error: error.message });
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
  res.json(buildPaginatedResponse(posts.map((post) => postForViewer(post, req.user)), total, page, limit));
}

async function getPost(req, res) {
  const post = await Post.findByPk(req.params.id, { include: [{ model: User, attributes: ['id', 'username', 'avatar_path'] }] });
  if (!post) return res.status(404).json({ message: 'Post introuvable' });
  res.json(postForViewer(post, req.user));
}

async function updatePost(req, res) {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post introuvable' });
  if (post.author_id !== req.user.id && !['admin', 'superadmin'].includes(req.user.status)) return res.status(403).json({ message: 'Accès refusé' });
  const type = req.body.type || post.type;
  if (['annonce', 'sondage', 'quiz', 'predication'].includes(type) && !['admin', 'superadmin'].includes(req.user.status)) {
    return res.status(403).json({ message: 'Seuls les admins peuvent créer ou modifier ce type de post' });
  }
  const quiz = type === 'quiz' && (req.body.quiz_type || req.body.quizType)
    ? normaliseQuizConfig(req.body)
    : null;
  if (quiz?.error) return res.status(400).json({ message: quiz.error });
  if (type === 'quiz' && post.type !== 'quiz' && !quiz) return res.status(400).json({ message: 'Choisissez le format et les réponses du quiz' });
  const content = req.body.content ?? post.content;
  if (type === 'quiz' && !String(content || '').trim()) return res.status(400).json({ message: 'La question du quiz est obligatoire' });
  await post.update({
    content,
    type,
    options: quiz?.config || post.options,
    reponse_correcte: quiz?.config?.correct_answers[0] || post.reponse_correcte,
    date_limite: req.body.date_limite ?? post.date_limite,
  });
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
  if (isRealtimeEnabled) {
    await triggerRealtimeEvent(`private-user-${post.author_id}`, 'notification:new', { type: 'like', postId: post.id });
  }
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
  const content = req.body.content;
  if (!content || !String(content).trim()) return res.status(400).json({ message: 'Le contenu du commentaire est obligatoire' });
  if (String(content).length > 2000) return res.status(400).json({ message: 'Le commentaire ne peut pas dépasser 2000 caractères' });
  const comment = await Comment.create({ post_id: post.id, author_id: req.user.id, content: String(content).trim() });
  await Notification.create({ user_id: post.author_id, type: 'comment', message: `${req.user.username} a commenté votre publication`, payload: { postId: post.id } });
  if (isRealtimeEnabled) {
    await triggerRealtimeEvent(`private-user-${post.author_id}`, 'notification:new', { type: 'comment', postId: post.id });
  }
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
  if (option_index === undefined || option_index === null || !Number.isInteger(Number(option_index)) || Number(option_index) < 0) {
    return res.status(400).json({ message: 'L\'index de l\'option de vote est requis et doit être un entier positif' });
  }
  const existingVote = await PollVote.findOne({ where: { user_id: req.user.id, post_id: post.id } });
  if (existingVote) return res.status(409).json({ message: 'Vous avez déjà voté à ce sondage' });
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
  const config = getQuizConfig(post);
  const answers = selectedAnswersFromRequest(req.body);
  if (!answers.length) return res.status(400).json({ message: 'Sélectionnez au moins une réponse' });
  if (answers.length > config.max_selections) return res.status(400).json({ message: `Vous pouvez sélectionner au maximum ${config.max_selections} choix` });
  const choiceIds = new Set(config.choices.map((choice) => String(choice.id)));
  if (answers.some((answer) => !choiceIds.has(answer))) return res.status(400).json({ message: 'Une ou plusieurs réponses sont invalides' });
  const existing = await QuizAnswer.findOne({ where: { user_id: req.user.id, post_id: post.id } });
  if (existing) return res.status(409).json({ message: 'Vous avez déjà répondu à ce quiz' });
  await QuizAnswer.create({ user_id: req.user.id, post_id: post.id, answer: JSON.stringify(answers) });
  const correctAnswers = [...new Set(config.correct_answers.map(String))];
  const correct = answers.length === correctAnswers.length && answers.every((answer) => correctAnswers.includes(answer));
  res.json({ correct, answers, answer: answers[0] });
}

async function getQuizResults(req, res) {
  const post = await Post.findByPk(req.params.id);
  if (!post || post.type !== 'quiz') return res.status(404).json({ message: 'Quiz introuvable' });
  if (post.author_id !== req.user.id && !['admin', 'superadmin'].includes(req.user.status)) return res.status(403).json({ message: 'Seul l’auteur ou un admin peut voir les résultats détaillés' });
  const answers = await QuizAnswer.findAll({ where: { post_id: post.id }, include: [{ model: User, attributes: ['id', 'username'] }] });
  res.json({
    postId: post.id,
    answers: answers.map((answer) => ({
      ...answer.get({ plain: true }),
      answers: parseJsonValue(answer.answer) || [answer.answer],
    })),
  });
}

module.exports = { listPosts, listPredications, createPost, getPost, updatePost, deletePost, likePost, unlikePost, listLikes, listComments, addComment, deleteComment, voteOnPost, getPollResults, answerQuiz, getQuizResults };
