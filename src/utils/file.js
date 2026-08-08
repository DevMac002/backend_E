const crypto = require('crypto');
const sharp = require('sharp');
const { Media } = require('../models');

const MAX_UPLOAD_SIZE_BYTES = Number(process.env.UPLOAD_MAX_SIZE_MB || 25) * 1024 * 1024;

async function saveUploadedFile(file, ownerId = null, type = 'generic') {
  if (!file || !file.buffer) {
    throw new Error('Aucun fichier à enregistrer');
  }
  if (file.buffer.length > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error(`Le fichier dépasse la taille maximale de ${process.env.UPLOAD_MAX_SIZE_MB || 25} Mo`);
  }

  const originalName = file.originalname || null;
  const mime = file.mimetype || 'application/octet-stream';

  // Handle images with sharp for validation and resizing; for other media types
  // (video, audio, etc.) store the raw buffer as-is and preserve mime/type.
  let filename;
  let dataBuffer;
  let mimeType;

  if (mime.startsWith('image/')) {
    // Use sharp to normalize images to JPEG and limit dimensions.
    // If sharp cannot decode the buffer (unsupported image format),
    // fallback to storing the original buffer rather than failing the request.
    filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.jpg`;
    try {
      dataBuffer = await sharp(file.buffer, { limitInputPixels: 40_000_000 })
        .rotate()
        .resize({ width: 1200, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      mimeType = 'image/jpeg';
    } catch (sharpError) {
      // Log and fallback to raw buffer. Some formats (ex: HEIC) may not be
      // supported by the system libvips used by sharp.
      console.warn('[saveUploadedFile] sharp failed, falling back to raw buffer:', sharpError.message);
      // Keep original extension if present, otherwise use .bin
      const extMatch = originalName && originalName.match(/\.([a-z0-9]+)$/i);
      const ext = extMatch ? `.${extMatch[1]}` : '';
      filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
      dataBuffer = file.buffer;
      mimeType = mime;
    }
  } else {
    // Non-image files: keep original extension if available
    const extMatch = originalName && originalName.match(/\.([a-z0-9]+)$/i);
    const ext = extMatch ? `.${extMatch[1]}` : '';
    filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    dataBuffer = file.buffer;
    mimeType = mime;
  }

  const media = await Media.create({
    filename,
    original_name: originalName,
    mime_type: mimeType,
    size: dataBuffer.length,
    owner_id: ownerId,
    type,
    data: dataBuffer,
  });

  return `/media/${media.id}`;
}

module.exports = { saveUploadedFile };
