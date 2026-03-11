const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Advertisement = sequelize.define('Advertisement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('image', 'gif', 'video'),
    allowNull: false
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'advertisements',
  timestamps: true
});

module.exports = Advertisement;
