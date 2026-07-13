const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RewardHistory = sequelize.define('RewardHistory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  admin_id: { type: DataTypes.INTEGER, allowNull: false },
  montant: { type: DataTypes.INTEGER, allowNull: false },
  motif: { type: DataTypes.TEXT, allowNull: false },
}, {
  tableName: 'rewards_history',
  underscored: true,
});

module.exports = RewardHistory;
