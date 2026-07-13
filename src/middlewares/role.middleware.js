function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentification requise' });
    const roles = allowedRoles.map((role) => role.toLowerCase());
    if (!roles.includes(req.user.status?.toLowerCase())) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    next();
  };
}

module.exports = { requireRole };
