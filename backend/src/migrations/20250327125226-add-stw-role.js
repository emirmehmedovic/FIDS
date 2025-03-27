'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add 'stw' to the existing ENUM type for the role column in the 'users' table.
    // IMPORTANT: This assumes your ENUM type is named 'enum_users_role'. 
    // If it has a different name, this migration will fail, and you'll need to adjust the name.
    try {
      await queryInterface.sequelize.query("ALTER TYPE enum_users_role ADD VALUE 'stw';");
      console.log("Successfully added 'stw' to enum_users_role.");
    } catch (error) {
      // Check if the error is because the value already exists (useful if migration is run multiple times)
      if (error.message.includes("enum label \"stw\" already exists")) {
        console.log("Value 'stw' already exists in enum_users_role. Skipping.");
      } else {
        // Log the specific error and re-throw if it's something else
        console.error("Error adding 'stw' to enum_users_role. Your ENUM type might have a different name.", error);
        // Try to find the actual enum name if possible (PostgreSQL specific)
        try {
          const enumData = await queryInterface.sequelize.query(
            `SELECT t.typname AS enum_name
             FROM pg_type t 
             JOIN pg_enum e ON t.oid = e.enumtypid  
             JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
             WHERE n.nspname = 'public' AND t.typname LIKE '%users%role%'
             GROUP BY t.typname;`, 
            { type: queryInterface.sequelize.QueryTypes.SELECT }
          );
          if (enumData && enumData.length > 0) {
            console.log("Possible ENUM names found:", enumData.map(e => e.enum_name).join(', '));
            console.log("Please update the migration file with the correct ENUM name and run again.");
          }
        } catch (enumError) {
          console.error("Could not query for ENUM names.", enumError);
        }
        throw error; // Re-throw the original error to stop migration
      }
    }
  },

  async down (queryInterface, Sequelize) {
    // Removing an ENUM value in PostgreSQL is complex and often requires recreating the type.
    // This simplified 'down' function does not remove the 'stw' value to avoid potential data loss
    // or complex type manipulation during rollback. Manual intervention would be needed for a full rollback.
    console.log("Rolling back add-stw-role: The 'stw' value was NOT automatically removed from the ENUM type.");
    // To properly remove:
    // 1. Ensure no users have the 'stw' role.
    // 2. Recreate the enum type without 'stw'.
    // 3. Update the table column to use the new type.
    // Example (DANGEROUS - requires manual checks):
    // await queryInterface.sequelize.query("UPDATE users SET role = 'user' WHERE role = 'stw';"); // Change existing 'stw' users
    // await queryInterface.sequelize.query("ALTER TYPE enum_users_role RENAME TO enum_users_role_old;");
    // await queryInterface.sequelize.query("CREATE TYPE enum_users_role AS ENUM('admin', 'user');"); // Recreate without 'stw'
    // await queryInterface.sequelize.query("ALTER TABLE users ALTER COLUMN role TYPE enum_users_role USING role::text::enum_users_role;");
    // await queryInterface.sequelize.query("DROP TYPE enum_users_role_old;");
  }
};
