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

  const ext = file.originalname ? file.originalname.split('.').pop().toLowerCase() : 'bin';
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
  let dataBuffer = file.buffer;
  let mimeType = file.mimetype || 'application/octet-stream';

  if (file.mimetype.startsWith('image/')) {
    dataBuffer = await sharp(file.buffer).resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
    mimeType = 'image/jpeg';
  }

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
