/**
 * VYBE Phase 4: Social APIs Integration Test Suite
 * Tests Posts, Comments, Likes, Follows, Profiles, and Security Guards against live DB
 */

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
}

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const User = require('./models/User');
const Post = require('./models/Post');
const postController = require('./controllers/postController');
const userController = require('./controllers/userController');

const results = [];

function recordResult(testName, passed, details) {
  results.push({ testName, passed, details });
  const symbol = passed === true ? '✅ PASS' : (passed === null ? 'ℹ️ SKIP' : '❌ FAIL');
  console.log(`${symbol} - ${testName}: ${details}`);
}

// Mock Response helper
const mockResponse = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
};

async function runSocialSuite() {
  console.log('====================================================');
  console.log('🧪 Running VYBE Phase 4 Social APIs Test Suite');
  console.log('====================================================\n');

  await connectDB();

  const timestamp = Date.now();
  let userA, userB;
  let postA, postB;
  let commentA;

  try {
    // ----------------------------------------------------------------
    // Setup: Create 2 Test Users (Cleaned up at end)
    // ----------------------------------------------------------------
    userA = await User.create({
      name: `Tester Alice ${timestamp}`,
      username: `alice_${timestamp}`,
      email: `alice_${timestamp}@example.com`,
      password: 'HashedPassword123!',
      bio: 'Alice original bio',
    });

    userB = await User.create({
      name: `Tester Bob ${timestamp}`,
      username: `bob_${timestamp}`,
      email: `bob_${timestamp}@example.com`,
      password: 'HashedPassword123!',
      bio: 'Bob original bio',
    });

    console.log(`Created test users: ${userA.username} & ${userB.username}\n`);

    // ----------------------------------------------------------------
    // 1. Post Creation (Authenticated)
    // ----------------------------------------------------------------
    const reqCreatePost = {
      user: userA,
      body: {
        content: `First post from Alice with #design and #vybe ${timestamp}`,
        mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
      },
    };
    const resCreatePost = mockResponse();
    await postController.createPost(reqCreatePost, resCreatePost);

    const postCreated = Boolean(resCreatePost.statusCode === 201 && resCreatePost.body.success && resCreatePost.body.post.id);
    recordResult(
      'Create Post (Authenticated)',
      postCreated,
      `Status: ${resCreatePost.statusCode}, Post ID: ${resCreatePost.body?.post?.id}, Tags: ${resCreatePost.body?.post?.tags?.join(', ')}`
    );
    postA = await Post.findById(resCreatePost.body.post.id);

    // ----------------------------------------------------------------
    // 2. Reject Empty Post Content
    // ----------------------------------------------------------------
    const reqEmptyPost = { user: userA, body: { content: '   ' } };
    const resEmptyPost = mockResponse();
    await postController.createPost(reqEmptyPost, resEmptyPost);
    recordResult(
      'Reject Empty Post Content',
      resEmptyPost.statusCode === 400 && !resEmptyPost.body.success,
      `Status: ${resEmptyPost.statusCode}, Message: "${resEmptyPost.body?.message}"`
    );

    // ----------------------------------------------------------------
    // 3. Retrieve Posts (Feed)
    // ----------------------------------------------------------------
    const reqGetPosts = { query: {}, user: userA };
    const resGetPosts = mockResponse();
    await postController.getPosts(reqGetPosts, resGetPosts);
    const hasPosts = resGetPosts.statusCode === 200 && Array.isArray(resGetPosts.body.posts) && resGetPosts.body.posts.length > 0;
    recordResult(
      'Get All Posts Feed',
      hasPosts,
      `Status: ${resGetPosts.statusCode}, Feed Count: ${resGetPosts.body?.count}`
    );

    // ----------------------------------------------------------------
    // 4. Retrieve Single Post by ID
    // ----------------------------------------------------------------
    const reqGetPostById = { params: { id: postA._id.toString() }, user: userA };
    const resGetPostById = mockResponse();
    await postController.getPostById(reqGetPostById, resGetPostById);
    recordResult(
      'Get Single Post by ID',
      resGetPostById.statusCode === 200 && resGetPostById.body.post.id === postA._id.toString(),
      `Status: ${resGetPostById.statusCode}, Author: ${resGetPostById.body?.post?.author?.username}`
    );

    // ----------------------------------------------------------------
    // 5. Handle Invalid Post ID Format & Missing Post
    // ----------------------------------------------------------------
    const resInvalidPostId = mockResponse();
    await postController.getPostById({ params: { id: 'invalid-id-xyz' } }, resInvalidPostId);
    const resMissingPostId = mockResponse();
    await postController.getPostById({ params: { id: new mongoose.Types.ObjectId().toString() } }, resMissingPostId);
    recordResult(
      'Invalid Post ID & 404 Handling',
      resInvalidPostId.statusCode === 400 && resMissingPostId.statusCode === 404,
      `Invalid ID -> HTTP ${resInvalidPostId.statusCode}, Missing ID -> HTTP ${resMissingPostId.statusCode}`
    );

    // ----------------------------------------------------------------
    // 6. Like & Unlike Post (Toggle)
    // ----------------------------------------------------------------
    // 6a. Like
    const reqLike = { params: { id: postA._id.toString() }, user: userB };
    const resLike = mockResponse();
    await postController.toggleLike(reqLike, resLike);
    const likedOk = resLike.statusCode === 200 && resLike.body.liked === true && resLike.body.likesCount === 1;

    // 6b. Unlike
    const resUnlike = mockResponse();
    await postController.toggleLike(reqLike, resUnlike);
    const unlikedOk = resUnlike.statusCode === 200 && resUnlike.body.liked === false && resUnlike.body.likesCount === 0;

    recordResult(
      'Toggle Like / Unlike',
      likedOk && unlikedOk,
      `Like -> liked: ${resLike.body?.liked} (count: ${resLike.body?.likesCount}), Unlike -> liked: ${resUnlike.body?.liked} (count: ${resUnlike.body?.likesCount})`
    );

    // ----------------------------------------------------------------
    // 7. Add Comment to Post
    // ----------------------------------------------------------------
    const reqComment = {
      params: { id: postA._id.toString() },
      user: userB,
      body: { text: 'Great observation Alice! Keep building.' },
    };
    const resComment = mockResponse();
    await postController.addComment(reqComment, resComment);
    const commentCreated = Boolean(resComment.statusCode === 201 && resComment.body.success && resComment.body.comment.id);
    recordResult(
      'Add Comment to Post',
      commentCreated,
      `Status: ${resComment.statusCode}, Comment ID: ${resComment.body?.comment?.id}, Author: ${resComment.body?.comment?.author?.username}`
    );
    commentA = resComment.body.comment;

    // ----------------------------------------------------------------
    // 8. Reject Unauthorized Comment Deletion
    // ----------------------------------------------------------------
    // Create User C (unrelated third party)
    const userC = await User.create({
      name: `Tester Charlie ${timestamp}`,
      username: `charlie_${timestamp}`,
      email: `charlie_${timestamp}@example.com`,
      password: 'HashedPassword123!',
    });

    const reqBadDeleteComment = {
      params: { postId: postA._id.toString(), commentId: commentA.id },
      user: userC,
    };
    const resBadDeleteComment = mockResponse();
    await postController.deleteComment(reqBadDeleteComment, resBadDeleteComment);
    recordResult(
      'Reject Unauthorized Comment Deletion (HTTP 403)',
      resBadDeleteComment.statusCode === 403,
      `Status: ${resBadDeleteComment.statusCode}, Message: "${resBadDeleteComment.body?.message}"`
    );

    // ----------------------------------------------------------------
    // 9. Delete Comment (Allowed for Comment Author)
    // ----------------------------------------------------------------
    const reqDeleteComment = {
      params: { postId: postA._id.toString(), commentId: commentA.id },
      user: userB, // userB is the comment author
    };
    const resDeleteComment = mockResponse();
    await postController.deleteComment(reqDeleteComment, resDeleteComment);
    recordResult(
      'Delete Comment by Author (HTTP 200)',
      resDeleteComment.statusCode === 200 && resDeleteComment.body.success,
      `Status: ${resDeleteComment.statusCode}, Message: "${resDeleteComment.body?.message}"`
    );

    // ----------------------------------------------------------------
    // 10. Reject Post Deletion by Non-Author (HTTP 403)
    // ----------------------------------------------------------------
    const reqBadDeletePost = {
      params: { id: postA._id.toString() },
      user: userB, // userB did NOT author postA
    };
    const resBadDeletePost = mockResponse();
    await postController.deletePost(reqBadDeletePost, resBadDeletePost);
    recordResult(
      'Reject Unauthorized Post Deletion (HTTP 403)',
      resBadDeletePost.statusCode === 403,
      `Status: ${resBadDeletePost.statusCode}, Message: "${resBadDeletePost.body?.message}"`
    );

    // ----------------------------------------------------------------
    // 11. Delete Post by Author (HTTP 200)
    // ----------------------------------------------------------------
    const reqDeletePost = {
      params: { id: postA._id.toString() },
      user: userA, // userA is author
    };
    const resDeletePost = mockResponse();
    await postController.deletePost(reqDeletePost, resDeletePost);
    recordResult(
      'Delete Post by Author (HTTP 200)',
      resDeletePost.statusCode === 200 && resDeletePost.body.success,
      `Status: ${resDeletePost.statusCode}, Message: "${resDeletePost.body?.message}"`
    );

    // ----------------------------------------------------------------
    // 12. Follow / Unfollow User Relationships
    // ----------------------------------------------------------------
    // 12a. Reject Self-Follow
    const reqSelfFollow = { params: { id: userA._id.toString() }, user: userA };
    const resSelfFollow = mockResponse();
    await userController.followUser(reqSelfFollow, resSelfFollow);
    recordResult(
      'Reject Self-Follow (HTTP 400)',
      resSelfFollow.statusCode === 400,
      `Status: ${resSelfFollow.statusCode}, Message: "${resSelfFollow.body?.message}"`
    );

    // 12b. Follow User
    const reqFollow = { params: { id: userB._id.toString() }, user: userA };
    const resFollow = mockResponse();
    await userController.followUser(reqFollow, resFollow);
    const followOk = resFollow.statusCode === 200 && resFollow.body.following === true;

    // 12c. Reject Duplicate Follow
    const resDupFollow = mockResponse();
    await userController.followUser(reqFollow, resDupFollow);
    const dupFollowRejected = resDupFollow.statusCode === 400;

    recordResult(
      'Follow User & Reject Duplicate Follow',
      followOk && dupFollowRejected,
      `Follow -> HTTP ${resFollow.statusCode} (following: ${resFollow.body?.following}), Duplicate -> HTTP ${resDupFollow.statusCode} ("${resDupFollow.body?.message}")`
    );

    // 12d. Unfollow User
    const resUnfollow = mockResponse();
    await userController.unfollowUser(reqFollow, resUnfollow);
    const unfollowOk = resUnfollow.statusCode === 200 && resUnfollow.body.following === false;
    recordResult(
      'Unfollow User (HTTP 200)',
      unfollowOk,
      `Status: ${resUnfollow.statusCode}, following: ${resUnfollow.body?.following}`
    );

    // ----------------------------------------------------------------
    // 13. Profile Retrieval & Profile Editing
    // ----------------------------------------------------------------
    // 13a. Get Profile by Username
    const reqGetProfile = { params: { id: userA.username }, user: userB };
    const resGetProfile = mockResponse();
    await userController.getUserProfile(reqGetProfile, resGetProfile);
    const profileOk = resGetProfile.statusCode === 200 && resGetProfile.body.user.username === userA.username && !('password' in resGetProfile.body.user);
    recordResult(
      'Get Profile by Username (Safe, No Passwords)',
      profileOk,
      `Status: ${resGetProfile.statusCode}, Name: "${resGetProfile.body?.user?.name}", Stats: ${JSON.stringify(resGetProfile.body?.user?.stats)}`
    );

    // 13b. Edit Profile
    const reqEditProfile = {
      user: userA,
      body: {
        bio: 'Updated bio for Alice with design tokens',
        website: 'alice.design',
      },
    };
    const resEditProfile = mockResponse();
    await userController.updateUserProfile(reqEditProfile, resEditProfile);
    const editOk = resEditProfile.statusCode === 200 && resEditProfile.body.user.bio === 'Updated bio for Alice with design tokens';
    recordResult(
      'Update User Profile (HTTP 200)',
      editOk,
      `Status: ${resEditProfile.statusCode}, Updated Bio: "${resEditProfile.body?.user?.bio}"`
    );

    // ----------------------------------------------------------------
    // 14. Suggested Users Retrieval
    // ----------------------------------------------------------------
    const reqSuggested = { user: userA };
    const resSuggested = mockResponse();
    await userController.getSuggestedUsers(reqSuggested, resSuggested);
    recordResult(
      'Get Suggested Users',
      resSuggested.statusCode === 200 && Array.isArray(resSuggested.body.users),
      `Status: ${resSuggested.statusCode}, Count: ${resSuggested.body?.count}`
    );

    // Clean up Charlie
    await User.findByIdAndDelete(userC._id);
  } finally {
    // ----------------------------------------------------------------
    // Clean up Test Records
    // ----------------------------------------------------------------
    if (userA) await User.findByIdAndDelete(userA._id);
    if (userB) await User.findByIdAndDelete(userB._id);
    if (postA) await Post.findByIdAndDelete(postA._id);
    console.log('\n🧹 Cleaned up all temporary test accounts and test documents.');
  }

  console.log('\n====================================================');
  console.log('📊 Test Suite Summary:');
  const passedCount = results.filter((r) => r.passed === true).length;
  const failedCount = results.filter((r) => r.passed === false).length;
  console.log(`Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('====================================================\n');

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
}

runSocialSuite();
