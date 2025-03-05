require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres', // Ensure this is a string
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
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false,
        ca: process.env.DB_SSL_CERT
      } : {},
      connectTimeout: 30000
    },
    pool: {
      max: 10,
      min: 2,
      acquire: 60000,
      idle: 20000
    },
    logging: console.log // Dodajemo logging za debug
  },
};
