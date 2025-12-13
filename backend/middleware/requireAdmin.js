// backend/middleware/requireAdmin.js

const { sendError } = require('../utils/response');

/**
 * Middleware để kiểm tra và chỉ cho phép người dùng có vai trò 'admin' truy cập.
 *
 * Lưu ý: Middleware này giả định rằng
 * 1. Đã có một middleware xác thực (ví dụ: requireAuth) chạy trước đó
 * để đảm bảo req.user hoặc req.session.user tồn tại và đã được xác thực.
 * 2. Thông tin người dùng bao gồm trường 'role'.
 */
const requireAdmin = (req, res, next) => {
  let user = req.user || req.session.user;

  // 1. Kiểm tra xem người dùng đã đăng nhập chưa
  if (!user) {
    // Nếu chưa đăng nhập, trả về lỗi 401 (Unauthenticated)
    return sendError(res, 'Authentication required to access this resource', 'UNAUTHENTICATED', 401);
  }

  // 2. Kiểm tra vai trò (role) của người dùng
  // Vai trò được định nghĩa trong ENUM user_role: 'user' hoặc 'admin'
  if (user.role !== 'admin') {
    // Nếu role không phải là 'admin', trả về lỗi 403 (Forbidden)
    return sendError(res, 'Access denied: Insufficient privileges (Admin role required)', 'ACCESS_DENIED', 403);
  }

  // 3. Nếu là admin, cho phép tiếp tục
  next();
};

module.exports = requireAdmin;