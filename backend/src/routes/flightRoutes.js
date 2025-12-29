const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flightController');
// Import roleAuth as well
const { authenticate, roleAuth } = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer for CSV upload (using memory storage)
const csvUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Accept only CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
}); 

// Public routes: Get flight information
router.get('/', flightController.getAllFlights);

// Dohvati dnevne odlaske
router.get('/daily-departures', flightController.getDailyDepartures);

// Dohvati dnevni raspored letova (Moved before /:id)
router.get('/daily/schedule', flightController.getDailyFlights);

// Dohvati jedan let po ID-u
router.get('/:id', flightController.getFlightById);

// Admin and User routes: Manage flights
router.post('/', roleAuth(['admin', 'user']), flightController.createFlight); // Allow admin and user
router.put('/:id', roleAuth(['admin', 'user']), flightController.updateFlight); // Allow admin and user
router.delete('/:id', roleAuth(['admin', 'user']), flightController.deleteFlight); // Allow admin and user
router.post('/generate-monthly-schedule', roleAuth(['admin', 'user']), flightController.generateMonthlySchedule); // Allow admin and user
router.delete('/monthly-schedule/:year/:month', roleAuth(['admin', 'user']), flightController.deleteMonthlySchedule); // Allow admin and user to delete monthly schedule

// Export remarks (Allow admin and user)
router.get('/remarks/export', roleAuth(['admin', 'user']), flightController.exportRemarks); // Allow admin and user

// Preview CSV file before importing (Allow admin and user)
router.post('/preview-csv', roleAuth(['admin', 'user']), csvUpload.single('csvFile'), flightController.previewCsv);

// Import flights from CSV (Allow admin and user)
router.post('/import-csv', roleAuth(['admin', 'user']), csvUpload.single('csvFile'), flightController.importFlightsFromCSV);

module.exports = router;
