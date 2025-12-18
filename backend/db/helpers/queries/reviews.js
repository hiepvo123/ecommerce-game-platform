// backend/db/helpers/queries/reviews.js
const { query, queryOne, buildOrderClause, buildPaginationClause } = require('../queryUtils');

/**
 * Review queries
 */

const reviewsQueries = {
  /**
   * Get review by ID
   * @param {number} reviewId - Review ID
   * @returns {Promise<Object|null>} Review object or null
   */
  getReviewById: async (reviewId) => {
    const queryText = 'SELECT * FROM reviews WHERE id = $1';
    return await queryOne(queryText, [reviewId]);
  },

  /**
   * Get reviews for a game
   * @param {number} appId - Game app_id
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of reviews
   */
  getReviewsByGame: async (appId, options = {}) => {
    const { limit, offset, sortBy = 'id', order = 'DESC' } = options;
    const orderClause = buildOrderClause(sortBy, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT 
        r.*,
        u.username,
        u.email
      FROM reviews r
      INNER JOIN users u ON r.user_id = u.id
      WHERE r.app_id = $1
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText, [appId]);
  },

  /**
   * Get review for a specific user and game
   * @param {number} userId - User ID
   * @param {number} appId - Game app_id
   * @returns {Promise<Object|null>} Review object or null
   */
  getReviewByUserAndGame: async (userId, appId) => {
    const queryText = 'SELECT * FROM reviews WHERE user_id = $1 AND app_id = $2';
    return await queryOne(queryText, [userId, appId]);
  },

  /**
   * Get user reviews
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of reviews
   */
  getReviewsByUser: async (userId, options = {}) => {
    const { limit, offset, sortBy = 'id', order = 'DESC' } = options;
    const orderClause = buildOrderClause(sortBy, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT 
        r.*,
        g.name as game_name,
        gd.header_image
      FROM reviews r
      INNER JOIN games g ON r.app_id = g.app_id
      LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
      WHERE r.user_id = $1
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText, [userId]);
  },

  /**
   * Create review
   * @param {Object} reviewData - Review data
   * @returns {Promise<Object>} Created review
   */
  createReview: async (reviewData) => {
    const { user_id, app_id, review_text, is_recommended } = reviewData;
    const queryText = `
      INSERT INTO reviews (id, user_id, app_id, review_text, is_recommended)
      VALUES (
        (SELECT COALESCE(MAX(id), 0) + 1 FROM reviews),
        $1, $2, $3, $4
      )
      RETURNING *
    `;
    return await queryOne(queryText, [user_id, app_id, review_text, is_recommended]);
  },

  /**
   * Update review
   * @param {number} reviewId - Review ID
   * @param {Object} reviewData - Review data to update
   * @returns {Promise<Object|null>} Updated review or null
   */
  updateReview: async (reviewId, reviewData) => {
    const { review_text, is_recommended } = reviewData;
    const queryText = `
      UPDATE reviews
      SET review_text = $1, is_recommended = $2
      WHERE id = $3
      RETURNING *
    `;
    return await queryOne(queryText, [review_text, is_recommended, reviewId]);
  },

  /**
   * Delete review
   * @param {number} reviewId - Review ID
   * @returns {Promise<boolean>} Success status
   */
  deleteReview: async (reviewId) => {
    const queryText = 'DELETE FROM reviews WHERE id = $1';
    await query(queryText, [reviewId]);
    return true;
  },

  /**
   * Get review statistics for a game
   * @param {number} appId - Game app_id
   * @returns {Promise<Object>} Review statistics
   */
  getReviewStats: async (appId) => {
    const queryText = `
      SELECT 
        COUNT(*) as total_reviews,
        COUNT(*) FILTER (WHERE is_recommended = true) as recommended_count,
        COUNT(*) FILTER (WHERE is_recommended = false) as not_recommended_count,
        ROUND(AVG(CASE WHEN is_recommended THEN 1 ELSE 0 END) * 100, 2) as recommendation_percentage
      FROM reviews
      WHERE app_id = $1
    `;
    return await queryOne(queryText, [appId]);
  },
};

module.exports = reviewsQueries;

