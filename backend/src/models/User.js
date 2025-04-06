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
  password_hash: { // Renamed to match common practice and likely DB column
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password' // Explicitly map to the 'password' column if it's named differently in DB
    // If the DB column is actually 'password_hash', remove the 'field' line above.
    // Assuming DB column is 'password' based on migration 20250225135158-add-password-to-users.js
  },
  role: {
    type: DataTypes.ENUM('admin', 'stw', 'user'), // Use ENUM for defined roles
    allowNull: false, // Roles should likely be required
    defaultValue: 'user', // Default to a less privileged role
  },
  refreshToken: { // Renamed for clarity (assuming refresh token usage)
    type: DataTypes.STRING, 
    allowNull: true, 
    field: 'token' // Map to the existing 'token' column in the database
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
