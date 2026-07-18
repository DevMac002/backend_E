const crypto = require('crypto');
const sharp = require('sharp');
const { Media } = require('../models');

const MAX_UPLOAD_SIZE_BYTES = Number(process.env.UPLOAD_MAX_SIZE_MB || 25) * 1024 * 1024;

async function saveUploadedFile(file, ownerId = null, type = 'generic') {
  if (!file || !file.buffer) {
    throw new Error('Aucun fichier à enregistrer');
  }
  if (file.buffer.length > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error('Le fichier dépasse la taille maximale de 4 Mo');
  }

  // Images are decoded and re-encoded, which validates their actual content
  // instead of trusting a browser-supplied MIME type or extension.
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.jpg`;
  const dataBuffer = await sharp(file.buffer, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
  const mimeType = 'image/jpeg';

  const media = await Media.create({
    filename,
    original_name: file.originalname || null,
    mime_type: mimeType,
    size: dataBuffer.length,
    owner_id: ownerId,
    type,
    data: dataBuffer,
  });

  return `/media/${media.id}`;
}

module.exports = { saveUploadedFile };
