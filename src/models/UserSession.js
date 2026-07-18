const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserSession = sequelize.define('UserSession', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  device: { type: DataTypes.STRING(100), allowNull: false },
  ip_address: { type: DataTypes.STRING(64), allowNull: true },
  user_agent: { type: DataTypes.STRING(500), allowNull: true },
  last_seen_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  revoked_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'user_sessions', underscored: true });

module.exports = UserSession;
