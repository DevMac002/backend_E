const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Story = sequelize.define('Story', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: true },
  media_path: { type: DataTypes.STRING(255), allowNull: true },
  media_type: { type: DataTypes.STRING(100), allowNull: true },
  expires_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'stories',
  underscored: true,
});

module.exports = Story;
