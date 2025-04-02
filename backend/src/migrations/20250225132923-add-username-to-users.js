// migrations/XXXXXXXXXXXXXX-add-username-to-users.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the column already exists
    const tableDescription = await queryInterface.describeTable('users');
    if (!tableDescription.username) {
      await queryInterface.addColumn('users', 'username', {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      });
    } else {
      console.log('Column "username" already exists in "users" table. Skipping addColumn.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Optional: Add a check here too for robustness
    const tableDescription = await queryInterface.describeTable('users');
    if (tableDescription.username) {
      await queryInterface.removeColumn('users', 'username');
    } else {
      console.log('Column "username" does not exist in "users" table. Skipping removeColumn.');
    }
  },
};
