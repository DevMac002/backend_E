const bcrypt = require('bcrypt');
const { User, UserSession, RoleChangeLog, RewardHistory, ModerationLog, Op } = require('../models');
const { saveUploadedFile } = require('../utils/file');
const { triggerRealtimeEvent, isRealtimeEnabled } = require('../config/realtime');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');
const { canManageUser, isSuperadmin } = require('../utils/permissions');
const { validateRestrictions } = require('../utils/user-access');
const { sendVerificationCodeEmail } = require('../utils/email');
const { generateOtpCode, getOtpExpiration } = require('../utils/otp');

const USER_ROLES = ['peuple', 'constellation', 'tornades', 'tour', 'batview'];
const USER_STATUSES = ['user', 'admin'];

function denyProtectedUserAction(req, res, targetUser) {
  if (!canManageUser(req.user, targetUser)) {
    res.status(403).json({ message: 'Vous ne pouvez pas gérer ce compte' });
    return true;
  }
  return false;
}

async function getMe(req, res) {
  res.json(req.user);
}

async function updateMe(req, res) {
  try {
    const { username, bio } = req.body;
    const changes = {};
    if (username !== undefined) {
      const normalizedUsername = String(username).trim();
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(normalizedUsername)) {
        return res.status(400).json({ message: 'Nom d’utilisateur invalide' });
      }
      const existingUser = await User.findOne({ where: { username: normalizedUsername } });
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(409).json({ message: 'Ce nom d’utilisateur est déjà utilisé' });
      }
      changes.username = normalizedUsername;
    }
    if (bio !== undefined) {
      if (typeof bio !== 'string' || bio.length > 500) return res.status(400).json({ message: 'Biographie invalide (500 caractères maximum)' });
      changes.bio = bio.trim();
    }
    await req.user.update(changes);
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function changeEmail(req, res) {
  const { email, currentPassword } = req.body;
  if (!email || !currentPassword) return res.status(400).json({ message: 'Email et mot de passe actuel requis' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Email invalide' });
  const validPassword = await bcrypt.compare(currentPassword, req.user.password_hash);
  if (!validPassword) return res.status(401).json({ message: 'Mot de passe actuel invalide' });
  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = await User.findOne({ where: { email: normalizedEmail } });
  if (existingUser && existingUser.id !== req.user.id) return res.status(409).json({ message: 'Cet email est déjà utilisé' });
  const code = generateOtpCode();
  await req.user.update({
    email: normalizedEmail,
    is_verified: false,
    verification_code: code,
    verification_code_expires_at: getOtpExpiration(10),
    verification_attempts: 0,
  });
  try {
    await sendVerificationCodeEmail(normalizedEmail, code);
  } catch (error) {
    return res.status(502).json({ message: 'Email modifié, mais le code de vérification n’a pas pu être envoyé' });
  }
  res.json({ message: 'Email modifié. Vérifiez la nouvelle adresse avec le code envoyé.' });
}

async function listMyDevices(req, res) {
  const devices = await UserSession.findAll({ where: { user_id: req.user.id }, order: [['last_seen_at', 'DESC']] });
  res.json(devices);
}

async function revokeMyDevice(req, res) {
  const session = await UserSession.findOne({ where: { id: req.params.sessionId, user_id: req.user.id } });
  if (!session) return res.status(404).json({ message: 'Appareil introuvable' });
  await session.update({ revoked_at: new Date() });
  res.json({ message: 'Appareil déconnecté' });
}

async function listUserDevices(req, res) {
  const targetUser = await User.findByPk(req.params.id);
  if (!targetUser) return res.status(404).json({ message: 'Utilisateur introuvable' });
  if (denyProtectedUserAction(req, res, targetUser)) return;
  const devices = await UserSession.findAll({ where: { user_id: targetUser.id }, order: [['last_seen_at', 'DESC']] });
  res.json(devices);
}

async function listUsers(req, res) {
  try {
    const { role, status, search, banned } = req.query;
    const { page, limit, offset } = getPaginationParams(req.query);
    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (banned !== undefined) where.is_banned = banned === 'true';
    if (search) where[Op.or] = [{ username: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }];

    const [users, total] = await Promise.all([
      User.findAll({
        where,
        attributes: { exclude: ['password_hash'] },
        order: [['created_at', 'DESC']],
        limit,
        offset,
      }),
      User.count({ where }),
    ]);
    res.json(buildPaginatedResponse(users, total, page, limit));
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function getUserById(req, res) {
  const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password_hash'] } });
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
  res.json(user);
}

async function uploadAvatar(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier fourni' });
    const avatarPath = await saveUploadedFile(req.file, req.user.id, 'avatar');
    await req.user.update({ avatar_path: avatarPath });
    res.json({ avatar_path: avatarPath });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function deleteMe(req, res) {
  try {
    await req.user.destroy();
    res.json({ message: 'Compte supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

async function updateUserRole(req, res) {
  const targetUser = await User.findByPk(req.params.id);
  if (!targetUser) return res.status(404).json({ message: 'Utilisateur introuvable' });
  if (denyProtectedUserAction(req, res, targetUser)) return;
  if (!USER_ROLES.includes(req.body.role)) return res.status(400).json({ message: 'Rôle invalide' });
  const previousRole = targetUser.role;
  const previousStatus = targetUser.status;
  await targetUser.update({ role: req.body.role });
  await RoleChangeLog.create({ user_id: targetUser.id, ancien_role: previousRole, nouveau_role: targetUser.role, ancien_statut: previousStatus, nouveau_statut: targetUser.status, changed_by: req.user.id });
  if (isRealtimeEnabled) {
    await triggerRealtimeEvent(`private-user-${targetUser.id}`, 'user:role_updated', { userId: targetUser.id, role: targetUser.role, status: targetUser.status });
  }
  res.json(targetUser);
}

async function updateUserStatus(req, res) {
  if (!isSuperadmin(req.user)) return res.status(403).json({ message: 'Seul un superadmin peut modifier les droits d’administration' });
  const targetUser = await User.findByPk(req.params.id);
  if (!targetUser) return res.status(404).json({ message: 'Utilisateur introuvable' });
  if (denyProtectedUserAction(req, res, targetUser)) return;
  if (!USER_STATUSES.includes(req.body.status)) return res.status(400).json({ message: 'Statut invalide' });
  const previousRole = targetUser.role;
  const previousStatus = targetUser.status;
  await targetUser.update({ status: req.body.status });
  await RoleChangeLog.create({ user_id: targetUser.id, ancien_role: previousRole, nouveau_role: targetUser.role, ancien_statut: previousStatus, nouveau_statut: targetUser.status, changed_by: req.user.id });
  if (isRealtimeEnabled) {
    await triggerRealtimeEvent(`private-user-${targetUser.id}`, 'user:status_updated', { userId: targetUser.id, status: targetUser.status });
  }
  res.json(targetUser);
}

async function banUser(req, res) {
  const targetUser = await User.findByPk(req.params.id);
  if (!targetUser) return res.status(404).json({ message: 'Utilisateur introuvable' });
  if (denyProtectedUserAction(req, res, targetUser)) return;
  await targetUser.update({ is_banned: req.body.ban !== false });
  await ModerationLog.create({ user_id: targetUser.id, admin_id: req.user.id, action: targetUser.is_banned ? 'ban' : 'unban', reason: req.body.reason || null });
  if (isRealtimeEnabled) {
    await triggerRealtimeEvent(`private-user-${targetUser.id}`, 'user:ban_updated', { userId: targetUser.id, banned: targetUser.is_banned });
  }
  res.json({ message: targetUser.is_banned ? 'Utilisateur banni' : 'Utilisateur débanni' });
}

async function temporaryBlockUser(req, res) {
  const targetUser = await User.findByPk(req.params.id);
  if (!targetUser) return res.status(404).json({ message: 'Utilisateur introuvable' });
  if (denyProtectedUserAction(req, res, targetUser)) return;

  if (req.body.until === null) {
    await targetUser.update({ blocked_until: null, block_reason: null });
    await ModerationLog.create({ user_id: targetUser.id, admin_id: req.user.id, action: 'temporary_block_removed', reason: req.body.reason || null });
    return res.json({ message: 'Blocage temporaire retiré', user: targetUser });
  }

  const until = new Date(req.body.until);
  if (!req.body.until || Number.isNaN(until.getTime()) || until <= new Date()) {
    return res.status(400).json({ message: 'La date de fin du blocage doit être dans le futur' });
  }
  await targetUser.update({ blocked_until: until, block_reason: req.body.reason || null });
  await ModerationLog.create({ user_id: targetUser.id, admin_id: req.user.id, action: 'temporary_block', reason: req.body.reason || null, expires_at: until });
  res.json({ message: 'Utilisateur bloqué temporairement', user: targetUser });
}

async function updateUserRestrictions(req, res) {
  const targetUser = await User.findByPk(req.params.id);
  if (!targetUser) return res.status(404).json({ message: 'Utilisateur introuvable' });
  if (denyProtectedUserAction(req, res, targetUser)) return;
  const restrictions = validateRestrictions(req.body.restrictions);
  if (!restrictions) return res.status(400).json({ message: 'Restrictions invalides. Utilisez posts, comments, messages et groups avec des booléens.' });
  await targetUser.update({ access_restrictions: restrictions });
  await ModerationLog.create({ user_id: targetUser.id, admin_id: req.user.id, action: 'access_restrictions_updated', reason: req.body.reason || null, metadata: { restrictions } });
  res.json({ message: 'Restrictions mises à jour', restrictions });
}

async function rewardUser(req, res) {
  const targetUser = await User.findByPk(req.params.id);
  if (!targetUser) return res.status(404).json({ message: 'Utilisateur introuvable' });
  if (denyProtectedUserAction(req, res, targetUser)) return;
  const montant = Number(req.body.montant);
  if (!Number.isInteger(montant) || montant <= 0) return res.status(400).json({ message: 'Le montant doit être un entier positif' });
  await targetUser.update({ foi_points: targetUser.foi_points + montant });
  await RewardHistory.create({ user_id: targetUser.id, admin_id: req.user.id, montant, motif: req.body.motif || 'Récompense' });
  await ModerationLog.create({ user_id: targetUser.id, admin_id: req.user.id, action: 'foi_reward', reason: req.body.motif || null, metadata: { montant } });
  res.json({ message: 'Récompense attribuée', user: targetUser });
}

async function adminDeleteUser(req, res) {
  const targetUser = await User.findByPk(req.params.id);
  if (!targetUser) return res.status(404).json({ message: 'Utilisateur introuvable' });
  if (denyProtectedUserAction(req, res, targetUser)) return;
  await ModerationLog.create({ user_id: targetUser.id, admin_id: req.user.id, action: 'account_deleted' });
  await targetUser.destroy();
  res.json({ message: 'Compte supprimé par un superadmin' });
}

async function getUserRewards(req, res) {
  const rewards = await RewardHistory.findAll({ where: { user_id: req.params.id }, include: [{ model: User, as: 'admin', attributes: ['id', 'username'] }], order: [['created_at', 'DESC']] });
  res.json(rewards);
}

async function getLeaderboard(req, res) {
  const limit = Number(req.query.limit || 10);
  const users = await User.findAll({ attributes: ['id', 'username', 'avatar_path', 'foi_points'], order: [['foi_points', 'DESC']], limit });
  res.json({ leaderboard: users });
}

async function getRoleLogs(req, res) {
  const logs = await RoleChangeLog.findAll({ order: [['created_at', 'DESC']], include: [{ model: User, as: 'target', attributes: ['id', 'username'] }, { model: User, as: 'changer', attributes: ['id', 'username'] }] });
  res.json(logs);
}

module.exports = { getMe, updateMe, changeEmail, listMyDevices, revokeMyDevice, listUserDevices, listUsers, getUserById, uploadAvatar, deleteMe, updateUserRole, updateUserStatus, banUser, temporaryBlockUser, updateUserRestrictions, rewardUser, adminDeleteUser, getUserRewards, getLeaderboard, getRoleLogs };
