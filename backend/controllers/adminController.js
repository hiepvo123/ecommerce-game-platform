const bcrypt = require('bcrypt');
const queries = require('../db/helpers/queries');
const { sendSuccess, sendError } = require('../utils/response'); // 🔥 [CẬP NHẬT] Thêm import
const { getRecentOrders } = require('../db/helpers/queries/orders');
const gamesQueries = require('../db/helpers/queries/games');// 🔥 [THÊM] Import helper cho games

// 🔥 [THÊM] Hàm tạo game đầy đủ
const createGame = async (req, res) => {
  try {
    const result = await gamesQueries.createGameFull(req.body);
    res.status(201).json({
      message: 'Game created successfully',
      app_id: result.app_id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Create game failed' });
  }
};

// Update existing game (basic info + description + genres)
const updateGame = async (req, res) => {
  try {
    const appId = parseInt(req.params.id, 10);
    if (Number.isNaN(appId)) {
      return sendError(res, 'Invalid game id', 'VALIDATION_ERROR', 400);
    }

    const updatedGame = await gamesQueries.updateGameFull(appId, req.body);
    return sendSuccess(res, updatedGame, 'Game updated successfully');
  } catch (err) {
    console.error(err);
    return sendError(res, 'Update game failed', 'INTERNAL_ERROR', 500);
  }
};

module.exports = {
  // 🔥 [CẬP NHẬT] Thêm hàm
  createGame,
  updateGame,

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
  },

  /**
   * Get all orders (for admin)
   * GET /api/admin/orders
   */
  getAllOrders: async (req, res) => {
    try {
      const { limit, offset, sortBy, order } = req.query;
      const options = {
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
        sortBy: sortBy || 'created_at',
        order: order || 'DESC',
      };
      const orders = await queries.orders.getAllOrders(options);
      return sendSuccess(res, { orders }, 'All orders retrieved successfully');
    } catch (error) {
      console.error('Get all orders error:', error);
      return sendError(res, 'Failed to load orders', 'INTERNAL_ERROR', 500);
    }
  },

  /**
   * Get pending payments (for admin)
   * GET /api/admin/payments/pending
   */
  getPendingPayments: async (req, res) => {
    try {
      const { limit, offset, sortBy, order } = req.query;
      const options = {
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
        sortBy: sortBy || 'payment_created',
        order: order || 'DESC',
      };
      const payments = await queries.payments.getPendingPayments(options);
      return sendSuccess(res, { payments }, 'Pending payments retrieved successfully');
    } catch (error) {
      console.error('Get pending payments error:', error);
      return sendError(res, 'Failed to load pending payments', 'INTERNAL_ERROR', 500);
    }
  },

  /**
   * Get all users (for admin)
   * GET /api/admin/users
   */
  getAllUsers: async (req, res) => {
    try {
      const { limit, offset, sortBy, order } = req.query;
      const options = {
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
        sortBy: sortBy || 'created_at',
        order: order || 'DESC',
      };
      const users = await queries.users.getAllUsers(options);
      return sendSuccess(res, { users }, 'All users retrieved successfully');
    } catch (error) {
      console.error('Get all users error:', error);
      return sendError(res, 'Failed to load users', 'INTERNAL_ERROR', 500);
    }
  },

  /**
   * Get all games (for admin)
   * GET /api/admin/games
   */
  getAllGames: async (req, res) => {
    try {
      const {
        limit,
        offset,
        sortBy,
        order,
        platform,
        minPrice,
        maxPrice,
        hasDiscount,
        languageId,
        genreId,
        categoryId,
        q,
      } = req.query;

      const options = {
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
        sortBy: sortBy || (q ? 'relevance' : 'name'),
        order: (order || (q ? 'DESC' : 'ASC')).toUpperCase(),
      };

      let games;

      if (q && q.trim() !== '') {
        // Full-text search by name/description
        games = await queries.games.searchGames(q.trim(), options);
      } else if (genreId) {
        // Filter by single genre (optional language)
        const genre = parseInt(genreId, 10);
        games = await queries.games.getGamesByGenre(genre, {
          ...options,
          languageId: languageId || undefined,
          // Admin should see all games, no excludeOwnedUserId
          excludeOwnedUserId: undefined,
        });
      } else if (categoryId) {
        // Filter by single category (optional language)
        const category = parseInt(categoryId, 10);
        games = await queries.games.getGamesByCategory(category, {
          ...options,
          languageId: languageId || undefined,
          excludeOwnedUserId: undefined,
        });
      } else {
        // Base listing with platform/price/discount/language filters
        const filters = {};
        if (platform) filters.platform = platform;
        if (minPrice) filters.minPrice = parseFloat(minPrice);
        if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
        if (hasDiscount === 'true') filters.hasDiscount = true;
        if (languageId) filters.languageId = languageId;

        games = await queries.games.getGamesByFilter(filters, options);
      }

      return sendSuccess(res, { games }, 'All games retrieved successfully');
    } catch (error) {
      console.error('Get all games error:', error);
      return sendError(res, 'Failed to load games', 'INTERNAL_ERROR', 500);
    }
  },

  /**
   * Update payment status (and corresponding order status)
   * PUT /api/admin/payments/:id/status
   */
  updatePaymentStatus: async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id, 10);
      const { payment_status } = req.body;

      if (Number.isNaN(paymentId)) {
        return sendError(res, 'Invalid payment ID', 'VALIDATION_ERROR', 400);
      }

      // Validate payment status
      const validStatuses = ['initiated', 'authorized', 'captured', 'failed', 'refunded', 'canceled'];
      if (!payment_status || !validStatuses.includes(payment_status)) {
        return sendError(res, 'Invalid payment status', 'VALIDATION_ERROR', 400);
      }

      // Get payment to find order_id
      const payment = await queries.payments.getPaymentById(paymentId);
      if (!payment) {
        return sendError(res, 'Payment not found', 'NOT_FOUND', 404);
      }

      // Map payment status to order status
      const orderStatusMap = {
        'authorized': 'paid',
        'captured': 'paid',
        'canceled': 'canceled',
        'failed': 'failed',
        'refunded': 'refunded',
        'initiated': 'pending', // Keep order as pending
      };

      const newOrderStatus = orderStatusMap[payment_status];

      // Update payment and order status in a transaction
      const updatedPayment = await queries.payments.updatePaymentAndOrderStatus(
        paymentId,
        payment_status,
        payment.order_id,
        newOrderStatus && newOrderStatus !== 'pending' ? newOrderStatus : null
      );

      return sendSuccess(
        res,
        { payment: updatedPayment },
        'Payment status updated successfully'
      );
    } catch (error) {
      console.error('Update payment status error:', error);
      return sendError(res, 'Failed to update payment status', 'INTERNAL_ERROR', 500);
    }
  },

  // Get game detail by appId
  getGameDetail: async (req, res) => {
    try {
      const appId = parseInt(req.params.id, 10);

      const game = await gamesQueries.getGameWithDetails(appId);

      if (!game) {
        return sendError(res, 'Game not found', 'NOT_FOUND', 404);
      }

      // 🔥 QUAN TRỌNG: dùng sendSuccess cho đồng bộ frontend
      return sendSuccess(res, game, 'Game detail retrieved successfully');

    } catch (err) {
      console.error(err);
      return sendError(res, 'Failed to load game detail', 'INTERNAL_ERROR', 500);
    }
  },


};
