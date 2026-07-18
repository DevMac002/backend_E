const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireNotBanned } = require('../middlewares/status.middleware');
const { Media } = require('../models');

const router = express.Router();

router.get('/:id', async (req, res) => {
  const media = await Media.findByPk(req.params.id);
  if (!media) return res.status(404).json({ message: 'Fichier introuvable' });
  res.set('Content-Type', media.mime_type);
  res.set('Content-Length', String(media.size));
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  const safeName = String(media.original_name || media.filename).replace(/[\r\n"\\]/g, '_');
  res.set('Content-Disposition', `inline; filename="${safeName}"`);
  res.send(media.data);
});

router.delete('/:id', authMiddleware, requireNotBanned, async (req, res) => {
  const media = await Media.findByPk(req.params.id);
  if (!media) return res.status(404).json({ message: 'Fichier introuvable' });
  const isOwner = media.owner_id === req.user.id;
  if (!isOwner && !['admin', 'superadmin'].includes(req.user.status)) {
    return res.status(403).json({ message: 'Accès refusé' });
  }
  await media.destroy();
  res.json({ message: 'Fichier supprimé' });
});

module.exports = router;
