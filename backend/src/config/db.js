// backend/src/config/db.js - Updated to use config.js
const { Sequelize } = require('sequelize');
const config = require('./config.js'); // Import the configurations

// Determine which environment we're in
const env = process.env.NODE_ENV || 'development';
console.log(`Initializing Sequelize for environment: ${env}`);

// Get the configuration for the current environment
const dbConfig = config[env];

if (!dbConfig) {
  throw new Error(`Configuration for environment "${env}" not found in config.js`);
}

let sequelize;

// Check if DATABASE_URL should be used (typically for production)
if (dbConfig.use_env_variable) {
  const dbUrl = process.env[dbConfig.use_env_variable];
  if (!dbUrl) {
    throw new Error(`Environment variable "${dbConfig.use_env_variable}" is not set, but required by config.js for environment "${env}".`);
  }
  console.log(`Using environment variable ${dbConfig.use_env_variable} for connection.`);
  // Pass the URL and the rest of the config options (like dialectOptions, pool, logging)
  sequelize = new Sequelize(dbUrl, dbConfig); 
} else {
  // Use individual parameters from the config object
  console.log(`Using individual parameters from config.js for environment "${env}".`);
  sequelize = new Sequelize(
    dbConfig.database, 
    dbConfig.username, 
    dbConfig.password, 
    dbConfig // Pass the entire config object (host, port, dialect, logging, etc.)
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
