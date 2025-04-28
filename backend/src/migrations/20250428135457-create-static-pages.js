'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('static_pages', {
      pageId: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      pageType: {
        // Define ENUM type explicitly for PostgreSQL
        type: Sequelize.ENUM('check-in', 'boarding', 'general'),
        allowNull: false,
        defaultValue: 'general'
      }
      // No createdAt or updatedAt as timestamps are false in the model
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('static_pages');
    // If using ENUM type outside of a table, you might need to drop it manually for PostgreSQL
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_static_pages_pageType";');
  }
};