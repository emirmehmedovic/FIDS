'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add flight1_id
    await queryInterface.addColumn('display_sessions', 'flight1_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'flights', // Ensure table name is correct
        key: 'id'
      },
      onUpdate: 'CASCADE', // Optional: Add actions
      onDelete: 'SET NULL' // Optional: Add actions
    });

    // Add flight2_id
    await queryInterface.addColumn('display_sessions', 'flight2_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'flights', // Ensure table name is correct
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add custom_airline_id
    await queryInterface.addColumn('display_sessions', 'custom_airline_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'airlines', // Ensure table name is correct
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add custom_flight_number
    await queryInterface.addColumn('display_sessions', 'custom_flight_number', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Add custom_destination1
    await queryInterface.addColumn('display_sessions', 'custom_destination1', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Add custom_destination2
    await queryInterface.addColumn('display_sessions', 'custom_destination2', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Add notification_text
    await queryInterface.addColumn('display_sessions', 'notification_text', {
      type: Sequelize.TEXT, // Use TEXT for potentially longer notifications
      allowNull: true,
    });

    // Add missing session_type 'notice' to ENUM if it doesn't exist
    // Note: Modifying ENUMs can be complex and database-specific.
    // This example might need adjustment for your specific PostgreSQL setup.
    try {
       await queryInterface.sequelize.query(`
         ALTER TYPE "enum_display_sessions_session_type" ADD VALUE IF NOT EXISTS 'notice';
       `);
    } catch (error) {
      console.warn("Could not add 'notice' to ENUM automatically. You might need to add it manually if it doesn't exist.", error.message);
      // Handle or log the error appropriately. This might fail if the type doesn't exist yet
      // or if run multiple times without IF NOT EXISTS logic in the DB function/trigger.
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove all added columns in reverse order
    await queryInterface.removeColumn('display_sessions', 'notification_text');
    await queryInterface.removeColumn('display_sessions', 'custom_destination2');
    await queryInterface.removeColumn('display_sessions', 'custom_destination1');
    await queryInterface.removeColumn('display_sessions', 'custom_flight_number');
    await queryInterface.removeColumn('display_sessions', 'custom_airline_id');
    await queryInterface.removeColumn('display_sessions', 'flight2_id');
    await queryInterface.removeColumn('display_sessions', 'flight1_id');

    // Removing ENUM values is generally not recommended or straightforward.
    // Usually, you wouldn't remove 'notice' in a down migration unless absolutely necessary.
  }
};