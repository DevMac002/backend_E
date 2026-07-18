const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { validateSession } = require('../utils/sessions');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user || user.is_banned) {
      return res.status(403).json({ message: 'Compte banni ou inaccessible' });
    }
    if (decoded.sid && !await validateSession(decoded.sid, user.id)) {
      return res.status(401).json({ message: 'Session expirée ou révoquée' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide' });
  }
}

module.exports = authMiddleware;
