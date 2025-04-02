'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    try {
      // Attempt to add 'stw' to the ENUM type
      await queryInterface.sequelize.query("ALTER TYPE enum_users_role ADD VALUE 'stw';");
      console.log("Successfully added 'stw' to enum_users_role.");
    } catch (error) {
      // Check if the error is because the ENUM type doesn't exist (PostgreSQL code '42704')
      if (error.original?.code === '42704') {
        console.warn("ENUM type 'enum_users_role' does not exist. Skipping adding 'stw' value. The 'role' column might be a STRING type instead.");
      } else if (error.message.includes("enum label \"stw\" already exists")) {
        // Also handle if the value somehow already exists
        console.log("Value 'stw' already exists in enum_users_role. Skipping.");
      } else {
        // Log and re-throw other unexpected errors
        console.error("Unexpected error altering enum_users_role:", error);
        throw error;
      }
    }
  },

  async down (queryInterface, Sequelize) {
    // Down migration remains complex and potentially unsafe, keep the warning.
    console.log("Rolling back add-stw-role: The 'stw' value was NOT automatically removed from the ENUM type (if it existed). Manual check/cleanup might be needed if the type was ENUM.");
  }
};
