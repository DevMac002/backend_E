const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Media = sequelize.define('Media', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  filename: { type: DataTypes.STRING(255), allowNull: false },
  mime_type: { type: DataTypes.STRING(100), allowNull: false },
  size: { type: DataTypes.INTEGER, allowNull: false },
  owner_id: { type: DataTypes.INTEGER, allowNull: true },
  data: { type: DataTypes.BLOB('long'), allowNull: false },
  type: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'generic' },
}, {
  tableName: 'media',
  underscored: true,
});

module.exports = Media;
