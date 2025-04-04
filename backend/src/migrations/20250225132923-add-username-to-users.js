// migrations/XXXXXXXXXXXXXX-add-username-to-users.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, check if the 'users' table exists
    const tables = await queryInterface.showAllTables();
    if (tables.includes('users')) {
      // If table exists, then check if the column already exists
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
    } else {
      // This case should ideally not happen if migrations run in order, 
      // but handles the scenario where this migration runs before the table is created.
      console.log('Table "users" does not exist yet. Skipping addColumn for "username" in migration 20250225132923.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // No action needed here. The 'users' table will be dropped by the 
    // 'down' function of the migration that created it (20250225134831-create-users.js)
    // during a db:migrate:undo:all operation. Attempting to remove the column
    // here would fail if the table has already been dropped.
    console.log('Skipping removeColumn for "username" in migration 20250225132923. Table will be dropped later.');
    // No await queryInterface.removeColumn('users', 'username');
  },
};
