'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('flights'); // Lowercase 'flights'
    if (!tableDescription.status) {
      await queryInterface.addColumn('flights', 'status', { // Lowercase 'flights'
        type: Sequelize.STRING,
        allowNull: true, // Or false if you want it to be required, but null is safer for existing rows
        defaultValue: 'Na vrijeme/On time' // Optional: Set a default status
      });
      console.log('Column "status" added to "flights" table.');
    } else {
      console.log('Column "status" already exists in "flights" table. Skipping addColumn.');
      // Optional: You could alter the column here if needed, e.g., to add the default value
      // if it didn't exist before, but skipping is safer for now.
    }
  },

  async down (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('flights'); // Lowercase 'flights'
    if (tableDescription.status) {
      await queryInterface.removeColumn('flights', 'status'); // Lowercase 'flights'
    } else {
      console.log('Column "status" does not exist in "flights" table. Skipping removeColumn.');
    }
  }
};
