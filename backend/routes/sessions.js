const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const playbackSessionService = require('../services/playbackSessionService');

/**
 * @route   POST /api/sessions
 * @desc    Create a new playback session
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, settings } = req.body;
    
    const result = await playbackSessionService.createSession(req.user.id, {
      name,
      description,
      settings
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Create session error:', error.message);
    res.status(500).json({ 
      error: 'Failed to create session',
      message: error.message 
    });
  }
});

/**
 * @route   GET /api/sessions
 * @desc    Get user's active sessions
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const result = await playbackSessionService.getUserSessions(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Get user sessions error:', error.message);
    res.status(500).json({ 
      error: 'Failed to get sessions',
      message: error.message 
    });
  }
});

/**
 * @route   GET /api/sessions/public
 * @desc    Get public sessions
 * @access  Private
 */
router.get('/public', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const result = await playbackSessionService.getPublicSessions(limit);
    res.json(result);
  } catch (error) {
    console.error('Get public sessions error:', error.message);
    res.status(500).json({ 
      error: 'Failed to get public sessions',
      message: error.message 
    });
  }
});

/**
 * @route   GET /api/sessions/:sessionId
 * @desc    Get session details
 * @access  Private
 */
router.get('/:sessionId', auth, async (req, res) => {
  try {
    const result = await playbackSessionService.getSession(req.params.sessionId);
    res.json(result);
  } catch (error) {
    console.error('Get session error:', error.message);
    res.status(404).json({ 
      error: 'Session not found',
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/sessions/:sessionId/join
 * @desc    Join a session
 * @access  Private
 */
router.post('/:sessionId/join', auth, async (req, res) => {
  try {
    const { socketId } = req.body;
    const result = await playbackSessionService.joinSession(
      req.params.sessionId,
      req.user.id,
      socketId
    );
    res.json(result);
  } catch (error) {
    console.error('Join session error:', error.message);
    res.status(400).json({ 
      error: 'Failed to join session',
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/sessions/:sessionId/leave
 * @desc    Leave a session
 * @access  Private
 */
router.post('/:sessionId/leave', auth, async (req, res) => {
  try {
    const result = await playbackSessionService.leaveSession(
      req.params.sessionId,
      req.user.id
    );
    res.json(result);
  } catch (error) {
    console.error('Leave session error:', error.message);
    res.status(500).json({ 
      error: 'Failed to leave session',
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/sessions/:sessionId/queue
 * @desc    Add track to queue
 * @access  Private
 */
router.post('/:sessionId/queue', auth, async (req, res) => {
  try {
    const track = req.body;
    const result = await playbackSessionService.addToQueue(
      req.params.sessionId,
      req.user.id,
      track
    );
    res.json(result);
  } catch (error) {
    console.error('Add to queue error:', error.message);
    res.status(400).json({ 
      error: 'Failed to add track',
      message: error.message 
    });
  }
});

/**
 * @route   DELETE /api/sessions/:sessionId/queue/:position
 * @desc    Remove track from queue
 * @access  Private
 */
router.delete('/:sessionId/queue/:position', auth, async (req, res) => {
  try {
    const result = await playbackSessionService.removeFromQueue(
      req.params.sessionId,
      req.user.id,
      parseInt(req.params.position)
    );
    res.json(result);
  } catch (error) {
    console.error('Remove from queue error:', error.message);
    res.status(400).json({ 
      error: 'Failed to remove track',
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/sessions/:sessionId/play
 * @desc    Play or resume playback
 * @access  Private
 */
router.post('/:sessionId/play', auth, async (req, res) => {
  try {
    const { track } = req.body;
    const result = await playbackSessionService.play(
      req.params.sessionId,
      req.user.id,
      track
    );
    res.json(result);
  } catch (error) {
    console.error('Play error:', error.message);
    res.status(400).json({ 
      error: 'Failed to play',
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/sessions/:sessionId/pause
 * @desc    Pause playback
 * @access  Private
 */
router.post('/:sessionId/pause', auth, async (req, res) => {
  try {
    const result = await playbackSessionService.pause(
      req.params.sessionId,
      req.user.id
    );
    res.json(result);
  } catch (error) {
    console.error('Pause error:', error.message);
    res.status(400).json({ 
      error: 'Failed to pause',
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/sessions/:sessionId/skip
 * @desc    Skip to next track
 * @access  Private
 */
router.post('/:sessionId/skip', auth, async (req, res) => {
  try {
    const result = await playbackSessionService.skip(
      req.params.sessionId,
      req.user.id
    );
    res.json(result);
  } catch (error) {
    console.error('Skip error:', error.message);
    res.status(400).json({ 
      error: 'Failed to skip',
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/sessions/:sessionId/seek
 * @desc    Seek to position
 * @access  Private
 */
router.post('/:sessionId/seek', auth, async (req, res) => {
  try {
    const { position } = req.body;
    const result = await playbackSessionService.seek(
      req.params.sessionId,
      req.user.id,
      position
    );
    res.json(result);
  } catch (error) {
    console.error('Seek error:', error.message);
    res.status(400).json({ 
      error: 'Failed to seek',
      message: error.message 
    });
  }
});

/**
 * @route   GET /api/sessions/:sessionId/sync
 * @desc    Get sync state for a participant
 * @access  Private
 */
router.get('/:sessionId/sync', auth, async (req, res) => {
  try {
    const result = await playbackSessionService.getSyncState(req.params.sessionId);
    res.json(result);
  } catch (error) {
    console.error('Get sync state error:', error.message);
    res.status(404).json({ 
      error: 'Failed to get sync state',
      message: error.message 
    });
  }
});

/**
 * @route   PUT /api/sessions/:sessionId/settings
 * @desc    Update session settings
 * @access  Private
 */
router.put('/:sessionId/settings', auth, async (req, res) => {
  try {
    const result = await playbackSessionService.updateSettings(
      req.params.sessionId,
      req.user.id,
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error('Update settings error:', error.message);
    res.status(400).json({ 
      error: 'Failed to update settings',
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/sessions/:sessionId/end
 * @desc    End a session
 * @access  Private
 */
router.post('/:sessionId/end', auth, async (req, res) => {
  try {
    const result = await playbackSessionService.endSession(
      req.params.sessionId,
      req.user.id
    );
    res.json(result);
  } catch (error) {
    console.error('End session error:', error.message);
    res.status(400).json({ 
      error: 'Failed to end session',
      message: error.message 
    });
  }
});

module.exports = router;
