require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const postRoutes = require('./routes/post.routes');
const groupRoutes = require('./routes/group.routes');
const messageRoutes = require('./routes/message.routes');
const notificationRoutes = require('./routes/notification.routes');
const searchRoutes = require('./routes/search.routes');
const adminRoutes = require('./routes/admin.routes');
const mediaRoutes = require('./routes/media.routes');
const swaggerRoutes = require('./routes/swagger.routes');
const logsRoutes = require('./routes/logs.routes');
const dbMiddleware = require('./middlewares/db.middleware');
const auditMiddleware = require('./middlewares/audit.middleware');

const app = express();

// Render and most managed hosts run the app behind a proxy.
// This lets express-rate-limit trust X-Forwarded-For without rejecting requests.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'epika-social' }));

// Kept before rate limiting so rejected requests are audited as well.
app.use(auditMiddleware);

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
app.use('/docs', swaggerRoutes);
app.use('/logs', logsRoutes);

module.exports = { app };
