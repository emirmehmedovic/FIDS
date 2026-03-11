const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AdScreen = sequelize.define('AdScreen', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'ad_screens',
  timestamps: true
});

module.exports = AdScreen;
