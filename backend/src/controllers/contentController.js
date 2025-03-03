const DisplaySession = require('../models/displaySessionModel');
const StaticPage = require('../models/StaticPage');
const path = require('path');
const fs = require('fs');

const getAllContent = async (req, res) => {
  try {
    const pages = await StaticPage.findAll();
    res.json(pages);
  }  catch (error) {
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
        return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
      });
  
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
      
      // Koristite apsolutnu putanju za URL
      const imageUrl = `/uploads/${req.file.filename}`;
  
      // Provjeri da li postoji pageId u zahtjevu
      const { pageId, pageType } = req.body;
      
      await StaticPage.upsert({
        pageId: pageId || 'default', // Ako nije proslijeđeno
        imageUrl,
        pageType: pageType || 'general'
      });
  
      res.status(200).json({ imageUrl });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: error.message });
    }
  };
  
  const updatePage = async (req, res) => {
    try {
      const { pageId } = req.params;
      const { imageUrl, pageType } = req.body; // Dodajte pageType
      
      await StaticPage.upsert({
        pageId,
        imageUrl,
        pageType // Obavezno polje
      });
  
      res.json({ message: 'Sadržaj uspješno ažuriran' });
    } catch (error) {
      res.status(500).json({ 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  };

module.exports = {
  getAllContent,
  getImages,
  uploadImage, // Dodajte
  updatePage
  //... other functions
};