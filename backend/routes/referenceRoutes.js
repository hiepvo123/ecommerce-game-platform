// backend/routes/referenceRoutes.js

const express = require('express');
const router = express.Router();
const referenceController = require('../controllers/referenceController');

// Languages routes (public - no auth required)
router.get('/languages', referenceController.getLanguages);
router.get('/languages/:id', referenceController.getLanguageById);

// Categories routes (public - no auth required)
router.get('/categories', referenceController.getCategories);
router.get('/categories/:id', referenceController.getCategoryById);

// Genres routes (public - no auth required)
router.get('/genres', referenceController.getGenres);
router.get('/genres/:id', referenceController.getGenreById);

module.exports = router;

