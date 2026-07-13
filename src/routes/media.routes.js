const express = require('express');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireNotBanned } = require('../middlewares/status.middleware');
const { Post } = require('../models');

const router = express.Router();
const uploadDir = path.join(__dirname, '../../uploads');

router.get('/:filename', async (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Fichier introuvable' });
  res.sendFile(filePath);
});

router.delete('/:filename', authMiddleware, requireNotBanned, async (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Fichier introuvable' });
  const post = await Post.findOne({ where: { media_path: `/media/${req.params.filename}` } });
  if (!post && !['admin', 'superadmin'].includes(req.user.status)) return res.status(403).json({ message: 'Accès refusé' });
  fs.unlinkSync(filePath);
  res.json({ message: 'Fichier supprimé' });
});

module.exports = router;
