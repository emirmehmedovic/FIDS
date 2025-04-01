const express = require('express');
const router = express.Router();
const notificationTemplateController = require('../controllers/notificationTemplateController');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming you want to protect these routes

// Protect all routes in this file using the exported authenticate function
router.use(authMiddleware.authenticate);

// GET all notification templates
router.get('/', notificationTemplateController.getAllTemplates);

// POST a new notification template
router.post('/', notificationTemplateController.createTemplate);

// PUT (update) a notification template by ID
router.put('/:id', notificationTemplateController.updateTemplate);

// DELETE a notification template by ID
router.delete('/:id', notificationTemplateController.deleteTemplate);

module.exports = router;
