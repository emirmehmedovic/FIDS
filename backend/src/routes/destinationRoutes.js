const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');
// Import roleAuth as well
const { authenticate, roleAuth } = require('../middleware/authMiddleware'); 

// Public route: Get all destinations
router.get('/', destinationController.getAll);

// Admin and User routes: Manage destinations
router.post('/', roleAuth(['admin', 'user']), destinationController.create); // Allow admin and user
router.delete('/:id', roleAuth(['admin', 'user']), destinationController.delete); // Allow admin and user
// TODO: Add PUT route for update, also protected with roleAuth(['admin', 'user'])

module.exports = router;
