'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. Add the new integer column, allowing NULL initially for population
    await queryInterface.addColumn('flights', 'destination_id_new', { // Use temporary name to avoid conflict if needed
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // 2. Populate the new column based on the existing string column
    // WARNING: This assumes the string in 'flights.destination' exactly matches 'destinations.name'.
    // Adjust the JOIN condition if the match is based on code or another field.
    // Consider potential case sensitivity or whitespace issues.
    try {
      await queryInterface.sequelize.query(`
        UPDATE flights f
        SET destination_id_new = d.id
        FROM destinations d
        WHERE f.destination = d.name; 
      `);
       // Log how many rows were updated vs not updated (had NULL destination_id_new)
       const [updatedResults] = await queryInterface.sequelize.query(`SELECT COUNT(*) FROM flights WHERE destination_id_new IS NOT NULL;`);
       const [notUpdatedResults] = await queryInterface.sequelize.query(`SELECT COUNT(*) FROM flights WHERE destination_id_new IS NULL AND destination IS NOT NULL;`);
       console.log(`Populated destination_id for ${updatedResults[0].count} flights.`);
       if (notUpdatedResults[0].count > 0) {
         console.warn(`WARNING: Could not find matching destination ID for ${notUpdatedResults[0].count} flights based on the 'destination' name column. These flights will have NULL destination_id.`);
       }
    } catch (error) {
        console.error("Error during population of destination_id_new:", error);
        // Decide if the migration should fail or continue
        // throw error; // Uncomment to make the migration fail on population error
    }


    // 3. Add the foreign key constraint
    await queryInterface.addConstraint('flights', {
      fields: ['destination_id_new'],
      type: 'foreign key',
      name: 'flights_destination_id_fk', // Optional constraint name
      references: {
        table: 'destinations',
        field: 'id',
      },
      onDelete: 'SET NULL', // Or 'RESTRICT', 'CASCADE' depending on desired behavior
      onUpdate: 'CASCADE',
    });

    // Optional: If population was successful and you want to enforce non-nullability:
    // await queryInterface.changeColumn('flights', 'destination_id_new', {
    //   type: Sequelize.INTEGER,
    //   allowNull: false,
    // });

    // Optional: Rename the column if you used a temporary name
    // await queryInterface.renameColumn('flights', 'destination_id_new', 'destination_id');

    // IMPORTANT: Consider removing the old 'destination' string column in a separate, later migration
    // await queryInterface.removeColumn('flights', 'destination');
  },

  async down (queryInterface, Sequelize) {
    // 1. Remove the foreign key constraint
    // Use the exact constraint name if you defined one, otherwise Sequelize might guess
    await queryInterface.removeConstraint('flights', 'flights_destination_id_fk');

    // 2. Remove the column
    await queryInterface.removeColumn('flights', 'destination_id_new'); // Use the same name as in addColumn
  }
};
