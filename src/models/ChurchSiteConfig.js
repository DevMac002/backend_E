const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Singleton configuration used by the public church homepage. Keeping it in
// the database makes the content editable by an administrator without a new
// front-end deployment.
const ChurchSiteConfig = sequelize.define('ChurchSiteConfig', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  config_key: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  content: { type: DataTypes.JSON, allowNull: false },
}, {
  tableName: 'church_site_configs',
  underscored: true,
});

module.exports = ChurchSiteConfig;
