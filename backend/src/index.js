// src/index.js (ažurirano)
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const bcrypt = require('bcrypt'); // Dodano za hash lozinke
const jwt = require('jsonwebtoken'); // Dodano za verifikaciju tokena
const destinationRoutes = require('./routes/destinationRoutes');

// Uvoz pojedinačnih modela
const Airline = require('./models/Airline'); // Uvoz Airline modela
const Flight = require('./models/Flight'); // Uvoz Flight modela
const StaticPage = require('./models/StaticPage'); // Uvoz StaticPage modela
const DisplaySession = require('./models/displaySessionModel'); // Uvoz DisplaySession modela
const User = require('./models/User'); // Uvoz User modela

// Import kontrolera
const flightController = require('./controllers/flightController');

// Import ruta
const flightRoutes = require('./routes/flightRoutes');
const airlineRoutes = require('./routes/airlineRoutes');
const displayRoutes = require('./routes/displayRoutes');
const contentRoutes = require('./routes/contentRoutes');
const contentController = require('./controllers/contentController');
const flightNumberRoutes = require('./routes/flightNumberRoutes');

// Konfiguracija aplikacije
const app = express();
const PORT = process.env.PORT || 5001;

// =============================================
// 1. MIDDLEWARE KONFIGURACIJA
// =============================================

// CORS konfiguracija - allow specific origins with credentials
app.use((req, res, next) => {
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Body parser middleware
app.use(express.json());

// Serviranje statičkih fajlova
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// =============================================
// 2. DEFINISANJE ASOCIJACIJA IZMEĐU MODELA
// =============================================

// Airline -> Flight (1:M)
Airline.hasMany(Flight, {
  foreignKey: 'airline_id',
  onDelete: 'CASCADE',
  as: 'flights'
});

// Flight -> Airline (M:1)
Flight.belongsTo(Airline, { 
  foreignKey: 'airline_id',
  onDelete: 'CASCADE' ,
  as: 'Airline' // Dodajte alias za dosljednost!
});

// DisplaySession -> Flight (M:1)
DisplaySession.belongsTo(Flight, {
  foreignKey: 'flight_id',
  as: 'flight'
});

// Flight -> DisplaySession (1:M)
Flight.hasMany(DisplaySession, {
  foreignKey: 'flight_id',
  as: 'sessions'
});

require('dotenv').config();

// =============================================
// 3. REGISTRACIJA RUTA
// =============================================

// Glavne funkcionalne rute
app.use('/api/auth', authRoutes);
app.use('/flights', require('./routes/flightRoutes')); // Uključite flight rute
app.use('/airlines', require('./routes/airlineRoutes'));
app.use('/api/flights', flightRoutes);

app.get('/flights', flightController.getAllFlights);
app.get('/flights/:id', flightController.getFlightById);
app.post('/flights', flightController.createFlight);
app.get('/flights/daily-departures', flightController.getDailyDepartures);

app.use('/api/display', displayRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/airlines', airlineRoutes);

app.use('/api/public/daily-schedule', require('./routes/publicDailyScheduleRoutes'));
app.use('/api/destinations', destinationRoutes);
app.use('/api/flight-numbers', flightNumberRoutes);
// Test ruta
app.get('/', (req, res) => {
  res.send('Flight Management Backend je aktivan!');
});

// =============================================
// 4. CRON JOBS
// =============================================

// Automatsko ažuriranje dnevnih letova u ponoć
cron.schedule('0 0 * * *', async () => {
  try {
    const dailyFlights = await flightController.getDailyFlights();
    console.log('[CRON] Dnevni letovi ažurirani:', dailyFlights);
  } catch (error) {
    console.error('[CRON] Greška:', error);
  }
});

// =============================================
// 5. INICIJALIZACIJA BAZE
// =============================================

// index.js (dodajte inicijalne podatke)
const initDB = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Tabele uspješno sinhronizovane');

    // Dodaj inicijalne statičke stranice
    await StaticPage.bulkCreate([
      { pageId: "C1", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "C2", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "C3", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "C4", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "C5", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "C6", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "C7", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "C8", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "C9", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "C10", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "C11", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "C12", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "C12", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "C13", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" }, { pageId: "C16", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "C14", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" }, { pageId: "C17", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "C18", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "C20", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "C15", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "C19", pageType: "check-in", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "U1", pageType: "boarding", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "U2", pageType: "boarding", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "U3", pageType: "boarding", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "U4", pageType: "boarding", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "U5", pageType: "boarding", imageUrl: "/uploads/Wizzairlogo.png" },
      { pageId: "U6", pageType: "boarding", imageUrl: "/uploads/Wizzairlogo.png" }
    ], 
    { 
      ignoreDuplicates: true 
    });

    // Provjeri da li postoji admin korisnik, ako ne, kreiraj ga
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount === 0) {
      console.log('Kreiranje inicijalnog admin korisnika...');
      const hashedPassword = await bcrypt.hash('123456789EmIna', 10);
      await User.create({
        username: 'admin',
        password_hash: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Inicijalni admin korisnik kreiran');
    }

  } catch (error) {
    console.error('❌ Greška pri sinhronizaciji:', error);
    process.exit(1); // Zaustavi aplikaciju ako ne može spojiti bazu
  }
};
// =============================================
// 6. KREIRANJE KORISNIKA (ADMIN ONLY)
// =============================================
app.post('/api/auth/create-user', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Niste autorizovani' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await User.findByPk(decoded.user.id);
    
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Nemate ovlaštenje!' });
    }

    const { username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, password_hash: hashedPassword, role });
    res.status(201).json({ message: 'Korisnik uspešno kreiran', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Greška pri kreiranju korisnika', error: error.message });
  }
});

// =============================================
// 7. GLOBALNA GREŠKA
// =============================================
app.use((err, req, res, next) => {
  console.error('🔥 Globalna greška:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// =============================================
// 8. POKRETANJE SERVERA
// =============================================
app.listen(PORT, async () => {
  await initDB();
  console.log(`🚀 Server je pokrenut na portu ${PORT}`);
});
