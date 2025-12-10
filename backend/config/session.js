// backend/config/session.js

const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

/**
 * Session configuration
 * Stores sessions in PostgreSQL using connect-pg-simple
 */
const sessionConfig = {
  store: new pgSession({
    // Use connection string for connect-pg-simple
    conString: process.env.DATABASE_URL || 
      `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    tableName: 'session', // Table name for storing sessions
    createTableIfMissing: true, // Automatically create session table if it doesn't exist
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Don't create session until something stored
  cookie: {
    httpOnly: false, // Allow JavaScript access for debugging
    secure: false, // Allow over HTTP for development
    sameSite: false, // Disable sameSite completely for development
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    domain: null, // Don't set domain restriction
  },
  name: 'gameShop.sid', // Session cookie name
};

module.exports = session(sessionConfig);
