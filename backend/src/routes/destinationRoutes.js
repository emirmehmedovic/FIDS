const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');
const { authenticate } = require('../middleware/authMiddleware'); // Koristite destructuring za `authenticate`

router.get('/', destinationController.getAll);
router.post('/', authenticate, destinationController.create); // Direktno koristite `authenticate`
router.delete('/:id', authenticate, destinationController.delete); // Direktno koristite `authenticate`

module.exports = router;