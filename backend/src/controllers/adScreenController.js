const AdScreen = require('../models/AdScreen');
const Playlist = require('../models/Playlist');

const getAll = async (req, res) => {
  try {
    const screens = await AdScreen.findAll({ order: [['createdAt', 'ASC']] });

    // For each screen, find its active playlist
    const screensWithPlaylist = await Promise.all(screens.map(async (screen) => {
      const activePlaylist = await Playlist.findOne({
        where: { screenId: screen.id, isActive: true },
        attributes: ['id', 'name']
      });
      return {
        ...screen.toJSON(),
        activePlaylist: activePlaylist ? activePlaylist.toJSON() : null
      };
    }));

    res.json(screensWithPlaylist);
  } catch (error) {
    console.error('Greška u getAll adScreens:', error);
    res.status(500).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Naziv ekrana je obavezan' });
    }

    const screen = await AdScreen.create({
      name: name.trim(),
      description: description || null
    });

    res.status(201).json({ ...screen.toJSON(), activePlaylist: null });
  } catch (error) {
    console.error('Greška pri kreiranju ekrana:', error);
    res.status(500).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const screen = await AdScreen.findByPk(id);
    if (!screen) return res.status(404).json({ message: 'Ekran nije pronađen' });

    if (name !== undefined) screen.name = name.trim();
    if (description !== undefined) screen.description = description;

    await screen.save();
    res.json(screen);
  } catch (error) {
    console.error('Greška pri ažuriranju ekrana:', error);
    res.status(500).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const screen = await AdScreen.findByPk(id);
    if (!screen) return res.status(404).json({ message: 'Ekran nije pronađen' });

    // Unassign all playlists from this screen
    await Playlist.update(
      { screenId: null, isActive: false },
      { where: { screenId: id } }
    );

    await screen.destroy();
    res.json({ message: 'Ekran uspješno obrisan' });
  } catch (error) {
    console.error('Greška pri brisanju ekrana:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAll, create, update, remove };
