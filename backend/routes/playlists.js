const express = require('express');
const jwt = require('jsonwebtoken');
const Playlist = require('../models/Playlist');
const auth = require('../middleware/auth'); 
const router = express.Router();

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

module.exports = router;