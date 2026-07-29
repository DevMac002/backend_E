const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireNotBanned } = require('../middlewares/status.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { ChurchSiteConfig } = require('../models');

const router = express.Router();
const CONFIG_KEY = 'homepage';

router.get('/content', async (_req, res) => {
  const config = await ChurchSiteConfig.findOne({ where: { config_key: CONFIG_KEY } });
  res.json({ content: config?.content || null });
});

router.put('/content', authMiddleware, requireNotBanned, requireRole('admin', 'superadmin'), async (req, res) => {
  if (!req.body?.content || typeof req.body.content !== 'object' || Array.isArray(req.body.content)) {
    return res.status(400).json({ message: 'Le contenu du site est invalide' });
  }

  const [config] = await ChurchSiteConfig.upsert({
    config_key: CONFIG_KEY,
    content: req.body.content,
  });
  return res.json({ message: 'Accueil mis à jour', content: config.content || req.body.content });
});

module.exports = router;
