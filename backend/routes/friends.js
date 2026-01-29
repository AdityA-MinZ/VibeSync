const express = require('express');
const router = express.Router();
const Friend = require('../models/Friend');  // Create models/Friend.js if missing
const auth = require('../middleware/auth');  // Create if missing

router.post('/request/:userId', auth, async (req, res) => {
  console.log('Friends request - user:', req.user.id);
  console.log('Target ID:', req.params.userId);
});

// POST /api/friends/request/:userId
router.post('/request/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user.id;
    
    // Check if request already exists
    const existing = await Friend.findOne({
      $or: [
        { user1: requesterId, user2: userId },
        { user1: userId, user2: requesterId }
      ]
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Request already exists' });
    }
    
    const friendReq = new Friend({
      user1: requesterId,
      user2: userId,
      status: 'pending'
    });
    await friendReq.save();
    
    res.status(201).json({ 
      message: 'Friend request sent',
      requestId: friendReq._id 
    });
  } catch (error) {
    console.error('Friend request error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/friends/accept/:requestId
router.put('/accept/:requestId', auth, async (req, res) => {
  try {
    const friendReq = await Friend.findOneAndUpdate(
      { _id: req.params.requestId, user2: req.user.id, status: 'pending' },
      { status: 'accepted' },
      { new: true }
    ).populate('user1 user2', 'username email');
    
    if (!friendReq) {
      return res.status(404).json({ error: 'Request not found or already handled' });
    }
    
    res.json({ 
      message: 'Friend request accepted',
      friend: friendReq 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/friends
router.get('/', auth, async (req, res) => {
  try {
    const friends = await Friend.find({
      $or: [{ user1: req.user.id }, { user2: req.user.id }],
      status: 'accepted'
    }).populate('user1 user2', 'username email');
    res.json(friends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
