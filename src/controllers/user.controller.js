const bcrypt = require('bcrypt');
const { User, RoleChangeLog, RewardHistory, Op } = require('../models');
const { saveUploadedFile } = require('../utils/file');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');

async function getMe(req, res) {
  res.json(req.user);
}

async function updateMe(req, res) {
  try {
    const { username, bio } = req.body;
    await req.user.update({ username, bio });
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
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
    const avatarPath = await saveUploadedFile(req.file);
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
  if (req.user.status !== 'superadmin' && targetUser.status === 'superadmin') {
    return res.status(403).json({ message: 'Impossible de modifier un superadmin' });
  }
  if (req.user.status === 'admin' && req.body.status === 'admin') {
    return res.status(403).json({ message: 'Un admin ne peut pas créer un autre admin' });
  }
  const previousRole = targetUser.role;
  const previousStatus = targetUser.status;
  await targetUser.update({ role: req.body.role || targetUser.role, status: req.body.status || targetUser.status });
  await RoleChangeLog.create({ user_id: targetUser.id, ancien_role: previousRole, nouveau_role: targetUser.role, ancien_statut: previousStatus, nouveau_statut: targetUser.status, changed_by: req.user.id });
  res.json(targetUser);
}

async function updateUserStatus(req, res) {
  if (req.user.status !== 'superadmin') return res.status(403).json({ message: 'Accès refusé' });
  const targetUser = await User.findByPk(req.params.id);
  if (!targetUser) return res.status(404).json({ message: 'Utilisateur introuvable' });
  const previousRole = targetUser.role;
  const previousStatus = targetUser.status;
  await targetUser.update({ status: req.body.status || targetUser.status });
  await RoleChangeLog.create({ user_id: targetUser.id, ancien_role: previousRole, nouveau_role: targetUser.role, ancien_statut: previousStatus, nouveau_statut: targetUser.status, changed_by: req.user.id });
  res.json(targetUser);
}

async function banUser(req, res) {
  if (req.user.status !== 'admin' && req.user.status !== 'superadmin') return res.status(403).json({ message: 'Accès refusé' });
  const targetUser = await User.findByPk(req.params.id);
  if (!targetUser) return res.status(404).json({ message: 'Utilisateur introuvable' });
  await targetUser.update({ is_banned: req.body.ban !== false });
  res.json({ message: targetUser.is_banned ? 'Utilisateur banni' : 'Utilisateur débanni' });
}

async function rewardUser(req, res) {
  if (req.user.status !== 'admin' && req.user.status !== 'superadmin') return res.status(403).json({ message: 'Accès refusé' });
  const targetUser = await User.findByPk(req.params.id);
  if (!targetUser) return res.status(404).json({ message: 'Utilisateur introuvable' });
  const montant = Number(req.body.montant || 0);
  await targetUser.update({ foi_points: targetUser.foi_points + montant });
  await RewardHistory.create({ user_id: targetUser.id, admin_id: req.user.id, montant, motif: req.body.motif || 'Récompense' });
  res.json({ message: 'Récompense attribuée', user: targetUser });
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

module.exports = { getMe, updateMe, listUsers, getUserById, uploadAvatar, deleteMe, updateUserRole, updateUserStatus, banUser, rewardUser, getUserRewards, getLeaderboard, getRoleLogs };
