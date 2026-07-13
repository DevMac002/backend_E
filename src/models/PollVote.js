const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PollVote = sequelize.define('PollVote', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  post_id: { type: DataTypes.INTEGER, allowNull: false },
  option_index: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'poll_votes',
  underscored: true,
});

module.exports = PollVote;
