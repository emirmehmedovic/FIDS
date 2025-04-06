const express = require('express');
const router = express.Router();
const notificationTemplateController = require('../controllers/notificationTemplateController');
// Import roleAuth specifically
const { roleAuth } = require('../middleware/authMiddleware'); 

// Apply role check: Allow admin, user, and stw
router.use(roleAuth(['admin', 'user', 'stw'])); 

// GET all notification templates (Admin, User, STW)
router.get('/', notificationTemplateController.getAllTemplates);

// POST a new notification template (Admin, User, STW)
router.post('/', notificationTemplateController.createTemplate);

// PUT (update) a notification template by ID (Admin, User, STW)
router.put('/:id', notificationTemplateController.updateTemplate);

// DELETE a notification template by ID (Admin, User, STW)
router.delete('/:id', notificationTemplateController.deleteTemplate);

module.exports = router;
