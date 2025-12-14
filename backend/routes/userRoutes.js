// backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const requireAuth = require('../middleware/auth');

// All user routes require authentication
router.use(requireAuth);

// Profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Billing address routes
router.get('/billing-addresses', userController.getBillingAddresses);
router.get('/billing-addresses/:id', userController.getBillingAddressById);
router.post('/billing-addresses', userController.createBillingAddress);
router.put('/billing-addresses/:id', userController.updateBillingAddress);
router.delete('/billing-addresses/:id', userController.deleteBillingAddress);

// Library routes
router.get('/library', userController.getLibrary);

module.exports = router;

