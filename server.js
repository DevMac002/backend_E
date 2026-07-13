require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./src/config/database');
const { initSocket } = require('./src/config/socket');
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const postRoutes = require('./src/routes/post.routes');
const groupRoutes = require('./src/routes/group.routes');
const messageRoutes = require('./src/routes/message.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const searchRoutes = require('./src/routes/search.routes');
const adminRoutes = require('./src/routes/admin.routes');
const mediaRoutes = require('./src/routes/media.routes');
const swaggerRoutes = require('./src/routes/swagger.routes');

const app = express();
const server = http.createServer(app);

function startServer() {
  return connectDB().then(() => {
    const port = process.env.PORT || 3000;
    return server.listen(port, () => {
      console.log(`Epika Social API running on port ${port}`);
    });
  });
}

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/media', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'epika-social' }));

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

initSocket(server);

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Unable to start server:', error);
    process.exit(1);
  });
}

module.exports = { app, server, startServer };
