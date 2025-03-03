module.exports = (sequelize, DataTypes) => {
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
      timestamps: true
    });
  
    return FlightNumber;
  };