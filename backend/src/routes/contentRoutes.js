// routes/contentRoutes.js - Refactored
const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { authenticate, roleAuth } = require('../middleware/authMiddleware'); // Import middleware
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Keep sync for initial check

// SPECIAL MIDDLEWARE: Handle any request path that might contain the problematic URL 
// pattern we're seeing with LG WebOS
router.use((req, res, next) => {
  const originalUrl = req.originalUrl;
  
  // Only process if this is a page content request
  if (originalUrl.includes('/api/content/page/')) {
    console.log('[DEBUG] Processing URL:', originalUrl);
    
    // Check if the URL has the problematic pattern (& instead of ?)
    if (originalUrl.includes('&') && !originalUrl.includes('?')) {
      // Extract the page ID from the problematic URL
      const urlParts = originalUrl.split('/api/content/page/')[1].split('&')[0];
      console.log('[FIXED] Extracted Page ID:', urlParts);
      
      // Rewrite the URL to use the correct query parameter format
      const timestamp = Date.now();
      const correctedUrl = `/api/content/page/${urlParts}?t=${timestamp}`;
      console.log('[FIXED] Redirecting to corrected URL:', correctedUrl);
      
      // Redirect to the corrected URL
      return res.redirect(correctedUrl);
    }
  }
  
  // Continue processing if no special handling was needed
  next();
});

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

// Add a VERY specific route handler for the exact pattern we're seeing
// This route directly matches "C1&t=timestamp" without any parsing
router.get('/page/C1&t=:timestamp', (req, res) => {
  console.log('[EXACT MATCH] Caught C1&t=timestamp pattern!');
  // Force the pageId to be C1
  req.params.pageId = 'C1';
  return contentController.getPageContent(req, res);
});

// DIRECT HANDLER: Explicitly catch and process the exact problematic pattern we're seeing
router.get('/page/:pageId*', (req, res) => {
  // Get the full URL to analyze
  const fullUrl = req.originalUrl;
  console.log('[DIRECT HANDLER] Processing:', fullUrl);
  
  // Extract the page ID (first part of the path parameter)
  let pageId = req.params.pageId;
  
  // If there's an & character in the pageId, clean it up
  if (pageId && pageId.includes('&')) {
    pageId = pageId.split('&')[0];
    console.log('[DIRECT HANDLER] Cleaned pageId:', pageId);
  }
  
  // Set the correct pageId and forward to controller
  req.params.pageId = pageId;
  return contentController.getPageContent(req, res);
});

// This is now a backup route that likely won't be reached
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

// Standard route - this will only be reached if the above routes don't match
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
