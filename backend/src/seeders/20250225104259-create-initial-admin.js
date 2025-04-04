// seeders/XXXXXXXXXXXXXX-create-initial-admin.js
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const salt = bcrypt.genSaltSync(10);
    const plainPassword = '123456789EmIna'; // Use a variable for clarity
    const hashedPassword = bcrypt.hashSync(plainPassword, salt);
    console.log(`[Seeder] Generated hash for admin: ${hashedPassword ? 'OK' : 'FAILED'}`); // Log hash generation status

    const userData = {
        username: 'admin',
        password: hashedPassword, 
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    console.log('[Seeder] Inserting user data:', JSON.stringify(userData, null, 2)); // Log the data being inserted

    return queryInterface.bulkInsert('users', [userData]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('users', { username: 'admin' });
  },
};
