const express = require('express');
const router = express.Router();
const advertisementController = require('../controllers/advertisementController');
const { roleAuth } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads/ads');
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (err) {
        return cb(err);
      }
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit for video files
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/quicktime'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Dozvoljeni su samo fajlovi tipa: slike (JPG, PNG, GIF, WebP) i videa (MP4, WebM, OGG, AVI, MOV)'), false);
    }
  }
});

// Public - for TV display
router.get('/active-playlist', advertisementController.getActivePlaylist);

// Protected routes - admin only
router.get('/', roleAuth(['admin']), advertisementController.getAll);
router.post('/', roleAuth(['admin']), upload.single('file'), advertisementController.create);
router.put('/:id', roleAuth(['admin']), advertisementController.update);
router.delete('/:id', roleAuth(['admin']), advertisementController.remove);

module.exports = router;
