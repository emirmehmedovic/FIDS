const Playlist = require('../models/Playlist');
const PlaylistItem = require('../models/PlaylistItem');
const Advertisement = require('../models/Advertisement');

const getAll = async (req, res) => {
  try {
    const playlists = await Playlist.findAll({ order: [['createdAt', 'DESC']] });
    res.json(playlists);
  } catch (error) {
    console.error('Greška u getAll playlists:', error);
    res.status(500).json({ message: error.message });
  }
};

const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const playlist = await Playlist.findByPk(id);
    if (!playlist) return res.status(404).json({ message: 'Playlist nije pronađen' });

    const items = await PlaylistItem.findAll({
      where: { playlistId: id },
      include: [{ model: Advertisement, as: 'advertisement' }],
      order: [['order', 'ASC']]
    });

    res.json({
      ...playlist.toJSON(),
      items: items.map(item => ({
        id: item.id,
        order: item.order,
        duration: item.duration,
        advertisement: item.advertisement ? item.advertisement.toJSON() : null
      }))
    });
  } catch (error) {
    console.error('Greška u getOne playlist:', error);
    res.status(500).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Naziv playlistе je obavezan' });

    const playlist = await Playlist.create({
      name,
      description: description || null,
      isActive: false
    });

    res.status(201).json(playlist);
  } catch (error) {
    console.error('Greška pri kreiranju playliste:', error);
    res.status(500).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const playlist = await Playlist.findByPk(id);
    if (!playlist) return res.status(404).json({ message: 'Playlist nije pronađen' });

    if (name !== undefined) playlist.name = name;
    if (description !== undefined) playlist.description = description;

    await playlist.save();
    res.json(playlist);
  } catch (error) {
    console.error('Greška pri ažuriranju playliste:', error);
    res.status(500).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const playlist = await Playlist.findByPk(id);
    if (!playlist) return res.status(404).json({ message: 'Playlist nije pronađen' });

    await PlaylistItem.destroy({ where: { playlistId: id } });
    await playlist.destroy();

    res.json({ message: 'Playlist uspješno obrisan' });
  } catch (error) {
    console.error('Greška pri brisanju playliste:', error);
    res.status(500).json({ message: error.message });
  }
};

const activate = async (req, res) => {
  try {
    const { id } = req.params;
    const { screenId } = req.body;

    if (!screenId) {
      return res.status(400).json({ message: 'screenId je obavezan za aktivaciju' });
    }

    const playlist = await Playlist.findByPk(id);
    if (!playlist) return res.status(404).json({ message: 'Playlist nije pronađen' });

    // Deactivate all playlists currently assigned to this screen
    await Playlist.update(
      { isActive: false, screenId: null },
      { where: { screenId: parseInt(screenId) } }
    );

    // Activate this playlist for the given screen
    playlist.isActive = true;
    playlist.screenId = parseInt(screenId);
    await playlist.save();

    res.json({ message: 'Playlist aktiviran na ekranu', playlist });
  } catch (error) {
    console.error('Greška pri aktiviranju playliste:', error);
    res.status(500).json({ message: error.message });
  }
};

const deactivate = async (req, res) => {
  try {
    const { id } = req.params;
    const playlist = await Playlist.findByPk(id);
    if (!playlist) return res.status(404).json({ message: 'Playlist nije pronađen' });

    playlist.isActive = false;
    playlist.screenId = null;
    await playlist.save();

    res.json({ message: 'Playlist deaktiviran', playlist });
  } catch (error) {
    console.error('Greška pri deaktiviranju playliste:', error);
    res.status(500).json({ message: error.message });
  }
};

const addItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { advertisementId, duration } = req.body;

    const playlist = await Playlist.findByPk(id);
    if (!playlist) return res.status(404).json({ message: 'Playlist nije pronađen' });

    const ad = await Advertisement.findByPk(advertisementId);
    if (!ad) return res.status(404).json({ message: 'Reklama nije pronađena' });

    // Find highest current order
    const maxOrderItem = await PlaylistItem.findOne({
      where: { playlistId: id },
      order: [['order', 'DESC']]
    });
    const nextOrder = maxOrderItem ? maxOrderItem.order + 1 : 0;

    const item = await PlaylistItem.create({
      playlistId: parseInt(id),
      advertisementId: parseInt(advertisementId),
      order: nextOrder,
      duration: duration ? parseInt(duration) : null
    });

    const itemWithAd = await PlaylistItem.findByPk(item.id, {
      include: [{ model: Advertisement, as: 'advertisement' }]
    });

    res.status(201).json({
      id: itemWithAd.id,
      order: itemWithAd.order,
      duration: itemWithAd.duration,
      advertisement: itemWithAd.advertisement ? itemWithAd.advertisement.toJSON() : null
    });
  } catch (error) {
    console.error('Greška pri dodavanju stavke u playlist:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { order, duration } = req.body;

    const item = await PlaylistItem.findOne({
      where: { id: itemId, playlistId: id }
    });
    if (!item) return res.status(404).json({ message: 'Stavka nije pronađena' });

    if (order !== undefined) item.order = parseInt(order);
    if (duration !== undefined) item.duration = duration ? parseInt(duration) : null;

    await item.save();
    res.json(item);
  } catch (error) {
    console.error('Greška pri ažuriranju stavke playliste:', error);
    res.status(500).json({ message: error.message });
  }
};

const removeItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;

    const item = await PlaylistItem.findOne({
      where: { id: itemId, playlistId: id }
    });
    if (!item) return res.status(404).json({ message: 'Stavka nije pronađena' });

    await item.destroy();
    res.json({ message: 'Stavka uspješno uklonjena iz playliste' });
  } catch (error) {
    console.error('Greška pri brisanju stavke playliste:', error);
    res.status(500).json({ message: error.message });
  }
};

const reorderItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // Array of { id, order }

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Nevažeći format podataka' });
    }

    for (const item of items) {
      await PlaylistItem.update(
        { order: item.order },
        { where: { id: item.id, playlistId: id } }
      );
    }

    res.json({ message: 'Redoslijed uspješno ažuriran' });
  } catch (error) {
    console.error('Greška pri preraspoređivanju stavki:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAll,
  getOne,
  create,
  update,
  remove,
  activate,
  deactivate,
  addItem,
  updateItem,
  removeItem,
  reorderItems
};
