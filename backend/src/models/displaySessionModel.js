// displaySessionModel.js (ispravljeno)
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Flight = require('./Flight');

const DisplaySession = sequelize.define('DisplaySession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  flightId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'flight_id',
    references: {
      model: 'flights',
      key: 'id',
    },
  },
  pageId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'page_id',
  },
  sessionType: {
    type: DataTypes.ENUM('check-in', 'boarding'),
    field: 'session_type',
    allowNull: false,
  },
  isPriority: {
    type: DataTypes.BOOLEAN,
    field: 'is_priority',
    defaultValue: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  start_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'display_sessions',
  timestamps: false,
});

DisplaySession.belongsTo(Flight, {
  foreignKey: 'flight_id',
  as: 'Flight'
});

module.exports = DisplaySession;