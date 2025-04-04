// update-admin-password.js
require('dotenv').config();
const bcrypt = require('bcrypt');
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

async function updateAdminPassword() {
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
    
    // Generate a new hash for the admin password
    const plainPassword = '123456789EmIna'; // Use the same password from the seeder
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    console.log('New password hash generated:', hashedPassword);
    
    // Update the admin user's password
    admin.password = hashedPassword;
    await admin.save();
    
    console.log('Admin password updated successfully!');
    
    // Verify the new password
    const isMatch = await bcrypt.compare(plainPassword, admin.password);
    console.log('Password verification test:', isMatch ? 'PASSED' : 'FAILED');
    
  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Run the update function
updateAdminPassword();
