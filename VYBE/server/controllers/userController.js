/**
 * VYBE User Controller
 * Phase 4: User Profiles, Follow/Unfollow Relationships, Suggestions
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const { SEED_USERS } = require('../data/seedData');

/**
 * Helper to find user by MongoDB ObjectId OR username
 * @param {string} identifier - ObjectId or username
 * @returns {Promise<User|null>}
 */
const findUserByIdentifier = async (identifier) => {
  if (!identifier) return null;
  if (mongoose.connection.readyState === 1) {
    try {
      if (mongoose.Types.ObjectId.isValid(identifier)) {
        const user = await User.findById(identifier);
        if (user) return user;
      }
      const cleanUsername = identifier.toLowerCase().replace(/^@/, '');
      const userByUsername = await User.findOne({ username: cleanUsername });
      if (userByUsername) return userByUsername;
    } catch (e) {
      // Fall through to seed user lookup
    }
  }

  // Fallback to seed creators
  const clean = identifier.toString().toLowerCase().replace(/^@/, '');
  const seedFound = SEED_USERS.find(
    (u) => u._id.toString() === clean || u.username.toLowerCase() === clean
  );
  return seedFound || null;
};

/**
 * Format follower count metrics (e.g. 1.2k)
 */
const formatMetric = (n) => {
  if (typeof n !== 'number') return '0';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return n.toString();
};

/**
 * @route   GET /api/users/:id or GET /api/users/:username
 * @desc    Get user profile by ID or username
 * @access  Public / Optional Auth
 */
