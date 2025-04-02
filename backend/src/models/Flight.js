// models/Flight.js (ispravljeno)
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Flight = sequelize.define('Flight', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  airline_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
  destination: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Destinacija je obavezna.',
      },
      len: {
        args: [1, 100],
        msg: 'Destinacija mora biti između 1 i 100 znakova.',
      },
    },
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
  status: { // Added status field
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Na vrijeme/On time'
  },
}, {
  tableName: 'flights',
  timestamps: false,
});

module.exports = Flight;
