const express = require('express');
const router = express.Router();
const ListeningSession = require('../models/ListeningSession');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// POST /api/listening-sessions/create - Create a new listening session
router.post('/create', auth, async (req, res) => {
  try {
    const { songName, songUrl, platform, friendId } = req.body;
    const userId = req.user.id;
    
    // Create the session
    const session = new ListeningSession({
      host: userId,
      participants: [userId],
      songName,
      songUrl,
      platform: platform || 'youtube',
      status: 'active'
    });
    
    await session.save();
    
    // Send session invite message to friend
    const inviteMessage = new Message({
      sender: userId,
      receiver: friendId,
      content: `${req.user.username} is listening to ${songName}`,
      type: 'session_invite',
      sessionData: {
        sessionId: session._id.toString(),
        songName,
        songUrl
      }
    });
    
    await inviteMessage.save();
    
    res.status(201).json({
      session,
      message: inviteMessage
    });
  } catch (error) {
    console.log('Create session ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/listening-sessions/:sessionId/join - Join a listening session
router.post('/:sessionId/join', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    const session = await ListeningSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.status === 'ended') {
      return res.status(400).json({ error: 'Session has ended' });
    }
    
    // Add user to participants if not already there
    if (!session.participants.includes(userId)) {
      session.participants.push(userId);
      await session.save();
    }
    
    const populatedSession = await ListeningSession.findById(sessionId)
      .populate('host', 'username')
      .populate('participants', 'username');
    
    res.json(populatedSession);
  } catch (error) {
    console.log('Join session ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/listening-sessions/:sessionId - Get session details
router.get('/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await ListeningSession.findById(sessionId)
      .populate('host', 'username')
      .populate('participants', 'username');
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.log('Get session ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/listening-sessions/:sessionId/update - Update session state (play/pause/seek)
router.put('/:sessionId/update', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { isPlaying, currentTime } = req.body;
    const userId = req.user.id;
    
    const session = await ListeningSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Only host can control playback
    if (session.host.toString() !== userId) {
      return res.status(403).json({ error: 'Only host can control playback' });
    }
    
    if (isPlaying !== undefined) session.isPlaying = isPlaying;
    if (currentTime !== undefined) session.currentTime = currentTime;
    
    await session.save();
    
    res.json(session);
  } catch (error) {
    console.log('Update session ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/listening-sessions/:sessionId/end - End a listening session
router.put('/:sessionId/end', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    const session = await ListeningSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Only host can end session
    if (session.host.toString() !== userId) {
      return res.status(403).json({ error: 'Only host can end session' });
    }
    
    session.status = 'ended';
    await session.save();
    
    res.json({ message: 'Session ended', session });
  } catch (error) {
    console.log('End session ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
