// check-admin-password.js
require('dotenv').config();
const { Sequelize } = require('sequelize');
const config = require('./src/config/config');

// Get the current environment
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

console.log(`Current environment: ${env}`);

// Create Sequelize instance
let sequelize;
if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
  );
}

// Define User model for this script
const User = sequelize.define('User', {
  username: Sequelize.STRING,
  password: Sequelize.STRING,
  role: Sequelize.STRING
}, {
  tableName: 'users',
  timestamps: true
});

async function checkAdminPassword() {
  try {
    // Connect to the database
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Find the admin user
    const admin = await User.findOne({ where: { username: 'admin' } });
    
    if (!admin) {
      console.error('Admin user not found!');
      return;
    }
    
    console.log('Admin user found:', admin.username);
    console.log('Admin user ID:', admin.id);
    console.log('Admin user role:', admin.role);
    
    // Check the password field
    console.log('Password field exists:', admin.password !== undefined);
    console.log('Password field type:', typeof admin.password);
    console.log('Password field value:', admin.password);
    console.log('Password field length:', admin.password ? admin.password.length : 0);
    
    // Check if the password starts with the bcrypt identifier
    if (admin.password) {
      console.log('Password starts with $2a$:', admin.password.startsWith('$2a$'));
      console.log('Password starts with $2b$:', admin.password.startsWith('$2b$'));
      console.log('Password starts with $2y$:', admin.password.startsWith('$2y$'));
    }
    
    // Update the password with a new hash
    const bcrypt = require('bcrypt');
    const plainPassword = '123456789EmIna';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    console.log('New password hash generated:', hashedPassword);
    
    // Update the admin user's password
    admin.password = hashedPassword;
    await admin.save();
    
    console.log('Admin password updated successfully!');
    
    // Verify the new password can be retrieved correctly
    const updatedAdmin = await User.findOne({ where: { username: 'admin' } });
    console.log('Updated password field value:', updatedAdmin.password);
    
  } catch (error) {
    console.error('Error checking admin password:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Run the check function
checkAdminPassword();
