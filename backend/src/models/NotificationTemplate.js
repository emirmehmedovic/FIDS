const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const NotificationTemplate = sequelize.define('NotificationTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'notification_templates',
  timestamps: true, // Add timestamps for tracking creation/update
});

module.exports = NotificationTemplate;
