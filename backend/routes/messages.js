const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// GET /api/messages/:friendId - Get messages between current user and friend
router.get('/:friendId', auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;
    
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId }
      ]
    })
    .populate('sender', 'username')
    .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    console.log('Get messages ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/messages/:friendId - Send message to friend
router.post('/:friendId', auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    const { content, type, sessionData } = req.body;
    const userId = req.user.id;
    
    const message = new Message({
      sender: userId,
      receiver: friendId,
      content,
      type: type || 'text',
      sessionData: sessionData || null
    });
    
    await message.save();
    
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username');
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.log('Send message ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/messages/:messageId/read - Mark message as read
router.put('/:messageId/read', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findByIdAndUpdate(
      messageId,
      { read: true },
      { new: true }
    );
    
    res.json(message);
  } catch (error) {
    console.log('Mark read ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
