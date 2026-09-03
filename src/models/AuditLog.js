const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },

    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    http_method: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },

    endpoint_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },

    status_code: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    response_time_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    ip_address: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },

    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    request_body_hash: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },

    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'audit_logs',
    timestamps: false,
    underscored: true,
  }
);

module.exports = AuditLog;