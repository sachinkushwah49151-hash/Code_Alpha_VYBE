/**
 * VYBE Auth Controller
 * Phase 3: Registration, Login & Current User Profile
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { SEED_USERS } = require('../data/seedData');
const { SERVER_BOOT_ID } = require('../config/bootSession');

/**
 * Generate JSON Web Token
 * @param {string} userId - Mongoose user _id
 * @param {string} username - User handle
 * @returns {string} Signed JWT
 */
const generateToken = (userId, username) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  return jwt.sign(
    { id: userId, username, bootId: SERVER_BOOT_ID },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user, hash password, return safe user & token
 * @access  Public
 */
exports.registerUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // 1. Validate required fields presence
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, username, email, and password.',
      });
    }

    // 2. Validate and sanitize name
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (trimmedName.length === 0 || trimmedName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 1 and 50 characters.',
      });
    }

    // 3. Normalize and validate username
    const normalizedUsername = typeof username === 'string'
      ? username.trim().toLowerCase().replace(/^@/, '')
      : '';

    if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 30 characters.',
      });
    }

    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!usernameRegex.test(normalizedUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, underscores, and dots.',
      });
    }

    // 4. Normalize and validate email
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // 5. Validate password requirements
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    let user;
    if (mongoose.connection.readyState === 1) {
      // 6. Check for existing username or email duplicates in MongoDB
      const existingUser = await User.findOne({
        $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
      });

      if (existingUser) {
        if (existingUser.email === normalizedEmail) {
          return res.status(400).json({
            success: false,
            message: 'An account with this email address already exists.',
          });
        }
        if (existingUser.username === normalizedUsername) {
          return res.status(400).json({
            success: false,
            message: 'This username is already taken.',
          });
        }
      }

      // 7. Securely hash password using bcryptjs
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 8. Create user in database
      user = await User.create({
        name: trimmedName,
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword,
      });
    } else {
      const existing = SEED_USERS.find(
        (u) => u.email.toLowerCase() === normalizedEmail || u.username.toLowerCase() === normalizedUsername
      );
      if (existing) {
        if (existing.email.toLowerCase() === normalizedEmail) {
          return res.status(400).json({
            success: false,
            message: 'An account with this email address already exists.',
          });
        }
        return res.status(400).json({
          success: false,
          message: 'This username is already taken.',
        });
      }

      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUserId = new mongoose.Types.ObjectId();
      user = {
        _id: newUserId,
        id: newUserId.toString(),
        name: trimmedName,
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}&background=5846E0&color=ffffff&bold=true`,
        bio: '',
        followers: [],
        following: [],
        createdAt: new Date(),
        toObject() {
          const c = { ...this };
          delete c.password;
          return c;
        },
      };
      SEED_USERS.push(user);
    }

    // 9. Generate token
    const token = generateToken(user._id, user.username);

    // 10. Format safe response without password hash
    const safeUser = user.toObject ? user.toObject() : { ...user };
    delete safeUser.password;

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: safeUser,
    });
  } catch (error) {
    // Handle MongoDB unique constraint race condition
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({
        success: false,
        message: `An account with this ${duplicateField} already exists.`,
      });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    console.error(`[VYBE Auth Error] Registration failure: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred during registration.',
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user, verify password hash, return JWT & safe user
 * @access  Public
 */
exports.loginUser = async (req, res) => {
  try {
    const rawIdentifier = req.body.email || req.body.identifier || req.body.username;
    const { password } = req.body;

    // 1. Validate inputs
    if (!rawIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email or username and password.',
      });
    }

    const normalizedIdentifier =
      typeof rawIdentifier === 'string' ? rawIdentifier.trim().toLowerCase().replace(/^@/, '') : '';

    // 2. Look up user by email or username and explicitly select password hash
    let user = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findOne({
          $or: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }],
        }).select('+password');
      } catch (_) {}
    }

    if (!user) {
      const seedFound = SEED_USERS.find(
        (u) => u.email.toLowerCase() === normalizedIdentifier || u.username.toLowerCase() === normalizedIdentifier
      );
      if (seedFound) {
        user = seedFound;
      }
    }

    // 3. Generic error for nonexistent user
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password.',
      });
    }

    // 4. Compare passwords with bcryptjs or direct seed password
    let isMatch = false;
    if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password.',
      });
    }

    // 5. Generate token
    const token = generateToken(user._id || user.id, user.username);

    // 6. Return safe user information without password
    const safeUser = user.toObject ? user.toObject() : { ...user };
    delete safeUser.password;

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error(`[VYBE Auth Error] Login failure: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred during login.',
    });
  }
};

/**
 * @route   POST /api/auth/demo
 * @desc    Explicitly start a preview session using the community demo account
 * @access  Public
 */
exports.demoLogin = async (req, res) => {
  try {
    let demoUser = null;
    if (mongoose.connection.readyState === 1) {
      try {
        demoUser = await User.findOne({ username: 'meera.k' });
      } catch (_) {}
    }

    if (!demoUser) {
      demoUser = SEED_USERS.find((u) => u.username === 'meera.k') || SEED_USERS[0];
    }

    if (!demoUser) {
      return res.status(404).json({
        success: false,
        message: 'Demo account is not available.',
      });
    }

    const token = generateToken(demoUser._id || demoUser.id, demoUser.username);
    const safeUser = demoUser.toObject ? demoUser.toObject() : { ...demoUser };
    delete safeUser.password;

    return res.status(200).json({
      success: true,
      isDemo: true,
      message: 'Demo preview session started.',
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error(`[VYBE Auth Error] Demo login failure: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to start demo session.',
    });
  }
};

/**
 * @route   GET /api/auth/oauth-status
 * @desc    Report whether third-party OAuth providers are configured
 * @access  Public
 */
exports.getOAuthStatus = (req, res) => {
  return res.status(200).json({
    success: true,
    providers: {
      google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      facebook: Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
    },
  });
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user's profile
 * @access  Private (requires protect middleware)
 */
exports.getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized.',
      });
    }

    const safeUser = req.user.toObject ? req.user.toObject() : { ...req.user };
    delete safeUser.password;

    return res.status(200).json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.error(`[VYBE Auth Error] Get profile failure: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user profile.',
    });
  }
};
