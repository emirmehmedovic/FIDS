// routes/contentRoutes.js - Refactored
const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { authenticate, roleAuth } = require('../middleware/authMiddleware'); // Import middleware
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Keep sync for initial check

// Multer setup (consider moving to a separate config file if complex)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads');
    // Sync check is acceptable here as it runs once per upload start
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (err) {
        console.error("Failed to create upload directory:", err);
        return cb(err); // Pass error to multer
      }
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename if needed, though Date.now() helps prevent collisions
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// --- Public Routes ---
// Get all static pages (content definitions)
router.get('/', contentController.getAllContent);
// Get list of available image URLs
router.get('/images', contentController.getImages);

// WORKAROUND: Add special route handler for malformed URLs that LG WebOS produces
// This MUST be defined BEFORE the standard route to catch malformed URLs first
router.get('/page/*', (req, res) => {
  // Get the full path after /page/
  const fullPath = req.params[0] || '';
  // Extract just the page ID part by splitting at any ? or & character
  const pageId = fullPath.split(/[\?\&]/)[0]; 
  
  console.log(`[WebOS Workaround] Processing path: ${fullPath}, extracted pageId: ${pageId}`);
  
  if (!pageId) {
    return res.status(404).json({ message: 'Invalid page ID' });
  }
  
  // Set the correct pageId and forward to the actual controller
  req.params.pageId = pageId;
  return contentController.getPageContent(req, res);
});

// Standard route - this will only be reached if the above route doesn't match
router.get('/page/:pageId', contentController.getPageContent);

// --- Admin, User, and STW Routes ---
// Upload a new image
router.post('/upload', roleAuth(['admin', 'user', 'stw']), upload.single('image'), contentController.uploadImage);
// Update a static page (e.g., link an image)
router.put('/:pageId', roleAuth(['admin', 'user', 'stw']), contentController.updatePage);
// Create a new static page definition
router.post('/pages', roleAuth(['admin', 'user', 'stw']), contentController.createPage);
// Delete an image (and unlink from pages)
router.delete('/images/:filename', roleAuth(['admin', 'user', 'stw']), contentController.deleteImage);

module.exports = router;
