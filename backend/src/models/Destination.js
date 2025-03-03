module.exports = (sequelize, DataTypes) => {
    const Destination = sequelize.define('Destination', {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      code: {
        type: DataTypes.STRING(3),
        allowNull: false
      }
    }, {
      tableName: 'destinations',
      timestamps: true
    });
  
    return Destination;
  };