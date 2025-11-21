// backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.post('/verify', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);

module.exports = router;