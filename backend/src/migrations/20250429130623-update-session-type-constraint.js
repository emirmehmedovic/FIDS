'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Define the constraint name (adjust if different in your DB)
    const constraintName = 'display_sessions_session_type_check';
    const tableName = 'display_sessions'; // Ensure table name is correct

    // Remove the old constraint first
    // Note: Constraint names can vary slightly depending on DB/creation method.
    // You might need to check the exact constraint name in your DB if this fails.
    try {
      await queryInterface.removeConstraint(tableName, constraintName);
      console.log(`Removed constraint: ${constraintName}`);
    } catch (error) {
      console.warn(`Could not remove constraint ${constraintName} (maybe it doesn't exist or name is different?): ${error.message}`);
      // Continue even if removal fails, as adding the new one might still work or provide a clearer error
    }

    // Add the new constraint including 'notice'
    await queryInterface.addConstraint(tableName, {
      fields: ['session_type'], // Column name might be 'session_type' or 'sessionType' depending on definition
      type: 'check',
      where: {
        session_type: { // Column name
          [Sequelize.Op.in]: ['check-in', 'boarding', 'notice'] // Add 'notice' here
        }
      },
      name: constraintName // Use the same name or a new one if preferred
    });
    console.log(`Added new constraint: ${constraintName} allowing 'notice'`);
  },

  async down (queryInterface, Sequelize) {
    // Revert to the old constraint (without 'notice')
    const constraintName = 'display_sessions_session_type_check';
    const tableName = 'display_sessions';

    try {
      await queryInterface.removeConstraint(tableName, constraintName);
    } catch (error) {
      console.warn(`Could not remove constraint ${constraintName} during down migration.`);
    }

    await queryInterface.addConstraint(tableName, {
      fields: ['session_type'],
      type: 'check',
      where: {
        session_type: {
          [Sequelize.Op.in]: ['check-in', 'boarding'] // Revert to old values
        }
      },
      name: constraintName
    });
    console.log(`Reverted constraint: ${constraintName} removing 'notice'`);
  }
};