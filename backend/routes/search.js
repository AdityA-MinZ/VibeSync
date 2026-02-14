const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Playlist = require('../models/Playlist');

// Search across all content types
// GET /api/search?q=query&type=all|tracks|artists|playlists|users&limit=20
router.get('/', auth, async (req, res) => {
  try {
    const { q, type = 'all', limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchQuery = q.trim();
    const searchRegex = new RegExp(searchQuery, 'i');
    const resultsLimit = parseInt(limit) || 20;

    let results = {
      tracks: [],
      artists: [],
      playlists: [],
      users: []
    };

    // Search tracks (mock data for now, will integrate with actual track model)
    if (type === 'all' || type === 'tracks') {
      // For now, we'll search through a mock tracks collection
      // In production, this would query a Track model
      results.tracks = await searchTracks(searchRegex, resultsLimit);
    }

    // Search artists (users with public profiles)
    if (type === 'all' || type === 'artists') {
      results.artists = await User.find({
        $or: [
          { username: searchRegex },
          { email: searchRegex }
        ]
      })
      .select('username email followers followings createdAt')
      .limit(resultsLimit)
      .lean();
    }

    // Search playlists
    if (type === 'all' || type === 'playlists') {
      results.playlists = await Playlist.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex }
        ]
      })
      .populate('owner', 'username email')
      .limit(resultsLimit)
      .lean();
    }

    // Search users
    if (type === 'all' || type === 'users') {
      results.users = await User.find({
        $or: [
          { username: searchRegex },
          { email: searchRegex }
        ]
      })
      .select('username email followers followings createdAt')
      .limit(resultsLimit)
      .lean();
    }

    // Add total count
    const totalResults = 
      results.tracks.length + 
      results.artists.length + 
      results.playlists.length + 
      results.users.length;

    res.json({
      query: searchQuery,
      type,
      total: totalResults,
      results
    });

  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Advanced search with filters
// POST /api/search/advanced
router.post('/advanced', auth, async (req, res) => {
  try {
    const { 
      q, 
      type = 'all',
      genre,
      mood,
      duration,
      sortBy = 'relevance',
      page = 1,
      limit = 20 
    } = req.body;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchQuery = q.trim();
    const searchRegex = new RegExp(searchQuery, 'i');
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const resultsLimit = parseInt(limit);

    let query = {};
    
    // Build query based on filters
    if (type === 'tracks' || type === 'all') {
      query = {
        $or: [
          { title: searchRegex },
          { artist: searchRegex },
          { description: searchRegex }
        ]
      };

      if (genre) query.genre = genre;
      if (mood) query.mood = mood;
    }

    // Sort options
    let sortOption = {};
    switch (sortBy) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'popular':
        sortOption = { plays: -1 };
        break;
      case 'likes':
        sortOption = { likes: -1 };
        break;
      default:
        sortOption = { createdAt: -1 }; // relevance fallback
    }

    let searchResults = [];

    if (type === 'tracks' || type === 'all') {
      // Mock track search - integrate with actual Track model
      searchResults = await searchTracks(searchRegex, resultsLimit, skip, query, sortOption);
    }

    const total = searchResults.length; // In production, use countDocuments

    res.json({
      query: searchQuery,
      type,
      filters: { genre, mood, duration },
      sortBy,
      pagination: {
        page: parseInt(page),
        limit: resultsLimit,
        total,
        pages: Math.ceil(total / resultsLimit)
      },
      results: searchResults
    });

  } catch (error) {
    console.error('Advanced search error:', error.message);
    res.status(500).json({ error: 'Advanced search failed' });
  }
});

// Get search suggestions
// GET /api/search/suggestions?q=query
router.get('/suggestions', auth, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    
    // Get suggestions from different sources
    const [users, playlists] = await Promise.all([
      User.find({ username: searchRegex })
        .select('username')
        .limit(5)
        .lean(),
      Playlist.find({ title: searchRegex })
        .select('title')
        .limit(5)
        .lean()
    ]);

    const suggestions = [
      ...users.map(u => ({ type: 'user', text: u.username })),
      ...playlists.map(p => ({ type: 'playlist', text: p.title }))
    ];

    res.json({ suggestions: suggestions.slice(0, 10) });

  } catch (error) {
    console.error('Suggestions error:', error.message);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Get popular searches
// GET /api/search/trending
router.get('/trending', auth, async (req, res) => {
  try {
    // In production, this would query a search analytics collection
    const trendingSearches = [
      'Electronic',
      'Summer Vibes',
      'Luna Eclipse',
      'Jazz',
      'Hip Hop',
      'Chill',
      'Workout',
      'Midnight Dreams'
    ];

    res.json({ trending: trendingSearches });
  } catch (error) {
    console.error('Trending error:', error.message);
    res.status(500).json({ error: 'Failed to get trending searches' });
  }
});

// Mock track search function - replace with actual Track model queries
async function searchTracks(regex, limit, skip = 0, filters = {}, sort = {}) {
  // This is mock data - in production, query your Track model
  const mockTracks = [
    {
      id: 1,
      title: "Midnight Dreams",
      artist: "Luna Eclipse",
      genre: "electronic",
      image: "https://picsum.photos/400/500?random=1",
      likes: 1234,
      plays: 45678,
      duration: "3:45",
      createdAt: new Date('2024-01-15')
    },
    {
      id: 2,
      title: "Summer Vibes",
      artist: "The Waves",
      genre: "pop",
      image: "https://picsum.photos/400/600?random=2",
      likes: 2341,
      plays: 78901,
      duration: "3:12",
      createdAt: new Date('2024-01-10')
    },
    {
      id: 3,
      title: "Urban Beats",
      artist: "Street Sound",
      genre: "hiphop",
      image: "https://picsum.photos/400/450?random=3",
      likes: 3456,
      plays: 123456,
      duration: "4:20",
      createdAt: new Date('2024-01-08')
    },
    {
      id: 4,
      title: "Jazz at Midnight",
      artist: "The Blue Notes",
      genre: "jazz",
      image: "https://picsum.photos/400/550?random=4",
      likes: 987,
      plays: 34567,
      duration: "5:15",
      createdAt: new Date('2024-01-05')
    },
    {
      id: 5,
      title: "Electric Storm",
      artist: "Neon Knights",
      genre: "rock",
      image: "https://picsum.photos/400/480?random=5",
      likes: 4567,
      plays: 234567,
      duration: "3:30",
      createdAt: new Date('2024-01-01')
    },
    {
      id: 6,
      title: "Morning Coffee",
      artist: "Acoustic Soul",
      genre: "pop",
      image: "https://picsum.photos/400/520?random=6",
      likes: 2345,
      plays: 89012,
      duration: "2:55",
      createdAt: new Date('2023-12-28')
    }
  ];

  // Filter tracks based on regex
  let filtered = mockTracks.filter(track => 
    regex.test(track.title) || 
    regex.test(track.artist) || 
    regex.test(track.genre)
  );

  // Apply additional filters
  if (filters.genre) {
    filtered = filtered.filter(track => track.genre === filters.genre);
  }

  // Apply sorting
  if (sort.createdAt) {
    filtered.sort((a, b) => {
      return sort.createdAt === -1 
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : new Date(a.createdAt) - new Date(b.createdAt);
    });
  }

  // Apply pagination
  return filtered.slice(skip, skip + limit);
}

module.exports = router;
