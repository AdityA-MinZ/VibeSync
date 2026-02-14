const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  artist: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  genre: {
    type: String,
    required: true,
    enum: ['electronic', 'pop', 'hiphop', 'rock', 'jazz', 'classical', 'rnb', 'folk', 'other'],
    index: true
  },
  mood: {
    type: String,
    enum: ['happy', 'sad', 'energetic', 'chill', 'romantic', 'focus', 'workout', 'party', 'sleep'],
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  duration: {
    type: String, // Format: "3:45"
    required: true
  },
  audioUrl: {
    type: String,
    required: true
  },
  coverArt: {
    type: String,
    default: null
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  plays: {
    type: Number,
    default: 0,
    index: true
  },
  likes: {
    type: Number,
    default: 0,
    index: true
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    index: true
  }],
  visibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, { 
  timestamps: true 
});

// Compound indexes for common search patterns
trackSchema.index({ title: 'text', artist: 'text', description: 'text' });
trackSchema.index({ genre: 1, mood: 1, createdAt: -1 });
trackSchema.index({ plays: -1, likes: -1 });
trackSchema.index({ creator: 1, createdAt: -1 });

// Pre-save middleware to ensure tags are lowercase
trackSchema.pre('save', function(next) {
  if (this.tags) {
    this.tags = this.tags.map(tag => tag.toLowerCase().trim());
  }
  next();
});

// Instance method to increment plays
trackSchema.methods.incrementPlays = async function() {
  this.plays += 1;
  return this.save();
};

// Instance method to toggle like
trackSchema.methods.toggleLike = async function(userId) {
  // Implementation would check if user already liked
  // For now, just increment/decrement
  this.likes += 1;
  return this.save();
};

// Static method to search tracks
trackSchema.statics.search = async function(query, filters = {}, options = {}) {
  const { 
    limit = 20, 
    skip = 0, 
    sortBy = 'relevance',
    sortOrder = 'desc'
  } = options;

  let searchCriteria = {
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { artist: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ],
    isActive: true,
    visibility: 'public'
  };

  // Apply filters
  if (filters.genre) searchCriteria.genre = filters.genre;
  if (filters.mood) searchCriteria.mood = filters.mood;
  if (filters.tags && filters.tags.length > 0) {
    searchCriteria.tags = { $in: filters.tags };
  }

  // Build sort object
  let sortCriteria = {};
  switch (sortBy) {
    case 'newest':
      sortCriteria = { createdAt: sortOrder === 'desc' ? -1 : 1 };
      break;
    case 'popular':
      sortCriteria = { plays: sortOrder === 'desc' ? -1 : 1 };
      break;
    case 'likes':
      sortCriteria = { likes: sortOrder === 'desc' ? -1 : 1 };
      break;
    case 'title':
      sortCriteria = { title: sortOrder === 'desc' ? -1 : 1 };
      break;
    default:
      sortCriteria = { createdAt: -1 };
  }

  return this.find(searchCriteria)
    .populate('creator', 'username email')
    .sort(sortCriteria)
    .skip(skip)
    .limit(limit)
    .lean();
};

// Static method to get trending tracks
trackSchema.statics.getTrending = async function(limit = 10) {
  return this.find({ 
    isActive: true, 
    visibility: 'public',
    plays: { $gt: 100 }
  })
  .sort({ plays: -1, likes: -1 })
  .limit(limit)
  .populate('creator', 'username')
  .lean();
};

// Static method to get recommendations
trackSchema.statics.getRecommendations = async function(userId, limit = 10) {
  // In production, this would use user's listening history
  // For now, return random popular tracks
  return this.find({ 
    isActive: true, 
    visibility: 'public' 
  })
  .sort({ plays: -1 })
  .limit(limit)
  .populate('creator', 'username')
  .lean();
};

module.exports = mongoose.model('Track', trackSchema);
