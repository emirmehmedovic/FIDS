const { DataTypes } = require('sequelize'); // Keep one import
const sequelize = require('../config/db'); // Import sequelize instance

// Reverting to original structure based on DB schema
const FlightNumber = sequelize.define('FlightNumber', {
      // Assuming ID is implicitly added or managed by DB/migrations
      number: {
        type: DataTypes.STRING,
        allowNull: false
      },
      destination: { // Keep destination as string
        type: DataTypes.STRING,
        allowNull: false
      },
      is_departure: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      }
      // Assuming no timestamps in the actual table
    }, {
      tableName: 'flight_numbers',
      timestamps: true // Enable timestamps as DB requires them
    });
  
module.exports = FlightNumber; // Export the defined model directly
