const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  location: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  followings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Spotify Integration Fields
  spotify: {
    connected: { type: Boolean, default: false },
    connectedAt: { type: Date },
    spotifyId: { type: String },
    displayName: { type: String },
    profileImage: { type: String },
    accessToken: { type: String },
    refreshToken: { type: String },
    tokenExpiresAt: { type: Date }
  },
  // Spotify Listening Stats
  spotifyStats: {
    totalListeningTime: { type: Number, default: 0 }, // in minutes
    topGenres: [{ type: String }],
    recentlyPlayed: [{
      trackId: String,
      trackName: String,
      artistName: String,
      playedAt: { type: Date, default: Date.now }
    }]
  },
  // Streak Fields
  streak: {
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null }
  }
}, { 
  timestamps: true,
  strictPopulate: false 
});

// Method to check if Spotify token needs refresh
userSchema.methods.needsSpotifyTokenRefresh = function() {
  if (!this.spotify.tokenExpiresAt) return true;
  // Refresh 5 minutes before expiry
  return Date.now() >= this.spotify.tokenExpiresAt - (5 * 60 * 1000);
};

// Method to update Spotify tokens
userSchema.methods.updateSpotifyTokens = function(accessToken, refreshToken, expiresIn) {
  this.spotify.accessToken = accessToken;
  if (refreshToken) {
    this.spotify.refreshToken = refreshToken;
  }
  this.spotify.tokenExpiresAt = new Date(Date.now() + (expiresIn * 1000));
  return this.save();
};

// Method to update listening streak
userSchema.methods.updateStreak = function() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastActive = this.streak.lastActiveDate ? 
    new Date(this.streak.lastActiveDate.getFullYear(), this.streak.lastActiveDate.getMonth(), this.streak.lastActiveDate.getDate()) : 
    null;
  
  // If already active today, do nothing
  if (lastActive && lastActive.getTime() === today.getTime()) {
    return this;
  }
  
  // If last active was yesterday, increment streak
  if (lastActive && lastActive.getTime() === yesterday.getTime()) {
    this.streak.currentStreak += 1;
  } else {
    // New streak started
    this.streak.currentStreak = 1;
  }
  
  // Update last active date
  this.streak.lastActiveDate = now;
  
  // Update longest streak if current is higher
  if (this.streak.currentStreak > this.streak.longestStreak) {
    this.streak.longestStreak = this.streak.currentStreak;
  }
  
  return this.save();
};

// Method to get streak info
userSchema.methods.getStreakInfo = function() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastActive = this.streak.lastActiveDate ? 
    new Date(this.streak.lastActiveDate.getFullYear(), this.streak.lastActiveDate.getMonth(), this.streak.lastActiveDate.getDate()) : 
    null;
  
  // Check if streak is still active (listened today or yesterday)
  let isActive = false;
  if (lastActive) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    isActive = lastActive.getTime() === today.getTime() || lastActive.getTime() === yesterday.getTime();
  }
  
  return {
    currentStreak: this.streak.currentStreak,
    longestStreak: this.streak.longestStreak,
    lastActiveDate: this.streak.lastActiveDate,
    isActive: isActive,
    daysSinceLastActive: lastActive ? Math.floor((today - lastActive) / (1000 * 60 * 60 * 24)) : null
  };
};

// Method to follow a user
userSchema.methods.follow = async function(userIdToFollow) {
  // Check if already following
  if (this.followings.includes(userIdToFollow)) {
    throw new Error('Already following this user');
  }
  
  // Can't follow yourself
  if (this._id.toString() === userIdToFollow.toString()) {
    throw new Error('Cannot follow yourself');
  }
  
  this.followings.push(userIdToFollow);
  await this.save();
  
  // Add to other user's followers
  await mongoose.model('User').findByIdAndUpdate(
    userIdToFollow,
    { $addToSet: { followers: this._id } }
  );
  
  return this;
};

// Method to unfollow a user
userSchema.methods.unfollow = async function(userIdToUnfollow) {
  // Remove from followings
  this.followings = this.followings.filter(id => 
    id.toString() !== userIdToUnfollow.toString()
  );
  await this.save();
  
  // Remove from other user's followers
  await mongoose.model('User').findByIdAndUpdate(
    userIdToUnfollow,
    { $pull: { followers: this._id } }
  );
  
  return this;
};

// Method to check if following
userSchema.methods.isFollowing = function(userId) {
  return this.followings.some(id => id.toString() === userId.toString());
};

// Method to get followers count
userSchema.methods.getFollowersCount = function() {
  return this.followers.length;
};

// Method to get following count
userSchema.methods.getFollowingCount = function() {
  return this.followings.length;
};

// Static method to get user profile with social stats
userSchema.statics.getUserProfile = async function(userId) {
  const user = await this.findById(userId)
    .select('-password -spotify.accessToken -spotify.refreshToken');
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return {
    ...user.toObject(),
    followersCount: user.getFollowersCount(),
    followingCount: user.getFollowingCount()
  };
};

module.exports = mongoose.model('User', userSchema);
