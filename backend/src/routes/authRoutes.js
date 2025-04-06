// routes/authRoutes.js - Refactored
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, roleAuth } = require('../middleware/authMiddleware');

// Public route: Login
router.post('/login', authController.login);

// Protected route: Get current user info
router.get('/me', authenticate, authController.me);

// --- Admin Only Routes ---

// Create User (Admin only)
router.post('/create-user', roleAuth('admin'), authController.createUser);

// Get All Users (Admin only)
router.get('/users', roleAuth('admin'), authController.getAllUsers);

// Delete User (Admin only)
router.delete('/users/:id', roleAuth('admin'), authController.deleteUser);

module.exports = router;
