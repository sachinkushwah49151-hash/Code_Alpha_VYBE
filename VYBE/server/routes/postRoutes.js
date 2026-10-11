/**
 * VYBE Post Routes
 * Phase 4: Real Post APIs, Likes, Comments
 */

const express = require('express');
const router = express.Router();
const {
  getPosts,
  getPostById,
  createPost,
  deletePost,
  toggleLike,
  getComments,
  addComment,
  deleteComment,
} = require('../controllers/postController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Post endpoints
router.get('/', optionalAuth, getPosts);
router.post('/', protect, createPost);
router.get('/:id', optionalAuth, getPostById);
router.delete('/:id', protect, deletePost);

// Like toggle endpoint
router.post('/:id/like', protect, toggleLike);

// Comment endpoints
router.get('/:id/comments', getComments);
router.post('/:id/comments', protect, addComment);
router.delete('/:postId/comments/:commentId', protect, deleteComment);
router.delete('/comments/:id', protect, deleteComment);

module.exports = router;
