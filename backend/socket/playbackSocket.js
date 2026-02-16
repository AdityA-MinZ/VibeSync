const playbackSessionService = require('../services/playbackSessionService');
const PlaybackSession = require('../models/PlaybackSession');

/**
 * Playback Session Socket Handler
 * 
 * Manages real-time collaborative playback synchronization
 */
class PlaybackSocketHandler {
  constructor(io) {
    this.io = io;
    this.activeSessions = new Map(); // sessionId -> { sockets: Set, playbackInterval: Interval }
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('🔌 Playback socket connected:', socket.id);

      // Join a playback session
      socket.on('join-playback-session', async (data) => {
        await this.handleJoinSession(socket, data);
      });

      // Leave a playback session
      socket.on('leave-playback-session', async (data) => {
        await this.handleLeaveSession(socket, data);
      });

      // Play track
      socket.on('session-play', async (data) => {
        await this.handlePlay(socket, data);
      });

      // Pause playback
      socket.on('session-pause', async (data) => {
        await this.handlePause(socket, data);
      });

      // Skip track
      socket.on('session-skip', async (data) => {
        await this.handleSkip(socket, data);
      });

      // Seek position
      socket.on('session-seek', async (data) => {
        await this.handleSeek(socket, data);
      });

      // Add to queue
      socket.on('session-add-queue', async (data) => {
        await this.handleAddToQueue(socket, data);
      });

      // Remove from queue
      socket.on('session-remove-queue', async (data) => {
        await this.handleRemoveFromQueue(socket, data);
      });

      // Sync request (for new joiners)
      socket.on('session-request-sync', async (data) => {
        await this.handleSyncRequest(socket, data);
      });

      // Update playback position periodically
      socket.on('session-update-position', async (data) => {
        await this.handlePositionUpdate(socket, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  /**
   * Handle user joining a session
   */
  async handleJoinSession(socket, data) {
    try {
      const { sessionId, userId } = data;
      
      if (!sessionId || !userId) {
        socket.emit('session-error', { message: 'Session ID and User ID required' });
        return;
      }

      // Join the socket room
      socket.join(`session-${sessionId}`);
      socket.sessionId = sessionId;
      socket.userId = userId;

      // Update session in database
      await playbackSessionService.joinSession(sessionId, userId, socket.id);

      // Get session data
      const sessionData = await playbackSessionService.getSession(sessionId);
      
      // Send current state to the joining user
      const syncState = await playbackSessionService.getSyncState(sessionId);
      socket.emit('session-joined', {
        success: true,
        session: sessionData.session,
        syncState: syncState.syncState
      });

      // Notify others in the session
      socket.to(`session-${sessionId}`).emit('user-joined-session', {
        userId: userId,
        socketId: socket.id,
        timestamp: new Date()
      });

      // Track active session
      if (!this.activeSessions.has(sessionId)) {
        this.activeSessions.set(sessionId, {
          sockets: new Set(),
          playbackInterval: null
        });
      }
      this.activeSessions.get(sessionId).sockets.add(socket.id);

      console.log(`✅ User ${userId} joined session ${sessionId}`);

    } catch (error) {
      console.error('Join session error:', error.message);
      socket.emit('session-error', { message: error.message });
    }
  }

  /**
   * Handle user leaving a session
   */
  async handleLeaveSession(socket, data) {
    try {
      const { sessionId, userId } = data;
      
      if (!sessionId) {
        sessionId = socket.sessionId;
      }
      if (!userId) {
        userId = socket.userId;
      }

      if (!sessionId) return;

      // Leave socket room
      socket.leave(`session-${sessionId}`);

      // Update session in database
      await playbackSessionService.leaveSession(sessionId, userId);

      // Notify others
      socket.to(`session-${sessionId}`).emit('user-left-session', {
        userId: userId,
        socketId: socket.id,
        timestamp: new Date()
      });

      // Clean up tracking
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.sockets.delete(socket.id);
        
        // If no more participants, clear interval
        if (session.sockets.size === 0) {
          if (session.playbackInterval) {
            clearInterval(session.playbackInterval);
          }
          this.activeSessions.delete(sessionId);
        }
      }

      // Clear socket data
      delete socket.sessionId;
      delete socket.userId;

      socket.emit('session-left', { success: true });

      console.log(`👋 User ${userId} left session ${sessionId}`);

    } catch (error) {
      console.error('Leave session error:', error.message);
      socket.emit('session-error', { message: error.message });
    }
  }

  /**
   * Handle play command
   */
  async handlePlay(socket, data) {
    try {
      const { sessionId, userId, track } = data;

      const result = await playbackSessionService.play(sessionId, userId, track);

      // Broadcast to all session participants
      this.io.to(`session-${sessionId}`).emit('session-playback-update', {
        type: 'play',
        session: result.session,
        triggeredBy: userId,
        timestamp: new Date()
      });

      // Start position tracking if not already started
      this.startPositionTracking(sessionId);

    } catch (error) {
      console.error('Play error:', error.message);
      socket.emit('session-error', { message: error.message });
    }
  }

  /**
   * Handle pause command
   */
  async handlePause(socket, data) {
    try {
      const { sessionId, userId } = data;

      const result = await playbackSessionService.pause(sessionId, userId);

      // Broadcast to all session participants
      this.io.to(`session-${sessionId}`).emit('session-playback-update', {
        type: 'pause',
        session: result.session,
        triggeredBy: userId,
        timestamp: new Date()
      });

      // Stop position tracking
      this.stopPositionTracking(sessionId);

    } catch (error) {
      console.error('Pause error:', error.message);
      socket.emit('session-error', { message: error.message });
    }
  }

  /**
   * Handle skip command
   */
  async handleSkip(socket, data) {
    try {
      const { sessionId, userId } = data;

      const result = await playbackSessionService.skip(sessionId, userId);

      // Broadcast to all session participants
      this.io.to(`session-${sessionId}`).emit('session-playback-update', {
        type: 'skip',
        session: result.session,
        triggeredBy: userId,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Skip error:', error.message);
      socket.emit('session-error', { message: error.message });
    }
  }

  /**
   * Handle seek command
   */
  async handleSeek(socket, data) {
    try {
      const { sessionId, userId, position } = data;

      const result = await playbackSessionService.seek(sessionId, userId, position);

      // Broadcast to all session participants
      this.io.to(`session-${sessionId}`).emit('session-playback-update', {
        type: 'seek',
        position: result.position,
        triggeredBy: userId,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Seek error:', error.message);
      socket.emit('session-error', { message: error.message });
    }
  }

  /**
   * Handle add to queue
   */
  async handleAddToQueue(socket, data) {
    try {
      const { sessionId, userId, track } = data;

      const result = await playbackSessionService.addToQueue(sessionId, userId, track);

      // Broadcast queue update to all participants
      this.io.to(`session-${sessionId}`).emit('session-queue-update', {
        type: 'add',
        track: track,
        addedBy: userId,
        queueLength: result.queueLength,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Add to queue error:', error.message);
      socket.emit('session-error', { message: error.message });
    }
  }

  /**
   * Handle remove from queue
   */
  async handleRemoveFromQueue(socket, data) {
    try {
      const { sessionId, userId, position } = data;

      const result = await playbackSessionService.removeFromQueue(sessionId, userId, position);

      // Broadcast queue update
      this.io.to(`session-${sessionId}`).emit('session-queue-update', {
        type: 'remove',
        position: position,
        removedBy: userId,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Remove from queue error:', error.message);
      socket.emit('session-error', { message: error.message });
    }
  }

  /**
   * Handle sync request (for new joiners)
   */
  async handleSyncRequest(socket, data) {
    try {
      const { sessionId } = data;

      const syncState = await playbackSessionService.getSyncState(sessionId);
      
      socket.emit('session-sync-data', syncState.syncState);

    } catch (error) {
      console.error('Sync request error:', error.message);
      socket.emit('session-error', { message: error.message });
    }
  }

  /**
   * Handle position update from clients
   */
  async handlePositionUpdate(socket, data) {
    try {
      const { sessionId, position } = data;

      // Update position in database (throttled)
      // This is used to keep track of current playback position
      await PlaybackSession.findOneAndUpdate(
        { sessionId },
        { currentPosition: position }
      );

    } catch (error) {
      console.error('Position update error:', error.message);
    }
  }

  /**
   * Start position tracking for a session
   */
  startPositionTracking(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.playbackInterval) return;

    // Update position every 5 seconds
    session.playbackInterval = setInterval(async () => {
      try {
        const sessionData = await PlaybackSession.findOne({ sessionId });
        if (!sessionData || !sessionData.isPlaying) {
          this.stopPositionTracking(sessionId);
          return;
        }

        // Calculate current position
        const elapsed = (Date.now() - sessionData.startedAt.getTime()) / 1000;
        const currentPosition = sessionData.currentPosition + elapsed;

        // Broadcast position to all participants
        this.io.to(`session-${sessionId}`).emit('session-position-update', {
          position: Math.floor(currentPosition),
          timestamp: new Date()
        });

        // Update in database
        await PlaybackSession.findOneAndUpdate(
          { sessionId },
          { currentPosition: Math.floor(currentPosition) }
        );

      } catch (error) {
        console.error('Position tracking error:', error.message);
      }
    }, 5000);
  }

  /**
   * Stop position tracking for a session
   */
  stopPositionTracking(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session && session.playbackInterval) {
      clearInterval(session.playbackInterval);
      session.playbackInterval = null;
    }
  }

  /**
   * Handle socket disconnect
   */
  handleDisconnect(socket) {
    console.log('🔌 Playback socket disconnected:', socket.id);
    
    // If socket was in a session, treat as leaving
    if (socket.sessionId && socket.userId) {
      this.handleLeaveSession(socket, {
        sessionId: socket.sessionId,
        userId: socket.userId
      });
    }
  }
}

module.exports = PlaybackSocketHandler;
