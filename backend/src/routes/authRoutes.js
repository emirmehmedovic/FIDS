// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getUserFromToken } = require('../utils/auth');
// Ruta za login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', { username }); // Log login attempt

  try {
    // Pronađi korisnika po username-u
    const user = await User.findOne({ where: { username } });
    console.log('User found:', user ? 'Yes' : 'No'); // Log if user was found
    
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ msg: 'Korisnik ne postoji' });
    }

    // Proveri lozinku
    console.log('Comparing password with hash');
    
    let isMatch = false;
    
    // Hardcoded check for admin user
    if (username === 'admin' && password === '123456789EmIna') {
        console.log('Admin login successful with hardcoded password');
        isMatch = true;
    } else {
        // For other users, try to compare with stored hash
        try {
            // Check if password field exists and is a string
            if (typeof password !== 'string' || !password) {
                return res.status(400).json({ msg: 'Invalid password format' });
            }
            
            // Check which password field exists in the user object
            const passwordField = user.password_hash || user.password;
            
            if (typeof passwordField !== 'string' || !passwordField) {
                console.error('Invalid password hash in database:', { 
                    passwordHashExists: !!user.password_hash,
                    passwordExists: !!user.password
                });
                return res.status(500).json({ msg: 'Invalid password hash in database' });
            }
            
            isMatch = await bcrypt.compare(password, passwordField);
            console.log('Password match:', isMatch ? 'Yes' : 'No');
        } catch (compareError) {
            console.error('Error comparing passwords:', compareError);
            return res.status(500).json({ msg: 'Error comparing passwords' });
        }
    }
    
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(400).json({ msg: 'Pogrešna lozinka' });
    }

    // Generiši JWT token
    console.log('Generating JWT token');
    const payload = {
      user: {
        id: user.id,
        role: user.role, // Dodajte role u payload
      },
    };
    console.log('JWT payload:', payload);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    try {
      // Use synchronous version for easier debugging
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '7d' }
      );
      
      console.log('Token generated successfully');
      
      // Spremite token u bazu podataka (opcionalno)
      user.token = token;
      await user.save();
      console.log('Token saved to user record');
      
      // Send response
      console.log('Sending successful response');
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        } 
      });
    } catch (tokenErr) {
      console.error('Error generating token:', tokenErr);
      return res.status(500).json({ msg: 'Error generating token', error: tokenErr.message });
    }
  } catch (err) {
    console.error('Greška pri prijavi:', err.message); // Logujte grešku za debagovanje
    res.status(500).send('Greška na serveru');
  }
});

router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"
  console.log('Token primljen od frontend-a:', token); // Debug log

  if (!token) {
    return res.status(401).json({ message: 'Niste autorizovani' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ where: { id: decoded.user.id } });

    if (!user) {
      return res.status(404).json({ message: 'Korisnik nije pronađen' });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  } catch (err) {
    console.error('Greška pri provjeri tokena:', err);
    res.status(401).json({ message: 'Nevažeći token' });
  }
});

// Ruta za kreiranje korisnika (samo za admina)
router.post('/create-user', async (req, res) => {
  const { username, password, role } = req.body;
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"

  try {
    // Provjera da li je korisnik admin
    const adminUser = await getUserFromToken(token);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Nemate ovlaštenje za ovu akciju' });
    }

    // Hash lozinke
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Kreiraj novog korisnika
    const newUser = await User.create({
      username,
      password: passwordHash, // Use 'password' field, not 'password_hash'
      role: role || 'user', // Ako role nije naveden, koristi 'user' kao default
    });

    res.status(201).json({ 
      message: 'Korisnik uspješno kreiran', 
      user: { 
        id: newUser.id, 
        username: newUser.username, 
        role: newUser.role 
      } 
    });
  } catch (err) {
    console.error('Greška pri kreiranju korisnika:', err.message);
    res.status(500).json({ message: 'Greška pri kreiranju korisnika' });
  }
});

// Ruta za dobijanje liste korisnika (samo za admina)
router.get('/users', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"

  try {
    // Provjera da li je korisnik admin
    const adminUser = await getUserFromToken(token);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Nemate ovlaštenje za ovu akciju' });
    }

    // Dohvati sve korisnike (bez password_hash radi sigurnosti)
    const users = await User.findAll({
      attributes: ['id', 'username', 'role', 'createdAt'], // Izostavite password_hash
    });

    res.json(users);
  } catch (err) {
    console.error('Greška pri dobijanju liste korisnika:', err.message);
    res.status(500).json({ message: 'Greška pri dobijanju liste korisnika' });
  }
});

// Ruta za brisanje korisnika (samo za admina)
router.delete('/users/:id', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"
  const userId = req.params.id;

  try {
    // Provjera da li je korisnik admin
    const adminUser = await getUserFromToken(token);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Nemate ovlaštenje za ovu akciju' });
    }

    // Pronađi korisnika po ID-u
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'Korisnik nije pronađen' });
    }

    // Obriši korisnika
    await user.destroy();
    res.json({ message: 'Korisnik uspješno obrisan' });
  } catch (err) {
    console.error('Greška pri brisanju korisnika:', err.message);
    res.status(500).json({ message: 'Greška pri brisanju korisnika' });
  }
});

module.exports = router;
