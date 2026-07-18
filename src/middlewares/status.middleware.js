const { clearExpiredTemporaryBlock, isTemporaryBlockActive, getRestrictions } = require('../utils/user-access');

async function requireNotBanned(req, res, next) {
  if (req.user?.is_banned) {
    return res.status(403).json({ message: 'Utilisateur banni' });
  }
  if (isTemporaryBlockActive(req.user)) {
    return res.status(403).json({ message: 'Compte temporairement bloqué', blocked_until: req.user.blocked_until, reason: req.user.block_reason });
  }
  await clearExpiredTemporaryBlock(req.user);
  next();
}

function requireAccess(feature) {
  return (req, res, next) => {
    if (getRestrictions(req.user)[feature]) {
      return res.status(403).json({ message: `Accès à cette fonctionnalité restreint: ${feature}` });
    }
    next();
  };
}

module.exports = { requireNotBanned, requireAccess };
