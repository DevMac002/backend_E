const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const QuizAnswer = sequelize.define('QuizAnswer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  post_id: { type: DataTypes.INTEGER, allowNull: false },
  answer: { type: DataTypes.STRING(255), allowNull: false },
}, {
  tableName: 'quiz_answers',
  underscored: true,
  indexes: [{ unique: true, fields: ['user_id', 'post_id'] }],
});

module.exports = QuizAnswer;
