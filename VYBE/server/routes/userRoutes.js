/**
 * VYBE User Routes
 * Phase 4: User Profiles, Follow/Unfollow, Suggested Users
 */

const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  followUser,
  unfollowUser,
  toggleFollow,
  getSuggestedUsers,
} = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Suggested users (must be declared before :id / :username param route)
router.get('/suggested', optionalAuth, getSuggestedUsers);

// Profile editing
router.put('/profile', protect, updateUserProfile);

// Follow / Unfollow relationships (REST standard POST / DELETE)
router.post('/:id/follow', protect, followUser);
router.delete('/:id/follow', protect, unfollowUser);
router.post('/:id/toggle-follow', protect, toggleFollow);

// Profile retrieval by ID or Username
router.get('/:id', optionalAuth, getUserProfile);

module.exports = router;
