const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['track', 'playlist', 'album', 'artist', 'comment', 'board'],
    required: true
  },
  targetId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate likes
likeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });
likeSchema.index({ targetType: 1, targetId: 1 }); // For finding likes on a target
likeSchema.index({ user: 1, createdAt: -1 }); // For user's like history

// Static method to toggle like (like if not exists, unlike if exists)
likeSchema.statics.toggleLike = async function(userId, targetType, targetId) {
  const existingLike = await this.findOne({
    user: userId,
    targetType,
    targetId
  });
  
  if (existingLike) {
    // Unlike
    await this.deleteOne({ _id: existingLike._id });
    return { liked: false, like: null };
  } else {
    // Like
    const like = new this({
      user: userId,
      targetType,
      targetId
    });
    await like.save();
    return { liked: true, like };
  }
};

// Static method to check if user liked something
likeSchema.statics.hasLiked = async function(userId, targetType, targetId) {
  const like = await this.findOne({
    user: userId,
    targetType,
    targetId
  });
  return !!like;
};

// Static method to get like count
likeSchema.statics.getLikeCount = async function(targetType, targetId) {
  return await this.countDocuments({ targetType, targetId });
};

// Static method to get user's likes
likeSchema.statics.getUserLikes = async function(userId, targetType = null, limit = 20, skip = 0) {
  const query = { user: userId };
  if (targetType) query.targetType = targetType;
  
  return await this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username');
};

module.exports = mongoose.model('Like', likeSchema);
