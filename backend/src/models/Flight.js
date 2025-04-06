// models/Flight.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Ensure this path is correct
const Airline = require('./Airline'); // Import Airline model
const Destination = require('./Destination'); // Import Destination model

// Define the allowed status values
const allowedStatuses = ['SCHEDULED', 'ON_TIME', 'DELAYED', 'CANCELLED', 'DEPARTED', 'ARRIVED', 'BOARDING', 'DIVERTED'];

const Flight = sequelize.define('Flight', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  airline_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'airlines',
      key: 'id',
    },
    validate: {
      notNull: {
        msg: 'airline_id je obavezan.',
      },
    },
  },
  flight_number: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Broj leta je obavezan.',
      },
      len: {
        args: [1, 10],
        msg: 'Broj leta mora biti između 1 i 10 znakova.',
      },
    },
  },
  departure_time: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: {
        msg: 'Vrijeme polaska mora biti valjani datum.',
      },
    },
  },
  arrival_time: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: {
        msg: 'Vrijeme dolaska mora biti valjani datum.',
      },
    },
  },
  destination_id_new: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'destinations',
      key: 'id',
    },
    validate: {
      notNull: {
        msg: 'ID destinacije je obavezan.',
      },
    },
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is_departure: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Polje is_departure je obavezno.',
      },
    },
  },
  remarks: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: {
        args: [0, 500],
        msg: 'Napomene mogu biti najviše 500 znakova.',
      },
    },
  },
  status: {
    type: DataTypes.STRING, // Corrected type to STRING
    allowNull: true, // Allow null if appropriate, or set a default
    defaultValue: 'SCHEDULED', // Keep default if desired
    validate: {
      isIn: {
        args: [allowedStatuses], // Validate against the allowed strings
        msg: `Status must be one of: ${allowedStatuses.join(', ')}`
      }
    }
  },
}, {
  tableName: 'flights',
  timestamps: false,
  indexes: [
    { fields: ['airline_id'] },
    { fields: ['destination_id_new'] },
    { fields: ['departure_time'] },
    { fields: ['arrival_time'] }
  ]
});

// Define Associations after model definition
Flight.belongsTo(Airline, {
  foreignKey: 'airline_id'
});
Airline.hasMany(Flight, { foreignKey: 'airline_id' });

Flight.belongsTo(Destination, {
  foreignKey: 'destination_id_new',
  as: 'DestinationInfo'
});
Destination.hasMany(Flight, { foreignKey: 'destination_id_new' });

// Explicitly define the model's attributes AFTER definition and associations
Flight.refreshAttributes();

module.exports = Flight;
