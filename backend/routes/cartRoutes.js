// backend/routes/cartRoutes.js

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const requireAuth = require('../middleware/auth');

// All cart routes require authentication
router.use(requireAuth);

// Cart routes
router.get('/', cartController.getCart);
router.get('/count', cartController.getCartCount);
router.post('/items', cartController.addToCart);
router.delete('/items/:appId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

module.exports = router;

