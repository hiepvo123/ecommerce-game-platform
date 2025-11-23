const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const auth = require('../middleware/authMiddleware');       // JWT check
const admin = require('../middleware/adminMiddleware');     // role check

// LOGIN ADMIN
router.post('/login', adminController.login);

// Bảo vệ các API admin
router.use(auth, admin);

// CRUD Games
router.post('/games', adminController.createGame);
router.put('/games/:appId', adminController.updateGame);
router.delete('/games/:appId', adminController.deleteGame);
// CRUD Game Descriptions
router.post('/games/:appId/description', adminController.createGameDescription);
router.put('/games/:appId/description', adminController.updateGameDescription);
router.delete('/games/:appId/description', adminController.deleteGameDescription);

// ===== Admin Update Order Status =====
router.put('/orders/:orderId/status', adminController.adminUpdateOrderStatus);

// ===== Admin Manage Users =====
// GET all users
router.get('/users', adminController.adminGetUsers);
// UPDATE user
router.put('/users/:userId', adminController.adminUpdateUser);
// DELETE user
router.delete('/users/:userId', adminController.adminDeleteUser);

module.exports = router;
