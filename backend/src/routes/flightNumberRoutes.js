const express = require('express');
const router = express.Router();
const flightNumberController = require('../controllers/flightNumberController');
const { authenticate } = require('../middleware/authMiddleware'); 

router.get('/', flightNumberController.getAll);
router.post('/', authenticate, flightNumberController.create);
router.delete('/:id', authenticate, flightNumberController.delete);

module.exports = router;
