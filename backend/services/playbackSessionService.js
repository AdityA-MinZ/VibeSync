const PlaybackSession = require('../models/PlaybackSession');
const User = require('../models/User');
const crypto = require('crypto');

class PlaybackSessionService {
  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  /**
   * Create a new playback session
   * 
   * @param {string} hostId - Host user ID
   * @param {Object} sessionData - Session configuration
   * @returns {Promise<Object>} - Created session
   */
  async createSession(hostId, sessionData) {
    try {
      const sessionId = this.generateSessionId();
      
      const session = new PlaybackSession({
        sessionId,
        host: hostId,
        name: sessionData.name || 'Listening Party',
        description: sessionData.description || '',
        settings: {
          isPublic: sessionData.settings?.isPublic ?? false,
          allowOthersToAdd: sessionData.settings?.allowOthersToAdd ?? true,
          allowOthersToControl: sessionData.settings?.allowOthersToControl ?? false,
          syncMode: sessionData.settings?.syncMode ?? 'strict'
        },
        participants: [{
          user: hostId,
          isActive: true
        }]
      });
      
      await session.save();
      
      // Populate host info
      await session.populate('host', 'username');
      await session.populate('participants.user', 'username');
      
      return {
        success: true,
        session: session.toObject()
      };
    } catch (error) {
      console.error('Create session error:', error.message);
      throw error;
    }
  }

  /**
   * Get session by ID
   * 
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Session data
   */
  async getSession(sessionId) {
    try {
      const session = await PlaybackSession.findOne({ sessionId })
        .populate('host', 'username email')
        .populate('participants.user', 'username email')
        .populate('currentTrack.addedBy', 'username')
        .populate('queue.addedBy', 'username');
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      return {
        success: true,
        session: session.toObject()
      };
    } catch (error) {
      console.error('Get session error:', error.message);
      throw error;
    }
  }

  /**
   * Join a session
   * 
   * @param {string} sessionId - Session ID
   * @param {string} userId - User joining
   * @param {string} socketId - Socket ID
   * @returns {Promise<Object>} - Updated session
   */
  async joinSession(sessionId, userId, socketId) {
    try {
      const session = await PlaybackSession.findOne({ 
        sessionId, 
        status: { $ne: 'ended' } 
      });
      
      if (!session) {
        throw new Error('Session not found or has ended');
      }
      
      // Check if public or user is invited
      if (!session.settings.isPublic) {
        const isParticipant = session.participants.some(
          p => p.user.toString() === userId.toString()
        );
        if (!isParticipant && !session.isHost(userId)) {
          throw new Error('This session is private');
        }
      }
      
      await session.addParticipant(userId, socketId);
      
      // Populate and return
      await session.populate('host', 'username');
      await session.populate('participants.user', 'username');
      
      return {
        success: true,
        session: session.toObject(),
        message: 'Joined session successfully'
      };
    } catch (error) {
      console.error('Join session error:', error.message);
      throw error;
    }
  }

  /**
   * Leave a session
   * 
   * @param {string} sessionId - Session ID
   * @param {string} userId - User leaving
   * @returns {Promise<Object>} - Result
   */
  async leaveSession(sessionId, userId) {
    try {
      const session = await PlaybackSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      // If host leaves, end the session
      if (session.isHost(userId)) {
        await session.endSession();
        return {
          success: true,
          message: 'Session ended (host left)',
          sessionEnded: true
        };
      }
      
      await session.removeParticipant(userId);
      
      return {
        success: true,
        message: 'Left session successfully'
      };
    } catch (error) {
      console.error('Leave session error:', error.message);
      throw error;
    }
  }

  /**
   * Add track to queue
   * 
   * @param {string} sessionId - Session ID
   * @param {string} userId - User adding track
   * @param {Object} track - Track data
   * @returns {Promise<Object>} - Updated session
   */
  async addToQueue(sessionId, userId, track) {
    try {
      const session = await PlaybackSession.findOne({ 
        sessionId, 
        status: 'active' 
      });
      
      if (!session) {
        throw new Error('Session not found or not active');
      }
      
      // Check permissions
      if (!session.canAddTracks(userId)) {
        throw new Error('You do not have permission to add tracks');
      }
      
      await session.addToQueue(track, userId);
      
      return {
        success: true,
        message: 'Track added to queue',
        queueLength: session.queue.length
      };
    } catch (error) {
      console.error('Add to queue error:', error.message);
      throw error;
    }
  }

