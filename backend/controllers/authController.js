// backend/controllers/authController.js

const crypto = require('crypto');
const UserModel = require('../models/UserModel');
const queries = require('../db/helpers/queries');
const emailService = require('../services/emailServices');
const { sendSuccess, sendError } = require('../utils/response');

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

/**
 * Register new user and send verification OTP
 */
const register = async (req, res) => {
  const { email, username, password, dateOfBirth, country } = req.body;

  if (!email || !username || !password) {
    return sendError(res, 'Email, username, and password are required', 'VALIDATION_ERROR', 400);
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    const [emailExists, usernameExists] = await Promise.all([
      UserModel.findByEmail(normalizedEmail),
      UserModel.findByUsername(normalizedUsername),
    ]);

    if (emailExists) {
      return sendError(res, 'Email already registered', 'EMAIL_EXISTS', 409);
    }

    if (usernameExists) {
      return sendError(res, 'Username already taken', 'USERNAME_EXISTS', 409);
    }

    const newUser = await UserModel.createUser({
      email: normalizedEmail,
      username: normalizedUsername,
      password,
      role: 'user',
      date_of_birth: dateOfBirth,
      country,
      is_verified: false,
    });

    const otpCode = generateOTP();
    const otpHash = await UserModel.hashPassword(otpCode);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await queries.userVerification.createOrReplaceOTP({
      userId: newUser.id,
      otpHash,
      deliveryMethod: 'email',
      expiresAt,
    });

    await emailService.sendVerificationCode(newUser.email, otpCode, newUser.username);

    return sendSuccess(
      res,
      {
        userId: newUser.id,
        email: newUser.email,
      },
      'Registration successful. Please check your email for the verification code.',
      201
    );
  } catch (error) {
    console.error('Register error:', error);
    return sendError(res, 'Unable to register. Please try again later.', 'REGISTER_FAILED', 500);
  }
};

