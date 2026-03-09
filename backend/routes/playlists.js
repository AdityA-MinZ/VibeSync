const express = require('express');
const Playlist = require('../models/Playlist');
const auth = require('../middleware/auth');
const router = express.Router();

// GET all public playlists
router.get('/', async (req, res) => {
  const playlists = await Playlist.find({ isPublic: true }).populate('owner', 'username');
  res.json(playlists);
});

// GET user's playlists (protected)
router.get('/me', auth, async (req, res) => {
  try {
    console.log('Fetching playlists for user:', req.user.id);
    const playlists = await Playlist.find({ owner: req.user.id })
      .populate('owner', 'username')
      .sort({ createdAt: -1 });
    console.log('Found playlists:', playlists.length);
    res.json(playlists);
  } catch (error) {
    console.error('Get playlists error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET playlists by user ID
router.get('/user/:userId', auth, async (req, res) => {
  try {
    console.log('Fetching playlists for userId:', req.params.userId);
    const playlists = await Playlist.find({ owner: req.params.userId, isPublic: true })
      .populate('owner', 'username')
      .sort({ createdAt: -1 });
    console.log('Found playlists for user:', playlists.length);
    res.json(playlists);
  } catch (error) {
    console.error('Get user playlists error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST increment plays (public - anyone can play a playlist)
router.post('/:id/plays', async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      { $inc: { plays: 1 } },
      { new: true }
    );
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    res.json({ plays: playlist.plays });
  } catch (error) {
    console.error('Increment plays error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST create (protected)
router.post('/', auth, async (req, res) => {
  try {
    const { name, title, description, tracks, visibility, genre, tags, coverImage } = req.body;
    
    // Map frontend format to backend format
    const playlistData = {
      title: title || name || 'Untitled Playlist',
      description: description || '',
      coverImage: coverImage || null,
      owner: req.user.id,
      isPublic: visibility === 'public' || visibility === true,
      tracks: (tracks || []).map(track => ({
        trackId: track.id || track.trackId,
        title: track.title || track.name,
        artist: track.artist || (track.artists && track.artists.map(a => a.name).join(',')),
        album: track.album?.name || track.album,
        image: track.image || track.album?.images?.[0]?.url || track.coverImage,
        duration: track.duration,
        durationMs: track.duration_ms,
        source: track.source || 'youtube',
        sourceUrl: track.sourceUrl || track.externalUrl,
        youtubeUrl: track.youtubeUrl || track.url,
        youtubeId: track.youtubeId,
        previewUrl: track.previewUrl
      }))
    };
    
    const playlist = new Playlist(playlistData);
    await playlist.save();
    await playlist.populate('owner', 'username');
    res.json(playlist);
  } catch (error) {
    console.error('Create playlist error:', error.message);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
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
  try {
    console.log('Delete playlist request:', req.params.id);
    console.log('User making request:', req.user.id);
    
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      console.log('Playlist not found');
      return res.status(404).json({ error: 'Playlist not found' });
    }
    
    console.log('Playlist owner:', playlist.owner);
    console.log('Request user:', req.user.id);
    
    // Check if user is the owner
    const playlistOwnerId = playlist.owner.toString();
    const requestUserId = req.user.id.toString();
    
    if (playlistOwnerId !== requestUserId) {
      console.log('User is not the owner');
      return res.status(403).json({ error: 'Not authorized to delete this playlist' });
    }
    
    await Playlist.findByIdAndDelete(req.params.id);
    console.log('Playlist deleted successfully');
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete playlist error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
