'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('flights'); // Lowercase 'flights'
    if (!tableDescription.status) {
      await queryInterface.addColumn('flights', 'status', { // Lowercase 'flights'
        type: Sequelize.STRING, // Use STRING type as defined in the model
        allowNull: true, // Allow null
        defaultValue: 'SCHEDULED' // Set default value consistent with model
      });
      console.log('Column "status" added to "flights" table as STRING.');
    } else {
      console.log('Column "status" already exists in "flights" table. Skipping addColumn.');
      // Optional: Ensure the existing column is STRING and has the correct default
      // await queryInterface.changeColumn('flights', 'status', {
      //   type: Sequelize.STRING,
      //   allowNull: true,
      //   defaultValue: 'SCHEDULED'
      // });
    }
  },

  async down (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('flights'); // Lowercase 'flights'
    if (tableDescription.status) {
      await queryInterface.removeColumn('flights', 'status'); // Lowercase 'flights'
      console.log('Column "status" removed from "flights" table.');
    } else {
      console.log('Column "status" does not exist in "flights" table. Skipping removeColumn.');
    }
  }
};
