// backend/db/helpers/queries/wishlist.js
const { query, queryOne, buildOrderClause, buildPaginationClause } = require('../queryUtils');

/**
 * Wishlist queries
 */
const wishlistQueries = {
  // ------------------
  // Get user wishlist (with game info + descriptions)
  // ------------------
  getUserWishlist: async (userId, options = {}) => {
    const { limit, offset, sortBy = 'added_at', order = 'DESC' } = options;

    const wishlistColumns = ['added_at', 'id', 'user_id', 'app_id'];
    const sortColumn = wishlistColumns.includes(sortBy) ? `uwl.${sortBy}` : `g.${sortBy}`;

    const orderClause = buildOrderClause(sortColumn, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
  SELECT
    g.*,
    uwl.added_at as wishlist_added_at,
    uwl.header_image,
    uwl.background,
    uwl.categories,
    uwl.genres
  FROM user_wishlist_items uwl
  LEFT JOIN games g ON uwl.app_id = g.app_id
  WHERE uwl.user_id = $1
  ${orderClause}
  ${paginationClause}
`.trim();


    return await query(queryText, [userId]);
  },

  // Check if in wishlist
  isInWishlist: async (userId, appId) => {
    const q = 'SELECT id FROM user_wishlist_items WHERE user_id = $1 AND app_id = $2 LIMIT 1';
    const res = await query(q, [userId, appId]);
    if (!res) return false;
    if (Array.isArray(res)) return res.length > 0;
    if (res.rowCount !== undefined) return res.rowCount > 0;
    return !!res;
  },

  // Add to wishlist (copy game_descriptions)
  addToWishlist: async (userId, appId) => {
    const q = `
      INSERT INTO user_wishlist_items (user_id, app_id, added_at, header_image, background, categories, genres)
      VALUES (
        $1, $2, NOW(),
        (SELECT header_image FROM game_descriptions WHERE app_id = $2),
        (SELECT background FROM game_descriptions WHERE app_id = $2),
        (SELECT categories FROM game_descriptions WHERE app_id = $2),
        (SELECT genres FROM game_descriptions WHERE app_id = $2)
      )
      ON CONFLICT (user_id, app_id) DO NOTHING
      RETURNING *
    `;
    return await queryOne(q, [userId, appId]);
  },

  // Remove from wishlist
  removeFromWishlist: async (userId, appId) => {
    const q = 'DELETE FROM user_wishlist_items WHERE user_id = $1 AND app_id = $2 RETURNING id';
    const res = await query(q, [userId, appId]);
    if (!res) return false;
    if (Array.isArray(res)) return res.length > 0;
    if (res.rowCount !== undefined) return res.rowCount > 0;
    return !!res;
  }
};

module.exports = wishlistQueries;
