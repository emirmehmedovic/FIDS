const DisplaySession = require('../models/displaySessionModel');
const StaticPage = require('../models/StaticPage');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize'); // Import Op for database operations

const getAllContent = async (req, res) => {
  try {
    const pages = await StaticPage.findAll({ order: [['pageId', 'ASC']] }); // Sort pages
    res.json(pages);
  } catch (error) {
    console.error('Error in getAllContent:', error);
    res.status(500).json({ message: error.message });
  }
};

const getImages = async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../public/uploads');

    // Kreirajte direktorijum ako ne postoji
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const imageFiles = fs.readdirSync(uploadsDir).filter(file => {
      const ext = path.extname(file).toLowerCase();
      // Allow common image types
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
    });

    // Vrati relativne putanje
    const imageUrls = imageFiles.map(file => `/uploads/${file}`);
    res.json(imageUrls);

  } catch (error) {
    console.error('Greška u getImages:', error);
    res.status(500).json({ message: error.message });
  }
};

const uploadImage = async (req, res) => {
  try {
    if (!req.file) throw new Error('Nijedna slika nije uploadovana');

    // Vrati relativnu putanju uploadovane slike
    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl });

    // Note: Upsert logic removed as per new plan (upload is separate from linking)

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

const updatePage = async (req, res) => {
  try {
    const { pageId } = req.params;
    const { imageUrl } = req.body; // Only expect imageUrl for linking

    const page = await StaticPage.findOne({ where: { pageId } });
    if (!page) {
      return res.status(404).json({ message: 'Stranica nije pronađena' });
    }

    // Update only the imageUrl
    page.imageUrl = imageUrl || ''; // Use empty string instead of null for unlinking
    await page.save();

    res.json({ message: 'Veza slike sa stranicom uspješno ažurirana', page });
  } catch (error) {
    console.error('Greška pri ažuriranju stranice:', error);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const createPage = async (req, res) => {
  try {
    const { pageType } = req.body; // Očekujemo 'check-in', 'boarding', ili 'general'

    if (!['check-in', 'boarding', 'general'].includes(pageType)) {
      return res.status(400).json({ message: 'Nevažeći tip stranice.' });
    }

    let prefix = '';
    if (pageType === 'check-in') prefix = 'C';
    else if (pageType === 'boarding') prefix = 'U';
    else prefix = 'G';

    // Pronađi sve stranice sa istim prefiksom
    const existingPages = await StaticPage.findAll({
      where: {
        pageId: {
          [Op.startsWith]: prefix // Use Op.startsWith
        }
      },
      order: [['pageId', 'ASC']] // Sortiraj da lakše nađemo najveći broj
    });

    let nextNumber = 1;
    if (existingPages.length > 0) {
      // Pronađi najveći postojeći broj
      const numbers = existingPages.map(p => parseInt(p.pageId.substring(1), 10)).filter(n => !isNaN(n));
      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1;
      }
    }

    const newPageId = `${prefix}${nextNumber}`;

    // Proveri da li ID već postoji (za svaki slučaj)
    const checkExisting = await StaticPage.findOne({ where: { pageId: newPageId } });
    if (checkExisting) {
      // Ovo ne bi trebalo da se desi ako je logika ispravna, ali za svaki slučaj
      return res.status(500).json({ message: 'Greška pri generisanju jedinstvenog ID-a.' });
    }

    // Kreiraj novu stranicu bez slike
    const newPage = await StaticPage.create({
      pageId: newPageId,
      pageType: pageType,
      imageUrl: '' // Use empty string instead of null
    });

    res.status(201).json(newPage);

  } catch (error) {
    console.error('Greška pri kreiranju stranice:', error);
    res.status(500).json({ message: error.message });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { filename } = req.params;
    // Basic validation to prevent directory traversal
    if (!filename || filename.includes('/') || filename.includes('..')) {
        return res.status(400).json({ message: 'Nevažeće ime fajla.' });
    }

    const imagePath = path.join(__dirname, '../public/uploads', filename);
    const relativeImagePath = `/uploads/${filename}`;

    // 1. Check if file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ message: 'Slika nije pronađena na serveru.' });
    }

    // 2. Unlink image from any pages using it by setting to empty string
    await StaticPage.update(
      { imageUrl: '' }, // Use empty string instead of null
      { where: { imageUrl: relativeImagePath } }
    );
    console.log(`Unlinked image ${relativeImagePath} from StaticPages.`);

    // 3. Delete the physical file
    fs.unlinkSync(imagePath);
    console.log(`Deleted physical file: ${imagePath}`);

    res.json({ message: `Slika ${filename} uspješno obrisana.` });

  } catch (error) {
    console.error('Greška pri brisanju slike:', error);
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  getAllContent,
  getImages,
  uploadImage,
  updatePage,
  createPage,
  deleteImage // Dodajemo novu funkciju
};
