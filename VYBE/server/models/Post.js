/**
 * VYBE Post Model
 * Phase 2: Mongoose Post Schema
 */

const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Comment author is required'],
    },
    text: {
      type: String,
      required: [true, 'Comment text cannot be empty'],
      trim: true,
      maxlength: [280, 'Comment cannot exceed 280 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual alias: allow accessing or setting comment text as 'content'
CommentSchema.virtual('content')
  .get(function () {
    return this.text;
  })
  .set(function (val) {
    this.text = val;
  });

const PostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post author is required'],
    },
    content: {
      type: String,
      required: [true, 'Post content cannot be empty'],
      trim: true,
      maxlength: [1000, 'Post content cannot exceed 1000 characters'],
    },
    mediaUrl: {
      type: String,
      default: '',
      trim: true,
    },
    mediaGrid: [
      {
        type: String,
        trim: true,
      },
    ],
    postType: {
      type: String,
      enum: ['text', 'image_single', 'image_grid_2', 'poll'],
      default: 'text',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [CommentSchema],
    isDemo: {
      type: Boolean,
      default: false,
    },
    seedKey: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual alias: allow accessing or setting post mediaUrl as 'imageUrl'
PostSchema.virtual('imageUrl')
  .get(function () {
    return this.mediaUrl;
  })
  .set(function (val) {
    this.mediaUrl = val;
  });

// Virtual counters for convenience
PostSchema.virtual('likesCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

PostSchema.virtual('commentsCount').get(function () {
  return this.comments ? this.comments.length : 0;
});

// Prevent re-compilation errors during hot reload
module.exports = mongoose.models.Post || mongoose.model('Post', PostSchema);
