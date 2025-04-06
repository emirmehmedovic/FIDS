const express = require('express');
const router = express.Router();
// const DisplaySession = require('../models/displaySessionModel'); // Model se koristi u kontroleru, ne mora ovde
const {
    openSession,
    closeSession,
    getActiveSessions,
    updateNotification 
} = require('../controllers/displaySessionController');
const { authenticate, roleAuth } = require('../middleware/authMiddleware'); // Import middleware

// Public route: Get active sessions
router.get('/active', getActiveSessions);

// Protected routes: Allow admin and stw
router.post('/sessions', roleAuth(['admin', 'stw']), openSession); // Allow admin, stw
router.put('/sessions/:id/close', roleAuth(['admin', 'stw']), closeSession); // Allow admin, stw
router.put('/sessions/:id/notification', roleAuth(['admin', 'stw']), updateNotification); // Allow admin, stw

module.exports = router;
