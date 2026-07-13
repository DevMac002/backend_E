const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Group = sequelize.define('Group', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nom: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  avatar_path: { type: DataTypes.STRING(255), allowNull: true },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('cardinal', 'discussion'), defaultValue: 'discussion' },
}, {
  tableName: 'groups',
  underscored: true,
});

module.exports = Group;
