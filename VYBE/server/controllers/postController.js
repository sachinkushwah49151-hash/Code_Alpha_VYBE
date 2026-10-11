/**
 * VYBE Post Controller
 * Phase 4: Real Social Post APIs, Likes, Comments, Moderation
 */

const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');

/**
 * Format relative timestamps (e.g. 'Just now', '15m ago', '2h ago')
 */
const formatTimestamp = (date) => {
  if (!date) return 'Recently';
  const now = new Date();
  const diffSec = Math.floor((now - new Date(date)) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
};

/**
 * Transform post document into consistent client-friendly shape
 */
const formatPost = (post, currentUserId) => {
  const p = post.toObject ? post.toObject({ virtuals: true }) : post;
  const isLiked = currentUserId && Array.isArray(p.likes)
    ? p.likes.some((id) => (id._id || id).toString() === currentUserId.toString())
    : false;

  const replies = (p.comments || []).map((c) => ({
    id: c._id ? c._id.toString() : '',
    _id: c._id,
    authorId: c.author ? (c.author._id || c.author).toString() : '',
    author: c.author && typeof c.author === 'object' ? {
      id: c.author._id,
      _id: c.author._id,
      name: c.author.name,
      username: c.author.username,
      avatar: c.author.avatar,
    } : null,
    text: c.text || c.content || '',
    content: c.text || c.content || '',
    createdAt: c.createdAt,
    timestamp: formatTimestamp(c.createdAt),
  }));

  const authorObj = p.author && typeof p.author === 'object' ? {
    id: p.author._id,
    _id: p.author._id,
    name: p.author.name,
    username: p.author.username,
    avatar: p.author.avatar || '',
  } : null;

  return {
    id: p._id.toString(),
    _id: p._id,
    authorId: p.author ? (p.author._id || p.author).toString() : '',
    author: authorObj,
    content: p.content,
    mediaUrl: p.mediaUrl || '',
    imageUrl: p.mediaUrl || '',
    mediaGrid: Array.isArray(p.mediaGrid) ? p.mediaGrid : [],
    postType: p.postType || 'text',
    type: p.postType || 'text',
    tags: Array.isArray(p.tags) ? p.tags : [],
    likes: Array.isArray(p.likes) ? p.likes.length : 0,
    liked: isLiked,
    comments: replies.length,
    replies: replies,
    reposts: 0,
    reposted: false,
    createdAt: p.createdAt,
    timestamp: formatTimestamp(p.createdAt),
  };
};

const { getFormattedSeedPosts, seedMongoDBIfEmpty, SEED_USERS } = require('../data/seedData');

/**
 * Helper to filter formatted seed posts by query parameters
 */
const filterAndPaginateSeedPosts = (seedPosts, req) => {
  const { filter, author, tag, q, search, page = 1, limit = 250 } = req.query;
  let filtered = seedPosts;

  if (tag) {
    const cleanTag = tag.replace(/^#/, '').trim().toLowerCase();
    filtered = filtered.filter((p) => p.tags.some((t) => t.toLowerCase() === cleanTag));
  }

  if (author) {
    const cleanAuthor = author.toLowerCase().replace(/^@/, '');
    filtered = filtered.filter((p) => {
      const matchUsername = p.author && p.author.username && p.author.username.toLowerCase() === cleanAuthor;
      const matchAuthorId =
        (p.authorId && p.authorId.toString() === author) ||
        (p.author &&
          ((p.author.id && p.author.id.toString() === author) ||
            (p.author._id && p.author._id.toString() === author)));
      return matchUsername || matchAuthorId;
    });
  }

  if (filter === 'following') {
    const currentUserId = req.user ? (req.user._id || req.user.id || '').toString() : '';
    const seedCurrentUser =
      SEED_USERS.find((u) => u._id.toString() === currentUserId) ||
      (req.user && req.user.username
        ? SEED_USERS.find((u) => u.username.toLowerCase() === req.user.username.toLowerCase())
        : null) ||
      SEED_USERS[0];

    const allowedAuthorIds = new Set(
      (seedCurrentUser.following || []).map((id) => id.toString())
    );
    if (currentUserId) allowedAuthorIds.add(currentUserId);
    allowedAuthorIds.add(seedCurrentUser._id.toString());

    filtered = filtered.filter((p) => allowedAuthorIds.has(String(p.authorId)));
  }

  const searchTerm = (q || search || '').trim().toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter((p) => {
      const textMatch = (p.content || '').toLowerCase().includes(searchTerm);
      const nameMatch = (p.author?.name || '').toLowerCase().includes(searchTerm);
      const handleMatch = (p.author?.username || '').toLowerCase().includes(searchTerm);
      const tagMatch = (p.tags || []).some((t) => t.toLowerCase().includes(searchTerm.replace(/^#/, '')));
      return textMatch || nameMatch || handleMatch || tagMatch;
    });
  }

  const totalCount = filtered.length;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 250);
  const start = (pageNum - 1) * limitNum;
  const paged = filtered.slice(start, start + limitNum);

  return {
    totalCount,
    count: paged.length,
    page: pageNum,
    hasMore: start + paged.length < totalCount,
    posts: paged,
  };
};

/**
 * @route   GET /api/posts
 * @desc    Get all feed posts with author population and optional filters
 * @access  Public / Optional Auth
 */
exports.getPosts = async (req, res) => {
  try {
    const { filter, author, tag, q, search, page = 1, limit = 250 } = req.query;

    if (mongoose.connection.readyState === 1) {
      // Ensure demo community is seeded in MongoDB if fewer than 50 posts exist
      const count = await Post.countDocuments();
      if (count < 50 && !filter && !author && !tag) {
        await seedMongoDBIfEmpty();
      }

      const query = {};

      if (author) {
        if (mongoose.Types.ObjectId.isValid(author)) {
          query.author = author;
        } else {
          const foundUser = await User.findOne({ username: author.toLowerCase().replace(/^@/, '') });
          if (foundUser) {
            query.author = foundUser._id;
          } else {
            return res.status(200).json({ success: true, totalCount: 0, count: 0, posts: [] });
          }
        }
      }

      if (tag) {
        const cleanTag = tag.replace(/^#/, '').trim();
        query.tags = cleanTag;
      }

      // Filter by following if requested and user is authenticated
      if (filter === 'following' && req.user) {
        const user = await User.findById(req.user._id);
        const followingList = user && user.following && user.following.length > 0
          ? [...user.following, req.user._id]
          : [...(SEED_USERS[0]?.following || []), req.user._id];
        query.author = { $in: followingList };
      }

      const searchTerm = (q || search || '').trim();
      if (searchTerm) {
        query.content = { $regex: searchTerm, $options: 'i' };
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 250);
      const totalCount = await Post.countDocuments(query);

      const posts = await Post.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('author', 'name username avatar bio')
        .populate('comments.author', 'name username avatar');

      const formattedPosts = posts.map((p) => formatPost(p, req.user ? req.user._id : null));
      return res.status(200).json({
        success: true,
        totalCount,
        count: formattedPosts.length,
        page: pageNum,
        hasMore: (pageNum - 1) * limitNum + formattedPosts.length < totalCount,
        posts: formattedPosts,
      });
    }

    // Graceful fallback to rich realistic community posts (Feed is never blank!)
    const seedPosts = getFormattedSeedPosts(req.user ? req.user._id : null);
    const result = filterAndPaginateSeedPosts(seedPosts, req);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.warn(`[VYBE Fallback] getPosts serving seed data: ${error.message}`);
    const seedPosts = getFormattedSeedPosts(req.user ? req.user._id : null);
    const result = filterAndPaginateSeedPosts(seedPosts, req);
    return res.status(200).json({
      success: true,
      ...result,
    });
  }
};

/**
 * @route   GET /api/posts/:id
 * @desc    Get single post by ID
 * @access  Public / Optional Auth
 */
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format.',
      });
    }

    if (mongoose.connection.readyState === 1) {
      const post = await Post.findById(id)
        .populate('author', 'name username avatar bio')
        .populate('comments.author', 'name username avatar');

      if (post) {
        const formatted = formatPost(post, req.user ? req.user._id : null);
        return res.status(200).json({
          success: true,
          post: formatted,
        });
      }
    }

    const seedPosts = getFormattedSeedPosts(req.user ? req.user._id : null);
    const found = seedPosts.find((p) => p.id === id || p._id.toString() === id);
    if (!found) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    return res.status(200).json({
      success: true,
      post: found,
    });
  } catch (error) {
    console.error(`[VYBE Error] getPostById: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving post.',
    });
  }
};

/**
 * @route   POST /api/posts
 * @desc    Create a new post for the authenticated user
 * @access  Private
 */
exports.createPost = async (req, res) => {
  try {
    const { content, mediaUrl, imageUrl, mediaGrid, postType, tags } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Post content cannot be empty.',
      });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Post content cannot exceed 1000 characters.',
      });
    }

    const finalMediaUrl = (mediaUrl || imageUrl || '').trim();
    const finalMediaGrid = Array.isArray(mediaGrid) ? mediaGrid.filter((u) => typeof u === 'string' && u.trim()) : [];

    // Extract hashtags if not provided explicitly
    let finalTags = Array.isArray(tags) ? tags.map((t) => t.replace(/^#/, '').trim()) : [];
    if (finalTags.length === 0) {
      const extracted = trimmedContent.match(/#([a-zA-Z0-9_]+)/g);
      if (extracted) {
        finalTags = extracted.map((t) => t.replace(/^#/, ''));
      }
    }

    // Determine type
    let finalType = postType || 'text';
    if (!postType) {
      if (finalMediaGrid.length >= 2) finalType = 'image_grid_2';
      else if (finalMediaUrl) finalType = 'image_single';
    }

    let formatted;
    if (mongoose.connection.readyState === 1) {
      const newPost = await Post.create({
        author: req.user._id,
        content: trimmedContent,
        mediaUrl: finalMediaUrl,
        mediaGrid: finalMediaGrid,
        postType: finalType,
        tags: finalTags,
        likes: [],
        comments: [],
      });

      const populatedPost = await Post.findById(newPost._id)
        .populate('author', 'name username avatar');

      formatted = formatPost(populatedPost, req.user._id);
    } else {
      const newId = new mongoose.Types.ObjectId();
      const currentUserId = req.user._id || req.user.id;
      formatted = {
        id: newId.toString(),
        _id: newId,
        authorId: currentUserId.toString(),
        author: {
          id: currentUserId,
          _id: currentUserId,
          name: req.user.name,
          username: req.user.username,
          avatar: req.user.avatar || '',
        },
        content: trimmedContent,
        mediaUrl: finalMediaUrl,
        imageUrl: finalMediaUrl,
        mediaGrid: finalMediaGrid,
        postType: finalType,
        type: finalType,
        tags: finalTags,
        likes: 0,
        liked: false,
        comments: 0,
        replies: [],
        reposts: 0,
        reposted: false,
        createdAt: new Date().toISOString(),
        timestamp: 'Just now',
      };

      const { SEED_POSTS } = require('../data/seedData');
      SEED_POSTS.unshift({
        _id: newId,
        author: currentUserId,
        content: trimmedContent,
        mediaUrl: finalMediaUrl,
        mediaGrid: finalMediaGrid,
        postType: finalType,
        tags: finalTags,
        likes: [],
        comments: [],
        createdAt: new Date(),
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Post created successfully.',
      post: formatted,
    });
  } catch (error) {
    console.error(`[VYBE Error] createPost: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error creating post.',
    });
  }
};

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete post by ID (Author only)
 * @access  Private
 */
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format.',
      });
    }

    if (mongoose.connection.readyState === 1) {
      const post = await Post.findById(id);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found.',
        });
      }

      // Verify ownership
      if (post.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this post. Only the post author can delete it.',
        });
      }

      await Post.findByIdAndDelete(id);
    } else {
      const { SEED_POSTS } = require('../data/seedData');
      const pIdx = SEED_POSTS.findIndex((p) => p._id.toString() === id);
      if (pIdx !== -1) {
        const p = SEED_POSTS[pIdx];
        const currentId = (req.user._id || req.user.id).toString();
        if (p.author && p.author.toString() !== currentId && p.authorId !== currentId) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to delete this post. Only the post author can delete it.',
          });
        }
        SEED_POSTS.splice(pIdx, 1);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Post deleted successfully.',
    });
  } catch (error) {
    console.error(`[VYBE Error] deletePost: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting post.',
    });
  }
};

/**
 * @route   POST /api/posts/:id/like
 * @desc    Toggle like/unlike for authenticated user
 * @access  Private
 */
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format.',
      });
    }

    if (mongoose.connection.readyState === 1) {
      const post = await Post.findById(id);

      if (post) {
        const userIdStr = req.user._id.toString();
        const alreadyLiked = post.likes.some((likeId) => likeId.toString() === userIdStr);

        if (alreadyLiked) {
          post.likes = post.likes.filter((likeId) => likeId.toString() !== userIdStr);
        } else {
          post.likes.push(req.user._id);
        }

        await post.save();

        return res.status(200).json({
          success: true,
          liked: !alreadyLiked,
          likesCount: post.likes.length,
          likes: post.likes.length,
          message: !alreadyLiked ? 'Post liked.' : 'Post unliked.',
        });
      }
    }

    // Fallback like response
    const { SEED_POSTS } = require('../data/seedData');
    const seedPost = SEED_POSTS.find((p) => p._id.toString() === id);
    let newLiked = true;
    let likesCount = 1;
    if (seedPost) {
      if (!Array.isArray(seedPost.likes)) seedPost.likes = [];
      const currentId = (req.user._id || req.user.id).toString();
      const existingIdx = seedPost.likes.findIndex((l) => l.toString() === currentId);
      if (existingIdx !== -1) {
        seedPost.likes.splice(existingIdx, 1);
        newLiked = false;
      } else {
        seedPost.likes.push(req.user._id || req.user.id);
        newLiked = true;
      }
      likesCount = seedPost.likes.length;
    }

    return res.status(200).json({
      success: true,
      liked: newLiked,
      likesCount: likesCount,
      likes: likesCount,
      message: newLiked ? 'Post liked.' : 'Post unliked.',
    });
  } catch (error) {
    console.error(`[VYBE Error] toggleLike: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error updating like state.',
    });
  }
};

