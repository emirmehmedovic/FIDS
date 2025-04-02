'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Flights', 'status', {
      type: Sequelize.STRING,
      allowNull: true, // Or false if you want it to be required, but null is safer for existing rows
      defaultValue: 'Na vrijeme/On time' // Optional: Set a default status
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Flights', 'status');
  }
};
