const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const spotifyService = require('../services/spotifyService');

// Helper to get or refresh access token from database
async function getValidAccessToken(userId) {
  const user = await User.findById(userId);
  
  if (!user || !user.spotify.connected) {
    throw new Error('Spotify not connected');
  }

  // Check if token needs refresh
  if (user.needsSpotifyTokenRefresh()) {
    console.log('Refreshing Spotify token for user:', userId);
    
    if (!user.spotify.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const refreshed = await spotifyService.refreshToken(user.spotify.refreshToken);
      
      await user.updateSpotifyTokens(
        refreshed.access_token,
        refreshed.refresh_token,
        refreshed.expires_in
      );
      
      return refreshed.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error.message);
      // Mark as disconnected if refresh fails
      user.spotify.connected = false;
      await user.save();
      throw new Error('Spotify connection expired. Please reconnect.');
    }
  }
  
  return user.spotify.accessToken;
}

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Get Spotify login URL
// GET /api/spotify/login
router.get('/login', auth, async (req, res) => {
  try {
    const state = req.user.id; // Use user ID as state
    const authUrl = spotifyService.getAuthUrl(state);
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Spotify login error:', error.message);
    res.status(500).json({ error: 'Failed to generate Spotify login URL' });
  }
});

// Spotify OAuth callback
// GET /api/spotify/callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error: spotifyError } = req.query;
    
    if (spotifyError) {
      console.error('Spotify OAuth error:', spotifyError);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?spotify=error&message=${spotifyError}`);
    }
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }
    
    // Exchange code for tokens
    const tokens = await spotifyService.getTokens(code);
    
    // Get user ID from state
    const userId = state;
    
    // Get Spotify profile to store additional info
    const spotifyProfile = await spotifyService.getUserProfile(tokens.access_token);
    
    // Update user with Spotify tokens and info
    await User.findByIdAndUpdate(userId, {
      'spotify.connected': true,
      'spotify.connectedAt': new Date(),
      'spotify.spotifyId': spotifyProfile.id,
      'spotify.displayName': spotifyProfile.display_name,
      'spotify.profileImage': spotifyProfile.images?.[0]?.url,
      'spotify.accessToken': tokens.access_token,
      'spotify.refreshToken': tokens.refresh_token,
      'spotify.tokenExpiresAt': new Date(Date.now() + (tokens.expires_in * 1000))
    });
    
    console.log('Spotify connected for user:', userId);
    
    // Redirect back to frontend
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?spotify=success`);
  } catch (error) {
    console.error('Spotify callback error:', error.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?spotify=error&message=${encodeURIComponent(error.message)}`);
  }
});

// Check if user has connected Spotify
// GET /api/spotify/status
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('spotify');
    
    res.json({ 
      connected: user?.spotify?.connected || false,
      displayName: user?.spotify?.displayName || null,
      profileImage: user?.spotify?.profileImage || null,
      connectedAt: user?.spotify?.connectedAt || null
    });
  } catch (error) {
    console.error('Spotify status error:', error.message);
    res.status(500).json({ error: 'Failed to check Spotify status' });
  }
});

// Disconnect Spotify
// POST /api/spotify/disconnect
router.post('/disconnect', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      'spotify.connected': false,
      'spotify.connectedAt': null,
      'spotify.accessToken': null,
      'spotify.refreshToken': null,
      'spotify.tokenExpiresAt': null
    });
    
    res.json({ message: 'Spotify disconnected successfully' });
  } catch (error) {
    console.error('Spotify disconnect error:', error.message);
    res.status(500).json({ error: 'Failed to disconnect Spotify' });
  }
});

// ============================================
// SEARCH ROUTES
// ============================================

// Search Spotify catalog
// GET /api/spotify/search?q=query&types=track,artist,album&limit=20
router.get('/search', auth, async (req, res) => {
  try {
    const { q, types = 'track,artist,album,playlist', limit = 20, offset = 0 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const accessToken = await getValidAccessToken(req.user.id);
    const typeArray = types.split(',');
    
    const results = await spotifyService.search(accessToken, q, typeArray, parseInt(limit), parseInt(offset));
    
    res.json(results);
  } catch (error) {
    console.error('Spotify search error:', error.message);
    if (error.message.includes('Spotify not connected')) {
      return res.status(401).json({ error: 'Spotify not connected', needsAuth: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// TRACK ROUTES
// ============================================

// Get track details
// GET /api/spotify/tracks/:id
router.get('/tracks/:id', auth, async (req, res) => {
  try {
    const accessToken = await getValidAccessToken(req.user.id);
    const track = await spotifyService.getTrack(accessToken, req.params.id);
    
    res.json(track);
  } catch (error) {
    console.error('Get track error:', error.message);
    if (error.message.includes('Spotify not connected')) {
      return res.status(401).json({ error: 'Spotify not connected', needsAuth: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get multiple tracks
// GET /api/spotify/tracks?ids=id1,id2,id3
router.get('/tracks', auth, async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ error: 'Track IDs required' });
    }
    
    const accessToken = await getValidAccessToken(req.user.id);
    const trackIds = ids.split(',');
    const tracks = await spotifyService.getTracks(accessToken, trackIds);
    
    res.json(tracks);
  } catch (error) {
    console.error('Get tracks error:', error.message);
    if (error.message.includes('Spotify not connected')) {
      return res.status(401).json({ error: 'Spotify not connected', needsAuth: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ARTIST ROUTES
// ============================================

// Get artist details
// GET /api/spotify/artists/:id
router.get('/artists/:id', auth, async (req, res) => {
  try {
    const accessToken = await getValidAccessToken(req.user.id);
    const artist = await spotifyService.getArtist(accessToken, req.params.id);
    
    res.json(artist);
  } catch (error) {
    console.error('Get artist error:', error.message);
    if (error.message.includes('Spotify not connected')) {
      return res.status(401).json({ error: 'Spotify not connected', needsAuth: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get artist's top tracks
// GET /api/spotify/artists/:id/top-tracks
router.get('/artists/:id/top-tracks', auth, async (req, res) => {
  try {
    const accessToken = await getValidAccessToken(req.user.id);
    const tracks = await spotifyService.getArtistTopTracks(accessToken, req.params.id);
    
    res.json(tracks);
  } catch (error) {
    console.error('Get artist top tracks error:', error.message);
    if (error.message.includes('Spotify not connected')) {
      return res.status(401).json({ error: 'Spotify not connected', needsAuth: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ALBUM ROUTES
// ============================================

// Get album details
// GET /api/spotify/albums/:id
router.get('/albums/:id', auth, async (req, res) => {
  try {
    const accessToken = await getValidAccessToken(req.user.id);
    const album = await spotifyService.getAlbum(accessToken, req.params.id);
    
    res.json(album);
  } catch (error) {
    console.error('Get album error:', error.message);
    if (error.message.includes('Spotify not connected')) {
      return res.status(401).json({ error: 'Spotify not connected', needsAuth: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// USER ROUTES
// ============================================

// Get current user's Spotify profile
// GET /api/spotify/me
router.get('/me', auth, async (req, res) => {
  try {
    const accessToken = await getValidAccessToken(req.user.id);
    const profile = await spotifyService.getUserProfile(accessToken);
    
    res.json(profile);
  } catch (error) {
    console.error('Get Spotify profile error:', error.message);
    if (error.message.includes('Spotify not connected')) {
      return res.status(401).json({ error: 'Spotify not connected', needsAuth: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get user's playlists
// GET /api/spotify/me/playlists
router.get('/me/playlists', auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const accessToken = await getValidAccessToken(req.user.id);
    const playlists = await spotifyService.getUserPlaylists(accessToken, parseInt(limit), parseInt(offset));
    
    res.json(playlists);
  } catch (error) {
    console.error('Get playlists error:', error.message);
    if (error.message.includes('Spotify not connected')) {
      return res.status(401).json({ error: 'Spotify not connected', needsAuth: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get user's top tracks
// GET /api/spotify/me/top/tracks
router.get('/me/top/tracks', auth, async (req, res) => {
  try {
    const { time_range = 'medium_term', limit = 20 } = req.query;
    const accessToken = await getValidAccessToken(req.user.id);
    const tracks = await spotifyService.getUserTopTracks(accessToken, time_range, parseInt(limit));
    
    // Store in user's stats
    await User.findByIdAndUpdate(req.user.id, {
      $push: {
        'spotifyStats.recentlyPlayed': {
          $each: tracks.items?.slice(0, 5).map(track => ({
            trackId: track.id,
            trackName: track.name,
            artistName: track.artists?.map(a => a.name).join(', ')
          })) || []
        }
      }
    });
    
    res.json(tracks);
  } catch (error) {
    console.error('Get top tracks error:', error.message);
    if (error.message.includes('Spotify not connected')) {
      return res.status(401).json({ error: 'Spotify not connected', needsAuth: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get user's top artists
// GET /api/spotify/me/top/artists
router.get('/me/top/artists', auth, async (req, res) => {
  try {
    const { time_range = 'medium_term', limit = 20 } = req.query;
    const accessToken = await getValidAccessToken(req.user.id);
    const artists = await spotifyService.getUserTopArtists(accessToken, time_range, parseInt(limit));
    
    // Extract genres from top artists
    const allGenres = artists.items?.flatMap(artist => artist.genres || []) || [];
    const uniqueGenres = [...new Set(allGenres)].slice(0, 10);
    
    // Update user's top genres
    await User.findByIdAndUpdate(req.user.id, {
      'spotifyStats.topGenres': uniqueGenres
    });
    
    res.json(artists);
  } catch (error) {
    console.error('Get top artists error:', error.message);
    if (error.message.includes('Spotify not connected')) {
      return res.status(401).json({ error: 'Spotify not connected', needsAuth: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get recently played tracks
// GET /api/spotify/me/recently-played
router.get('/me/recently-played', auth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const accessToken = await getValidAccessToken(req.user.id);
    const tracks = await spotifyService.getRecentlyPlayed(accessToken, parseInt(limit));
    
    // Calculate total listening time (in minutes)
    const totalTime = tracks.items?.reduce((sum, item) => {
      return sum + (item.track?.duration_ms || 0);
    }, 0) / (1000 * 60) || 0;
    
    // Update user's listening stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'spotifyStats.totalListeningTime': Math.round(totalTime) }
    });
    
    res.json(tracks);
  } catch (error) {
    console.error('Get recently played error:', error.message);
    if (error.message.includes('Spotify not connected')) {
      return res.status(401).json({ error: 'Spotify not connected', needsAuth: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PLAYLIST ROUTES
// ============================================

// Get playlist details
// GET /api/spotify/playlists/:id
router.get('/playlists/:id', auth, async (req, res) => {
  try {
    const accessToken = await getValidAccessToken(req.user.id);
    const playlist = await spotifyService.getPlaylist(accessToken, req.params.id);
    
    res.json(playlist);
  } catch (error) {
    console.error('Get playlist error:', error.message);
    if (error.message.includes('Spotify not connected')) {
      return res.status(401).json({ error: 'Spotify not connected', needsAuth: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get playlist tracks
// GET /api/spotify/playlists/:id/tracks
router.get('/playlists/:id/tracks', auth, async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const accessToken = await getValidAccessToken(req.user.id);
    const tracks = await spotifyService.getPlaylistTracks(accessToken, req.params.id, parseInt(limit), parseInt(offset));
    
    res.json(tracks);
  } catch (error) {
    console.error('Get playlist tracks error:', error.message);
    if (error.message.includes('Spotify not connected')) {
      return res.status(401).json({ error: 'Spotify not connected', needsAuth: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// BROWSE ROUTES
// ============================================

// Get featured playlists
// GET /api/spotify/browse/featured-playlists
router.get('/browse/featured-playlists', auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0, country = 'US' } = req.query;
    const accessToken = await getValidAccessToken(req.user.id);
    const playlists = await spotifyService.getFeaturedPlaylists(accessToken, parseInt(limit), parseInt(offset), country);
    
    res.json(playlists);
  } catch (error) {
    console.error('Get featured playlists error:', error.message);
    if (error.message.includes('Spotify not connected')) {
      return res.status(401).json({ error: 'Spotify not connected', needsAuth: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get new releases
// GET /api/spotify/browse/new-releases
router.get('/browse/new-releases', auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0, country = 'US' } = req.query;
    const accessToken = await getValidAccessToken(req.user.id);
    const releases = await spotifyService.getNewReleases(accessToken, parseInt(limit), parseInt(offset), country);
    
    res.json(releases);
  } catch (error) {
    console.error('Get new releases error:', error.message);
    if (error.message.includes('Spotify not connected')) {
      return res.status(401).json({ error: 'Spotify not connected', needsAuth: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get categories
// GET /api/spotify/browse/categories
router.get('/browse/categories', auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0, country = 'US' } = req.query;
    const accessToken = await getValidAccessToken(req.user.id);
    const categories = await spotifyService.getCategories(accessToken, parseInt(limit), parseInt(offset), country);
    
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error.message);
    if (error.message.includes('Spotify not connected')) {
      return res.status(401).json({ error: 'Spotify not connected', needsAuth: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RECOMMENDATIONS
// ============================================

// Get recommendations
// GET /api/spotify/recommendations?seed_tracks=id1,id2&seed_artists=id1&seed_genres=genre1,genre2&limit=20
router.get('/recommendations', auth, async (req, res) => {
  try {
    const { seed_tracks, seed_artists, seed_genres, limit = 20 } = req.query;
    
    const options = { limit: parseInt(limit) };
    if (seed_tracks) options.seed_tracks = seed_tracks;
    if (seed_artists) options.seed_artists = seed_artists;
    if (seed_genres) options.seed_genres = seed_genres;
    
    const accessToken = await getValidAccessToken(req.user.id);
    const recommendations = await spotifyService.getRecommendations(accessToken, options);
    
    res.json(recommendations);
  } catch (error) {
    console.error('Get recommendations error:', error.message);
    if (error.message.includes('Spotify not connected')) {
      return res.status(401).json({ error: 'Spotify not connected', needsAuth: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get available genre seeds
// GET /api/spotify/recommendations/available-genre-seeds
router.get('/recommendations/available-genre-seeds', auth, async (req, res) => {
  try {
    const accessToken = await getValidAccessToken(req.user.id);
    const genres = await spotifyService.getAvailableGenres(accessToken);
    
    res.json(genres);
  } catch (error) {
    console.error('Get genres error:', error.message);
    if (error.message.includes('Spotify not connected')) {
      return res.status(401).json({ error: 'Spotify not connected', needsAuth: true });
    }
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PLAYER ROUTES
// ============================================

// Get playback state
// GET /api/spotify/me/player
router.get('/me/player', auth, async (req, res) => {
  try {
    const accessToken = await getValidAccessToken(req.user.id);
    const state = await spotifyService.getPlaybackState(accessToken);
    
    res.json(state || { is_playing: false, message: 'No active device' });
  } catch (error) {
    console.error('Get playback state error:', error.message);
    if (error.message.includes('Spotify not connected')) {
      return res.status(401).json({ error: 'Spotify not connected', needsAuth: true });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
