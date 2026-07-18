const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  method: { type: DataTypes.STRING(10), allowNull: false },
  path: { type: DataTypes.STRING(500), allowNull: false },
  status_code: { type: DataTypes.INTEGER, allowNull: false },
  ip_address: { type: DataTypes.STRING(64), allowNull: true },
  user_agent: { type: DataTypes.STRING(500), allowNull: true },
  metadata: { type: DataTypes.JSON, allowNull: true },
}, { tableName: 'audit_logs', underscored: true });

module.exports = AuditLog;
