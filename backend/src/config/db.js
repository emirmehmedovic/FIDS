// backend/src/config/db.js - Updated to use config.js
const { Sequelize } = require('sequelize');
const config = require('./config.js'); // Import the configurations
const pg = require('pg');

// Override pg's default timestamp parsing to return strings instead of Date objects
// This prevents timezone conversion issues
// 1114 = TIMESTAMP WITHOUT TIME ZONE
// 1184 = TIMESTAMP WITH TIME ZONE

// Helper function to format timestamp as ISO string with Z suffix
// This tells JavaScript to interpret the time as UTC, preserving the exact hours/minutes
const formatTimestampAsUTC = (stringValue) => {
  if (!stringValue) return null;
  // PostgreSQL returns format like "2025-12-29 14:39:00" or "2025-12-29 14:39:00+00"
  // Extract date and time parts, ignore any timezone suffix from PostgreSQL
  const match = stringValue.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/);
  if (match) {
    // Return as ISO format with Z suffix - this tells JavaScript the time IS UTC
    // so getUTCHours() will return the exact hour from the database
    return `${match[1]}T${match[2]}.000Z`;
  }
  return stringValue;
};

pg.types.setTypeParser(1114, formatTimestampAsUTC); // TIMESTAMP WITHOUT TIME ZONE
pg.types.setTypeParser(1184, formatTimestampAsUTC); // TIMESTAMP WITH TIME ZONE

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
