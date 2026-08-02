const { Op } = require('sequelize');
const { Story, StoryView, User } = require('../models');
const { saveUploadedFile } = require('../utils/file');

async function listStories(req, res) {
  const now = new Date();
  const stories = await Story.findAll({
    where: {
      [Op.or]: [
        { expires_at: null },
        { expires_at: { [Op.gt]: now } },
      ],
    },
    order: [['created_at', 'DESC']],
    limit: 50,
    include: [{ model: User, attributes: ['id', 'username', 'avatar_path'] }],
  });
  res.json(stories);
}

async function listUserStories(req, res) {
  const now = new Date();
  const stories = await Story.findAll({
    where: {
      user_id: req.params.userId,
      [Op.or]: [
        { expires_at: null },
        { expires_at: { [Op.gt]: now } },
      ],
    },
    order: [['created_at', 'DESC']],
    include: [{ model: User, attributes: ['id', 'username', 'avatar_path'] }],
  });
  res.json(stories);
}

async function getStory(req, res) {
  const story = await Story.findByPk(req.params.id, {
    include: [{ model: User, attributes: ['id', 'username', 'avatar_path'] }],
  });
  if (!story) return res.status(404).json({ message: 'Story non trouvée' });
  if (story.expires_at && new Date(story.expires_at) <= new Date()) {
    return res.status(404).json({ message: 'Story expirée' });
  }
  res.json(story);
}

async function createStory(req, res) {
  const { content, expires_at } = req.body;

  if (!req.file && !String(content || '').trim()) {
    return res.status(400).json({ message: 'Le contenu ou un média est requis pour une story' });
  }

  let mediaPath = null;
  let mediaType = null;
  if (req.file) {
    try {
      mediaPath = await saveUploadedFile(req.file, req.user.id, 'story');
      mediaType = req.file.mimetype;
    } catch (error) {
      return res.status(400).json({ message: 'Erreur lors du téléversement du média de la story', error: error.message });
    }
  }

  const expiresAt = expires_at ? new Date(expires_at) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (expires_at && Number.isNaN(expiresAt.getTime())) {
    return res.status(400).json({ message: 'Date d’expiration invalide' });
  }

  const story = await Story.create({
    user_id: req.user.id,
    content,
    media_path: mediaPath,
    media_type: mediaType,
    expires_at: expiresAt,
  });
  res.status(201).json(story);
}

async function markStoryViewed(req, res) {
  const story = await Story.findByPk(req.params.id);
  if (!story) return res.status(404).json({ message: 'Story non trouvée' });
  if (story.expires_at && new Date(story.expires_at) <= new Date()) {
    return res.status(404).json({ message: 'Story expirée' });
  }

  const [view, created] = await StoryView.findOrCreate({
    where: { story_id: story.id, user_id: req.user.id },
    defaults: { viewed_at: new Date() },
  });

  if (!created) {
    await view.update({ viewed_at: new Date() });
  }

  res.json({ success: true, viewed_at: view.viewed_at });
}

async function listStoryViewers(req, res) {
  const story = await Story.findByPk(req.params.id);
  if (!story) return res.status(404).json({ message: 'Story non trouvée' });

  const viewers = await StoryView.findAll({
    where: { story_id: story.id },
    include: [{ model: User, attributes: ['id', 'username', 'avatar_path'] }],
    order: [['viewed_at', 'DESC']],
  });

  res.json(viewers.map((view) => ({ user: view.User, viewed_at: view.viewed_at })));
}

async function deleteStory(req, res) {
  const story = await Story.findByPk(req.params.id);
  if (!story) return res.status(404).json({ message: 'Story non trouvée' });
  if (story.user_id !== req.user.id && !['admin', 'superadmin'].includes(req.user.status)) {
    return res.status(403).json({ message: 'Non autorisé' });
  }
  await story.destroy();
  res.status(204).send();
}

module.exports = {
  listStories,
  getStory,
  createStory,
  deleteStory,
  markStoryViewed,
  listStoryViewers,
  listUserStories,
};
