// backend/middleware/errorHandler.js

const { sendError } = require('../utils/response');

/**
 * Global error handler middleware
 * Must be the last middleware in the chain
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Handle known error types
  if (err.name === 'ValidationError') {
    return sendError(res, err.message, 'VALIDATION_ERROR', 400);
  }

  if (err.name === 'UnauthorizedError') {
    return sendError(res, 'Unauthorized access', 'UNAUTHORIZED', 401);
  }

  // Database errors
  if (err.code === '23505') {
    // PostgreSQL unique violation
    return sendError(res, 'Duplicate entry. This record already exists.', 'DUPLICATE_ENTRY', 409);
  }

  if (err.code === '23503') {
    // PostgreSQL foreign key violation
    return sendError(res, 'Invalid reference. Related record does not exist.', 'FOREIGN_KEY_VIOLATION', 400);
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message || 'Internal server error';

  return sendError(res, message, 'INTERNAL_ERROR', statusCode);
};

module.exports = errorHandler;
