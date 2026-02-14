const axios = require('axios');
const querystring = require('querystring');

class SpotifyService {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI;
    this.baseUrl = 'https://api.spotify.com/v1';
    this.tokenUrl = 'https://accounts.spotify.com/api/token';
    this.authUrl = 'https://accounts.spotify.com/authorize';
  }

  // Generate authorization URL for OAuth
  getAuthUrl(state = '') {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'streaming',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-library-read',
      'user-top-read',
      'user-read-recently-played'
    ].join(' ');

    const params = {
      response_type: 'code',
      client_id: this.clientId,
      scope: scopes,
      redirect_uri: this.redirectUri,
      state: state
    };

    return `${this.authUrl}?${querystring.stringify(params)}`;
  }

  // Exchange authorization code for access token
  async getTokens(code) {
    try {
      const response = await axios.post(
        this.tokenUrl,
        querystring.stringify({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Spotify token exchange error:', error.response?.data || error.message);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  // Refresh access token
  async refreshToken(refreshToken) {
    try {
      const response = await axios.post(
        this.tokenUrl,
        querystring.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Spotify refresh token error:', error.response?.data || error.message);
      throw new Error('Failed to refresh access token');
    }
  }

  // Search Spotify catalog
  async search(accessToken, query, types = ['track', 'artist', 'album', 'playlist'], limit = 20, offset = 0) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          q: query,
          type: types.join(','),
          limit,
          offset
        }
      });

      return response.data;
    } catch (error) {
      console.error('Spotify search error:', error.response?.data || error.message);
      throw new Error('Search failed');
    }
  }

  // Get track details
  async getTrack(accessToken, trackId) {
    try {
      const response = await axios.get(`${this.baseUrl}/tracks/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Spotify get track error:', error.response?.data || error.message);
      throw new Error('Failed to get track details');
    }
  }

  // Get several tracks
  async getTracks(accessToken, trackIds) {
    try {
      const response = await axios.get(`${this.baseUrl}/tracks`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          ids: trackIds.join(',')
        }
      });

      return response.data;
    } catch (error) {
      console.error('Spotify get tracks error:', error.response?.data || error.message);
      throw new Error('Failed to get tracks');
    }
  }

  // Get artist details
  async getArtist(accessToken, artistId) {
    try {
      const response = await axios.get(`${this.baseUrl}/artists/${artistId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Spotify get artist error:', error.response?.data || error.message);
      throw new Error('Failed to get artist details');
    }
  }

  // Get artist's top tracks
  async getArtistTopTracks(accessToken, artistId, market = 'US') {
    try {
      const response = await axios.get(`${this.baseUrl}/artists/${artistId}/top-tracks`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: { market }
      });

      return response.data;
    } catch (error) {
      console.error('Spotify get artist top tracks error:', error.response?.data || error.message);
      throw new Error('Failed to get artist top tracks');
    }
  }

  // Get album details
  async getAlbum(accessToken, albumId) {
    try {
      const response = await axios.get(`${this.baseUrl}/albums/${albumId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Spotify get album error:', error.response?.data || error.message);
      throw new Error('Failed to get album details');
    }
  }

  // Get user profile
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Spotify get user profile error:', error.response?.data || error.message);
      throw new Error('Failed to get user profile');
    }
  }

  // Get user's playlists
  async getUserPlaylists(accessToken, limit = 20, offset = 0) {
    try {
      const response = await axios.get(`${this.baseUrl}/me/playlists`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: { limit, offset }
      });

      return response.data;
    } catch (error) {
      console.error('Spotify get user playlists error:', error.response?.data || error.message);
      throw new Error('Failed to get user playlists');
    }
  }

  // Get playlist details
  async getPlaylist(accessToken, playlistId) {
    try {
      const response = await axios.get(`${this.baseUrl}/playlists/${playlistId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Spotify get playlist error:', error.response?.data || error.message);
      throw new Error('Failed to get playlist details');
    }
  }

  // Get playlist tracks
  async getPlaylistTracks(accessToken, playlistId, limit = 100, offset = 0) {
    try {
      const response = await axios.get(`${this.baseUrl}/playlists/${playlistId}/tracks`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: { limit, offset }
      });

      return response.data;
    } catch (error) {
      console.error('Spotify get playlist tracks error:', error.response?.data || error.message);
      throw new Error('Failed to get playlist tracks');
    }
  }

  // Get user's top tracks
  async getUserTopTracks(accessToken, timeRange = 'medium_term', limit = 20) {
    try {
      const response = await axios.get(`${this.baseUrl}/me/top/tracks`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: { time_range: timeRange, limit }
      });

      return response.data;
    } catch (error) {
      console.error('Spotify get user top tracks error:', error.response?.data || error.message);
      throw new Error('Failed to get user top tracks');
    }
  }

  // Get user's top artists
  async getUserTopArtists(accessToken, timeRange = 'medium_term', limit = 20) {
    try {
      const response = await axios.get(`${this.baseUrl}/me/top/artists`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: { time_range: timeRange, limit }
      });

      return response.data;
    } catch (error) {
      console.error('Spotify get user top artists error:', error.response?.data || error.message);
      throw new Error('Failed to get user top artists');
    }
  }

  // Get user's recently played tracks
  async getRecentlyPlayed(accessToken, limit = 20) {
    try {
      const response = await axios.get(`${this.baseUrl}/me/player/recently-played`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: { limit }
      });

      return response.data;
    } catch (error) {
      console.error('Spotify get recently played error:', error.response?.data || error.message);
      throw new Error('Failed to get recently played tracks');
    }
  }

  // Get recommendations
  async getRecommendations(accessToken, options = {}) {
    try {
      const { seed_tracks, seed_artists, seed_genres, limit = 20 } = options;
      
      const params = { limit };
      if (seed_tracks) params.seed_tracks = seed_tracks;
      if (seed_artists) params.seed_artists = seed_artists;
      if (seed_genres) params.seed_genres = seed_genres;

      const response = await axios.get(`${this.baseUrl}/recommendations`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params
      });

      return response.data;
    } catch (error) {
      console.error('Spotify get recommendations error:', error.response?.data || error.message);
      throw new Error('Failed to get recommendations');
    }
  }

  // Get featured playlists
  async getFeaturedPlaylists(accessToken, limit = 20, offset = 0, country = 'US') {
    try {
      const response = await axios.get(`${this.baseUrl}/browse/featured-playlists`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: { limit, offset, country }
      });

      return response.data;
    } catch (error) {
      console.error('Spotify get featured playlists error:', error.response?.data || error.message);
      throw new Error('Failed to get featured playlists');
    }
  }

  // Get new releases
  async getNewReleases(accessToken, limit = 20, offset = 0, country = 'US') {
    try {
      const response = await axios.get(`${this.baseUrl}/browse/new-releases`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: { limit, offset, country }
      });

      return response.data;
    } catch (error) {
      console.error('Spotify get new releases error:', error.response?.data || error.message);
      throw new Error('Failed to get new releases');
    }
  }

  // Get categories
  async getCategories(accessToken, limit = 20, offset = 0, country = 'US') {
    try {
      const response = await axios.get(`${this.baseUrl}/browse/categories`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: { limit, offset, country }
      });

      return response.data;
    } catch (error) {
      console.error('Spotify get categories error:', error.response?.data || error.message);
      throw new Error('Failed to get categories');
    }
  }

  // Get playback state
  async getPlaybackState(accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/me/player`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 204) {
        return null; // No active device
      }
      console.error('Spotify get playback state error:', error.response?.data || error.message);
      throw new Error('Failed to get playback state');
    }
  }

  // Get available genres
  async getAvailableGenres(accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/recommendations/available-genre-seeds`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Spotify get genres error:', error.response?.data || error.message);
      throw new Error('Failed to get available genres');
    }
  }

  // Get client credentials token (for non-user specific requests)
  async getClientCredentialsToken() {
    try {
      const response = await axios.post(
        this.tokenUrl,
        querystring.stringify({
          grant_type: 'client_credentials'
        }),
        {
          headers: {
            'Authorization': 'Basic ' + Buffer.from(this.clientId + ':' + this.clientSecret).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Spotify client credentials error:', error.response?.data || error.message);
      throw new Error('Failed to get client credentials token');
    }
  }
}

module.exports = new SpotifyService();
