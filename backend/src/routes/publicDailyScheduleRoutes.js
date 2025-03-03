// routes/publicDailyScheduleRoutes.js
const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flightController');

// Dobavi dnevne letove
router.get('/', flightController.getDailyFlights);

module.exports = router;