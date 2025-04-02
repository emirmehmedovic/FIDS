// migrations/XXXXXXXXXXXXXX-add-password-to-users.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('users');
    if (!tableDescription.password) {
      // Add the column but allow nulls initially
      await queryInterface.addColumn('users', 'password', {
        type: Sequelize.STRING,
        allowNull: true, // Allow NULLs for now
      });
      console.log('Column "password" added to "users" table (allowing NULLs).');
      // Optional: You might want to add a separate step/migration later
      // to update NULL passwords and then set allowNull: false
    } else {
      console.log('Column "password" already exists in "users" table. Skipping addColumn.');
      // Optional: Check if it allows nulls and alter if needed, but safer to skip for now.
      // if (tableDescription.password.allowNull) { ... }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('users');
    if (tableDescription.password) {
      await queryInterface.removeColumn('users', 'password');
    } else {
      console.log('Column "password" does not exist in "users" table. Skipping removeColumn.');
    }
  },
};
