const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { isTemporaryBlockActive } = require('../utils/user-access');
const { validateSession } = require('../utils/sessions');

let io;
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedSocketRequest(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch (_error) {
    return false;
  }
}

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : true,
      credentials: true,
    },
    allowRequest(req, callback) {
      callback(null, isAllowedSocketRequest(req));
    },
  });

  io.of('/logs-realtime').on('connection', (socket) => {
    socket.join('public:audit-logs');
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token manquant'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      if (!user || user.is_banned || isTemporaryBlockActive(user)) return next(new Error('Utilisateur non autorisé'));
      if (decoded.sid && !await validateSession(decoded.sid, user.id)) return next(new Error('Session expirée ou révoquée'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);
    socket.broadcast.emit('presence:online', { userId });

    socket.on('disconnect', () => {
      socket.broadcast.emit('presence:offline', { userId });
    });
  });
}

function emitAuditLog(entry) {
  if (!io) return;
  io.of('/logs-realtime').to('public:audit-logs').emit('audit:created', entry);
}

module.exports = { initSocket, getIo: () => io, emitAuditLog };
