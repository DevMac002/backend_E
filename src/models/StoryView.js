const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StoryView = sequelize.define('StoryView', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  story_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  viewed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'story_views',
  underscored: true,
  timestamps: false,
});

module.exports = StoryView;
