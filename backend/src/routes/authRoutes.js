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

  try {
    // Pronađi korisnika po username-u
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json({ msg: 'Korisnik ne postoji' });
    }


    // Proveri lozinku
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Pogrešna lozinka' });
    }

    // Generiši JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role, // Dodajte role u payload
      },
    };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      async (err, token) => {
        if (err) {
          console.error('Greška pri generisanju tokena:', err);
          return res.status(500).send('Greška pri generisanju tokena');
        }
    
        // Spremite token u bazu podataka (opcionalno)
        user.token = token;
        await user.save();
    
        res.json({ 
          token, 
          user: { 
            id: user.id, 
            username: user.username, 
            role: user.role 
          } 
        });
      }
    );
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
      password_hash: passwordHash,
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
