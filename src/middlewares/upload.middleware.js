const multer = require('multer');
const storage = multer.memoryStorage();

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']);
const ALLOWED_MEDIA_TYPES = new Set([...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]);

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.UPLOAD_MAX_SIZE_MB || 90) * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MEDIA_TYPES.has(file.mimetype)) {
      return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
    }
    return callback(null, true);
  },
});

module.exports = upload;
module.exports.ALLOWED_IMAGE_TYPES = ALLOWED_IMAGE_TYPES;
module.exports.ALLOWED_VIDEO_TYPES = ALLOWED_VIDEO_TYPES;