const express = require('express');
const adminController = require('../controllers/adminController');
const router = express.Router();

const requireAdmin = require('../middleware/requireAdmin'); // Giả định tên middleware

router.post('/login', adminController.login);

// 🔥 [CẬP NHẬT] Tuyến đường mới: Lấy số liệu thống kê dashboard, yêu cầu quyền admin
router.get('/stats', requireAdmin, adminController.getStats);
// 🔥 [THÊM] Tuyến đường mới: Lấy danh sách đơn hàng gần đây
router.get('/recent-orders', requireAdmin, adminController.getRecentOrders);

module.exports = router;