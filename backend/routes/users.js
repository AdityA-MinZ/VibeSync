const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Playlist = require('../models/Playlist');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/profile-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    console.log('Fetching user profile for:', req.user.id);
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
    console.error('Get user error:', error.message);
    res.status(500).json({ error: error.message });
  }
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
    const { username, bio, location } = req.body;
    
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

    await user.save();

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      location: user.location
    });
  } catch (error) {
    console.log('Update user error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/me/stats', auth, async (req, res) => {
  try {
    console.log('Fetching stats for user:', req.user.id);
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
      longestStreak: user.streak?.longestStreak || 0,
      topGenres: user.spotifyStats?.topGenres || []
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

// Profile image upload route
router.post('/me/profile-image', auth, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old profile image if exists
    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, '..', user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update user profile with new image path
    user.profileImage = `/uploads/profile-images/${req.file.filename}`;
    await user.save();

    res.json({ 
      message: 'Profile image uploaded successfully',
      profileImage: user.profileImage 
    });
  } catch (error) {
    console.log('Profile image upload error:', error.message);
    
    // Delete uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(__dirname, '..', req.file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/me/notification-settings
router.put('/me/notification-settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add notification settings to user schema if not exists
    if (!user.notificationSettings) {
      user.notificationSettings = {};
    }

    // Update notification settings
    Object.assign(user.notificationSettings, req.body);
    await user.save();

    res.json({ 
      message: 'Notification settings updated successfully',
      notificationSettings: user.notificationSettings
    });
  } catch (error) {
    console.log('Update notification settings error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/me/delete-account
router.delete('/me/delete-account', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user's playlists
    await Playlist.deleteMany({ owner: req.user.id });

    // Delete user's profile image if exists
    if (user.profileImage) {
      const imagePath = path.join(__dirname, '..', user.profileImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the user
    await User.findByIdAndDelete(req.user.id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.log('Delete account error:', error.message);
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
