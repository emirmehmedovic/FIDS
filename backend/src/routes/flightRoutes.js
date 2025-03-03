const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flightController');
const { authenticate } = require('../middleware/authMiddleware'); 

// Dohvati sve letove
router.get('/', flightController.getAllFlights);

// Dohvati dnevne odlaske
router.get('/daily-departures', flightController.getDailyDepartures);

// Dohvati jedan let po ID-u
router.get('/:id', flightController.getFlightById);

// Kreiraj novi let
router.post('/', authenticate, flightController.createFlight);

// Ažuriraj postojeći let
router.put('/:id', authenticate, flightController.updateFlight);

// Obriši let
router.delete('/:id', authenticate, flightController.deleteFlight);

// Generiraj mjesečni raspored
router.post('/generate-monthly-schedule', authenticate, flightController.generateMonthlySchedule);

// Dohvati dnevni raspored letova
router.get('/daily/schedule', flightController.getDailyFlights);

// Ažuriraj napomene (remarks) za let - dostupno svim prijavljenim korisnicima
router.put(
    '/:id/remarks',
    authenticate, 
    flightController.updateFlightRemarks
  );

  router.get('/remarks/export', flightController.exportRemarks);

module.exports = router;
