const bcrypt = require('bcrypt');
const queries = require('../db/helpers/queries');
const { sendSuccess, sendError } = require('../utils/response'); // 🔥 [CẬP NHẬT] Thêm import
const { getRecentOrders } = require('../db/helpers/queries/orders');


module.exports = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return sendError(res, 'Email and password are required', 'MISSING_CREDENTIALS', 400);
      }

      // Lấy user bằng email
      const user = await queries.users.getUserByEmail(email);

      if (!user) {
        return sendError(res, 'Invalid email or password', 'INVALID_CREDENTIALS', 401);
      }

      // Kiểm tra role
      if (user.role !== "admin") {
        return sendError(res, 'Access denied: Not an admin', 'ACCESS_DENIED', 403);
      }

      // So sánh mật khẩu
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return sendError(res, 'Invalid email or password', 'INVALID_CREDENTIALS', 401);
      }

      // Create session
      req.session.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        loginTime: Date.now(),
        lastActivity: Date.now()
      };

      // Configure session expiry (3 hours default)
      const sessionDurationMs = parseInt(process.env.SESSION_DURATION_HOURS || '3', 10) * 60 * 60 * 1000;
      req.session.cookie.maxAge = sessionDurationMs;

      // Save session explicitly (ensure it's persisted)
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return sendError(res, 'Login failed - session error', 'SESSION_ERROR', 500);
        }

        return sendSuccess(res, {
          admin: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role
          },
          sessionId: req.sessionID
        }, 'Admin login successful');
      });

    } catch (error) {
      console.error("Admin login error:", error);
      return sendError(res, 'Server error', 'INTERNAL_ERROR', 500);
    }
  },

  /**
   * [CHỨC NĂNG MỚI] Lấy số liệu thống kê Dashboard
   * GET /api/admin/stats
   */
  getStats: async (req, res) => {
    try {
      // Giả định các hàm query helper để đếm số lượng bản ghi:
      const [totalUsers, totalGames, totalOrders] = await Promise.all([
        queries.users.getCountOfUsers(),
        queries.games.getCountOfGames(),
        queries.orders.getCountOfOrders(), 
      ]);

      // Trả về dữ liệu thống kê theo định dạng chuẩn
      return sendSuccess(res, {
        orders: totalOrders, 
        users: totalUsers,
        games: totalGames,
      }, 'Dashboard stats retrieved successfully');

    } catch (error) {
      console.error("Get admin stats error:", error);
      return sendError(res, "Failed to retrieve stats", "INTERNAL_ERROR", 500);
    }
  },

  // 🔥 [CHỨC NĂNG MỚI] Lấy danh sách đơn hàng gần đây để hiện lên dashboard
  getRecentOrders: async (req, res) => {
    try {
      const recentOrders = await getRecentOrders(3); // Lấy 3 đơn hàng gần đây nhất
    return sendSuccess(res, recentOrders, 'Recent orders retrieved');
  } catch (error) {
    console.error('Get recent orders error:', error);
    return sendError(res, 'Failed to load recent orders', 'INTERNAL_ERROR', 500);
  }
}


};
