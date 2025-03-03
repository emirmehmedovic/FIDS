// utils/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getUserFromToken = async (token) => {
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ where: { id: decoded.user.id } });
    return user;
  } catch (err) {
    console.error('Greška pri dekodiranju tokena:', err);
    return null;
  }
};

module.exports = { getUserFromToken };
