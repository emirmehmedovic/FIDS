'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('destinations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      code: {
        type: Sequelize.STRING(3), // Ensure length matches model
        allowNull: false,
        unique: true
        // Note: Database-level CHECK constraint (like CHECK (code ~* '^[A-Z]{3}$'))
        // usually needs to be added with raw SQL if required,
        // as Sequelize constraints are primarily for model validation.
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') // Optional: Set default in DB
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') // Optional: Set default in DB
      }
    });

    // Optional: Add index if needed for performance on 'code'
    // await queryInterface.addIndex('destinations', ['code']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('destinations');
  }
};