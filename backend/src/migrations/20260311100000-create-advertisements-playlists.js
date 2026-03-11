'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create advertisements table
    await queryInterface.createTable('advertisements', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('image', 'gif', 'video'),
        allowNull: false
      },
      fileUrl: {
        type: Sequelize.STRING,
        allowNull: false
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    // Create playlists table
    await queryInterface.createTable('playlists', {
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
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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

    // Create playlist_items table
    await queryInterface.createTable('playlist_items', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      playlistId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'playlists', key: 'id' },
        onDelete: 'CASCADE'
      },
      advertisementId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'advertisements', key: 'id' },
        onDelete: 'CASCADE'
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('playlist_items');
    await queryInterface.dropTable('playlists');
    await queryInterface.dropTable('advertisements');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_advertisements_type";');
  }
};
