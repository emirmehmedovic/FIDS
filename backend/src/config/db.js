require('dotenv').config();
const { Sequelize } = require('sequelize');
const config = require('./config.js');

let sequelize;

// Determine which environment we're in
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

if (env === 'production' && process.env.DATABASE_URL) {
  // For production with DATABASE_URL (Render.com)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
        ca: process.env.DB_SSL_CERT
      },
      connectTimeout: 60000
    },
    pool: {
      max: 10,
      min: 2,
      acquire: 120000,
      idle: 30000
    },
    logging: false
  });
} else {
  // For development/test environments
  sequelize = new Sequelize(
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
}

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Veza s bazom podataka uspostavljena.');
  } catch (error) {
    console.error('Greška prilikom povezivanja s bazom podataka:', error);
  }
})();

module.exports = sequelize;
