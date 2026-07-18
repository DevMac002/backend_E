const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { isTemporaryBlockActive } = require('../utils/user-access');
const { validateSession } = require('../utils/sessions');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: true, credentials: true },
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

    socket.on('message:send', (payload) => {
      io.to(`user:${userId}`).emit('message:receive', { ...payload, senderId: userId });
    });

    socket.on('post:new', (payload) => {
      io.emit('post:new', payload);
    });

    socket.on('notification:new', (payload) => {
      io.emit('notification:new', payload);
    });

    socket.on('poll:vote_update', (payload) => {
      io.emit('poll:vote_update', payload);
    });

    socket.on('disconnect', () => {
      socket.broadcast.emit('presence:offline', { userId });
    });
  });
}

module.exports = { initSocket, getIo: () => io };
