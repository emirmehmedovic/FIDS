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
  // Fields for custom sessions (based on flight number)
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
  custom_destination1: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  custom_destination2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // New field for notification text
  notification_text: {
    type: DataTypes.TEXT,
    allowNull: true, // Allow null if no notification
  },
}, {
  tableName: 'display_sessions',
  timestamps: false,
});

// Standard Flight association
DisplaySession.belongsTo(Flight, {
  foreignKey: 'flight_id',
  as: 'Flight'
});

// Custom Airline association
DisplaySession.belongsTo(Airline, {
  foreignKey: 'custom_airline_id',
  as: 'CustomAirline', // Use the same alias as in the controller include
  constraints: false // Important: Since custom_airline_id can be null, don't enforce FK constraint strictly here
});


module.exports = DisplaySession;
