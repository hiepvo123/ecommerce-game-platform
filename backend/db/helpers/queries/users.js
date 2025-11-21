// backend/db/helpers/queries/users.js
const { query, queryOne, buildWhereClause, buildOrderClause, buildPaginationClause } = require('../queryUtils');

/**
 * User queries
 */

const usersQueries = {
  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  getUserById: async (userId) => {
    const queryText = 'SELECT id, email, username, role, is_verified, date_of_birth, country, created_at FROM users WHERE id = $1';
    return await queryOne(queryText, [userId]);
  },

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  getUserByEmail: async (email) => {
    const queryText = 'SELECT * FROM users WHERE email = $1';
    return await queryOne(queryText, [email]);
  },

  /**
   * Get user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User object or null
   */
  getUserByUsername: async (username) => {
    const queryText = 'SELECT * FROM users WHERE username = $1';
    return await queryOne(queryText, [username]);
  },

  /**
   * Get user with profile
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} User with profile or null
   */
  getUserWithProfile: async (userId) => {
    const queryText = `
      SELECT 
        u.id,
        u.email,
        u.username,
        u.role,
        u.date_of_birth,
        u.country,
        up.prefer_lang_ids,
        up.prefer_genre_ids,
        up.prefer_cate_ids,
        up.prefer_platforms
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1
    `;
    return await queryOne(queryText, [userId]);
  },

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  createUser: async (userData) => {
    const { email, username, password_hash, role = 'user', is_verified = false, date_of_birth, country } = userData;
    const queryText = `
      INSERT INTO users (email, username, password_hash, role, is_verified, date_of_birth, country)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, username, role, is_verified, date_of_birth, country
    `;
    return await queryOne(queryText, [email, username, password_hash, role, is_verified, date_of_birth, country]);
  },

  /**
   * Update user
   * @param {number} userId - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<Object|null>} Updated user or null
   */
  updateUser: async (userId, userData) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['email', 'username', 'password_hash', 'role', 'is_verified', 'date_of_birth', 'country'];
    for (const [key, value] of Object.entries(userData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return await usersQueries.getUserById(userId);
    }

    values.push(userId);
    const queryText = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, username, role, is_verified, date_of_birth, country
    `;
    return await queryOne(queryText, values);
  },

  /**
   * Mark user as verified
   * @param {number} userId
   * @returns {Promise<Object|null>}
   */
  markUserVerified: async (userId) => {
    const queryText = `
      UPDATE users
      SET is_verified = true
      WHERE id = $1
      RETURNING id, email, username, role, is_verified
    `;
    return await queryOne(queryText, [userId]);
  },

  /**
   * Get user billing addresses
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of billing addresses
   */
  getUserBillingAddresses: async (userId) => {
    const queryText = 'SELECT * FROM user_billing_addresses WHERE user_id = $1';
    return await query(queryText, [userId]);
  },

  /**
   * Create billing address
   * @param {Object} addressData - Address data
   * @returns {Promise<Object>} Created address
   */
  createBillingAddress: async (addressData) => {
    const { user_id, full_name, line1, line2, city, state, postal_code, country } = addressData;
    const queryText = `
      INSERT INTO user_billing_addresses (user_id, full_name, line1, line2, city, state, postal_code, country)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    return await queryOne(queryText, [user_id, full_name, line1, line2, city, state, postal_code, country]);
  },

  /**
   * Get user profile
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} User profile or null
   */
  getUserProfile: async (userId) => {
    const queryText = 'SELECT * FROM user_profiles WHERE user_id = $1';
    return await queryOne(queryText, [userId]);
  },

  /**
   * Create or update user profile
   * @param {number} userId - User ID
   * @param {Object} profileData - Profile data
   * @returns {Promise<Object>} User profile
   */
  upsertUserProfile: async (userId, profileData) => {
    const { prefer_lang_ids, prefer_genre_ids, prefer_cate_ids, prefer_platforms } = profileData;
    const queryText = `
      INSERT INTO user_profiles (user_id, prefer_lang_ids, prefer_genre_ids, prefer_cate_ids, prefer_platforms)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id)
      DO UPDATE SET
        prefer_lang_ids = EXCLUDED.prefer_lang_ids,
        prefer_genre_ids = EXCLUDED.prefer_genre_ids,
        prefer_cate_ids = EXCLUDED.prefer_cate_ids,
        prefer_platforms = EXCLUDED.prefer_platforms
      RETURNING *
    `;
    return await queryOne(queryText, [userId, prefer_lang_ids, prefer_genre_ids, prefer_cate_ids, prefer_platforms]);
  },
};

module.exports = usersQueries;

