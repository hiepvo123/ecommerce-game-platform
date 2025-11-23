// backend/routes/gameRoutes.js

const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Game routes (mostly public, some can use optional auth for personalization)
router.get('/recommended', gameController.getRecommendedGames); // Optional auth for personalization
router.get('/featured', gameController.getFeaturedGames);
router.get('/discounted', gameController.getDiscountedGames);
router.get('/search', gameController.searchGames);
router.get('/genre/:genreId', gameController.getGamesByGenre);
router.get('/category/:categoryId', gameController.getGamesByCategory);
router.get('/:appId', gameController.getGameById);
router.get('/', gameController.getGames); // Must be last due to route matching

module.exports = router;