  /**
   * Remove track from queue
   * 
   * @param {string} sessionId - Session ID
   * @param {string} userId - User removing track
   * @param {number} position - Queue position
   * @returns {Promise<Object>} - Result
   */
  async removeFromQueue(sessionId, userId, position) {
    try {
      const session = await PlaybackSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Only host or track adder can remove
      const track = session.queue.find(t => t.position === position);
      if (!track) {
        throw new Error('Track not found in queue');
      }
      
      if (!session.isHost(userId) && track.addedBy.toString() !== userId) {
        throw new Error('You can only remove tracks you added');
      }
      
      await session.removeFromQueue(position);
      
      return {
        success: true,
        message: 'Track removed from queue'
      };
    } catch (error) {
      console.error('Remove from queue error:', error.message);
      throw error;
    }
  }

  /**
   * Play track
   * 
   * @param {string} sessionId - Session ID
   * @param {string} userId - User controlling playback
   * @param {Object} track - Track to play (optional, plays from queue if not provided)
   * @returns {Promise<Object>} - Updated session
   */
  async play(sessionId, userId, track = null) {
    try {
      const session = await PlaybackSession.findOne({ 
        sessionId, 
        status: 'active' 
      });
      
      if (!session) {
        throw new Error('Session not found or not active');
      }
      
      // Check permissions
      if (!session.canControl(userId)) {
        throw new Error('You do not have permission to control playback');
      }
      
      if (track) {
        // Play specific track
        if (session.currentTrack) {
          // Add current to history
          session.history.push({
            trackId: session.currentTrack.trackId,
            title: session.currentTrack.title,
            artist: session.currentTrack.artist,
            playedAt: new Date(),
            duration: session.currentPosition
          });
        }
        
        session.currentTrack = {
          ...track,
          addedBy: userId,
          addedAt: new Date()
        };
        session.currentPosition = 0;
        session.isPlaying = true;
        session.startedAt = new Date();
      } else if (session.queue.length > 0) {
        // Play next from queue
        await session.playNext();
      } else {
        // Resume current track
        session.isPlaying = true;
        session.startedAt = new Date();
      }
      
      await session.save();
      
      return {
        success: true,
        session: session.toObject(),
        message: 'Playback started'
      };
    } catch (error) {
      console.error('Play error:', error.message);
      throw error;
    }
  }

  /**
   * Pause playback
   * 
   * @param {string} sessionId - Session ID
   * @param {string} userId - User controlling playback
   * @returns {Promise<Object>} - Updated session
   */
  async pause(sessionId, userId) {
    try {
      const session = await PlaybackSession.findOne({ 
        sessionId, 
        status: 'active' 
      });
      
      if (!session) {
        throw new Error('Session not found or not active');
      }
      
      if (!session.canControl(userId)) {
        throw new Error('You do not have permission to control playback');
      }
      
      session.isPlaying = false;
      session.pausedAt = new Date();
      await session.save();
      
      return {
        success: true,
        session: session.toObject(),
        message: 'Playback paused'
      };
    } catch (error) {
      console.error('Pause error:', error.message);
      throw error;
    }
  }

  /**
   * Skip to next track
   * 
   * @param {string} sessionId - Session ID
   * @param {string} userId - User controlling playback
   * @returns {Promise<Object>} - Updated session
   */
  async skip(sessionId, userId) {
    try {
      const session = await PlaybackSession.findOne({ 
        sessionId, 
        status: 'active' 
      });
      
      if (!session) {
        throw new Error('Session not found or not active');
      }
      
      if (!session.canControl(userId)) {
        throw new Error('You do not have permission to control playback');
      }
      
      if (session.queue.length === 0) {
        throw new Error('No tracks in queue');
      }
      
      await session.playNext();
      
      return {
        success: true,
        session: session.toObject(),
        message: 'Skipped to next track'
      };
    } catch (error) {
      console.error('Skip error:', error.message);
      throw error;
    }
  }

  /**
   * Seek to position
   * 
   * @param {string} sessionId - Session ID
   * @param {string} userId - User controlling playback
   * @param {number} position - Position in seconds
   * @returns {Promise<Object>} - Updated session
   */
  async seek(sessionId, userId, position) {
    try {
      const session = await PlaybackSession.findOne({ 
        sessionId, 
        status: 'active' 
      });
      
      if (!session) {
        throw new Error('Session not found or not active');
      }
      
      if (!session.canControl(userId)) {
        throw new Error('You do not have permission to control playback');
      }
      
      session.currentPosition = position;
      await session.save();
      
      return {
        success: true,
        position: position,
        message: `Seeked to ${position}s`
      };
    } catch (error) {
      console.error('Seek error:', error.message);
      throw error;
    }
  }

