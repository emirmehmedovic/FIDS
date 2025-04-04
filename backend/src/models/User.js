// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: { // Corrected field name to match migration/database
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'admin',
  },
  token: {
    type: DataTypes.STRING, // Dodajte kolonu token
    allowNull: true,        // Token može biti null
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  
}, {
  tableName: 'users', // Eksplicitno navedite ime tabele
  timestamps: true,   // Omogućite automatsko upravljanje `createdAt` i `updatedAt`
});

module.exports = User;
