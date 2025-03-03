require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(

  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' 
      ? (msg) => console.log(`\n[SEQUELIZE] ${msg}\n`) 
      : false,
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Veza s bazom podataka uspostavljena.');
  } catch (error) {
    console.error('Greška prilikom povezivanja s bazom podataka:', error);
  }
})();

module.exports = sequelize;