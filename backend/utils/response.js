// backend/utils/response.js

/**
 * Standardized response format helpers
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, data = null, message = null, statusCode = 200) => {
  const response = {
    success: true,
  };

  if (data !== null) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {string} code - Error code (optional)
 * @param {number} statusCode - HTTP status code (default: 400)
 */
const sendError = (res, message, code = null, statusCode = 400) => {
  const response = {
    success: false,
    error: {
      message,
    },
  };

  if (code) {
    response.error.code = code;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError,
};

