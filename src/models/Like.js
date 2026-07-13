const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Like = sequelize.define('Like', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  post_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'likes',
  underscored: true,
  indexes: [{ unique: true, fields: ['user_id', 'post_id'] }],
});

module.exports = Like;
