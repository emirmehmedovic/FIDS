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
const Flight = require('./models/Flight'); 
const StaticPage = require('./models/StaticPage'); 
const DisplaySession = require('./models/displaySessionModel'); 
const User = require('./models/User'); 
const Destination = require('./models/Destination'); // Import Destination model
const FlightNumber = require('./models/FlightNumber'); // Import FlightNumber model

// Import kontrolera
const flightController = require('./controllers/flightController');

// Import ruta
const flightRoutes = require('./routes/flightRoutes');
const airlineRoutes = require('./routes/airlineRoutes');
const displayRoutes = require('./routes/displayRoutes');
const contentRoutes = require('./routes/contentRoutes');
const contentController = require('./controllers/contentController');
const flightNumberRoutes = require('./routes/flightNumberRoutes');
const notificationTemplateRoutes = require('./routes/notificationTemplateRoutes'); // Import notification template routes

// Konfiguracija aplikacije
const app = express();
const PORT = process.env.PORT || 5001;

// ===== DEBUG LOGGING START =====
app.use((req, res, next) => {
  console.log(`[REQUEST RECEIVED] ${req.method} ${req.originalUrl} from ${req.ip}`);
  // Logiraj Content-Type za POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    console.log(`[REQUEST HEADERS] Content-Type: ${req.headers['content-type']}`);
  }
  next(); // Obavezno pozovi next()!
});
// ===== DEBUG LOGGING END =====

// =============================================
// 1. MIDDLEWARE KONFIGURACIJA
// =============================================

// CORS konfiguracija - Koristimo cors middleware
const allowedOrigins = [
  'http://localhost:3000', // Za lokalni frontend razvoj
  'http://192.168.18.15:3000', // Za frontend na lokalnom VM-u
  'https://fids.vercel.app' // Ažurirano sa stvarnim Vercel URL-om
  // Dodaj druge origine ako je potrebno
];

const corsOptions = {
  origin: function (origin, callback) {
    // Dozvoli zahtjeve bez origina (npr. mobilne aplikacije, curl) ili ako je origin na listi dozvoljenih
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Omogući slanje kolačića (cookies)
  optionsSuccessStatus: 200 // Za starije browsere
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());

// Serviranje statičkih fajlova
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// =============================================
// 2. DEFINISANJE ASOCIJACIJA IZMEĐU MODELA 
//    (Relying on definitions within model files where possible)
// =============================================

// Airline -> Flight (1:M) - Defined in Flight.js & Airline.js (implicitly via hasMany)
// Flight -> Airline (M:1) - Defined in Flight.js

// DisplaySession -> Flight (M:1) 
// NOTE: Assuming this is NOT defined in DisplaySession model file, define here.
DisplaySession.belongsTo(Flight, {
  foreignKey: 'flight_id',
  as: 'flight' 
});

// Associations for dual flight sessions
DisplaySession.belongsTo(Flight, {
  foreignKey: 'flight1_id',
  as: 'flight1',
  constraints: false
});

DisplaySession.belongsTo(Flight, {
  foreignKey: 'flight2_id',
  as: 'flight2',
  constraints: false
});

// Flight -> DisplaySession (1:M)
// NOTE: Assuming this is NOT defined in Flight model file, define here.
Flight.hasMany(DisplaySession, {
  foreignKey: 'flight_id',
  as: 'sessions'
});

// Flight -> Destination (M:1) - Defined in Flight.js
// Destination -> Flight (1:M) - Defined in Flight.js

// DisplaySession -> Airline (M:1) - For custom sessions
// NOTE: Assuming this is NOT defined in DisplaySession model file, define here.
DisplaySession.belongsTo(Airline, { 
  foreignKey: 'customAirlineId', 
  as: 'CustomAirline', 
  constraints: false 
});


require('dotenv').config(); // Keep dotenv config load

// =============================================
// 3. REGISTRACIJA RUTA
// =============================================

// Prefiksiraj sve API rute sa /api
app.use('/api/auth', authRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/airlines', airlineRoutes);
app.use('/api/display', displayRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/public/daily-schedule', require('./routes/publicDailyScheduleRoutes'));
app.use('/api/destinations', destinationRoutes);
app.use('/api/flight-numbers', flightNumberRoutes);
app.use('/api/notification-templates', notificationTemplateRoutes);

// Obrisane duple rute bez /api prefixa

// Test ruta
app.get('/', (req, res) => {
  res.send('Flight Management Backend je aktivan!');
});

// Debug route to check environment variables
app.get('/debug-env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV || 'not set',
    JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
    DB_HOST: process.env.DB_HOST || 'not set',
    DB_PORT: process.env.DB_PORT || 'not set',
    DB_NAME: process.env.DB_NAME || 'not set',
    DB_USER: process.env.DB_USER || 'not set',
    DB_PASS_EXISTS: !!process.env.DB_PASS
  });
});

// Static HTML routes for TV displays
app.get('/tv/daily-schedule', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/public-daily-schedule.html'));
});

app.get('/tv/display/:pageId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/public-display.html'));
});

// Standalone HTML routes for maximum compatibility
app.get('/standalone/daily-schedule', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/standalone-daily-schedule.html'));
});

app.get('/standalone/display/:pageId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/standalone-display.html'));
});

// API endpoints for static HTML pages - dodajemo /api prefiks
app.get('/api/public/daily-schedule-static', async (req, res) => {
  try {
    // Reuse the existing controller logic
    const flights = await flightController.getDailyFlights();
    res.json(flights);
  } catch (error) {
    console.error('Error fetching daily flights for static page:', error);
    res.status(500).json({ error: 'Failed to fetch flight data' });
  }
});

app.get('/api/display/active-static', async (req, res) => {
  try {
    const { page } = req.query;
    if (!page) {
      return res.status(400).json({ error: 'Page parameter is required' });
    }
    
    // Query the database for active display sessions for this page
    const sessions = await DisplaySession.findAll({
      where: {
        page_id: page,
        is_active: true
      },
      include: [
        {
          model: Flight,
          as: 'Flight', // Keep this alias for DisplaySession -> Flight
          include: [
            {
              model: Airline // Removed alias 'Airline' from nested include
            },
            {
              model: Destination // Include Destination, removed conflicting alias 'DestinationInfo'
              // Sequelize should use the 'DestinationInfo' alias defined in Flight model automatically
            }
          ]
        }
      ],
      order: [['priority', 'DESC']]
    });
    
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching active sessions for static page:', error);
    res.status(500).json({ error: 'Failed to fetch session data' });
  }
});

app.get('/api/content/page-static/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    
    // Find the static page content
    const page = await StaticPage.findOne({
      where: { pageId }
    });
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    res.json({
      content: {
        imageUrl: page.imageUrl
      }
    });
  } catch (error) {
    console.error('Error fetching page content for static page:', error);
    res.status(500).json({ error: 'Failed to fetch page content' });
  }
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
    // REMOVED: await sequelize.sync({ alter: true }); - Rely on migrations for schema changes
    console.log('✅ Database connection verified. Schema managed by migrations.');

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
app.post('/auth/create-user', async (req, res) => {
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
