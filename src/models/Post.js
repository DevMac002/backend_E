const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  author_id: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: true },
  media_path: { type: DataTypes.STRING(255), allowNull: true },
  type: { type: DataTypes.ENUM('post', 'predication', 'annonce', 'sondage', 'quiz'), defaultValue: 'post' },
  visible_to: { type: DataTypes.ENUM('all'), defaultValue: 'all' },
  options: { type: DataTypes.JSON, allowNull: true },
  reponse_correcte: { type: DataTypes.STRING(255), allowNull: true },
  date_limite: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'posts',
  underscored: true,
});

module.exports = Post;
