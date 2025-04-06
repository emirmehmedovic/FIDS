'use strict';

'use strict';

const ENUM_NAME = 'enum_flights_status'; // Define ENUM name constant

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. Create the ENUM type first
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "${ENUM_NAME}" AS ENUM('SCHEDULED', 'ON_TIME', 'DELAYED', 'CANCELLED', 'DEPARTED', 'ARRIVED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log(`Enum type "${ENUM_NAME}" created or already exists.`);

    // 2. Add the column using the created ENUM type
    const tableDescription = await queryInterface.describeTable('flights');
    if (!tableDescription.status) {
      await queryInterface.addColumn('flights', 'status', {
        type: Sequelize.ENUM('SCHEDULED', 'ON_TIME', 'DELAYED', 'CANCELLED', 'DEPARTED', 'ARRIVED'), // Use ENUM type
        // Or using the raw type: type: `"${ENUM_NAME}"`
        allowNull: true, // Allow null initially
        // defaultValue: 'ON_TIME' // Set a default if needed, must be one of the ENUM values
      });
      console.log(`Column "status" added to "flights" table using enum "${ENUM_NAME}".`);
    } else {
      console.log('Column "status" already exists in "flights" table. Skipping addColumn.');
      // If the column exists but is STRING, you might need an ALTER COLUMN statement here
      // to change its type to the ENUM, but that's more complex and depends on existing data.
      // For a fresh setup, this check is sufficient.
    }
  },

  async down (queryInterface, Sequelize) {
    // 1. Remove the column first
    const tableDescription = await queryInterface.describeTable('flights');
    if (tableDescription.status) {
      await queryInterface.removeColumn('flights', 'status');
      console.log('Column "status" removed from "flights" table.');
    } else {
      console.log('Column "status" does not exist in "flights" table. Skipping removeColumn.');
    }

    // 2. Drop the ENUM type
    // Note: This will fail if the type is still in use by other tables/columns.
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${ENUM_NAME}";`);
    console.log(`Enum type "${ENUM_NAME}" dropped.`);
  }
};
