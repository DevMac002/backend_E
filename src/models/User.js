const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  avatar_path: { type: DataTypes.STRING(255), allowNull: true },
  bio: { type: DataTypes.TEXT, allowNull: true },
  role: { type: DataTypes.ENUM('peuple', 'constellation', 'tornades', 'tour', 'batview'), defaultValue: 'peuple' },
  status: { type: DataTypes.ENUM('user', 'admin', 'superadmin'), defaultValue: 'user' },
  foi_points: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_banned: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  verification_code: { type: DataTypes.STRING(6), allowNull: true },
  verification_code_expires_at: { type: DataTypes.DATE, allowNull: true },
  verification_attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  device: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'unknown' },
  password_reset_code: { type: DataTypes.STRING(6), allowNull: true },
  password_reset_code_expires_at: { type: DataTypes.DATE, allowNull: true },
  password_reset_attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'users',
  underscored: true,
});

module.exports = User;
