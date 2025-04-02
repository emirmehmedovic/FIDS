// migrations/XXXXXXXXXXXXXX-add-token-to-user.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('users');
    if (!tableDescription.token) {
      await queryInterface.addColumn('users', 'token', {
        type: Sequelize.STRING,
        allowNull: true, // Already allows null, which is good
      });
      console.log('Column "token" added to "users" table.');
    } else {
      console.log('Column "token" already exists in "users" table. Skipping addColumn.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('users');
    if (tableDescription.token) {
      await queryInterface.removeColumn('users', 'token');
    } else {
      console.log('Column "token" does not exist in "users" table. Skipping removeColumn.');
    }
  },
};
