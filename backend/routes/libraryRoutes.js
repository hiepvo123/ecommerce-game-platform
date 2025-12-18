// backend/routes/libraryRoutes.js

const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');
const requireAuth = require('../middleware/auth');

// All library routes require authentication
router.use(requireAuth);

// Get user's game library
router.get('/', libraryController.getLibrary);

// Create or update review for a game in user's library
router.post('/review', libraryController.addOrUpdateReview);

module.exports = router;


