const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PlaylistItem = sequelize.define('PlaylistItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  playlistId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  advertisementId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'playlist_items',
  timestamps: false
});

module.exports = PlaylistItem;
