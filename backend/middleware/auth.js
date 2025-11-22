// backend/middleware/auth.js

const { sendError } = require('../utils/response');

/**
 * Authentication middleware
 * Checks if user is logged in via session
 */
const requireAuth = async (req, res, next) => {
  try {
    let sessionUser = req.session.user;
    
    // If no user in current session but we have X-Session-ID header, try to load that session
    if (!sessionUser && req.headers['x-session-id']) {
      try {
        const sessionStore = req.sessionStore;
        const sessionData = await new Promise((resolve, reject) => {
          sessionStore.get(req.headers['x-session-id'], (err, session) => {
            if (err) reject(err);
            else resolve(session);
          });
        });
        
        if (sessionData && sessionData.user) {
          sessionUser = sessionData.user;
          // Update current session with the user data
          req.session.user = sessionUser;
        }
      } catch (error) {
        // Session not found or expired
      }
    }
    
    if (!sessionUser) {
      return sendError(res, 'Not authenticated', 'NOT_AUTHENTICATED', 401);
    }
    
    // Attach user to request for easy access
    req.user = sessionUser;
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return sendError(res, 'Authentication error', 'AUTH_ERROR', 500);
  }
};

module.exports = requireAuth;
