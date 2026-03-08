const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverImage: {
    type: String,
    default: null
  },
  
  // Board type
  type: {
    type: String,
    enum: ['playlist', 'albums', 'artists', 'tracks', 'mixed'],
    default: 'mixed'
  },
  
  // Privacy settings
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Collaborators (can add items)
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Items in the board
  items: [{
    itemType: {
      type: String,
      enum: ['track', 'playlist', 'album', 'artist'],
      required: true
    },
    itemId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    artist: {
      type: String,
      default: null
    },
    album: {
      type: String,
      default: null
    },
    coverArt: {
      type: String,
      default: null
    },
    source: {
      type: String,
      enum: ['youtube', 'local'],
      default: 'local'
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      maxlength: 200,
      default: ''
    }
  }],
  
  // Tags for discovery
  tags: [{
    type: String,
    maxlength: 30
  }],
  
  // Statistics
  likes: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  
  // Followers (users who saved this board)
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Indexes
boardSchema.index({ owner: 1, createdAt: -1 });
boardSchema.index({ isPublic: 1, createdAt: -1 });
boardSchema.index({ tags: 1 });
boardSchema.index({ 'items.itemType': 1, 'items.itemId': 1 });

// Instance method to check if user can edit
boardSchema.methods.canEdit = function(userId) {
  if (this.owner.toString() === userId.toString()) return true;
  return this.collaborators.some(c => c.user.toString() === userId.toString());
};

// Instance method to check if user can view
boardSchema.methods.canView = function(userId) {
  if (this.isPublic) return true;
  if (this.owner.toString() === userId.toString()) return true;
  return this.collaborators.some(c => c.user.toString() === userId.toString());
};

// Instance method to add item
boardSchema.methods.addItem = async function(item, userId) {
  // Check for duplicates
  const exists = this.items.some(i => 
    i.itemId === item.itemId && i.itemType === item.itemType
  );
  
  if (exists) {
    throw new Error('Item already exists in board');
  }
  
  this.items.push({
    ...item,
    addedBy: userId
  });
  
  return this.save();
};

// Instance method to remove item
boardSchema.methods.removeItem = async function(itemId, userId) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('Item not found');
  }
  
  // Only owner, item adder, or board owner can remove
  if (item.addedBy.toString() !== userId.toString() && 
      this.owner.toString() !== userId.toString()) {
    throw new Error('Not authorized to remove this item');
  }
  
  item.remove();
  return this.save();
};

// Instance method to add collaborator
boardSchema.methods.addCollaborator = async function(userId) {
  const exists = this.collaborators.some(c => 
    c.user.toString() === userId.toString()
  );
  
  if (exists) {
    throw new Error('User is already a collaborator');
  }
  
  this.collaborators.push({ user: userId });
  return this.save();
};

// Instance method to remove collaborator
boardSchema.methods.removeCollaborator = async function(userId) {
  this.collaborators = this.collaborators.filter(c => 
    c.user.toString() !== userId.toString()
  );
  return this.save();
};

// Instance method to increment views
boardSchema.methods.incrementViews = async function() {
  this.views += 1;
  return this.save();
};

// Static method to get user's boards
boardSchema.statics.getUserBoards = async function(userId, includePrivate = false) {
  const query = { owner: userId };
  if (!includePrivate) query.isPublic = true;
  
  return await this.find(query)
    .sort({ createdAt: -1 })
    .populate('owner', 'username profileImage')
    .populate('collaborators.user', 'username');
};

// Static method to get public boards
boardSchema.statics.getPublicBoards = async function(options = {}) {
  const { limit = 20, skip = 0, tag = null, sortBy = 'newest' } = options;
  
  const query = { isPublic: true };
  if (tag) query.tags = tag;
  
  let sortOption = {};
  switch (sortBy) {
    case 'newest':
      sortOption = { createdAt: -1 };
      break;
    case 'popular':
      sortOption = { likes: -1, views: -1 };
      break;
    case 'mostItems':
      sortOption = { 'items.length': -1 };
      break;
    default:
      sortOption = { createdAt: -1 };
  }
  
  return await this.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .populate('owner', 'username profileImage');
};

// Static method to search boards
boardSchema.statics.searchBoards = async function(searchQuery, options = {}) {
  const { limit = 20, skip = 0 } = options;
  
  return await this.find({
    isPublic: true,
    $or: [
      { name: { $regex: searchQuery, $options: 'i' } },
      { description: { $regex: searchQuery, $options: 'i' } },
      { tags: { $in: [new RegExp(searchQuery, 'i')] } }
    ]
  })
    .sort({ likes: -1, views: -1 })
    .skip(skip)
    .limit(limit)
    .populate('owner', 'username profileImage');
};

module.exports = mongoose.model('Board', boardSchema);