exports.getUserProfile = async (req, res) => {
  try {
    const identifier = req.params.id || req.params.username;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'User identifier is required.',
      });
    }

    const user = await findUserByIdentifier(identifier);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    let postsCount = 0;
    if (mongoose.connection.readyState === 1) {
      try {
        postsCount = await Post.countDocuments({ author: user._id });
      } catch (cntErr) {
        postsCount = 0;
      }
    } else {
      const { SEED_POSTS } = require('../data/seedData');
      postsCount = SEED_POSTS.filter((p) => p.author.toString() === user._id.toString()).length;
    }

    const followersCount = Array.isArray(user.followers) ? user.followers.length : 0;
    const followingCount = Array.isArray(user.following) ? user.following.length : 0;

    const isFollowing = req.user
      ? (user.followers || []).some((id) => id.toString() === (req.user._id || req.user.id).toString())
      : false;

    const isSelf = req.user
      ? user._id.toString() === (req.user._id || req.user.id).toString()
      : false;

    const safeProfile = {
      id: user._id.toString(),
      _id: user._id,
      name: user.name,
      username: user.username,
      bio: user.bio || '',
      avatar: user.avatar || '',
      website: user.website || '',
      interests: user.interests || [],
      createdAt: user.createdAt,
      joinedDate: new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      is_following: isFollowing,
      isFollowing,
      isSelf,
      stats: {
        posts: postsCount,
        followers: followersCount,
        following: followingCount,
      },
      postsCount,
      followersCount,
      followingCount,
    };

    return res.status(200).json({
      success: true,
      user: safeProfile,
    });
  } catch (error) {
    console.error(`[VYBE Error] getUserProfile: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user profile.',
    });
  }
};

/**
 * @route   PUT /api/users/profile
 * @desc    Update current authenticated user's profile
 * @access  Private
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, bio, avatar, website } = req.body;
    const updates = {};

    if (name !== undefined) {
      const trimmedName = typeof name === 'string' ? name.trim() : '';
      if (trimmedName.length === 0 || trimmedName.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Name must be between 1 and 50 characters.',
        });
      }
      updates.name = trimmedName;
    }

    if (bio !== undefined) {
      const trimmedBio = typeof bio === 'string' ? bio.trim() : '';
      if (trimmedBio.length > 160) {
        return res.status(400).json({
          success: false,
          message: 'Bio cannot exceed 160 characters.',
        });
      }
      updates.bio = trimmedBio;
    }

    if (website !== undefined) {
      updates.website = typeof website === 'string' ? website.trim() : '';
    }

    if (avatar !== undefined) {
      updates.avatar = typeof avatar === 'string' ? avatar.trim() : '';
    }

    let safeUser;
    if (mongoose.connection.readyState === 1) {
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');

      let postsCount = 0;
      try {
        postsCount = await Post.countDocuments({ author: updatedUser._id });
      } catch (_) {}

      safeUser = {
        id: updatedUser._id.toString(),
        _id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        bio: updatedUser.bio || '',
        avatar: updatedUser.avatar || '',
        website: updatedUser.website || '',
        createdAt: updatedUser.createdAt,
        stats: {
          posts: postsCount,
          followers: updatedUser.followers ? updatedUser.followers.length : 0,
          following: updatedUser.following ? updatedUser.following.length : 0,
        },
        followersCount: updatedUser.followers ? updatedUser.followers.length : 0,
        followingCount: updatedUser.following ? updatedUser.following.length : 0,
      };
    } else {
      const { SEED_POSTS, SEED_USERS } = require('../data/seedData');
      const currentId = (req.user._id || req.user.id).toString();
      const currentUsername = (req.user.username || '').toLowerCase();
      const realPostsCount = SEED_POSTS.filter((p) => {
        const matchesAuthorId = (p.authorId && p.authorId.toString() === currentId) || (p.author && p.author.toString() === currentId);
        const matchesUsername = p.author && p.author.username && p.author.username.toLowerCase() === currentUsername;
        return matchesAuthorId || matchesUsername;
      }).length;
      const realFollowersCount = Array.isArray(req.user.followers) ? req.user.followers.length : 0;
      const realFollowingCount = Array.isArray(req.user.following) ? req.user.following.length : 0;

      const seedUser = SEED_USERS.find((u) => u._id.toString() === currentId || u.username === req.user.username);
      if (seedUser) {
        if (updates.name) seedUser.name = updates.name;
        if (updates.bio !== undefined) seedUser.bio = updates.bio;
        if (updates.website !== undefined) seedUser.website = updates.website;
        if (updates.avatar !== undefined) seedUser.avatar = updates.avatar;
      }

      safeUser = {
        id: currentId,
        _id: req.user._id || req.user.id,
        name: updates.name !== undefined ? updates.name : req.user.name,
        username: req.user.username,
        bio: updates.bio !== undefined ? updates.bio : (req.user.bio || ''),
        avatar: updates.avatar !== undefined ? updates.avatar : (req.user.avatar || ''),
        website: updates.website !== undefined ? updates.website : (req.user.website || ''),
        createdAt: req.user.createdAt || new Date().toISOString(),
        stats: { posts: realPostsCount, followers: realFollowersCount, following: realFollowingCount },
        followersCount: realFollowersCount,
        followingCount: realFollowingCount,
      };
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: safeUser,
    });
  } catch (error) {
    console.error(`[VYBE Error] updateUserProfile: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error updating profile.',
    });
  }
};

/**
 * @route   POST /api/users/:id/follow
 * @desc    Follow target user
 * @access  Private
 */
