const express = require('express');
const router = express.Router();
const airlineController = require('../controllers/airlineController');

// Dohvati sve aviokompanije
router.get('/', airlineController.getAllAirlines);

// Dohvati jednu aviokompaniju po ID-u
router.get('/:id', airlineController.getAirlineById);

// Dodaj novu aviokompaniju
router.post('/', airlineController.createAirline);

// Ažuriraj postojeću aviokompaniju
router.put('/:id', airlineController.updateAirline);

// Obriši aviokompaniju
router.delete('/:id', airlineController.deleteAirline);

module.exports = router;