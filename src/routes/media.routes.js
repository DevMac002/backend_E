const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireNotBanned } = require('../middlewares/status.middleware');
const { Media } = require('../models');

const router = express.Router();

router.get('/:id', async (req, res) => {
  const media = await Media.findByPk(req.params.id);

  if (!media) {
    return res.status(404).json({
      message: 'Fichier introuvable',
    });
  }

  const mimeType = media.mime_type || 'application/octet-stream';

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', mimeType);
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${media.original_name || media.filename}"`
  );

  const fileSize = media.data.length;
  const range = req.headers.range;

  if (range && mimeType.startsWith('video/')) {
    const parts = range.replace(/bytes=/, '').split('-');

    const start = parseInt(parts[0], 10);
    const end = parts[1]
      ? parseInt(parts[1], 10)
      : fileSize - 1;

    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    return res.end(media.data.slice(start, end + 1));
  }

  res.writeHead(200, {
    'Content-Length': fileSize,
    'Content-Type': mimeType,
    'Cache-Control': 'public, max-age=31536000, immutable',
  });

  return res.end(media.data);
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
