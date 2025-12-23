const express = require('express');
const jwt = require('jsonwebtoken');
const Playlist = require('../models/Playlist');
const auth = require('../middleware/auth'); 
const router = express.Router();
const User = require('../models/User');

// CREATE playlist
router.post('/', auth, async (req, res) => {
  try {
    const playlist = new Playlist({
      title: req.body.title,
      description: req.body.description || '',
      owner: req.user.id,   // uses decoded.id
      tracks: []
    });

    const saved = await playlist.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET all public playlists
router.get('/', async (req, res) => {
  const playlists = await Playlist.find({ isPublic: true }).populate('owner', 'username');
  res.json(playlists);
});

// GET my playlists
router.get('/me', auth, async (req, res) => {
  const playlists = await Playlist.find({ owner: req.user.id });
  res.json(playlists);
});

// UPDATE playlist
router.put('/:id', auth, async (req, res) => {
  try {
    const playlist = await Playlist.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true }
    );
    if (!playlist) return res.status(404).json({ error: 'Not found or not owner' });
    res.json(playlist);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE playlist
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Playlist.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!deleted) return res.status(404).json({ error: 'Not found or not owner' });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// GET feed playlists from followed users with pagination
router.get('/feed', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get users current user follows (with fallback)
    const user = await User.findById(req.user.id).select('followings');
    const followingIds = user?.followings?.map(id => id.toString()) || [];

    const playlists = await Playlist.find({ 
      owner: { $in: followingIds },
      isPublic: true 
    })
    .populate('owner', 'username')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    res.json({ 
      playlists, 
      pagination: { 
        current: page, 
        limit,
        followingCount: followingIds.length 
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;