  /**
   * Update session settings
   * 
   * @param {string} sessionId - Session ID
   * @param {string} userId - Host user ID
   * @param {Object} settings - New settings
   * @returns {Promise<Object>} - Updated session
   */
  async updateSettings(sessionId, userId, settings) {
    try {
      const session = await PlaybackSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      if (!session.isHost(userId)) {
        throw new Error('Only the host can update settings');
      }
      
      // Update allowed settings
      if (settings.isPublic !== undefined) {
        session.settings.isPublic = settings.isPublic;
      }
      if (settings.allowOthersToAdd !== undefined) {
        session.settings.allowOthersToAdd = settings.allowOthersToAdd;
      }
      if (settings.allowOthersToControl !== undefined) {
        session.settings.allowOthersToControl = settings.allowOthersToControl;
      }
      if (settings.syncMode !== undefined) {
        session.settings.syncMode = settings.syncMode;
      }
      
      await session.save();
      
      return {
        success: true,
        settings: session.settings,
        message: 'Settings updated'
      };
    } catch (error) {
      console.error('Update settings error:', error.message);
      throw error;
    }
  }

  /**
   * Get active sessions for a user
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Active sessions
   */
  async getUserSessions(userId) {
    try {
      const sessions = await PlaybackSession.find({
        $or: [
          { host: userId },
          { 'participants.user': userId, 'participants.isActive': true }
        ],
        status: 'active'
      })
      .populate('host', 'username')
      .populate('participants.user', 'username')
      .sort({ createdAt: -1 });
      
      return {
        success: true,
        sessions: sessions.map(s => s.toObject())
      };
    } catch (error) {
      console.error('Get user sessions error:', error.message);
      throw error;
    }
  }

  /**
   * Get public sessions
   * 
   * @param {number} limit - Number of sessions to return
   * @returns {Promise<Array>} - Public sessions
   */
  async getPublicSessions(limit = 20) {
    try {
      const sessions = await PlaybackSession.find({
        'settings.isPublic': true,
        status: 'active'
      })
      .populate('host', 'username')
      .populate('participants.user', 'username')
      .limit(limit)
      .sort({ createdAt: -1 });
      
      return {
        success: true,
        sessions: sessions.map(s => ({
          sessionId: s.sessionId,
          name: s.name,
          host: s.host,
          participantCount: s.participants.filter(p => p.isActive).length,
          currentTrack: s.currentTrack,
          isPlaying: s.isPlaying
        }))
      };
    } catch (error) {
      console.error('Get public sessions error:', error.message);
      throw error;
    }
  }

  /**
   * End session
   * 
   * @param {string} sessionId - Session ID
   * @param {string} userId - Host user ID
   * @returns {Promise<Object>} - Result
   */
  async endSession(sessionId, userId) {
    try {
      const session = await PlaybackSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      if (!session.isHost(userId)) {
        throw new Error('Only the host can end the session');
      }
      
      await session.endSession();
      
      return {
        success: true,
        message: 'Session ended'
      };
    } catch (error) {
      console.error('End session error:', error.message);
      throw error;
    }
  }

  /**
   * Get sync state for a participant
   * Used to synchronize new joiners with current playback
   * 
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Sync state
   */
  async getSyncState(sessionId) {
    try {
      const session = await PlaybackSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Calculate current position if playing
      let calculatedPosition = session.currentPosition;
      if (session.isPlaying && session.startedAt) {
        const elapsed = (Date.now() - session.startedAt.getTime()) / 1000;
        calculatedPosition = session.currentPosition + elapsed;
        
        // Don't exceed track duration
        if (session.currentTrack && calculatedPosition > session.currentTrack.duration) {
          calculatedPosition = session.currentTrack.duration;
        }
      }
      
      return {
        success: true,
        syncState: {
          isPlaying: session.isPlaying,
          currentTrack: session.currentTrack,
          position: Math.floor(calculatedPosition),
          startedAt: session.startedAt,
          queue: session.queue,
          syncMode: session.settings.syncMode
        }
      };
    } catch (error) {
      console.error('Get sync state error:', error.message);
      throw error;
    }
  }
}

module.exports = new PlaybackSessionService();
