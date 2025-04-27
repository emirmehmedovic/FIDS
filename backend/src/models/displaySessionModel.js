// displaySessionModel.js (ispravljeno)
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Flight = require('./Flight');
const Airline = require('./Airline'); // Ensure Airline is required

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
  // New fields for dual flight sessions
  flight1Id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for non-dual sessions
    field: 'flight1_id',
    references: {
      model: 'flights',
      key: 'id',
    },
  },
  flight2Id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for non-dual sessions
    field: 'flight2_id',
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
    type: DataTypes.ENUM('check-in', 'boarding', 'notice'), // Added 'notice'
    field: 'session_type',
    allowNull: false,
  },
  isPriority: {
    type: DataTypes.BOOLEAN,
    field: 'is_priority',
    defaultValue: false,
  },
  isActive: { // Changed to camelCase
    type: DataTypes.BOOLEAN,
    field: 'is_active', // Keep field mapping
    defaultValue: true,
  },
  startTime: { // Changed to camelCase
    type: DataTypes.DATE,
    field: 'start_time', // Keep field mapping
    defaultValue: DataTypes.NOW,
  },
  endTime: { // Changed to camelCase
    type: DataTypes.DATE,
    field: 'end_time', // Keep field mapping
    allowNull: true,
  },
  // Fields for custom sessions (based on flight number)
  customAirlineId: { // Changed to camelCase
    type: DataTypes.INTEGER,
    field: 'custom_airline_id', // Keep field mapping
    allowNull: true,
    references: {
      model: 'airlines', // Assuming your airlines table is named 'airlines'
      key: 'id',
    },
  },
  customFlightNumber: { // Changed to camelCase
    type: DataTypes.STRING,
    field: 'custom_flight_number', // Keep field mapping
    allowNull: true,
  },
  customDestination1: { // Changed to camelCase
    type: DataTypes.STRING,
    field: 'custom_destination1', // Keep field mapping
    allowNull: true,
  },
  customDestination2: { // Changed to camelCase
    type: DataTypes.STRING,
    field: 'custom_destination2', // Keep field mapping
    allowNull: true,
  },
  // New field for notification text
  notificationText: { // Changed to camelCase
    type: DataTypes.TEXT,
    field: 'notification_text', // Keep field mapping
    allowNull: true, // Allow null if no notification
  },
}, {
  tableName: 'display_sessions',
  timestamps: false, // Revert: Disable timestamps to match current DB schema
});

// Associations moved to index.js for centralization

module.exports = DisplaySession;
