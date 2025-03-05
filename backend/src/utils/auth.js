// utils/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getUserFromToken = async (token) => {
  if (!token) {
    console.log('No token provided to getUserFromToken');
    return null;
  }
  
  try {
    console.log('JWT_SECRET exists in getUserFromToken:', !!process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    console.log('Token decoded successfully in getUserFromToken:', decoded);
    
    const user = await User.findOne({ where: { id: decoded.user.id } });
    console.log('User found in getUserFromToken:', user ? 'Yes' : 'No');
    
    return user;
  } catch (err) {
    console.error('Greška pri dekodiranju tokena:', err);
    return null;
  }
};

module.exports = { getUserFromToken };
