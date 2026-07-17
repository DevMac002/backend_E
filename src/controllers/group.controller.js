const { Group, GroupMember, User, Notification, Op } = require('../models');
const { triggerRealtimeEvent, isRealtimeEnabled } = require('../config/realtime');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');
const { isPlatformAdmin } = require('../utils/permissions');

async function getGroupManager(req, group) {
  if (isPlatformAdmin(req.user)) return { platformAdmin: true };
  if (group.created_by === req.user.id) return { owner: true };
  return GroupMember.findOne({ where: { group_id: group.id, user_id: req.user.id } });
}

function canManageGroupSettings(manager) {
  return Boolean(manager?.platformAdmin || manager?.owner);
}

function canManageMembers(manager) {
  return Boolean(manager?.platformAdmin || manager?.owner || manager?.role_in_group === 'moderateur');
}

async function listGroups(req, res) {
  const { page, limit, offset } = getPaginationParams(req.query);
  const where = {};
  if (req.query.search) where.nom = { [Op.like]: `%${req.query.search}%` };
  const [groups, total] = await Promise.all([
    Group.findAll({ where, include: [{ model: User, attributes: ['id', 'username'] }], limit, offset }),
    Group.count({ where }),
  ]);
  res.json(buildPaginatedResponse(groups, total, page, limit));
}

async function discoverGroups(req, res) {
  const { page, limit, offset } = getPaginationParams(req.query);
  const where = {};
  if (req.query.search) where.nom = { [Op.like]: `%${req.query.search}%` };
  const [groups, total] = await Promise.all([
    Group.findAll({ where, include: [{ model: User, attributes: ['id', 'username'] }], limit, offset }),
    Group.count({ where }),
  ]);
  res.json(buildPaginatedResponse(groups, total, page, limit));
}

async function getGroup(req, res) {
  const group = await Group.findByPk(req.params.id, { include: [{ model: User, attributes: ['id', 'username'] }] });
  if (!group) return res.status(404).json({ message: 'Groupe introuvable' });
  res.json(group);
}

async function createGroup(req, res) {
  if (req.body.type === 'cardinal' && !['admin', 'superadmin'].includes(req.user.status)) {
    return res.status(403).json({ message: 'Seuls les admins peuvent créer des groupes cardinaux' });
  }
  const group = await Group.create({ nom: req.body.nom, description: req.body.description, created_by: req.user.id, type: req.body.type || 'discussion' });
  await GroupMember.create({ group_id: group.id, user_id: req.user.id, role_in_group: 'moderateur' });
  res.status(201).json(group);
}

async function updateGroup(req, res) {
  const group = await Group.findByPk(req.params.id);
  if (!group) return res.status(404).json({ message: 'Groupe introuvable' });
  const manager = await getGroupManager(req, group);
  if (!canManageGroupSettings(manager)) return res.status(403).json({ message: 'Seul le créateur ou un admin peut modifier ce groupe' });
  await group.update({ nom: req.body.nom || group.nom, description: req.body.description || group.description });
  res.json(group);
}

async function deleteGroup(req, res) {
  const group = await Group.findByPk(req.params.id);
  if (!group) return res.status(404).json({ message: 'Groupe introuvable' });
  const manager = await getGroupManager(req, group);
  if (!canManageGroupSettings(manager)) return res.status(403).json({ message: 'Seul le créateur ou un admin peut supprimer ce groupe' });
  await group.destroy();
  res.json({ message: 'Groupe supprimé' });
}

async function listMembers(req, res) {
  const members = await GroupMember.findAll({ where: { group_id: req.params.id }, include: [{ model: User, attributes: ['id', 'username', 'avatar_path'] }] });
  res.json(members);
}

async function addMember(req, res) {
  const group = await Group.findByPk(req.params.id);
  if (!group) return res.status(404).json({ message: 'Groupe introuvable' });
  const manager = await getGroupManager(req, group);
  if (!canManageMembers(manager)) return res.status(403).json({ message: 'Droits de modération requis' });
  const user = await User.findByPk(req.body.user_id);
  if (!user || user.is_banned) return res.status(404).json({ message: 'Utilisateur introuvable ou banni' });
  const existing = await GroupMember.findOne({ where: { group_id: group.id, user_id: user.id } });
  if (existing) return res.status(409).json({ message: 'Cet utilisateur est déjà membre du groupe' });
  const requestedRole = req.body.role_in_group || 'membre';
  if (!['membre', 'moderateur'].includes(requestedRole)) return res.status(400).json({ message: 'Rôle de groupe invalide' });
  if (requestedRole === 'moderateur' && !canManageGroupSettings(manager)) return res.status(403).json({ message: 'Seul le créateur ou un admin peut désigner un modérateur' });
  const member = await GroupMember.create({ group_id: group.id, user_id: user.id, role_in_group: requestedRole });
  await Notification.create({ user_id: user.id, type: 'group_join', message: `Vous avez été ajouté au groupe ${group.nom}`, payload: { groupId: group.id } });
  if (isRealtimeEnabled) {
    await triggerRealtimeEvent(`private-user-${req.body.user_id}`, 'group:member_added', { groupId: group.id, groupName: group.nom });
  }
  res.status(201).json(member);
}

async function removeMember(req, res) {
  const group = await Group.findByPk(req.params.id);
  if (!group) return res.status(404).json({ message: 'Groupe introuvable' });
  const manager = await getGroupManager(req, group);
  if (!canManageMembers(manager)) return res.status(403).json({ message: 'Droits de modération requis' });
  const member = await GroupMember.findOne({ where: { group_id: req.params.id, user_id: req.params.userId } });
  if (!member) return res.status(404).json({ message: 'Membre introuvable' });
  if (Number(req.params.userId) === group.created_by) return res.status(403).json({ message: 'Le créateur ne peut pas être retiré du groupe' });
  if (member.role_in_group === 'moderateur' && !canManageGroupSettings(manager)) return res.status(403).json({ message: 'Seul le créateur ou un admin peut retirer un modérateur' });
  await member.destroy();
  res.json({ message: 'Membre retiré' });
}

async function leaveGroup(req, res) {
  const group = await Group.findByPk(req.params.id);
  if (!group) return res.status(404).json({ message: 'Groupe introuvable' });
  if (group.created_by === req.user.id) return res.status(400).json({ message: 'Le créateur doit supprimer le groupe ou transférer sa gestion avant de le quitter' });
  const member = await GroupMember.findOne({ where: { group_id: req.params.id, user_id: req.user.id } });
  if (!member) return res.status(404).json({ message: 'Vous n’êtes pas membre du groupe' });
  await member.destroy();
  res.json({ message: 'Vous avez quitté le groupe' });
}

async function updateMemberRole(req, res) {
  const group = await Group.findByPk(req.params.id);
  if (!group) return res.status(404).json({ message: 'Groupe introuvable' });
  const manager = await getGroupManager(req, group);
  if (!canManageGroupSettings(manager)) return res.status(403).json({ message: 'Seul le créateur ou un admin peut modifier les rôles du groupe' });
  const member = await GroupMember.findOne({ where: { group_id: req.params.id, user_id: req.params.userId } });
  if (!member) return res.status(404).json({ message: 'Membre introuvable' });
  if (!['membre', 'moderateur'].includes(req.body.role_in_group)) return res.status(400).json({ message: 'Rôle de groupe invalide' });
  await member.update({ role_in_group: req.body.role_in_group });
  res.json(member);
}

module.exports = { listGroups, discoverGroups, getGroup, createGroup, updateGroup, deleteGroup, listMembers, addMember, removeMember, leaveGroup, updateMemberRole };
