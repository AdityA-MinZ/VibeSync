const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Playlist = require('../models/Playlist');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -spotify.accessToken -spotify.refreshToken');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const playlists = await Playlist.find({ owner: req.user.id });
    
    res.json({
      ...user.toObject(),
      playlistsCount: playlists.length,
      followersCount: user.followers?.length || 0,
      followingCount: user.followings?.length || 0,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.log('Get current user error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -spotify.accessToken -spotify.refreshToken');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const playlists = await Playlist.find({ owner: req.params.id });
    
    const isFollowing = req.user.id === req.params.id 
      ? null 
      : user.followers?.some(id => id.toString() === req.user.id);

    res.json({
      ...user.toObject(),
      playlistsCount: playlists.length,
      followersCount: user.followers?.length || 0,
      followingCount: user.followings?.length || 0,
      isFollowing: isFollowing,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.log('Get user error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.put('/me', auth, async (req, res) => {
  try {
    const { username, bio, location, website } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      user.username = username;
    }

    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;

    await user.save();

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      location: user.location,
      website: user.website
    });
  } catch (error) {
    console.log('Update user error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/me/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const playlists = await Playlist.find({ owner: req.user.id });
    const totalTracks = playlists.reduce((sum, p) => sum + (p.tracks?.length || 0), 0);

    res.json({
      playlistsCount: playlists.length,
      tracksCount: totalTracks,
      followersCount: user.followers?.length || 0,
      followingCount: user.followings?.length || 0,
      totalListeningTime: user.spotifyStats?.totalListeningTime || 0,
      currentStreak: user.streak?.currentStreak || 0,
      longestStreak: user.streak?.longestStreak || 0
    });
  } catch (error) {
    console.log('Get user stats error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/me/activity', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const playlists = await Playlist.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);

    const activities = [];

    playlists.forEach(playlist => {
      activities.push({
        type: 'playlist_created',
        icon: '🎵',
        text: `Created playlist '${playlist.name}'`,
        time: playlist.createdAt,
        color: '#7c3aed'
      });
    });

    if (user.spotifyStats?.recentlyPlayed?.length > 0) {
      user.spotifyStats.recentlyPlayed.slice(0, 3).forEach(track => {
        activities.push({
          type: 'listened',
          icon: '🎧',
          text: `Listened to '${track.trackName}' by ${track.artistName}`,
          time: track.playedAt,
          color: '#06b6d4'
        });
      });
    }

    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    const result = activities.slice(0, parseInt(req.query.limit) || 10).map(a => ({
      ...a,
      time: getRelativeTime(a.time)
    }));

    res.json(result);
  } catch (error) {
    console.log('Get user activity error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

function getRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return then.toLocaleDateString();
}

module.exports = router;
