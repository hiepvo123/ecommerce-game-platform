// backend/models/UserModel.js

const bcrypt = require('bcrypt');
const queries = require('../db/helpers/queries');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

/**
 * Hash plain password
 * @param {string} password - Plain password
 * @returns {Promise<string>} hashed password
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare password with hash
 * @param {string} password - Plain password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} true if match
 */
const comparePassword = async (password, hash) => {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
};

/**
 * Find user by email
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
const findByEmail = async (email) => {
  return queries.users.getUserByEmail(email);
};

/**
 * Find user by username
 * @param {string} username
 * @returns {Promise<Object|null>}
 */
const findByUsername = async (username) => {
  return queries.users.getUserByUsername(username);
};

/**
 * Create new user with hashed password
 * @param {Object} payload
 * @returns {Promise<Object>} created user
 */
const createUser = async (payload) => {
  const password_hash = await hashPassword(payload.password);
  return queries.users.createUser({
    email: payload.email,
    username: payload.username,
    password_hash,
    role: payload.role,
    date_of_birth: payload.date_of_birth,
    country: payload.country,
  });
};

/**
 * Validate user credentials using bcrypt
 * @param {string} identifier - email or username
 * @param {string} password
 * @returns {Promise<Object|null>} user info if valid
 */
const checkUserCredentials = async (identifier, password) => {
  // Try email first, fallback to username
  const user =
    (await findByEmail(identifier)) ||
    (await findByUsername(identifier));

  if (!user) {
    return null;
  }

  const match = await comparePassword(password, user.password_hash);
  if (!match) {
    return null;
  }

  // Expose limited fields
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  findByEmail,
  findByUsername,
  createUser,
  checkUserCredentials,
};