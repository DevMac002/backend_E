const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

async function saveUploadedFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  const target = path.join(uploadDir, name);

  if (file.mimetype.startsWith('image/')) {
    await sharp(file.buffer).resize({ width: 1200 }).jpeg({ quality: 80 }).toFile(target);
  } else if (file.mimetype.startsWith('video/')) {
    fs.writeFileSync(target, file.buffer);
  } else {
    fs.writeFileSync(target, file.buffer);
  }

  return `/media/${name}`;
}

module.exports = { saveUploadedFile };
