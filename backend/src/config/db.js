require('dotenv').config();
const { Sequelize } = require('sequelize');
const config = require('./config.js');

let sequelize;

// Determine which environment we're in
const env = process.env.NODE_ENV || 'development';
console.log(`Current environment: ${env}`);
console.log(`DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
const dbConfig = config[env];

// Always use DATABASE_URL in production if it exists
if (env === 'production' && process.env.DATABASE_URL) {
  console.log('Using DATABASE_URL for production');
  
  // Ensure URL starts with postgres:// (some Sequelize versions prefer this)
  let dbUrl = process.env.DATABASE_URL;
  if (dbUrl.startsWith('postgresql://')) {
    dbUrl = 'postgres://' + dbUrl.substring('postgresql://'.length);
    console.log('Converted postgresql:// to postgres:// in URL');
  }
  
  // For production with DATABASE_URL (Render.com)
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    dialectOptions: {
      // Try a simpler SSL configuration that works with many PostgreSQL providers
      ssl: true,
      connectTimeout: 60000
    },
    pool: {
      max: 10,
      min: 2,
      acquire: 120000,
      idle: 30000
    },
    logging: true // Enable logging temporarily for debugging
  });
} else {
  console.log('Using individual environment variables for database connection');
  
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