/**
 * @route   GET /api/posts/:id/comments
 * @desc    Get all comments for a post
 * @access  Public
 */
exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format.',
      });
    }

    if (mongoose.connection.readyState === 1) {
      const post = await Post.findById(id).populate('comments.author', 'name username avatar');

      if (post) {
        const comments = post.comments.map((c) => ({
          id: c._id.toString(),
          _id: c._id,
          authorId: c.author ? c.author._id.toString() : '',
          author: c.author,
          text: c.text,
          content: c.text,
          createdAt: c.createdAt,
          timestamp: formatTimestamp(c.createdAt),
        }));

        return res.status(200).json({
          success: true,
          count: comments.length,
          comments,
        });
      }
    }

    return res.status(200).json({
      success: true,
      count: 0,
      comments: [],
    });
  } catch (error) {
    console.error(`[VYBE Error] getComments: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving comments.',
    });
  }
};

/**
 * @route   POST /api/posts/:id/comments
 * @desc    Add comment to a post
 * @access  Private
 */
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format.',
      });
    }

    const commentText = (text || content || '').trim();
    if (!commentText) {
      return res.status(400).json({
        success: false,
        message: 'Comment text cannot be empty.',
      });
    }

    if (commentText.length > 280) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 280 characters.',
      });
    }

    if (mongoose.connection.readyState === 1) {
      const post = await Post.findById(id);

      if (post) {
        const newComment = {
          author: req.user._id,
          text: commentText,
          createdAt: new Date(),
        };

        post.comments.push(newComment);
        await post.save();

        const updatedPost = await Post.findById(id).populate('comments.author', 'name username avatar');
        const addedComment = updatedPost.comments[updatedPost.comments.length - 1];

        const formattedComment = {
          id: addedComment._id.toString(),
          _id: addedComment._id,
          authorId: req.user._id.toString(),
          author: addedComment.author,
          text: addedComment.text,
          content: addedComment.text,
          createdAt: addedComment.createdAt,
          timestamp: 'Just now',
        };

        return res.status(201).json({
          success: true,
          message: 'Comment added successfully.',
          comment: formattedComment,
          commentsCount: updatedPost.comments.length,
        });
      }
    }

    // Fallback comment response
    const commentId = new mongoose.Types.ObjectId();
    const currentUserId = req.user._id || req.user.id;
    const fallbackComment = {
      id: commentId.toString(),
      _id: commentId,
      authorId: currentUserId.toString(),
      author: {
        id: currentUserId,
        _id: currentUserId,
        name: req.user.name,
        username: req.user.username,
        avatar: req.user.avatar || '',
      },
      text: commentText,
      content: commentText,
      createdAt: new Date().toISOString(),
      timestamp: 'Just now',
    };

    const { SEED_POSTS } = require('../data/seedData');
    const seedPost = SEED_POSTS.find((p) => p._id.toString() === id);
    let totalComments = 1;
    if (seedPost) {
      if (!Array.isArray(seedPost.comments)) seedPost.comments = [];
      seedPost.comments.push({
        _id: commentId,
        author: currentUserId,
        text: commentText,
        createdAt: new Date(),
      });
      totalComments = seedPost.comments.length;
    }

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      comment: fallbackComment,
      commentsCount: totalComments,
    });
  } catch (error) {
    console.error(`[VYBE Error] addComment: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error adding comment.',
    });
  }
};

/**
 * @route   DELETE /api/posts/:postId/comments/:commentId
 * @desc    Delete comment (Comment author OR Post author moderation)
 * @access  Private
 */
exports.deleteComment = async (req, res) => {
  try {
    const postId = req.params.postId || req.params.id;
    const commentId = req.params.commentId || req.params.id;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID format.',
      });
    }

    // Find post containing this comment
    let post;
    if (postId && mongoose.Types.ObjectId.isValid(postId)) {
      post = await Post.findById(postId);
    } else {
      post = await Post.findOne({ 'comments._id': commentId });
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post or comment not found.',
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
      });
    }

    // Moderation Policy: Comment author OR Post owner can delete
    const isCommentAuthor = comment.author.toString() === req.user._id.toString();
    const isPostOwner = post.author.toString() === req.user._id.toString();

    if (!isCommentAuthor && !isPostOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment. Only the comment author or post owner may delete it.',
      });
    }

    post.comments.pull(commentId);
    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully.',
      commentsCount: post.comments.length,
    });
  } catch (error) {
    console.error(`[VYBE Error] deleteComment: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting comment.',
    });
  }
};
