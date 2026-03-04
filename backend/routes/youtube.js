// routes/youtube.js
const express = require('express');
const axios = require('axios');

const router = express.Router();
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YT_API_URL = 'https://www.googleapis.com/youtube/v3';
const YT_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

router.get('/search', async (req, res) => {
  try {
    const query = req.query.query;
    const maxResults = Number(req.query.maxResults) || 10;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const { data } = await axios.get(YT_SEARCH_URL, {
      params: {
        key: YOUTUBE_API_KEY,
        part: 'snippet',
        type: 'video',
        q: query,
        maxResults,
        videoCategoryId: '10',
      },
    });

    const items = (data.items || []).map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

    res.json({ items });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'YouTube search failed' });
  }
});

// Import playlist from URL
// POST /api/youtube/import-playlist
router.post('/import-playlist', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Extract playlist ID from URL
    // Formats: https://www.youtube.com/playlist?list=PLxxxxx
    let playlistId;
    if (url.includes('list=')) {
      playlistId = url.split('list=')[1].split('&')[0];
    } else {
      return res.status(400).json({ error: 'Invalid YouTube playlist URL' });
    }

    // Get playlist details
    const playlistResponse = await axios.get(`${YT_API_URL}/playlists`, {
      params: {
        key: YOUTUBE_API_KEY,
        part: 'snippet',
        id: playlistId,
      },
    });

    if (!playlistResponse.data.items || playlistResponse.data.items.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const playlistInfo = playlistResponse.data.items[0];
    
    // Get playlist items
    const itemsResponse = await axios.get(`${YT_API_URL}/playlistItems`, {
      params: {
        key: YOUTUBE_API_KEY,
        part: 'snippet',
        playlistId: playlistId,
        maxResults: 50,
      },
    });

    const tracks = (itemsResponse.data.items || []).map(item => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      image: item.snippet.thumbnails?.medium?.url || '',
      youtubeUrl: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
    })).filter(t => t.id && t.title !== 'Private video' && t.title !== 'Deleted video');

    res.json({
      name: playlistInfo.snippet.title,
      description: playlistInfo.snippet.description || '',
      image: playlistInfo.snippet.thumbnails?.medium?.url || '',
      tracks: tracks,
    });
  } catch (error) {
    console.error('Import YouTube playlist error:', error.response?.data || error.message);
    res.status(500).json({ error: error.message || 'Failed to import YouTube playlist' });
  }
});

module.exports = router;
