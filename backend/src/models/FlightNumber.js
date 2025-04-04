const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Import sequelize instance

const FlightNumber = sequelize.define('FlightNumber', {
      number: {
        type: DataTypes.STRING,
        allowNull: false
      },
      destination: {
        type: DataTypes.STRING,
        allowNull: false
      },
      is_departure: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      }
    }, {
      tableName: 'flight_numbers',
      timestamps: true // Keep timestamps if they are indeed used
    });
  
module.exports = FlightNumber; // Export the defined model directly
