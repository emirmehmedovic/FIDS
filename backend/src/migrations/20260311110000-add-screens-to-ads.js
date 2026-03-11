'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create ad_screens table
    await queryInterface.createTable('ad_screens', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add screenId column to playlists
    await queryInterface.addColumn('playlists', 'screenId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'ad_screens', key: 'id' },
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('playlists', 'screenId');
    await queryInterface.dropTable('ad_screens');
  }
};
