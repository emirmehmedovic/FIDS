'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableName = 'display_sessions';
    const tableDescription = await queryInterface.describeTable(tableName);

    // Helper function to add column only if it doesn't exist
    const addColumnIfNotExists = async (columnName, columnDefinition) => {
      if (!tableDescription[columnName]) {
        console.log(`Adding column ${columnName} to ${tableName}...`);
        await queryInterface.addColumn(tableName, columnName, columnDefinition);
      } else {
        console.log(`Column ${columnName} already exists in ${tableName}. Skipping.`);
      }
    };

    // Add flight1_id if not exists
    await addColumnIfNotExists('flight1_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'flights', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add flight2_id if not exists
    await addColumnIfNotExists('flight2_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'flights', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add custom_airline_id if not exists
    await addColumnIfNotExists('custom_airline_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'airlines', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add custom_flight_number if not exists
    await addColumnIfNotExists('custom_flight_number', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Add custom_destination1 if not exists
    await addColumnIfNotExists('custom_destination1', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Add custom_destination2 if not exists
    await addColumnIfNotExists('custom_destination2', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Add notification_text if not exists
    await addColumnIfNotExists('notification_text', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Add missing session_type 'notice' to ENUM if it doesn't exist
    try {
      // Ensure ENUM type modification happens only if needed and possible
      // This specific query might vary slightly based on exact PG version and setup
      const enumTypeExists = await queryInterface.sequelize.query(
         `SELECT 1 FROM pg_type WHERE typname = 'enum_display_sessions_session_type'`,
         { type: queryInterface.sequelize.QueryTypes.SELECT }
       );

       if (enumTypeExists.length > 0) {
         const noticeValueExists = await queryInterface.sequelize.query(
           `SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_display_sessions_session_type') AND enumlabel = 'notice'`,
           { type: queryInterface.sequelize.QueryTypes.SELECT }
         );
         if (noticeValueExists.length === 0) {
           console.log("Adding 'notice' value to enum_display_sessions_session_type...");
           await queryInterface.sequelize.query(`ALTER TYPE "enum_display_sessions_session_type" ADD VALUE 'notice';`);
         } else {
           console.log("Value 'notice' already exists in enum_display_sessions_session_type. Skipping.");
         }
       } else {
           console.warn("ENUM type 'enum_display_sessions_session_type' not found. Cannot add 'notice'. This might indicate an issue with a previous migration.");
       }

    } catch (error) {
      console.warn("Could not add 'notice' to ENUM automatically. You might need to add it manually if needed.", error.message);
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove all added columns in reverse order (safe even if they don't exist)
    // Wrapping in try/catch might be safer if strict error handling is needed
    await queryInterface.removeColumn('display_sessions', 'notification_text');
    await queryInterface.removeColumn('display_sessions', 'custom_destination2');
    await queryInterface.removeColumn('display_sessions', 'custom_destination1');
    await queryInterface.removeColumn('display_sessions', 'custom_flight_number');
    await queryInterface.removeColumn('display_sessions', 'custom_airline_id');
    await queryInterface.removeColumn('display_sessions', 'flight2_id');
    await queryInterface.removeColumn('display_sessions', 'flight1_id');
  }
};