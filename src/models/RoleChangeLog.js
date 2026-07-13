const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RoleChangeLog = sequelize.define('RoleChangeLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  ancien_role: { type: DataTypes.STRING(50), allowNull: true },
  nouveau_role: { type: DataTypes.STRING(50), allowNull: true },
  ancien_statut: { type: DataTypes.STRING(50), allowNull: true },
  nouveau_statut: { type: DataTypes.STRING(50), allowNull: true },
  changed_by: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'role_change_logs',
  underscored: true,
});

module.exports = RoleChangeLog;
