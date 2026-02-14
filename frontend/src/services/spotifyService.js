import axios from 'axios';

const API_URL = 'http://localhost:4000/api/spotify';

// Get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`
  };
};

// ============================================
// AUTHENTICATION
// ============================================

export const getSpotifyLoginUrl = async () => {
  const response = await axios.get(`${API_URL}/login`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getSpotifyStatus = async () => {
  const response = await axios.get(`${API_URL}/status`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const disconnectSpotify = async () => {
  const response = await axios.post(`${API_URL}/disconnect`, {}, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// ============================================
// SEARCH
// ============================================

export const searchSpotify = async (query, types = ['track', 'artist', 'album', 'playlist'], limit = 20) => {
  const response = await axios.get(`${API_URL}/search`, {
    params: { 
      q: query, 
      types: types.join(','), 
      limit 
    },
    headers: getAuthHeaders()
  });
  return response.data;
};

// ============================================
// TRACKS
// ============================================

export const getSpotifyTrack = async (trackId) => {
  const response = await axios.get(`${API_URL}/tracks/${trackId}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getSpotifyTracks = async (trackIds) => {
  const response = await axios.get(`${API_URL}/tracks`, {
    params: { ids: trackIds.join(',') },
    headers: getAuthHeaders()
  });
  return response.data;
};

// ============================================
// ARTISTS
// ============================================

export const getSpotifyArtist = async (artistId) => {
  const response = await axios.get(`${API_URL}/artists/${artistId}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getSpotifyArtistTopTracks = async (artistId) => {
  const response = await axios.get(`${API_URL}/artists/${artistId}/top-tracks`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// ============================================
// ALBUMS
// ============================================

export const getSpotifyAlbum = async (albumId) => {
  const response = await axios.get(`${API_URL}/albums/${albumId}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// ============================================
// USER DATA
// ============================================

export const getSpotifyProfile = async () => {
  const response = await axios.get(`${API_URL}/me`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getSpotifyPlaylists = async (limit = 20, offset = 0) => {
  const response = await axios.get(`${API_URL}/me/playlists`, {
    params: { limit, offset },
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getSpotifyTopTracks = async (timeRange = 'medium_term', limit = 20) => {
  const response = await axios.get(`${API_URL}/me/top/tracks`, {
    params: { time_range: timeRange, limit },
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getSpotifyTopArtists = async (timeRange = 'medium_term', limit = 20) => {
  const response = await axios.get(`${API_URL}/me/top/artists`, {
    params: { time_range: timeRange, limit },
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getSpotifyRecentlyPlayed = async (limit = 20) => {
  const response = await axios.get(`${API_URL}/me/recently-played`, {
    params: { limit },
    headers: getAuthHeaders()
  });
  return response.data;
};

// ============================================
// PLAYLISTS
// ============================================

export const getSpotifyPlaylist = async (playlistId) => {
  const response = await axios.get(`${API_URL}/playlists/${playlistId}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getSpotifyPlaylistTracks = async (playlistId, limit = 100, offset = 0) => {
  const response = await axios.get(`${API_URL}/playlists/${playlistId}/tracks`, {
    params: { limit, offset },
    headers: getAuthHeaders()
  });
  return response.data;
};

// ============================================
// BROWSE
// ============================================

export const getSpotifyFeaturedPlaylists = async (limit = 20, offset = 0, country = 'US') => {
  const response = await axios.get(`${API_URL}/browse/featured-playlists`, {
    params: { limit, offset, country },
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getSpotifyNewReleases = async (limit = 20, offset = 0, country = 'US') => {
  const response = await axios.get(`${API_URL}/browse/new-releases`, {
    params: { limit, offset, country },
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getSpotifyCategories = async (limit = 20, offset = 0, country = 'US') => {
  const response = await axios.get(`${API_URL}/browse/categories`, {
    params: { limit, offset, country },
    headers: getAuthHeaders()
  });
  return response.data;
};

// ============================================
// RECOMMENDATIONS
// ============================================

export const getSpotifyRecommendations = async (options = {}) => {
  const { seed_tracks, seed_artists, seed_genres, limit = 20 } = options;
  
  const params = { limit };
  if (seed_tracks) params.seed_tracks = seed_tracks;
  if (seed_artists) params.seed_artists = seed_artists;
  if (seed_genres) params.seed_genres = seed_genres;
  
  const response = await axios.get(`${API_URL}/recommendations`, {
    params,
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getSpotifyAvailableGenres = async () => {
  const response = await axios.get(`${API_URL}/recommendations/available-genre-seeds`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// ============================================
// PLAYER
// ============================================

export const getSpotifyPlaybackState = async () => {
  const response = await axios.get(`${API_URL}/me/player`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// ============================================
// UTILITIES
// ============================================

// Format duration from milliseconds to mm:ss
export const formatDuration = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Format large numbers (1,000 -> 1K)
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Get image URL with fallback
export const getSpotifyImage = (images, size = 'medium') => {
  if (!images || images.length === 0) {
    return 'https://via.placeholder.com/300x300/252b4a/ffffff?text=No+Image';
  }
  
  // Return appropriate size
  if (size === 'large' && images[0]) return images[0].url;
  if (size === 'small' && images[images.length - 1]) return images[images.length - 1].url;
  
  // Return medium (middle image or first if only one)
  const middleIndex = Math.floor(images.length / 2);
  return images[middleIndex]?.url || images[0].url;
};
