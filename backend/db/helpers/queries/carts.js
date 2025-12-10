// backend/db/helpers/queries/carts.js
const { query, queryOne, transaction } = require('../queryUtils');

/**
 * Cart queries
 */

const cartsQueries = {
  /**
   * Get user cart
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Cart object or null
   */
  getCartByUserId: async (userId) => {
    const queryText = 'SELECT * FROM carts WHERE user_id = $1';
    return await queryOne(queryText, [userId]);
  },

  /**
   * Create cart for user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Created cart
   */
  createCart: async (userId) => {
    const queryText = `
      INSERT INTO carts (user_id, total_price)
      VALUES ($1, 0)
      RETURNING *
    `;
    return await queryOne(queryText, [userId]);
  },

  /**
   * Get cart with items
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Cart with items or null
   */
  getCartWithItems: async (userId) => {
    const cartQuery = 'SELECT * FROM carts WHERE user_id = $1';
    const cart = await queryOne(cartQuery, [userId]);
    
    if (!cart) {
      return null;
    }

    const itemsQuery = `
      SELECT 
        ci.id,
        ci.cart_id,
        ci.app_id,
        g.*,
        gd.header_image,
        gd.background
      FROM cart_items ci
      INNER JOIN games g ON ci.app_id = g.app_id
      LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
      WHERE ci.cart_id = $1
    `;
    const items = await query(itemsQuery, [cart.id]);

    return {
      ...cart,
      items
    };
  },

  /**
   * Add item to cart
   * @param {number} cartId - Cart ID
   * @param {number} appId - Game app_id
   * @returns {Promise<Object>} Cart item
   */
  addItemToCart: async (cartId, appId) => {
    // Check if item already exists
    const existingQuery = 'SELECT * FROM cart_items WHERE cart_id = $1 AND app_id = $2';
    const existing = await queryOne(existingQuery, [cartId, appId]);

    if (existing) {
      return existing;
    }

    // Add item
    const insertQuery = `
      INSERT INTO cart_items (cart_id, app_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    const cartItem = await queryOne(insertQuery, [cartId, appId]);

    // Update cart total
    await cartsQueries.updateCartTotal(cartId);

    return cartItem;
  },

  /**
   * Remove item from cart
   * @param {number} cartId - Cart ID
   * @param {number} appId - Game app_id
   * @returns {Promise<boolean>} Success status
   */
  removeItemFromCart: async (cartId, appId) => {
    const deleteQuery = 'DELETE FROM cart_items WHERE cart_id = $1 AND app_id = $2';
    await query(deleteQuery, [cartId, appId]);

    // Update cart total
    await cartsQueries.updateCartTotal(cartId);

    return true;
  },

  /**
   * Clear cart
   * @param {number} cartId - Cart ID
   * @returns {Promise<boolean>} Success status
   */
  clearCart: async (cartId) => {
    const deleteQuery = 'DELETE FROM cart_items WHERE cart_id = $1';
    await query(deleteQuery, [cartId]);

    // Update cart total
    await cartsQueries.updateCartTotal(cartId);

    return true;
  },

  /**
   * Update cart total price
   * @param {number} cartId - Cart ID
   * @returns {Promise<Object>} Updated cart
   */
  updateCartTotal: async (cartId) => {
    const queryText = `
      UPDATE carts
      SET total_price = (
        SELECT COALESCE(SUM(g.price_final), 0)
        FROM cart_items ci
        INNER JOIN games g ON ci.app_id = g.app_id
        WHERE ci.cart_id = $1
      )
      WHERE id = $1
      RETURNING *
    `;
    return await queryOne(queryText, [cartId]);
  },

  /**
   * Get or create cart for user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Cart object
   */
  getOrCreateCart: async (userId) => {
    let cart = await cartsQueries.getCartByUserId(userId);
    
    if (!cart) {
      cart = await cartsQueries.createCart(userId);
    }

    return cart;
  },
};

module.exports = cartsQueries;