exports.followUser = async (req, res) => {
  try {
    const identifier = req.params.id || req.params.username;
    const targetUser = await findUserByIdentifier(identifier);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Prevent following oneself
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself.',
      });
    }

    const isAlreadyFollowing = (targetUser.followers || []).some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (isAlreadyFollowing) {
      return res.status(400).json({
        success: false,
        message: 'You are already following this user.',
      });
    }

    if (mongoose.connection.readyState === 1) {
      // Atomically update both sides
      await Promise.all([
        User.findByIdAndUpdate(targetUser._id, { $addToSet: { followers: req.user._id } }),
        User.findByIdAndUpdate(req.user._id, { $addToSet: { following: targetUser._id } }),
      ]);
    } else {
      const currentUserId = req.user._id || req.user.id;
      if (!Array.isArray(targetUser.followers)) targetUser.followers = [];
      if (!targetUser.followers.some((f) => f.toString() === currentUserId.toString())) {
        targetUser.followers.push(currentUserId);
      }
      const actorSeed = SEED_USERS.find((u) => u._id.toString() === currentUserId.toString());
      if (actorSeed) {
        if (!Array.isArray(actorSeed.following)) actorSeed.following = [];
        if (!actorSeed.following.some((f) => f.toString() === targetUser._id.toString())) {
          actorSeed.following.push(targetUser._id);
        }
      }
    }

    const updatedFollowers = Array.isArray(targetUser.followers) ? targetUser.followers.length : 1;
    const updatedFollowing = (req.user.following ? req.user.following.length : 0) + 1;

    return res.status(200).json({
      success: true,
      following: true,
      is_following: true,
      message: `Now following @${targetUser.username}.`,
      followersCount: updatedFollowers,
      followingCount: updatedFollowing,
    });
  } catch (error) {
    console.error(`[VYBE Error] followUser: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error creating follow relationship.',
    });
  }
};

/**
 * @route   DELETE /api/users/:id/follow
 * @desc    Unfollow target user
 * @access  Private
 */
exports.unfollowUser = async (req, res) => {
  try {
    const identifier = req.params.id || req.params.username;
    const targetUser = await findUserByIdentifier(identifier);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Prevent unfollowing oneself
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot unfollow yourself.',
      });
    }

    if (mongoose.connection.readyState === 1) {
      // Atomically remove from both sides
      await Promise.all([
        User.findByIdAndUpdate(targetUser._id, { $pull: { followers: req.user._id } }),
        User.findByIdAndUpdate(req.user._id, { $pull: { following: targetUser._id } }),
      ]);
    } else {
      const currentUserId = req.user._id || req.user.id;
      if (Array.isArray(targetUser.followers)) {
        targetUser.followers = targetUser.followers.filter((f) => f.toString() !== currentUserId.toString());
      }
      const actorSeed = SEED_USERS.find((u) => u._id.toString() === currentUserId.toString());
      if (actorSeed && Array.isArray(actorSeed.following)) {
        actorSeed.following = actorSeed.following.filter((f) => f.toString() !== targetUser._id.toString());
      }
    }

    const updatedFollowers = Array.isArray(targetUser.followers) ? targetUser.followers.length : 0;

    return res.status(200).json({
      success: true,
      following: false,
      is_following: false,
      message: `Unfollowed @${targetUser.username}.`,
      followersCount: updatedFollowers,
    });
  } catch (error) {
    console.error(`[VYBE Error] unfollowUser: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error removing follow relationship.',
    });
  }
};

/**
 * @route   POST /api/users/:id/toggle-follow (or POST /api/users/:username/follow)
 * @desc    Toggle follow / unfollow for convenience
 * @access  Private
 */
