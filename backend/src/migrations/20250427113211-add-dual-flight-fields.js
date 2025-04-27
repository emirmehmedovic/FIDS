'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add flight1_id and flight2_id columns
    await queryInterface.addColumn('display_sessions', 'flight1_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'flights',
        key: 'id'
      }
    });

    await queryInterface.addColumn('display_sessions', 'flight2_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'flights',
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the added columns
    await queryInterface.removeColumn('display_sessions', 'flight1_id');
    await queryInterface.removeColumn('display_sessions', 'flight2_id');
  }
}; 