/**
 * Login with session management
 */
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or username

    if (!identifier || !password) {
      return sendError(res, 'Email/username and password are required', 'MISSING_CREDENTIALS', 400);
    }

    // Check user credentials
    const user = await UserModel.checkUserCredentials(identifier, password);
    if (!user) {
      return sendError(res, 'Invalid email/username or password', 'INVALID_CREDENTIALS', 401);
    }

    // Get full user data to check verification status
    const fullUser = await UserModel.findByEmail(user.email);
    if (!fullUser.is_verified) {
      return sendError(res, 'Please verify your email before logging in', 'EMAIL_NOT_VERIFIED', 403);
    }

    // Create session
    req.session.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      loginTime: Date.now(),
      lastActivity: Date.now()
    };

    // Configure session expiry (3 hours default)
    const sessionDurationMs = parseInt(process.env.SESSION_DURATION_HOURS || '3', 10) * 60 * 60 * 1000;
    req.session.cookie.maxAge = sessionDurationMs;

    // Save session explicitly (ensure it's persisted)
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return sendError(res, 'Login failed - session error', 'SESSION_ERROR', 500);
      }

      return sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        },
        sessionId: req.sessionID
      }, 'Login successful');
    });

  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return sendError(res, 'Email and OTP code are required', 'MISSING_FIELDS', 400);
    }

    // Get user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return sendError(res, 'User not found', 'USER_NOT_FOUND', 404);
    }

    if (user.is_verified) {
      return sendError(res, 'User is already verified', 'ALREADY_VERIFIED', 400);
    }

    // Get active OTP
    const otpRecord = await queries.userVerification.getActiveOTPByUser(user.id);
    if (!otpRecord) {
      return sendError(res, 'No active verification code found. Please request a new one.', 'NO_ACTIVE_OTP', 400);
    }

    // Check if OTP is expired
    if (new Date() > new Date(otpRecord.expires_at)) {
      return sendError(res, 'Verification code has expired. Please request a new one.', 'OTP_EXPIRED', 400);
    }

    // Check attempt limit
    if (otpRecord.attempt_count >= 5) {
      return sendError(res, 'Too many failed attempts. Please request a new code.', 'TOO_MANY_ATTEMPTS', 429);
    }

    // Verify OTP
    const isValidOTP = await UserModel.comparePassword(otpCode, otpRecord.otp_hash);
    
    if (!isValidOTP) {
      // Increment attempt count
      await queries.userVerification.incrementAttemptCount(user.id);
      return sendError(res, 'Invalid verification code', 'INVALID_OTP', 400);
    }

    // Mark user as verified
    await queries.users.updateUser(user.id, { is_verified: true });
    
    // Mark OTP as verified and clean up
    await queries.userVerification.markVerified(user.id);

    return sendSuccess(res, 
      { userId: user.id, email: user.email, verified: true }, 
      'Email verified successfully! You can now log in.'
    );

  } catch (error) {
    console.error('OTP verification error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 'Email is required', 'MISSING_EMAIL', 400);
    }

    // Get user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return sendError(res, 'User not found', 'USER_NOT_FOUND', 404);
    }

    if (user.is_verified) {
      return sendError(res, 'User is already verified', 'ALREADY_VERIFIED', 400);
    }

    // Generate new OTP
    const otpCode = generateOTP();
    const otpHash = await UserModel.hashPassword(otpCode);
    const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10) * 60 * 1000));

    // Replace existing OTP
    await queries.userVerification.createOrReplaceOTP({
      userId: user.id,
      otpHash,
      deliveryMethod: 'email',
      expiresAt,
    });

    // Send new OTP
    await emailService.sendVerificationCode(user.email, otpCode, user.username);

    return sendSuccess(res, 
      { email: user.email }, 
      'New verification code sent to your email'
    );

  } catch (error) {
    console.error('Resend OTP error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

// Get current user from session
const getMe = async (req, res) => {
  try {
    // Check if session has user data
    let sessionUser = req.session.user;
    
    // If no user in current session but we have X-Session-ID header, try to load that session
    if (!sessionUser && req.headers['x-session-id']) {
      // For development: manually query the session store
      // This is a workaround for cross-origin cookie issues
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

    // Update last activity for sliding session
    sessionUser.lastActivity = Date.now();
    if (req.session.user) {
      req.session.user.lastActivity = Date.now();
    }
    
    // Check if session should be extended (sliding expiry)
    const sessionDurationMs = parseInt(process.env.SESSION_DURATION_HOURS || '3', 10) * 60 * 60 * 1000;
    const timeUntilExpiry = req.session.cookie.maxAge;
    const slideThreshold = sessionDurationMs * 0.33; // Extend if less than 1/3 time remaining
    
    if (timeUntilExpiry < slideThreshold) {
      req.session.cookie.maxAge = sessionDurationMs;
    }

    return sendSuccess(res, {
      user: {
        id: sessionUser.id,
        email: sessionUser.email,
        username: sessionUser.username,
        role: sessionUser.role
      },
      sessionInfo: {
        loginTime: sessionUser.loginTime,
        lastActivity: sessionUser.lastActivity,
        expiresIn: req.session.cookie.maxAge
      }
    }, 'Session active');

  } catch (error) {
    console.error('Get me error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

// Logout - destroy session
const logout = async (req, res) => {
  try {
    let sessionUser = req.session.user;
    let sessionIdToDestroy = req.sessionID;

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
          sessionIdToDestroy = req.headers['x-session-id'];
        }
      } catch (error) {
        // Session not found
      }
    }

    if (!sessionUser) {
      return sendError(res, 'Not authenticated', 'NOT_AUTHENTICATED', 401);
    }

    // Destroy the correct session
    if (sessionIdToDestroy === req.sessionID) {
      // Current session
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
          return sendError(res, 'Logout failed', 'LOGOUT_ERROR', 500);
        }

        // Clear session cookie
        res.clearCookie('gameShop.sid');
        
        return sendSuccess(res, null, 'Logged out successfully');
      });
    } else {
      // Session from header - destroy manually
      req.sessionStore.destroy(sessionIdToDestroy, (err) => {
        if (err) {
          console.error('Session destroy error:', err);
          return sendError(res, 'Logout failed', 'LOGOUT_ERROR', 500);
        }
        
        return sendSuccess(res, null, 'Logged out successfully');
      });
    }

  } catch (error) {
    console.error('Logout error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  verifyOTP,
  resendOTP,
};