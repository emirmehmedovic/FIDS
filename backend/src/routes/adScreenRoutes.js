const express = require('express');
const router = express.Router();
const adScreenController = require('../controllers/adScreenController');
const { roleAuth } = require('../middleware/authMiddleware');

router.get('/', roleAuth(['admin']), adScreenController.getAll);
router.post('/', roleAuth(['admin']), adScreenController.create);
router.put('/:id', roleAuth(['admin']), adScreenController.update);
router.delete('/:id', roleAuth(['admin']), adScreenController.remove);

module.exports = router;
