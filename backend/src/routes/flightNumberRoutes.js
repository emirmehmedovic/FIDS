const express = require('express');
const router = express.Router();
const flightNumberController = require('../controllers/flightNumberController');
// Import roleAuth as well
const { authenticate, roleAuth } = require('../middleware/authMiddleware'); 

// Public route: Get all flight numbers (or maybe admin only?) - Assuming public for now
router.get('/', flightNumberController.getAll); 

// Admin and User routes: Manage flight numbers
router.post('/', roleAuth(['admin', 'user']), flightNumberController.create); // Allow admin and user
router.delete('/:id', roleAuth(['admin', 'user']), flightNumberController.delete); // Allow admin and user
// TODO: Add PUT route for update, also protected with roleAuth(['admin', 'user'])

module.exports = router;
