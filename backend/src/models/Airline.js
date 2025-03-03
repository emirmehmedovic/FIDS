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
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'airlines',
  timestamps: false,
});

module.exports = Airline;