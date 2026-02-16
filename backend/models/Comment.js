const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['track', 'playlist', 'album', 'artist', 'board'],
    required: true
  },
  targetId: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  likes: {
    type: Number,
    default: 0
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
commentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 }); // Get comments on target
commentSchema.index({ user: 1, createdAt: -1 }); // Get user's comments
commentSchema.index({ parentComment: 1 }); // Get replies

// Pre-find middleware to populate user (excluding deleted comments)
commentSchema.pre(/^find/, function(next) {
  if (!this._conditions.includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

// Instance method to add reply
commentSchema.methods.addReply = async function(replyCommentId) {
  this.replies.push(replyCommentId);
  return this.save();
};

// Instance method to soft delete
commentSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.content = '[deleted]';
  return this.save();
};

// Instance method to edit
commentSchema.methods.edit = async function(newContent) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

// Static method to get comments on a target
commentSchema.statics.getComments = async function(targetType, targetId, options = {}) {
  const { limit = 20, skip = 0, sortBy = 'newest' } = options;
  
  let sortOption = {};
  switch (sortBy) {
    case 'newest':
      sortOption = { createdAt: -1 };
      break;
    case 'oldest':
      sortOption = { createdAt: 1 };
      break;
    case 'popular':
      sortOption = { likes: -1, createdAt: -1 };
      break;
    default:
      sortOption = { createdAt: -1 };
  }
  
  return await this.find({
    targetType,
    targetId,
    parentComment: null, // Top-level comments only
    isDeleted: false
  })
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .populate('user', 'username profileImage')
    .populate({
      path: 'replies',
      populate: {
        path: 'user',
        select: 'username profileImage'
      }
    });
};

// Static method to get comment count
commentSchema.statics.getCommentCount = async function(targetType, targetId) {
  return await this.countDocuments({
    targetType,
    targetId,
    isDeleted: false
  });
};

// Static method to get user's comments
commentSchema.statics.getUserComments = async function(userId, limit = 20, skip = 0) {
  return await this.find({
    user: userId,
    isDeleted: false
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username profileImage');
};

module.exports = mongoose.model('Comment', commentSchema);
