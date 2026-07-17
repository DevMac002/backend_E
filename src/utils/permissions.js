function isPlatformAdmin(user) {
  return ['admin', 'superadmin'].includes(user?.status);
}

function isSuperadmin(user) {
  return user?.status === 'superadmin';
}

// A superadmin is protected from every account-management action. An admin
// cannot manage another platform administrator (or themself).
function canManageUser(actor, target) {
  if (!actor || !target || actor.id === target.id || target.status === 'superadmin') return false;
  return isSuperadmin(actor) || (actor.status === 'admin' && target.status === 'user');
}

module.exports = { isPlatformAdmin, isSuperadmin, canManageUser };
