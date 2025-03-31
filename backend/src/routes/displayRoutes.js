const express = require('express');
const router = express.Router();
// const DisplaySession = require('../models/displaySessionModel'); // Model se koristi u kontroleru, ne mora ovde
const {
    openSession,
    closeSession,
    getActiveSessions,
    updateNotification // Importujemo novu funkciju
} = require('../controllers/displaySessionController');

router.post('/sessions', openSession);
router.put('/sessions/:id/close', closeSession);
router.get('/active', getActiveSessions); // Samo jedna GET /active ruta
router.put('/sessions/:id/notification', updateNotification); // Dodajemo PUT rutu za notifikacije

// Uklonjena duplirana GET /active ruta

module.exports = router;
