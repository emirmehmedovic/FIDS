// models/Airline.js (ispravljeno)
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Airline = sequelize.define('Airline', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  logo_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  iata_code: {
    type: DataTypes.STRING(3), // Limit length, IATA codes are usually 2 or 3 chars
    allowNull: false,
    unique: true, // Enforce uniqueness
    validate: {
      is: /^[A-Z0-9]{2,3}$/i // Basic validation for 2 or 3 alphanumeric chars (case-insensitive)
    }
  },
}, {
  tableName: 'airlines',
  timestamps: false, // Revert: Disable timestamps to match current DB schema
});

module.exports = Airline;
