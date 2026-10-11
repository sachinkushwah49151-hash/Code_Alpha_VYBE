/**
 * VYBE Seed Data & Resilient In-Memory Fallback Store
 * Powered by communityDataset.js (65 distinct fictional users & 200 realistic community posts)
 */

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Post = require('../models/Post');
const { buildUsers, buildPosts } = require('./communityDataset');

// Pre-computed bcrypt hash for 'password123'
const DEMO_PASSWORD_HASH = bcrypt.hashSync('password123', 10);

const SEED_USERS = buildUsers(DEMO_PASSWORD_HASH);
const SEED_POSTS = buildPosts(SEED_USERS);

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
 * Helper to look up a seed user by _id or username
 */
const findSeedUser = (identifier) => {
  if (!identifier) return null;
  const str = identifier.toString().toLowerCase();
  return (
    SEED_USERS.find(
      (u) =>
        u._id.toString().toLowerCase() === str ||
        u.username.toLowerCase() === str ||
        u.email.toLowerCase() === str
    ) || null
  );
};

/**
 * Helper to look up a seed post by _id or seedKey
 */
const findSeedPost = (id) => {
  if (!id) return null;
  const str = id.toString();
  return (
    SEED_POSTS.find(
      (p) => p._id.toString() === str || p.seedKey === str
    ) || null
  );
};

/**
 * Format SEED_POSTS with populated author and comment authors for API responses
 */
const getFormattedSeedPosts = (currentUserId = null) => {
  const userMap = new Map(SEED_USERS.map((u) => [u._id.toString(), u]));

  return SEED_POSTS.map((p) => {
    const authorIdStr = p.author ? p.author.toString() : '';
    const authorUser = userMap.get(authorIdStr) || SEED_USERS[0];
    const isLiked =
      currentUserId && Array.isArray(p.likes)
        ? p.likes.some((id) => id.toString() === currentUserId.toString())
        : false;

    const replies = (p.comments || []).map((c) => {
      const cAuthorId = c.author ? c.author.toString() : '';
      const cUser = userMap.get(cAuthorId) || SEED_USERS[1];
      return {
        id: c._id ? c._id.toString() : '',
        _id: c._id,
        authorId: cUser._id.toString(),
        author: {
          id: cUser._id.toString(),
          _id: cUser._id,
          name: cUser.name,
          username: cUser.username,
          avatar: cUser.avatar || '',
        },
        text: c.text || c.content || '',
        content: c.text || c.content || '',
        createdAt: c.createdAt,
        timestamp: formatTimestamp(c.createdAt),
      };
    });

    return {
      id: p._id.toString(),
      _id: p._id,
      seedKey: p.seedKey || '',
      isDemo: true,
      authorId: authorUser._id.toString(),
      author: {
        id: authorUser._id.toString(),
        _id: authorUser._id,
        name: authorUser.name,
        username: authorUser.username,
        avatar: authorUser.avatar || '',
        bio: authorUser.bio || '',
      },
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
      replies,
      reposts: 0,
      reposted: false,
      createdAt: p.createdAt,
      timestamp: formatTimestamp(p.createdAt),
    };
  });
};

/**
 * Idempotently seed MongoDB if empty or missing demo records
 */
let isSeeding = false;
const seedMongoDBIfEmpty = async () => {
  if (isSeeding) return;
  isSeeding = true;
  try {
    for (const u of SEED_USERS) {
      await User.updateOne(
        { $or: [{ _id: u._id }, { username: u.username }, { email: u.email }] },
        {
          $setOnInsert: u,
          $set: { avatar: u.avatar }
        },
        { upsert: true }
      );
    }
    for (const p of SEED_POSTS) {
      await Post.updateOne(
        { $or: [{ _id: p._id }, { seedKey: p.seedKey }] },
        { $setOnInsert: p },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn('[VYBE Seed] Auto-seed skipped:', err.message);
  } finally {
    isSeeding = false;
  }
};

module.exports = {
  SEED_USERS,
  SEED_POSTS,
  findSeedUser,
  findSeedPost,
  getFormattedSeedPosts,
  seedMongoDBIfEmpty,
  DEMO_PASSWORD_HASH,
};
