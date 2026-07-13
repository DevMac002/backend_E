function requireNotBanned(req, res, next) {
  if (req.user?.is_banned) {
    return res.status(403).json({ message: 'Utilisateur banni' });
  }
  next();
}

module.exports = { requireNotBanned };
