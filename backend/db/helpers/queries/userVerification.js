// backend/db/helpers/queries/userVerification.js

const { query, queryOne } = require('../queryUtils');

const userVerificationQueries = {
  /**
   * Create or replace OTP for a user
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  createOrReplaceOTP: async ({ userId, otpHash, deliveryMethod = 'email', expiresAt }) => {
    const queryText = `
      INSERT INTO user_verifications (user_id, otp_hash, delivery_method, expires_at, created_at, attempt_count, verified_at)
      VALUES ($1, $2, $3, $4, NOW(), 0, NULL)
      ON CONFLICT (user_id)
      DO UPDATE SET
        otp_hash = EXCLUDED.otp_hash,
        delivery_method = EXCLUDED.delivery_method,
        expires_at = EXCLUDED.expires_at,
        created_at = NOW(),
        attempt_count = 0,
        verified_at = NULL
      RETURNING *
    `;
    return await queryOne(queryText, [userId, otpHash, deliveryMethod, expiresAt]);
  },

  /**
   * Get active OTP record by user
   * @param {number} userId
   * @returns {Promise<Object|null>}
   */
  getByUserId: async (userId) => {
    const queryText = `
      SELECT *
      FROM user_verifications
      WHERE user_id = $1
    `;
    return await queryOne(queryText, [userId]);
  },

  /**
   * Get active (unverified) OTP by user
   * @param {number} userId
   * @returns {Promise<Object|null>}
   */
  getActiveOTPByUser: async (userId) => {
    const queryText = `
      SELECT *
      FROM user_verifications
      WHERE user_id = $1 AND verified_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return await queryOne(queryText, [userId]);
  },

  /**
   * Increment attempt count
   * @param {number} userId
   */
  incrementAttemptCount: async (userId) => {
    const queryText = `
      UPDATE user_verifications
      SET attempt_count = attempt_count + 1
      WHERE user_id = $1
      RETURNING *
    `;
    return await queryOne(queryText, [userId]);
  },

  /**
   * Mark OTP as verified
   * @param {number} userId
   */
  markVerified: async (userId) => {
    const queryText = `
      UPDATE user_verifications
      SET verified_at = NOW()
      WHERE user_id = $1
      RETURNING *
    `;
    return await queryOne(queryText, [userId]);
  },

  /**
   * Delete OTP by user
   * @param {number} userId
   */
  deleteByUserId: async (userId) => {
    const queryText = 'DELETE FROM user_verifications WHERE user_id = $1';
    return await query(queryText, [userId]);
  },
};

module.exports = userVerificationQueries;

