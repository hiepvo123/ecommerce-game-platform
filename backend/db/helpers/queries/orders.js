// backend/db/helpers/queries/orders.js
const { query, queryOne, transaction, buildOrderClause, buildPaginationClause } = require('../queryUtils');

/**
 * Order queries
 */

const ordersQueries = {


  /**
   * Get recent orders(For dashboard) -> là kiểu lay một số liệu thống kê đơn giản
   * 
   */
  getRecentOrders: async (limit = 5) => {
  const queryText = `
    SELECT 
      o.id,
      o.total_price,
      o.order_status,
      o.created_at,
      u.email AS user_email
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT $1
  `;
  return await query(queryText, [limit]);
},

  /**
   * Get total count of orders 
   * @returns {Promise<numbr} Total order count
   */
  getCountOfOrders: async () => {
    const queryText = 'SELECT COUNT(*) AS count FROM orders';
    const result = await queryOne(queryText);
    // trả về số lượng dưới dạng số nguyên
    return parseInt(result?.count, 10)||0;
  },


  /**
   * Get order by ID
   * @param {number} orderId - Order ID
   * @returns {Promise<Object|null>} Order object or null
   */
  getOrderById: async (orderId) => {
    const queryText = 'SELECT * FROM orders WHERE id = $1';
    return await queryOne(queryText, [orderId]);
  },

  /**
   * Get order with items
   * @param {number} orderId - Order ID
   * @returns {Promise<Object|null>} Order with items or null
   */
  getOrderWithItems: async (orderId) => {
    const orderQuery = `
      SELECT 
        o.*,
        u.username,
        u.email
      FROM orders o
      INNER JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `;
    const order = await queryOne(orderQuery, [orderId]);
    
    if (!order) {
      return null;
    }

    const itemsQuery = `
      SELECT 
        oi.id,
        oi.order_id,
        oi.app_id,
        oi.unit_price_paid,
        oi.discount_percent_applied,
        g.name,
        g.price_currency,
        gd.header_image
      FROM order_items oi
      INNER JOIN games g ON oi.app_id = g.app_id
      LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
      WHERE oi.order_id = $1
    `;
    const items = await query(itemsQuery, [orderId]);

    return {
      ...order,
      items
    };
  },

  /**
   * Get user orders
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of orders
   */
  getUserOrders: async (userId, options = {}) => {
    const { limit, offset, sortBy = 'created_at', order = 'DESC' } = options;
    const orderClause = buildOrderClause(sortBy, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT * FROM orders
      WHERE user_id = $1
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText, [userId]);
  },

  /**
   * Get user orders with items (for list display)
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of orders with items
   */
  getUserOrdersWithItems: async (userId, options = {}) => {
    const { limit, offset, sortBy = 'created_at', order = 'DESC' } = options;
    const orderBy = String(sortBy || '').includes('.') ? sortBy : `o.${sortBy}`;
    const orderClause = buildOrderClause(orderBy, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT
        o.*,
        COALESCE(
          json_agg(
            json_build_object(
              'app_id', oi.app_id,
              'name', g.name,
              'header_image', gd.header_image
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN games g ON oi.app_id = g.app_id
      LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText, [userId]);
  },

  /**
   * Create order from cart
   * @param {number} userId - User ID
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Created order
   */
  createOrderFromCart: async (userId, orderData = {}) => {
    return await transaction(async (client) => {
      // Get user cart
      const cartQuery = 'SELECT * FROM carts WHERE user_id = $1';
      const cartResult = await client.query(cartQuery, [userId]);
      const cart = cartResult.rows[0];

      if (!cart) {
        throw new Error('Cart not found');
      }

      const selectedAppIds = Array.isArray(orderData.app_ids)
        ? orderData.app_ids
            .map((id) => parseInt(id, 10))
            .filter((id) => Number.isFinite(id))
        : null;
      const hasSelection = selectedAppIds && selectedAppIds.length > 0;

      // Get cart items (optionally filtered)
      const itemsQuery = hasSelection
        ? 'SELECT * FROM cart_items WHERE cart_id = $1 AND app_id = ANY($2)'
        : 'SELECT * FROM cart_items WHERE cart_id = $1';
      const itemsResult = hasSelection
        ? await client.query(itemsQuery, [cart.id, selectedAppIds])
        : await client.query(itemsQuery, [cart.id]);
      const items = itemsResult.rows;

      if (items.length === 0) {
        throw new Error(hasSelection ? 'CART_SELECTION_EMPTY' : 'Cart is empty');
      }

      if (hasSelection) {
        const foundIds = new Set(items.map((item) => item.app_id));
        const missing = selectedAppIds.filter((id) => !foundIds.has(id));
        if (missing.length > 0) {
          throw new Error('CART_SELECTION_INVALID');
        }
      }

      // Get game prices
      const gameIds = items.map(item => item.app_id);
      const gamesQuery = `SELECT app_id, price_final, discount_percent FROM games WHERE app_id = ANY($1)`;
      const gamesResult = await client.query(gamesQuery, [gameIds]);
      const games = gamesResult.rows.reduce((acc, game) => {
        acc[game.app_id] = game;
        return acc;
      }, {});

      // Calculate total (sum of current game prices)
      let totalPrice = 0;
      const orderItems = items.map(item => {
        const game = games[item.app_id];
        const price = parseFloat(game.price_final);
        totalPrice += price;
        return {
          app_id: item.app_id,
          unit_price_paid: price,
          discount_percent_applied: game.discount_percent
        };
      });

      // Apply discount if provided
      let discountOrder = 0;
      let coupon = null;
      const rawCode = (orderData.discount_code || '').trim();

      if (rawCode) {
        const code = rawCode.toUpperCase();

        // 1) Look up coupon by code
        const couponQuery = `
          SELECT id, code, discount_type, value
          FROM coupons
          WHERE UPPER(code) = $1
        `;
        const couponResult = await client.query(couponQuery, [code]);
        coupon = couponResult.rows[0];

        if (!coupon) {
          // Controller will translate this to a user-facing error
          throw new Error('INVALID_COUPON');
        }

        // 2) Check if user already used this coupon
        const usageQuery = `
          SELECT id FROM user_coupon_usage
          WHERE user_id = $1 AND coupon_id = $2
        `;
        const usageResult = await client.query(usageQuery, [userId, coupon.id]);
        const alreadyUsed = usageResult.rows.length > 0;
        if (alreadyUsed) {
          throw new Error('COUPON_ALREADY_USED');
        }

        // 3) Compute discount
        const couponValue = parseFloat(coupon.value);
        if (coupon.discount_type === 'percentage') {
          // e.g. value 10 -> 10%
          discountOrder = (totalPrice * couponValue) / 100;
        } else {
          // fixed_amount
          discountOrder = couponValue;
        }

        // 4) Cap discount so total never goes negative
        if (discountOrder < 0) discountOrder = 0;
        if (discountOrder > totalPrice) discountOrder = totalPrice;
      }

      totalPrice -= discountOrder;

      // Create order
      const orderQuery = `
        INSERT INTO orders (user_id, total_price, discount_code, discount_order, order_status, billing_address_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const orderResult = await client.query(orderQuery, [
        userId,
        totalPrice,
        orderData.discount_code || null,
        discountOrder,
        orderData.order_status || 'pending',
        orderData.billing_address_id || null
      ]);
      const order = orderResult.rows[0];

      // Record coupon usage if applied
      if (coupon && rawCode) {
        const usageInsert = `
          INSERT INTO user_coupon_usage (user_id, coupon_id, order_id)
          VALUES ($1, $2, $3)
        `;
        await client.query(usageInsert, [userId, coupon.id, order.id]);
      }

      // Create order items
      for (const item of orderItems) {
        const itemQuery = `
          INSERT INTO order_items (order_id, app_id, unit_price_paid, discount_percent_applied)
          VALUES ($1, $2, $3, $4)
        `;
        await client.query(itemQuery, [order.id, item.app_id, item.unit_price_paid, item.discount_percent_applied]);
      }

      // Clear selected items from cart (or all if no selection)
      if (hasSelection) {
        await client.query(
          'DELETE FROM cart_items WHERE cart_id = $1 AND app_id = ANY($2)',
          [cart.id, selectedAppIds]
        );
      } else {
        await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);
      }
      await client.query(
        `
          UPDATE carts
          SET total_price = (
            SELECT COALESCE(SUM(g.price_final), 0)
            FROM cart_items ci
            INNER JOIN games g ON ci.app_id = g.app_id
            WHERE ci.cart_id = $1
          )
          WHERE id = $1
        `,
        [cart.id]
      );

      return order;
    });
  },

  /**
   * Update order status
   * @param {number} orderId - Order ID
   * @param {string} status - Order status
   * @returns {Promise<Object|null>} Updated order or null
   */
  updateOrderStatus: async (orderId, status) => {
    const queryText = `
      UPDATE orders
      SET order_status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    return await queryOne(queryText, [status, orderId]);
  },

  /**
   * Get orders by status
   * @param {string} status - Order status
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of orders
   */
  getOrdersByStatus: async (status, options = {}) => {
    const { limit, offset, sortBy = 'created_at', order = 'DESC' } = options;
    const orderClause = buildOrderClause(sortBy, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT * FROM orders
      WHERE order_status = $1
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText, [status]);
  },

  /**
   * Get all orders with user info (for admin)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of orders
   */
  getAllOrders: async (options = {}) => {
    const { limit, offset, sortBy = 'created_at', order = 'DESC' } = options;
    const orderClause = buildOrderClause(sortBy, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT 
        o.*,
        u.email AS user_email,
        u.username AS user_username
      FROM orders o
      INNER JOIN users u ON o.user_id = u.id
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText);
  },
};

module.exports = ordersQueries;

