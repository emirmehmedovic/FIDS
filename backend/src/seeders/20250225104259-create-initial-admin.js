// seeders/XXXXXXXXXXXXXX-create-initial-admin.js
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync('123456789EmIna', salt);

    return queryInterface.bulkInsert('users', [
      {
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('users', { username: 'admin' });
  },
};
