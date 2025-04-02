const NotificationTemplate = require('../models/NotificationTemplate');

// Get all notification templates
exports.getAllTemplates = async (req, res) => {
  try {
    // Order by name for easier finding in UI
    const templates = await NotificationTemplate.findAll({
      order: [['name', 'ASC']],
    });
    res.json(templates);
  } catch (error) {
    console.error('Error fetching notification templates:', error);
    res.status(500).json({ message: 'Error fetching notification templates', error: error.message });
  }
};

// Create a new notification template
exports.createTemplate = async (req, res) => {
  // Expect name and at least one language text
  const { name, text_bs, text_en, text_de, text_tr } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Template name is required' });
  }
  // Basic check if at least one language is provided
  if (!text_bs && !text_en && !text_de && !text_tr) {
    return res.status(400).json({ message: 'At least one language text is required for the template' });
  }

  try {
    const newTemplate = await NotificationTemplate.create({
      name,
      text_bs,
      text_en,
      text_de,
      text_tr
    });
    res.status(201).json(newTemplate);
  } catch (error) {
    // Check for unique constraint violation error (specific to Sequelize)
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.warn('Unique constraint violation:', error.errors);
      // Extract the field that caused the violation if possible
      const field = error.errors?.[0]?.path || 'name';
      return res.status(409).json({ message: `Šablon sa ovim imenom ('${field}') već postoji.` });
    }
    // Log other errors and return 500
    console.error('Error creating notification template:', error);
    res.status(500).json({ message: 'Greška pri kreiranju šablona', error: error.message });
  }
};

// Update a notification template
exports.updateTemplate = async (req, res) => {
  const { id } = req.params;
  // Expect name and potentially all language texts
  const { name, text_bs, text_en, text_de, text_tr } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Template name is required' });
  }
  // Basic check if at least one language is provided
  if (!text_bs && !text_en && !text_de && !text_tr) {
    return res.status(400).json({ message: 'At least one language text is required for the template' });
  }

  try {
    const template = await NotificationTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({ message: 'Notification template not found' });
    }

    // Update fields
    template.name = name;
    template.text_bs = text_bs || null; // Allow clearing a language field
    template.text_en = text_en || null;
    template.text_de = text_de || null;
    template.text_tr = text_tr || null;

    await template.save();
    res.json(template);
  } catch (error) {
     // Check for unique constraint violation error on update as well
     if (error.name === 'SequelizeUniqueConstraintError') {
       console.warn('Unique constraint violation during update:', error.errors);
       const field = error.errors?.[0]?.path || 'name';
       return res.status(409).json({ message: `Šablon sa ovim imenom ('${field}') već postoji.` });
     }
    console.error('Error updating notification template:', error);
    res.status(500).json({ message: 'Greška pri ažuriranju šablona', error: error.message });
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
