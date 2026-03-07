import axios from 'axios';
import API_URL from '../config';

export const updateStreak = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/streaks/update`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Update streak error:', error);
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const url = userId ? `${API_URL}/users/${userId}` : `${API_URL}/users/me`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

export const updateUserProfile = async (userData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${API_URL}/users/me`,
      userData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
};

export const getUserPlaylists = async (userId, limit = 20, skip = 0) => {
  try {
    const token = localStorage.getItem('token');
    
    // If no token, try to get public playlists
    if (!token) {
      const response = await axios.get(`${API_URL}/playlists`, {
        params: { limit, skip }
      });
      return response.data;
    }
    
    const url = userId 
      ? `${API_URL}/playlists/user/${userId}` 
      : `${API_URL}/playlists/me`;
    const response = await axios.get(url, {
      params: { limit, skip },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get user playlists error:', error);
    // Fallback to public playlists if auth fails
    try {
      const response = await axios.get(`${API_URL}/playlists`, {
        params: { limit, skip }
      });
      return response.data;
    } catch (fallbackError) {
      console.error('Fallback playlists error:', fallbackError);
      throw fallbackError;
    }
  }
};

export const getUserStats = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    
    // If no token, return default stats
    if (!token) {
      return {
        totalPlaylists: 0,
        totalTracks: 0,
        totalLikes: 0,
        topGenres: [],
        recentActivity: []
      };
    }
    
    const url = userId 
      ? `${API_URL}/users/${userId}/stats` 
      : `${API_URL}/users/me/stats`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get user stats error:', error);
    // Return default stats on error
    return {
      totalPlaylists: 0,
      totalTracks: 0,
      totalLikes: 0,
      topGenres: [],
      recentActivity: []
    };
  }
};

export const getUserActivity = async (userId, limit = 10) => {
  try {
    const token = localStorage.getItem('token');
    const url = userId 
      ? `${API_URL}/users/${userId}/activity` 
      : `${API_URL}/users/me/activity`;
    const response = await axios.get(url, {
      params: { limit },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get user activity error:', error);
    throw error;
  }
};

export const importSpotifyPlaylist = async (url) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/spotify/import-playlist`,
      { url },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Import Spotify playlist error:', error);
    throw error;
  }
};

export const importYouTubePlaylist = async (url) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/youtube/import-playlist`,
      { url },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Import YouTube playlist error:', error);
    throw error;
  }
};

export const searchTracks = async (query) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/search/tracks`, {
      params: { q: query },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Search tracks error:', error);
    throw error;
  }
};

export const createPlaylist = async (playlistData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/playlists`,
      playlistData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Create playlist error:', error);
    throw error;
  }
};

export const deletePlaylist = async (playlistId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.delete(
      `${API_URL}/playlists/${playlistId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Delete playlist error:', error);
    throw error;
  }
};
