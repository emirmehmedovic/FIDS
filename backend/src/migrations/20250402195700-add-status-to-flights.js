'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Flights');
    if (!tableDescription.status) {
      await queryInterface.addColumn('Flights', 'status', {
        type: Sequelize.STRING,
        allowNull: true, // Or false if you want it to be required, but null is safer for existing rows
        defaultValue: 'Na vrijeme/On time' // Optional: Set a default status
      });
      console.log('Column "status" added to "Flights" table.');
    } else {
      console.log('Column "status" already exists in "Flights" table. Skipping addColumn.');
      // Optional: You could alter the column here if needed, e.g., to add the default value
      // if it didn't exist before, but skipping is safer for now.
    }
  },

  async down (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Flights');
    if (tableDescription.status) {
      await queryInterface.removeColumn('Flights', 'status');
    } else {
      console.log('Column "status" does not exist in "Flights" table. Skipping removeColumn.');
    }
  }
};
