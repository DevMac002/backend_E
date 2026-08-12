require('dotenv').config();
const dns = require('dns');
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
const express = require('express');
require('express-async-errors');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const postRoutes = require('./routes/post.routes');
const groupRoutes = require('./routes/group.routes');
const messageRoutes = require('./routes/message.routes');
const notificationRoutes = require('./routes/notification.routes');
const searchRoutes = require('./routes/search.routes');
const adminRoutes = require('./routes/admin.routes');
const mediaRoutes = require('./routes/media.routes');
const storyRoutes = require('./routes/story.routes');
const logsRoutes = require('./routes/logs.routes');
const siteRoutes = require('./routes/site.routes');
const docsRoutes = require('./docs.routes');
const dbMiddleware = require('./middlewares/db.middleware');
const auditMiddleware = require('./middlewares/audit.middleware');

const app = express();

// Render and most managed hosts run the app behind a proxy.bbbbbb
// This lets express-rate-limit trust X-Forwarded-For without rejecting requests.
app.set('trust proxy', 1);

// A nonce keeps the public /logs page compatible with a strict CSP without
// enabling unsafe-inline for every other response.
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isLocalhostOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

const corsMiddleware = (req, res, next) => {
  const corsOptions = {
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.length > 0) {
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        if (process.env.NODE_ENV !== 'production' && isLocalhostOrigin(origin)) {
          return callback(null, true);
        }

        return callback(new Error('Origine non autorisée par CORS'));
      }

      if (process.env.NODE_ENV !== 'production' && isLocalhostOrigin(origin)) {
        return callback(null, true);
      }

      const requestOrigin = `${req.protocol}://${req.get('host')}`;
      return origin === requestOrigin
        ? callback(null, true)
        : callback(new Error('Origine non autorisée par CORS'));
    },
    credentials: true,
  };

  return cors(corsOptions)(req, res, next);
};

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "https:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(corsMiddleware);
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true }));

// Kept before rate limiting so rejected requests are audited as well.
app.use(auditMiddleware);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'epika-social' }));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);
app.use(dbMiddleware);

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/posts', postRoutes);
app.use('/groups', groupRoutes);
app.use('/messages', messageRoutes);
app.use('/notifications', notificationRoutes);
app.use('/search', searchRoutes);
app.use('/admin', adminRoutes);
app.use('/media', mediaRoutes);
app.use('/stories', storyRoutes);
app.use('/logs', logsRoutes);
app.use('/site', siteRoutes);
app.use('/docs', docsRoutes);

// `site-web` was the former standalone landing page. Keep old bookmarks
// working, but use the React homepage as the single public experience.
app.get(['/site-web', '/site-web/'], (_req, res) => res.redirect(301, '/'));
app.get('/site-web/*', (_req, res) => res.redirect(301, '/'));

const webAppDist = path.join(__dirname, '..', 'web-app', 'dist');
const webAppIndex = path.join(webAppDist, 'index.html');

if (fs.existsSync(webAppDist) && fs.existsSync(webAppIndex)) {
  app.use(express.static(webAppDist));

  app.get('*', (req, res, next) => {
    const apiPrefixes = [
      '/auth',
      '/users',
      '/posts',
      '/groups',
      '/messages',
      '/notifications',
      '/search',
      '/admin',
      '/media',
      '/logs',
      '/health',
      '/site-web',
      '/site',
    ];

    if (apiPrefixes.some((prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`))) {
      return next();
    }

    return res.sendFile(webAppIndex);
  });
}

app.use((error, _req, res, _next) => {
  console.error('========================');
  console.error('ERREUR SERVEUR');
  console.error(error);
  console.error(error.stack);
  console.error('========================');

  if (error?.message === 'Origine non autorisée par CORS') {
    return res.status(403).json({
      message: 'Origine non autorisée',
      error: error.message,
    });
  }

  if (error?.name === 'MulterError') {
    return res.status(400).json({
      message: 'Fichier invalide ou trop volumineux',
      error: error.message,
    });
  }

  return res.status(500).json({
    message: 'Erreur serveur',
    error: error.message,
    stack: error.stack,
  });
});


module.exports = { app };
