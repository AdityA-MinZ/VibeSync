// routes/youtube.js
const express = require('express');
const axios = require('axios');

const router = express.Router();
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YT_API_URL = 'https://www.googleapis.com/youtube/v3/search';

router.get('/search', async (req, res) => {
  try {
    const query = req.query.query;
    const maxResults = Number(req.query.maxResults) || 10;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const { data } = await axios.get(YT_API_URL, {
      params: {
        key: YOUTUBE_API_KEY,
        part: 'snippet',
        type: 'video',
        q: query,
        maxResults,
        videoCategoryId: '10', // Music category where available[web:23][web:29]
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

module.exports = router;
