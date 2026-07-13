const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GroupMember = sequelize.define('GroupMember', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  group_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  role_in_group: { type: DataTypes.ENUM('membre', 'moderateur'), defaultValue: 'membre' },
}, {
  tableName: 'group_members',
  underscored: true,
});

module.exports = GroupMember;
