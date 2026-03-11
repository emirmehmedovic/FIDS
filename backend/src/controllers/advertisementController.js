const Advertisement = require('../models/Advertisement');
const Playlist = require('../models/Playlist');
const PlaylistItem = require('../models/PlaylistItem');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

const getAll = async (req, res) => {
  try {
    const ads = await Advertisement.findAll({ order: [['createdAt', 'DESC']] });
    res.json(ads);
  } catch (error) {
    console.error('Greška u getAll advertisements:', error);
    res.status(500).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    if (!req.file) throw new Error('Nijedan fajl nije uploadovan');
    const { title, description, duration } = req.body;

    const fileUrl = `/uploads/ads/${req.file.filename}`;

    let type;
    if (req.file.mimetype.startsWith('video/')) {
      type = 'video';
    } else if (req.file.mimetype === 'image/gif') {
      type = 'gif';
    } else {
      type = 'image';
    }

    const ad = await Advertisement.create({
      title: title || req.file.originalname,
      description: description || null,
      type,
      fileUrl,
      duration: parseInt(duration) || 10,
      isActive: true
    });

    res.status(201).json(ad);
  } catch (error) {
    console.error('Greška pri kreiranju reklame:', error);
    res.status(500).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, duration, isActive } = req.body;

    const ad = await Advertisement.findByPk(id);
    if (!ad) return res.status(404).json({ message: 'Reklama nije pronađena' });

    if (title !== undefined) ad.title = title;
    if (description !== undefined) ad.description = description;
    if (duration !== undefined) ad.duration = parseInt(duration);
    if (isActive !== undefined) ad.isActive = isActive === true || isActive === 'true';

    await ad.save();
    res.json(ad);
  } catch (error) {
    console.error('Greška pri ažuriranju reklame:', error);
    res.status(500).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await Advertisement.findByPk(id);
    if (!ad) return res.status(404).json({ message: 'Reklama nije pronađena' });

    // Delete physical file
    if (ad.fileUrl) {
      const filePath = path.join(__dirname, '../public', ad.fileUrl);
      try {
        await fs.unlink(filePath);
      } catch (e) {
        console.warn('Nije moguće obrisati fajl:', filePath, e.message);
      }
    }

    await ad.destroy();
    res.json({ message: 'Reklama uspješno obrisana' });
  } catch (error) {
    console.error('Greška pri brisanju reklame:', error);
    res.status(500).json({ message: error.message });
  }
};

// Public endpoint for TV display - returns active playlist for a specific screen
const getActivePlaylist = async (req, res) => {
  try {
    const { screen } = req.query;

    if (!screen) {
      return res.status(400).json({ message: 'Parametar "screen" je obavezan (npr. ?screen=1)' });
    }

    const playlist = await Playlist.findOne({
      where: { isActive: true, screenId: parseInt(screen) }
    });

    if (!playlist) {
      return res.json({ playlist: null, items: [] });
    }

    const items = await PlaylistItem.findAll({
      where: { playlistId: playlist.id },
      include: [{ model: Advertisement, as: 'advertisement' }],
      order: [['order', 'ASC']]
    });

    const activeItems = items.filter(item => item.advertisement && item.advertisement.isActive);

    res.json({
      playlist: playlist.toJSON(),
      items: activeItems.map(item => ({
        id: item.id,
        order: item.order,
        duration: item.duration || item.advertisement.duration,
        advertisement: item.advertisement.toJSON()
      }))
    });
  } catch (error) {
    console.error('Greška u getActivePlaylist:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAll, create, update, remove, getActivePlaylist };
