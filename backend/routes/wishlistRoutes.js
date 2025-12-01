// backend/routes/wishlistRoutes.js

const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const requireAuth = require('../middleware/auth');

// All wishlist routes require authentication
router.use(requireAuth);

// Wishlist routes
router.get('/', wishlistController.getWishlist);
router.post('/', wishlistController.addToWishlist);
router.delete('/:appId', wishlistController.removeFromWishlist);
router.get('/check/:appId', wishlistController.checkWishlist);

module.exports = router;

