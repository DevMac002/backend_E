const { Group, GroupMember, User, Notification, Op } = require('../models');
const { triggerRealtimeEvent, isRealtimeEnabled } = require('../config/realtime');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');

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
  await group.update({ nom: req.body.nom || group.nom, description: req.body.description || group.description });
  res.json(group);
}

async function deleteGroup(req, res) {
  const group = await Group.findByPk(req.params.id);
  if (!group) return res.status(404).json({ message: 'Groupe introuvable' });
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
  const member = await GroupMember.create({ group_id: group.id, user_id: req.body.user_id, role_in_group: req.body.role_in_group || 'membre' });
  await Notification.create({ user_id: req.body.user_id, type: 'group_join', message: `Vous avez été ajouté au groupe ${group.nom}`, payload: { groupId: group.id } });
  if (isRealtimeEnabled) {
    await triggerRealtimeEvent(`private-user-${req.body.user_id}`, 'group:member_added', { groupId: group.id, groupName: group.nom });
  }
  res.status(201).json(member);
}

async function removeMember(req, res) {
  const member = await GroupMember.findOne({ where: { group_id: req.params.id, user_id: req.params.userId } });
  if (!member) return res.status(404).json({ message: 'Membre introuvable' });
  await member.destroy();
  res.json({ message: 'Membre retiré' });
}

async function leaveGroup(req, res) {
  const member = await GroupMember.findOne({ where: { group_id: req.params.id, user_id: req.user.id } });
  if (!member) return res.status(404).json({ message: 'Vous n’êtes pas membre du groupe' });
  await member.destroy();
  res.json({ message: 'Vous avez quitté le groupe' });
}

async function updateMemberRole(req, res) {
  const member = await GroupMember.findOne({ where: { group_id: req.params.id, user_id: req.params.userId } });
  if (!member) return res.status(404).json({ message: 'Membre introuvable' });
  await member.update({ role_in_group: req.body.role_in_group || member.role_in_group });
  res.json(member);
}

module.exports = { listGroups, discoverGroups, getGroup, createGroup, updateGroup, deleteGroup, listMembers, addMember, removeMember, leaveGroup, updateMemberRole };