exports.toggleFollow = async (req, res) => {
  try {
    const identifier = req.params.id || req.params.username;
    const targetUser = await findUserByIdentifier(identifier);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself.',
      });
    }

    const isFollowing = (targetUser.followers || []).some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (mongoose.connection.readyState === 1) {
      if (isFollowing) {
        await Promise.all([
          User.findByIdAndUpdate(targetUser._id, { $pull: { followers: req.user._id } }),
          User.findByIdAndUpdate(req.user._id, { $pull: { following: targetUser._id } }),
        ]);
      } else {
        await Promise.all([
          User.findByIdAndUpdate(targetUser._id, { $addToSet: { followers: req.user._id } }),
          User.findByIdAndUpdate(req.user._id, { $addToSet: { following: targetUser._id } }),
        ]);
      }
    } else {
      if (!Array.isArray(targetUser.followers)) targetUser.followers = [];
      const currentUserId = req.user._id || req.user.id;
      const actorSeed = SEED_USERS.find((u) => u._id.toString() === currentUserId.toString());
      if (isFollowing) {
        targetUser.followers = targetUser.followers.filter((f) => f.toString() !== currentUserId.toString());
        if (actorSeed && Array.isArray(actorSeed.following)) {
          actorSeed.following = actorSeed.following.filter((f) => f.toString() !== targetUser._id.toString());
        }
      } else {
        if (!targetUser.followers.some((f) => f.toString() === currentUserId.toString())) {
          targetUser.followers.push(currentUserId);
        }
        if (actorSeed) {
          if (!Array.isArray(actorSeed.following)) actorSeed.following = [];
          if (!actorSeed.following.some((f) => f.toString() === targetUser._id.toString())) {
            actorSeed.following.push(targetUser._id);
          }
        }
      }
    }

    const newFollowState = !isFollowing;
    const updatedCount = Array.isArray(targetUser.followers) ? targetUser.followers.length : (newFollowState ? 1 : 0);

    return res.status(200).json({
      success: true,
      following: newFollowState,
      is_following: newFollowState,
      message: newFollowState ? `Now following @${targetUser.username}.` : `Unfollowed @${targetUser.username}.`,
      followersCount: updatedCount,
    });
  } catch (error) {
    console.error(`[VYBE Error] toggleFollow: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error updating follow state.',
    });
  }
};

/**
 * @route   GET /api/users/suggested
 * @desc    Get suggested users to follow (supports ?limit= & ?q=)
 * @access  Public / Optional Auth
 */
exports.getSuggestedUsers = async (req, res) => {
  const formatUserItem = (u, excludeId) => {
    const isFollowing = excludeId
      ? (u.followers || []).some((id) => id.toString() === excludeId.toString())
      : false;
    const fCount = Array.isArray(u.followers) ? u.followers.length : 0;
    const flwingCount = Array.isArray(u.following) ? u.following.length : 0;
    return {
      id: u._id.toString(),
      _id: u._id,
      name: u.name,
      username: u.username,
      avatar: u.avatar || '',
      bio: u.bio || '',
      website: u.website || '',
      interests: Array.isArray(u.interests) ? u.interests : [],
      is_following: isFollowing,
      followersCount: fCount,
      followingCount: flwingCount,
      followers: formatMetric(fCount),
    };
  };

  try {
    const excludeId = req.user ? (req.user._id || req.user.id) : null;
    const limitNum = Math.max(1, parseInt(req.query.limit, 10) || 65);
    const searchTerm = (req.query.q || req.query.search || '').trim().toLowerCase();

    if (mongoose.connection.readyState === 1) {
      const query = excludeId ? { _id: { $ne: excludeId } } : {};
      if (searchTerm) {
        query.$or = [
          { name: { $regex: searchTerm, $options: 'i' } },
          { username: { $regex: searchTerm, $options: 'i' } },
          { bio: { $regex: searchTerm, $options: 'i' } },
        ];
      }
      const users = await User.find(query)
        .limit(limitNum)
        .select('name username avatar bio website interests followers following');

      if (users.length > 0) {
        const formatted = users.map((u) => formatUserItem(u, excludeId));
        return res.status(200).json({
          success: true,
          count: formatted.length,
          users: formatted,
          data: formatted,
        });
      }
    }

    // Fallback to seed creators
    let seedList = SEED_USERS.filter((u) => !excludeId || u._id.toString() !== excludeId.toString());
    if (searchTerm) {
      seedList = seedList.filter(
        (u) =>
          u.name.toLowerCase().includes(searchTerm) ||
          u.username.toLowerCase().includes(searchTerm) ||
          (u.bio && u.bio.toLowerCase().includes(searchTerm)) ||
          (Array.isArray(u.interests) && u.interests.some((i) => i.toLowerCase().includes(searchTerm)))
      );
    }
    const seedFormatted = seedList.slice(0, limitNum).map((u) => formatUserItem(u, excludeId));

    return res.status(200).json({
      success: true,
      count: seedFormatted.length,
      users: seedFormatted,
      data: seedFormatted,
    });
  } catch (error) {
    console.warn(`[VYBE Fallback] getSuggestedUsers using seed users: ${error.message}`);
    const excludeId = req.user ? (req.user._id || req.user.id) : null;
    const limitNum = Math.max(1, parseInt(req.query.limit, 10) || 65);
    const seedFormatted = SEED_USERS.filter((u) => !excludeId || u._id.toString() !== excludeId.toString())
      .slice(0, limitNum)
      .map((u) => formatUserItem(u, excludeId));

    return res.status(200).json({
      success: true,
      count: seedFormatted.length,
      users: seedFormatted,
      data: seedFormatted,
    });
  }
};
