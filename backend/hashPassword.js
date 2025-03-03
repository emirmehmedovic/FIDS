// hashPassword.js
const bcrypt = require('bcryptjs');

const password = '123456789EmIna'; // Unesite željenu lozinku
const salt = bcrypt.genSaltSync(10);
const hashedPassword = bcrypt.hashSync(password, salt);

console.log('Hashed Password:', hashedPassword);