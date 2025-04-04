// migrations/XXXXXXXXXXXXXX-add-password-to-users.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('users');
    if (!tableDescription.password) {
      // Add the column and enforce non-null constraint
      await queryInterface.addColumn('users', 'password', {
        type: Sequelize.STRING,
        allowNull: false, // Enforce NOT NULL constraint
      });
      console.log('Column "password" added to "users" table (NOT NULL).');
    } else {
      console.log('Column "password" already exists in "users" table. Checking constraints...');
      // If it exists, ensure it doesn't allow nulls
      if (tableDescription.password.allowNull) {
        console.log('Altering existing "password" column to disallow NULLs.');
        await queryInterface.changeColumn('users', 'password', {
          type: Sequelize.STRING,
          allowNull: false,
        });
      } else {
        console.log('Existing "password" column already enforces NOT NULL.');
      }
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
