const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ModerationLog = sequelize.define('ModerationLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  admin_id: { type: DataTypes.INTEGER, allowNull: false },
  action: { type: DataTypes.STRING(50), allowNull: false },
  reason: { type: DataTypes.STRING(500), allowNull: true },
  expires_at: { type: DataTypes.DATE, allowNull: true },
  metadata: { type: DataTypes.JSON, allowNull: true },
}, {
  tableName: 'moderation_logs',
  underscored: true,
});

module.exports = ModerationLog;
