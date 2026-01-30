const express = require('express');
const router = express.Router();
const Friend = require('../models/Friend');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.post('/request/:userId', auth, async (req, res) => {
  console.log('Friends request START');
  try {
    const { userId } = req.params;
    const requesterId = req.user.id;
    
    // Check if already friends or request pending
    const existing = await Friend.findOne({
      $or: [
        { user1: requesterId, user2: userId, status: 'accepted' },
        { user1: userId, user2: requesterId, status: 'accepted' },
        { $and: [{ user1: requesterId, user2: userId }, { status: 'pending' }] },
        { $and: [{ user1: userId, user2: requesterId }, { status: 'pending' }] }
      ]
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Already friends or request pending' });
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
    console.log('Friends request SUCCESS');
  } catch (error) {
    console.log('Friends request ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.put('/accept/:requestId', auth, async (req, res) => {
  console.log('Accept START');
  try {
    const { requestId } = req.params;
    
    const friendReq = await Friend.findOne({
      _id: requestId,
      status: 'pending',
      $or: [{ user2: req.user.id }, { user1: req.user.id }]  // Receiver is either
    });
    
    if (!friendReq) {
      return res.status(404).json({ error: 'Request not found or invalid user' });
    }
    
    friendReq.status = 'accepted';
    await friendReq.save();
    
    // 🚀 Update followings for FEED API!
    const user1 = await User.findById(friendReq.user1);
    const user2 = await User.findById(friendReq.user2);
    user1.followings.push(friendReq.user2);
    user2.followings.push(friendReq.user1);
    await Promise.all([user1.save(), user2.save()]);
    
    const populated = await Friend.findById(requestId).populate('user1 user2', 'username email');
    
    res.json({ 
      message: 'Friend request accepted',
      friend: populated 
    });
    console.log('Accept SUCCESS');
  } catch (error) {
    console.log('Accept ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const requests = await Friend.find({
      $or: [{ user1: req.user.id }, { user2: req.user.id }]
    }).populate('user1 user2', 'username email');
    res.json(requests);  // Shows pending + accepted
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
