const express = require('express');
const router = express.Router();
const airlineController = require('../controllers/airlineController');
// Import roleAuth as well
const { authenticate, roleAuth } = require('../middleware/authMiddleware'); 

// Public routes: Get airlines
router.get('/', airlineController.getAllAirlines);

// Dohvati jednu aviokompaniju po ID-u
router.get('/:id', airlineController.getAirlineById);

// Admin and User routes: Manage airlines
router.post('/', roleAuth(['admin', 'user']), airlineController.createAirline); // Allow admin and user
router.put('/:id', roleAuth(['admin', 'user']), airlineController.updateAirline); // Allow admin and user
router.delete('/:id', roleAuth(['admin', 'user']), airlineController.deleteAirline); // Allow admin and user

module.exports = router;
