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
        u.email,
        rr.reply_text,
        rr.created_at AS reply_created_at,
        rr.updated_at AS reply_updated_at,
        au.username AS reply_admin_username
      FROM reviews r
      INNER JOIN users u ON r.user_id = u.id
      LEFT JOIN review_replies rr ON rr.review_id = r.id
      LEFT JOIN users au ON rr.admin_id = au.id
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

  /**
   * Get a reply by review ID
   * @param {number} reviewId
   */
  getReplyByReviewId: async (reviewId) => {
    const queryText = 'SELECT * FROM review_replies WHERE review_id = $1';
    return await queryOne(queryText, [reviewId]);
  },

  /**
   * Upsert (create or update) admin reply for a review
   * @param {number} reviewId
   * @param {number} adminId
   * @param {string} replyText
   */
  upsertReviewReply: async (reviewId, adminId, replyText) => {
    const queryText = `
      INSERT INTO review_replies (review_id, admin_id, reply_text, created_at, updated_at)
      VALUES ($1, $2, $3, now(), now())
      ON CONFLICT (review_id)
      DO UPDATE SET
        reply_text = EXCLUDED.reply_text,
        admin_id = EXCLUDED.admin_id,
        updated_at = now()
      RETURNING *
    `;
    return await queryOne(queryText, [reviewId, adminId, replyText]);
  },

  /**
   * Admin: get reviews with game/user info and optional filters
   * @param {Object} options
   */
  getAdminReviews: async (options = {}) => {
    const {
      limit,
      offset,
      sortBy = 'review_at',
      order = 'DESC',
      gameId,
      userId,
      isRecommended,
      hasReply,
      q,
    } = options;

    const params = [];
    const conditions = [];
    let idx = 1;

    if (gameId) {
      conditions.push(`r.app_id = $${idx}`);
      params.push(gameId);
      idx++;
    }

    if (userId) {
      conditions.push(`r.user_id = $${idx}`);
      params.push(userId);
      idx++;
    }

    if (typeof isRecommended === 'boolean') {
      conditions.push(`r.is_recommended = $${idx}`);
      params.push(isRecommended);
      idx++;
    }

    if (hasReply === true || hasReply === 'true') {
      conditions.push('rr.id IS NOT NULL');
    } else if (hasReply === false || hasReply === 'false') {
      conditions.push('rr.id IS NULL');
    }

    if (q && q.trim() !== '') {
      const like = `%${q.trim()}%`;
      conditions.push(
        `(g.name ILIKE $${idx} OR u.username ILIKE $${idx} OR u.email ILIKE $${idx} OR r.review_text ILIKE $${idx})`
      );
      params.push(like);
      idx++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    let sortColumn;
    if (sortBy === 'game_name') {
      sortColumn = 'g.name';
    } else if (sortBy === 'review_at') {
      sortColumn = 'r.review_at';
    } else {
      sortColumn = `r.${sortBy}`;
    }

    const orderClause = buildOrderClause(sortColumn, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT
        r.*,
        u.username,
        u.email,
        g.name AS game_name,
        rr.reply_text,
        rr.created_at AS reply_created_at,
        rr.updated_at AS reply_updated_at,
        au.username AS reply_admin_username,
        CASE WHEN rr.id IS NULL THEN false ELSE true END AS has_reply
      FROM reviews r
      INNER JOIN users u ON r.user_id = u.id
      INNER JOIN games g ON r.app_id = g.app_id
      LEFT JOIN review_replies rr ON rr.review_id = r.id
      LEFT JOIN users au ON rr.admin_id = au.id
      ${whereClause}
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText, params);
  },
};

module.exports = reviewsQueries;

