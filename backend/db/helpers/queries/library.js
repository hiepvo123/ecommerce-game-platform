// backend/db/helpers/queries/library.js
const { query, queryOne, buildOrderClause, buildPaginationClause } = require('../queryUtils');

/**
 * Library and Wishlist queries
 */

const libraryQueries = {
  /**
   * Get user game library
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of library games
   */
  getUserLibrary: async (userId, options = {}) => {
    const { limit, offset, sortBy = 'added_at', order = 'DESC' } = options;
    
    // Determine which table the sort column belongs to
    const libraryColumns = ['added_at', 'id', 'user_id', 'app_id', 'order_id'];
    const sortColumn = libraryColumns.includes(sortBy) 
      ? `ugl.${sortBy}` 
      : `g.${sortBy}`;
    
    const orderClause = buildOrderClause(sortColumn, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT 
        g.*,
        ugl.added_at as library_added_at,
        ugl.order_id,
        gd.header_image,
        gd.background,
        gd.detailed_description
      FROM user_game_library ugl
      INNER JOIN games g ON ugl.app_id = g.app_id
      LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
      WHERE ugl.user_id = $1
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText, [userId]);
  },

  /**
   * Add game to library
   * @param {number} userId - User ID
   * @param {number} appId - Game app_id
   * @param {number} orderId - Order ID (optional)
   * @returns {Promise<Object>} Library entry
   */
  addToLibrary: async (userId, appId, orderId = null) => {
    const queryText = `
      INSERT INTO user_game_library (user_id, app_id, order_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, app_id) DO NOTHING
      RETURNING *
    `;
    return await queryOne(queryText, [userId, appId, orderId]);
  },

  /**
   * Check if game is in library
   * @param {number} userId - User ID
   * @param {number} appId - Game app_id
   * @returns {Promise<boolean>} True if in library
   */
  isInLibrary: async (userId, appId) => {
    const queryText = 'SELECT id FROM user_game_library WHERE user_id = $1 AND app_id = $2';
    const result = await queryOne(queryText, [userId, appId]);
    return result !== null;
  },

  /**
   * Remove game from library
   * @param {number} userId - User ID
   * @param {number} appId - Game app_id
   * @returns {Promise<boolean>} Success status
   */
  removeFromLibrary: async (userId, appId) => {
    const queryText = 'DELETE FROM user_game_library WHERE user_id = $1 AND app_id = $2';
    await query(queryText, [userId, appId]);
    return true;
  },

  /**
   * Get user wishlist
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of wishlist games with full details
   */
  getUserWishlist: async (userId, options = {}) => {
    const { limit, offset, sortBy = 'added_at', order = 'DESC' } = options;
    
    // Determine which table the sort column belongs to
    // Wishlist-specific columns: added_at, id, user_id, app_id
    // All other columns belong to games table
    const wishlistColumns = ['added_at', 'id', 'user_id', 'app_id'];
    const sortColumn = wishlistColumns.includes(sortBy) 
      ? `uwl.${sortBy}` 
      : `g.${sortBy}`;
    
    const orderClause = buildOrderClause(sortColumn, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT 
        g.*,
        uwl.added_at as wishlist_added_at,
        gd.header_image,
        gd.background,
        gd.detailed_description
      FROM user_wishlist_items uwl
      INNER JOIN games g ON uwl.app_id = g.app_id
      LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
      WHERE uwl.user_id = $1
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText, [userId]);
  },

  /**
   * Add game to wishlist
   * @param {number} userId - User ID
   * @param {number} appId - Game app_id
   * @returns {Promise<Object>} Wishlist entry
   */
  addToWishlist: async (userId, appId) => {
    const queryText = `
      INSERT INTO user_wishlist_items (user_id, app_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, app_id) DO NOTHING
      RETURNING *
    `;
    return await queryOne(queryText, [userId, appId]);
  },

  /**
   * Check if game is in wishlist
   * @param {number} userId - User ID
   * @param {number} appId - Game app_id
   * @returns {Promise<boolean>} True if in wishlist
   */
  isInWishlist: async (userId, appId) => {
    const queryText = 'SELECT id FROM user_wishlist_items WHERE user_id = $1 AND app_id = $2';
    const result = await queryOne(queryText, [userId, appId]);
    return result !== null;
  },

  /**
   * Remove game from wishlist
   * @param {number} userId - User ID
   * @param {number} appId - Game app_id
   * @returns {Promise<boolean>} Success status
   */
  removeFromWishlist: async (userId, appId) => {
    const queryText = 'DELETE FROM user_wishlist_items WHERE user_id = $1 AND app_id = $2';
    await query(queryText, [userId, appId]);
    return true;
  },
};

module.exports = libraryQueries;

