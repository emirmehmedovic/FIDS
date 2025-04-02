const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Re-applying multi-language model structure
const NotificationTemplate = sequelize.define('NotificationTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: { // Added field for template identification
    type: DataTypes.STRING,
    allowNull: true, // Allow NULL in the database schema
    unique: true, // Ensure template names are unique
    comment: 'Internal name/identifier for the template (e.g., "Delay - Weather")',
  },
  text_bs: { // Text for Bosnian
    type: DataTypes.TEXT,
    allowNull: true, // Allow null if a language is not provided initially
    comment: 'Template text in Bosnian with placeholders',
  },
  text_en: { // Text for English
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Template text in English with placeholders',
  },
  text_de: { // Text for German
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Template text in German with placeholders',
  },
  text_tr: { // Text for Turkish
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Template text in Turkish with placeholders',
  },
  // REMOVED old 'text' field
}, {
  tableName: 'notification_templates',
  timestamps: true, // Keep timestamps
});

module.exports = NotificationTemplate;
