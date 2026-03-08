const mongoose = require('mongoose');

const playbackSessionSchema = new mongoose.Schema({
  // Session identification
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Session metadata
  name: {
    type: String,
    required: true,
    default: 'Listening Party'
  },
  description: {
    type: String,
    default: ''
  },
  
  // Host (creator)
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Participants
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    socketId: {
      type: String,
      default: null
    }
  }],
  
  // Current playback state
  currentTrack: {
    trackId: String,
    title: String,
    artist: String,
    album: String,
    duration: Number, // in seconds
    coverArt: String,
    source: {
      type: String,
      enum: ['youtube', 'local'],
      default: 'local'
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  
  // Playback state
  isPlaying: {
    type: Boolean,
    default: false
  },
  
  currentPosition: {
    type: Number,
    default: 0 // current position in seconds
  },
  
  startedAt: {
    type: Date,
    default: null
  },
  
  pausedAt: {
    type: Date,
    default: null
  },
  
  // Queue management
  queue: [{
    trackId: String,
    title: String,
    artist: String,
    album: String,
    duration: Number,
    coverArt: String,
    source: {
      type: String,
      enum: ['youtube', 'local'],
      default: 'local'
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    position: {
      type: Number,
      default: 0
    }
  }],
  
  // Session settings
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowOthersToAdd: {
      type: Boolean,
      default: true
    },
    allowOthersToControl: {
      type: Boolean,
      default: false
    },
    syncMode: {
      type: String,
      enum: ['strict', 'relaxed'],
      default: 'strict' // strict = force sync, relaxed = participants can be slightly off
    }
  },
  
  // Session status
  status: {
    type: String,
    enum: ['active', 'paused', 'ended'],
    default: 'active'
  },
  
  // Playback history
  history: [{
    trackId: String,
    title: String,
    artist: String,
    playedAt: {
      type: Date,
      default: Date.now
    },
    duration: Number
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  endedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for querying active sessions
playbackSessionSchema.index({ status: 1, createdAt: -1 });
playbackSessionSchema.index({ host: 1, status: 1 });
playbackSessionSchema.index({ 'participants.user': 1 });

// Method to add participant
playbackSessionSchema.methods.addParticipant = function(userId, socketId) {
  const existingParticipant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (existingParticipant) {
    existingParticipant.isActive = true;
    existingParticipant.socketId = socketId;
  } else {
    this.participants.push({
      user: userId,
      socketId: socketId,
      isActive: true
    });
  }
  
  return this.save();
};

// Method to remove participant
playbackSessionSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (participant) {
    participant.isActive = false;
    participant.socketId = null;
  }
  
  return this.save();
};

// Method to add track to queue
playbackSessionSchema.methods.addToQueue = function(track, userId) {
  const queueItem = {
    ...track,
    addedBy: userId,
    position: this.queue.length
  };
  
  this.queue.push(queueItem);
  return this.save();
};

// Method to remove track from queue
playbackSessionSchema.methods.removeFromQueue = function(position) {
  this.queue = this.queue.filter(item => item.position !== position);
  // Reindex queue
  this.queue.forEach((item, idx) => {
    item.position = idx;
  });
  return this.save();
};

// Method to play next track
playbackSessionSchema.methods.playNext = function() {
  if (this.currentTrack) {
    // Add current to history
    this.history.push({
      trackId: this.currentTrack.trackId,
      title: this.currentTrack.title,
      artist: this.currentTrack.artist,
      playedAt: new Date(),
      duration: this.currentPosition
    });
  }
  
  // Get next from queue
  if (this.queue.length > 0) {
    const nextTrack = this.queue.shift();
    this.currentTrack = {
      trackId: nextTrack.trackId,
      title: nextTrack.title,
      artist: nextTrack.artist,
      album: nextTrack.album,
      duration: nextTrack.duration,
      coverArt: nextTrack.coverArt,
      source: nextTrack.source,
      addedBy: nextTrack.addedBy,
      addedAt: new Date()
    };
    this.currentPosition = 0;
    this.isPlaying = true;
    this.startedAt = new Date();
    
    // Reindex queue
    this.queue.forEach((item, idx) => {
      item.position = idx;
    });
  } else {
    this.currentTrack = null;
    this.isPlaying = false;
    this.currentPosition = 0;
  }
  
  return this.save();
};

// Method to update playback state
playbackSessionSchema.methods.updatePlaybackState = function(updates) {
  if (updates.isPlaying !== undefined) {
    this.isPlaying = updates.isPlaying;
    if (updates.isPlaying && !this.startedAt) {
      this.startedAt = new Date();
    }
    if (!updates.isPlaying) {
      this.pausedAt = new Date();
    }
  }
  
  if (updates.currentPosition !== undefined) {
    this.currentPosition = updates.currentPosition;
  }
  
  if (updates.currentTrack) {
    this.currentTrack = updates.currentTrack;
  }
  
  return this.save();
};

// Method to check if user is host
playbackSessionSchema.methods.isHost = function(userId) {
  return this.host.toString() === userId.toString();
};

// Method to check if user is participant
playbackSessionSchema.methods.isParticipant = function(userId) {
  return this.participants.some(
    p => p.user.toString() === userId.toString() && p.isActive
  );
};

// Method to check if user can control playback
playbackSessionSchema.methods.canControl = function(userId) {
  if (this.isHost(userId)) return true;
  if (this.settings.allowOthersToControl) {
    return this.isParticipant(userId);
  }
  return false;
};

// Method to check if user can add tracks
playbackSessionSchema.methods.canAddTracks = function(userId) {
  if (this.isHost(userId)) return true;
  if (this.settings.allowOthersToAdd) {
    return this.isParticipant(userId);
  }
  return false;
};

// Method to end session
playbackSessionSchema.methods.endSession = function() {
  this.status = 'ended';
  this.endedAt = new Date();
  this.isPlaying = false;
  return this.save();
};

module.exports = mongoose.model('PlaybackSession', playbackSessionSchema);
