const express = require('express');
const router = express.Router();
const airlineController = require('../controllers/airlineController');
const { authenticate } = require('../middleware/authMiddleware');

// Dohvati sve aviokompanije
router.get('/', airlineController.getAllAirlines);

// Dohvati jednu aviokompaniju po ID-u
router.get('/:id', airlineController.getAirlineById);

// Dodaj novu aviokompaniju
router.post('/', authenticate, airlineController.createAirline);

// Ažuriraj postojeću aviokompaniju
router.put('/:id', authenticate, airlineController.updateAirline);

// Obriši aviokompaniju
router.delete('/:id', authenticate, airlineController.deleteAirline);

module.exports = router;
