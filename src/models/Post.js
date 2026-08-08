const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  author_id: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: true },
  media_path: { type: DataTypes.STRING(255), allowNull: true },
  type: { type: DataTypes.ENUM('post', 'photo', 'predication', 'annonce', 'sondage', 'quiz'), defaultValue: 'post' },
  visible_to: { type: DataTypes.ENUM('all', 'followers', 'only_me'), defaultValue: 'all' },
  options: { type: DataTypes.JSON, allowNull: true },
  reponse_correcte: { type: DataTypes.STRING(255), allowNull: true },
  date_limite: { type: DataTypes.DATE, allowNull: true },
  location: { type: DataTypes.STRING(150), allowNull: true },
  hide_like_count: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  disable_comments: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  scheduled_at: { type: DataTypes.DATE, allowNull: true },
  status: { type: DataTypes.ENUM('published', 'scheduled'), allowNull: false, defaultValue: 'published' },
  tagged_user_ids: { type: DataTypes.JSON, allowNull: true },
}, {
  tableName: 'posts',
  underscored: true,
});

module.exports = Post;