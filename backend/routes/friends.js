const express = require('express');
const router = express.Router();
const Friend = require('../models/Friend');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// POST /api/friends/request/:userId
router.post('/request/:userId', auth, async (req, res) => {
  console.log('Friends request START');
  try {
    const { userId } = req.params;
    const requesterId = req.user.id;
    console.log('Requester:', requesterId, 'Target:', userId);

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
      console.log('Already friends or pending');
      return res.status(400).json({ error: 'Already friends or request pending' });
    }

    const friendReq = new Friend({
      user1: requesterId,
      user2: userId,
      status: 'pending'
    });
    await friendReq.save();
    console.log('Friend request saved:', friendReq._id);

    // Create notification for the target user
    try {
      const requester = await User.findById(requesterId).select('username');
      const targetUser = await User.findById(userId);
      
      if (targetUser) {
        const notification = new Notification({
          recipient: userId,
          sender: requesterId,
          type: 'friend_request',
          message: `${requester?.username || 'Someone'} sent you a friend request`,
          data: {
            requestId: friendReq._id,
            requesterId: requesterId,
            requesterUsername: requester?.username
          }
        });
        await notification.save();
        console.log('Notification created:', notification._id);
      }
    } catch (notifError) {
      console.log('Notification creation failed:', notifError.message);
    }

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

// PUT /api/friends/accept/:requestId
router.put('/accept/:requestId', auth, async (req, res) => {
  console.log('Accept START');
  try {
    const { requestId } = req.params;
    console.log('Accepting request:', requestId);

    const friendReq = await Friend.findOne({
      _id: requestId,
      status: 'pending',
      $or: [{ user2: req.user.id }, { user1: req.user.id }]
    });
    if (!friendReq) {
      console.log('Request not found or invalid user');
      return res.status(404).json({ error: 'Request not found or invalid user' });
    }

    friendReq.status = 'accepted';
    await friendReq.save();
    console.log('Request accepted');

    // Update followings for FEED API
    const user1 = await User.findById(friendReq.user1);
    const user2 = await User.findById(friendReq.user2);
    user1.followings.push(friendReq.user2);
    user2.followings.push(friendReq.user1);
    await Promise.all([user1.save(), user2.save()]);
    console.log('Followings updated');

    const populated = await Friend.findById(requestId).populate('user1 user2', 'username email');

    // Notify the requester that their friend request was accepted
    try {
      const acceptor = await User.findById(req.user.id).select('username');
      const requesterId = friendReq.user1.toString() === req.user.id ? friendReq.user2 : friendReq.user1;
      const notification = new Notification({
        recipient: requesterId,
        type: 'friend_accepted',
        title: 'Friend Request Accepted',
        message: `${acceptor?.username || 'Someone'} accepted your friend request`,
        data: {
          friendId: req.user.id,
          friendUsername: acceptor?.username
        }
      });
      await notification.save();
      console.log('Friend accepted notification created');
    } catch (notifError) {
      console.log('Notification creation failed:', notifError.message);
    }

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

// GET /api/friends
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching friends list for:', req.user.id);
    const requests = await Friend.find({
      $or: [{ user1: req.user.id }, { user2: req.user.id }]
    }).populate('user1 user2', 'username email');
    res.json(requests);
  } catch (error) {
    console.log('Friends list ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;