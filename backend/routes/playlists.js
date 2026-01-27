const express = require('express');
const Playlist = require('../models/Playlist');
const auth = require('../middleware/auth');
const router = express.Router();

// GET all public playlists
router.get('/', async (req, res) => {
  const playlists = await Playlist.find({ isPublic: true }).populate('owner', 'username');
  res.json(playlists);
});

// POST create (protected)
router.post('/', auth, async (req, res) => {
  const playlist = new Playlist({ ...req.body, owner: req.user.id });
  await playlist.save();
  await playlist.populate('owner', 'username');
  res.json(playlist);
});

// PUT update (owner only)
router.put('/:id', auth, async (req, res) => {
  const playlist = await Playlist.findOne({ _id: req.params.id, owner: req.user.id });
  if (!playlist) return res.status(404).json({ error: 'Not found' });
  Object.assign(playlist, req.body);
  await playlist.save();
  await playlist.populate('owner', 'username');
  res.json(playlist);
});

// DELETE (owner only)
router.delete('/:id', auth, async (req, res) => {
  const playlist = await Playlist.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!playlist) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
