const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const { roleAuth } = require('../middleware/authMiddleware');

router.get('/', roleAuth(['admin']), playlistController.getAll);
router.get('/:id', roleAuth(['admin']), playlistController.getOne);
router.post('/', roleAuth(['admin']), playlistController.create);
router.put('/:id', roleAuth(['admin']), playlistController.update);
router.delete('/:id', roleAuth(['admin']), playlistController.remove);

router.post('/:id/activate', roleAuth(['admin']), playlistController.activate);
router.post('/:id/deactivate', roleAuth(['admin']), playlistController.deactivate);

router.post('/:id/items', roleAuth(['admin']), playlistController.addItem);
router.put('/:id/items/reorder', roleAuth(['admin']), playlistController.reorderItems);
router.put('/:id/items/:itemId', roleAuth(['admin']), playlistController.updateItem);
router.delete('/:id/items/:itemId', roleAuth(['admin']), playlistController.removeItem);

module.exports = router;
