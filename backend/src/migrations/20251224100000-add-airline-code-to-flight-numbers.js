'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('flight_numbers', 'airline_code', {
      type: Sequelize.STRING(10),
      allowNull: true, // Make it nullable initially for existing records
      after: 'number'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('flight_numbers', 'airline_code');
  }
};
