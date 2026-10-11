/**
 * VYBE Authentication Middleware
 * Phase 3/4: JWT Verification & Protected/Optional Route Guards
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { SERVER_BOOT_ID, IS_DEV_MODE } = require('../config/bootSession');

/**
 * Protect routes by verifying Bearer JWT and attaching user to req.user
 */
const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Reject requests without token
  if (!token || token.trim() === '') {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('[VYBE Auth Error] JWT_SECRET is not set in environment variables.');
    return res.status(500).json({
      success: false,
      message: 'Authentication server configuration error.',
    });
  }

  try {
    // Verify token signature and expiration
    const decoded = jwt.verify(token, jwtSecret);

    // Development-only session policy: reject tokens issued before the latest server restart
    if (IS_DEV_MODE && decoded.bootId !== SERVER_BOOT_ID) {
      return res.status(401).json({
        success: false,
        code: 'DEV_SERVER_RESTARTED',
        message: 'Development server restarted. Please sign in again.',
      });
    }

    // Fetch user from MongoDB excluding password
    let user = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findById(decoded.id).select('-password');
      } catch (dbErr) {
        // Fall back to seed users
      }
    }

    if (!user) {
      const { SEED_USERS } = require('../data/seedData');
      const seedFound = SEED_USERS.find(
        (u) => u._id.toString() === decoded.id.toString() || u.username === decoded.username
      );
      if (seedFound) {
        user = {
          ...seedFound,
          id: seedFound._id.toString(),
        };
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    // Attach safe user document to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.',
    });
  }
};

/**
 * Optional authentication: extracts req.user if a valid token is provided,
 * but allows public access if no token or an invalid token is sent.
 */
const optionalAuth = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token || token.trim() === '') {
    return next();
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (IS_DEV_MODE && decoded.bootId !== SERVER_BOOT_ID) {
      return next();
    }
    let user = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findById(decoded.id).select('-password');
      } catch (_) {}
    }
    if (!user) {
      const { SEED_USERS } = require('../data/seedData');
      const seedFound = SEED_USERS.find(
        (u) => u._id.toString() === decoded.id.toString() || u.username === decoded.username
      );
      if (seedFound) {
        user = seedFound;
      }
    }
    if (user) {
      req.user = user;
    }
  } catch (err) {
    // Ignore invalid/expired token for optional auth routes
  }

  next();
};

module.exports = { protect, optionalAuth };
