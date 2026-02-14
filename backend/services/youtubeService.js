const axios = require('axios');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

class YouTubeService {
  constructor() {
    this.apiKey = YOUTUBE_API_KEY;
    this.baseUrl = YOUTUBE_BASE_URL;
  }

  // Search YouTube
  async search(query, type = 'video', maxResults = 20) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          q: query,
          type: type,
          maxResults: maxResults,
          key: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('YouTube search error:', error.response?.data || error.message);
      throw new Error('YouTube search failed');
    }
  }

  // Get video details
  async getVideo(videoId) {
    try {
      const response = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoId,
          key: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('YouTube get video error:', error.response?.data || error.message);
      throw new Error('Failed to get video details');
    }
  }

  // Get multiple videos
  async getVideos(videoIds) {
    try {
      const response = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoIds.join(','),
          key: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('YouTube get videos error:', error.response?.data || error.message);
      throw new Error('Failed to get videos');
    }
  }

  // Get video comments
  async getVideoComments(videoId, maxResults = 20) {
    try {
      const response = await axios.get(`${this.baseUrl}/commentThreads`, {
        params: {
          part: 'snippet',
          videoId: videoId,
          maxResults: maxResults,
          key: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('YouTube get comments error:', error.response?.data || error.message);
      throw new Error('Failed to get video comments');
    }
  }

  // Search for music videos specifically
  async searchMusic(query, maxResults = 20) {
    try {
      // Add "music" or "official video" to improve music search results
      const musicQuery = `${query} music`;
      
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          q: musicQuery,
          type: 'video',
          videoCategoryId: '10', // Music category
          maxResults: maxResults,
          key: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('YouTube music search error:', error.response?.data || error.message);
      throw new Error('YouTube music search failed');
    }
  }

  // Get trending videos (music category)
  async getTrendingMusic(regionCode = 'US', maxResults = 20) {
    try {
      const response = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          part: 'snippet,statistics',
          chart: 'mostPopular',
          videoCategoryId: '10', // Music category
          regionCode: regionCode,
          maxResults: maxResults,
          key: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('YouTube trending error:', error.response?.data || error.message);
      throw new Error('Failed to get trending music');
    }
  }

  // Get related videos
  async getRelatedVideos(videoId, maxResults = 10) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          relatedToVideoId: videoId,
          type: 'video',
          maxResults: maxResults,
          key: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('YouTube related videos error:', error.response?.data || error.message);
      throw new Error('Failed to get related videos');
    }
  }

  // Get playlist items
  async getPlaylistItems(playlistId, maxResults = 50) {
    try {
      const response = await axios.get(`${this.baseUrl}/playlistItems`, {
        params: {
          part: 'snippet,contentDetails',
          playlistId: playlistId,
          maxResults: maxResults,
          key: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('YouTube playlist items error:', error.response?.data || error.message);
      throw new Error('Failed to get playlist items');
    }
  }

  // Get playlist details
  async getPlaylist(playlistId) {
    try {
      const response = await axios.get(`${this.baseUrl}/playlists`, {
        params: {
          part: 'snippet,contentDetails',
          id: playlistId,
          key: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('YouTube playlist error:', error.response?.data || error.message);
      throw new Error('Failed to get playlist');
    }
  }

  // Get channel details
  async getChannel(channelId) {
    try {
      const response = await axios.get(`${this.baseUrl}/channels`, {
        params: {
          part: 'snippet,statistics,contentDetails',
          id: channelId,
          key: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('YouTube channel error:', error.response?.data || error.message);
      throw new Error('Failed to get channel');
    }
  }

  // Search channels
  async searchChannels(query, maxResults = 10) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          q: query,
          type: 'channel',
          maxResults: maxResults,
          key: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('YouTube channel search error:', error.response?.data || error.message);
      throw new Error('YouTube channel search failed');
    }
  }

  // Format duration from ISO 8601 to mm:ss
  formatDuration(isoDuration) {
    if (!isoDuration) return '0:00';
    
    const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';
    
    const hours = (match[1] || '').replace('H', '') || 0;
    const minutes = (match[2] || '').replace('M', '') || 0;
    const seconds = (match[3] || '').replace('S', '') || 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Format view count
  formatViewCount(count) {
    const num = parseInt(count);
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}

module.exports = new YouTubeService();
