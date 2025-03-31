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
    allowNull: true, // Allow null for custom sessions
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
  // New fields for custom sessions
  custom_airline_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'airlines', // Assuming your airlines table is named 'airlines'
      key: 'id',
    },
  },
  custom_flight_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // custom_departure_time: { // Removed
  //   type: DataTypes.DATE,
  //   allowNull: true,
  // },
  // custom_arrival_time: { // Removed
  //   type: DataTypes.DATE,
  //   allowNull: true,
  // },
  custom_destination1: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  custom_destination2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // custom_is_departure: { // Removed
  //   type: DataTypes.BOOLEAN,
  //   allowNull: true,
  // },
}, {
  tableName: 'display_sessions',
  timestamps: false,
});

DisplaySession.belongsTo(Flight, {
  foreignKey: 'flight_id',
  as: 'Flight'
});

// Define the association for the custom airline ID
const Airline = require('./Airline'); // Make sure Airline is required here if not already
DisplaySession.belongsTo(Airline, {
  foreignKey: 'custom_airline_id',
  as: 'CustomAirline', // Use the same alias as in the controller include
  constraints: false // Important: Since custom_airline_id can be null, don't enforce FK constraint strictly here
});


module.exports = DisplaySession;
