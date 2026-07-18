const ACCESS_FEATURES = ['posts', 'comments', 'messages', 'groups'];

function getRestrictions(user) {
  const value = user?.access_restrictions;
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (_error) {
      return {};
    }
  }
  return value;
}

function isTemporaryBlockActive(user) {
  return Boolean(user?.blocked_until && new Date(user.blocked_until) > new Date());
}

async function clearExpiredTemporaryBlock(user) {
  if (user?.blocked_until && !isTemporaryBlockActive(user)) {
    await user.update({ blocked_until: null, block_reason: null });
  }
}

function validateRestrictions(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const unknown = Object.keys(value).filter((key) => !ACCESS_FEATURES.includes(key));
  if (unknown.length || Object.values(value).some((restricted) => typeof restricted !== 'boolean')) return null;
  return Object.fromEntries(ACCESS_FEATURES.map((feature) => [feature, value[feature] === true]));
}

module.exports = {
  ACCESS_FEATURES,
  getRestrictions,
  isTemporaryBlockActive,
  clearExpiredTemporaryBlock,
  validateRestrictions,
};
