const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Playlist = sequelize.define('Playlist', {
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
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  screenId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'playlists',
  timestamps: true
});

module.exports = Playlist;
