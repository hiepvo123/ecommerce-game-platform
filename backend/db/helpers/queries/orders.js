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
    const orderQuery = 'SELECT * FROM orders WHERE id = $1';
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

      // Get cart items
      const itemsQuery = 'SELECT * FROM cart_items WHERE cart_id = $1';
      const itemsResult = await client.query(itemsQuery, [cart.id]);
      const items = itemsResult.rows;

      if (items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Get game prices
      const gameIds = items.map(item => item.app_id);
      const gamesQuery = `SELECT app_id, price_final, discount_percent FROM games WHERE app_id = ANY($1)`;
      const gamesResult = await client.query(gamesQuery, [gameIds]);
      const games = gamesResult.rows.reduce((acc, game) => {
        acc[game.app_id] = game;
        return acc;
      }, {});

      // Calculate total
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
      if (orderData.discount_code) {
        // TODO: Apply coupon discount logic
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

      // Create order items
      for (const item of orderItems) {
        const itemQuery = `
          INSERT INTO order_items (order_id, app_id, unit_price_paid, discount_percent_applied)
          VALUES ($1, $2, $3, $4)
        `;
        await client.query(itemQuery, [order.id, item.app_id, item.unit_price_paid, item.discount_percent_applied]);
      }

      // Clear cart
      await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);
      await client.query('UPDATE carts SET total_price = 0 WHERE id = $1', [cart.id]);

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
};

module.exports = ordersQueries;

