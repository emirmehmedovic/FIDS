// models/Destination.js - Refactored for consistency
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Assuming db config is here

const Destination = sequelize.define('Destination', {
  id: { // Add primary key if not already defined by migration
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: { // Assuming IATA Airport Code
    type: DataTypes.STRING(3),
    allowNull: false,
    unique: true, // Airport codes should be unique
    validate: {
      is: /^[A-Z]{3}$/i // Validate for exactly 3 letters (case-insensitive)
    }
  }
}, {
  tableName: 'destinations',
  timestamps: true // Enable timestamps as DB requires them
});

module.exports = Destination;
