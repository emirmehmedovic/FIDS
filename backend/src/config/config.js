require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    timezone: '+00:00', // Store times as UTC without timezone conversion
    logging: false // Disable SQL query logging
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
  },
  production: {
    dialect: 'postgres',
    use_env_variable: 'DATABASE_URL',
    timezone: '+00:00', // Store times as UTC without timezone conversion
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
  }
};
