const Airline = require('../models/Airline');
const router = require('express').Router();
const {
  getAllContent,
  getImages,
  uploadImage,
  updatePage,
  createPage,
  deleteImage // Dodajemo novu funkciju
} = require('../controllers/contentController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// DODAJ UVOZE MODELA
const DisplaySession = require('../models/displaySessionModel');
const Flight = require('../models/Flight');
const StaticPage = require('../models/StaticPage');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Dozvoljeni su samo image fajlovi!'), false);
    }
  }
});

// ISPRAVLJENA RUTA ZA /page/:pageId
// contentRoutes.js (ispravljeno)
router.get('/page/:pageId', async (req, res) => {
    try {
      const { pageId } = req.params;
  
      const activeSession = await DisplaySession.findOne({
        where: { 
          pageId: pageId, 
          is_active: true 
        },
        include: [{
          model: Flight,
          as: 'Flight', // Eksplicitno koristite alias
          include: [{
            model: Airline,
            as: 'Airline' // Eksplicitno koristite alias
          }]
        }]
      });
  
      if (activeSession) {
        return res.json({
          content: activeSession,
          isSessionActive: true
        });
      }
  
      const staticContent = await StaticPage.findOne({ 
        where: { pageId } 
      });
  
      res.json({
        content: staticContent,
        isSessionActive: false
      });
  
    } catch (error) {
      console.error('Greška u /page/:pageId:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: error.message 
      });
    }
  });

// Ostale rute ostaju iste
router.get('/', getAllContent);
router.get('/images', getImages);
router.post('/upload', upload.single('image'), uploadImage);
router.put('/:pageId', updatePage);
router.post('/pages', createPage); // Dodajemo POST rutu za kreiranje stranica
router.delete('/images/:filename', deleteImage); // Dodajemo DELETE rutu za slike
// router.delete('/:pageId', deletePage); // Uklanjamo DELETE rutu

module.exports = router;
