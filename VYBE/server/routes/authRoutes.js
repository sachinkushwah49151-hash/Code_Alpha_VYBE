/**
 * VYBE Authentication Routes
 * Phase 3: Registration, Login & Protected Profile
 */

const express = require('express');
const router = express.Router();
const { registerUser, loginUser, demoLogin, getOAuthStatus, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/demo', demoLogin);
router.get('/oauth-status', getOAuthStatus);
router.get('/me', protect, getMe);

module.exports = router;
