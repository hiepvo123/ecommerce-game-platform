const express = require('express');
const adminController = require('../controllers/adminController');
const router = express.Router();

const requireAdmin = require('../middleware/requireAdmin'); // Giả định tên middleware

router.post('/login', adminController.login);

// 🔥 [CẬP NHẬT] Tuyến đường mới: Lấy số liệu thống kê dashboard, yêu cầu quyền admin
router.get('/stats', requireAdmin, adminController.getStats);

module.exports = router;