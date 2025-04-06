'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Modify the 'destination' column to allow NULL values
    await queryInterface.changeColumn('flights', 'destination', {
      type: Sequelize.STRING,
      allowNull: true, // Change constraint to allow NULL
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert the 'destination' column to NOT allow NULL values
    // Note: This might fail if there are NULL values in the column when reverting.
    // Consider adding logic here to handle existing NULLs if necessary before reverting.
    await queryInterface.changeColumn('flights', 'destination', {
      type: Sequelize.STRING,
      allowNull: false, // Revert constraint back to NOT NULL
    });
  }
};
