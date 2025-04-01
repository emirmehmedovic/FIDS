const NotificationTemplate = require('../models/NotificationTemplate');

// Get all notification templates
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await NotificationTemplate.findAll({
      order: [['createdAt', 'DESC']], // Optional: order by creation date
    });
    res.json(templates);
  } catch (error) {
    console.error('Error fetching notification templates:', error);
    res.status(500).json({ message: 'Error fetching notification templates', error: error.message });
  }
};

// Create a new notification template
exports.createTemplate = async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ message: 'Template text is required' });
  }
  try {
    const newTemplate = await NotificationTemplate.create({ text });
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error creating notification template:', error);
    res.status(500).json({ message: 'Error creating notification template', error: error.message });
  }
};

// Update a notification template
exports.updateTemplate = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ message: 'Template text is required' });
  }
  try {
    const template = await NotificationTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({ message: 'Notification template not found' });
    }
    template.text = text;
    await template.save();
    res.json(template);
  } catch (error) {
    console.error('Error updating notification template:', error);
    res.status(500).json({ message: 'Error updating notification template', error: error.message });
  }
};

// Delete a notification template
exports.deleteTemplate = async (req, res) => {
  const { id } = req.params;
  try {
    const template = await NotificationTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({ message: 'Notification template not found' });
    }
    await template.destroy();
    res.status(204).send(); // No content on successful deletion
  } catch (error) {
    console.error('Error deleting notification template:', error);
    res.status(500).json({ message: 'Error deleting notification template', error: error.message });
  }
};
