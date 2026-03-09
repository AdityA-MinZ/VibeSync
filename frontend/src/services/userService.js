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
    
    // If no token, return null profile
    if (!token) {
      return null;
    }
    
    const url = userId ? `${API_URL}/users/${userId}` : `${API_URL}/users/me`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get user profile error:', error);
    // Return null on error
    return null;
  }
};

export const getUserByUsername = async (username) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('No token found');
      return null;
    }
    
    console.log('Fetching user by username:', username);
    const response = await axios.get(`${API_URL}/users/username/${username}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('getUserByUsername response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get user by username error:', error);
    console.error('Error response:', error.response?.data);
    return null;
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

export const getPublicPlaylists = async (limit = 20, skip = 0) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/playlists`, {
      params: { limit, skip },
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  } catch (error) {
    console.error('Get public playlists error:', error);
    throw error;
  }
};

export const getUserPlaylists = async (userId, limit = 20, skip = 0) => {
  try {
    const token = localStorage.getItem('token');
    
    // If no token, return empty array
    if (!token) {
      return [];
    }
    
    // If userId is provided but invalid, return empty array
    if (userId && typeof userId !== 'string') {
      console.error('Invalid userId:', userId);
      return [];
    }
    
    const url = userId 
      ? `${API_URL}/playlists/user/${userId}` 
      : `${API_URL}/playlists/me`;
    console.log('Fetching playlists from URL:', url, 'with userId:', userId);
    const response = await axios.get(url, {
      params: { limit, skip },
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Playlists response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get user playlists error:', error);
    console.error('Error response:', error.response?.data);
    // Return empty array on error instead of falling back to all playlists
    return [];
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
    
    // If no token, return empty activity
    if (!token) {
      return [];
    }
    
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
    // Return empty activity on error
    return [];
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

export const incrementPlaylistPlays = async (playlistId) => {
  try {
    const response = await axios.post(`${API_URL}/playlists/${playlistId}/plays`);
    return response.data;
  } catch (error) {
    console.error('Increment plays error:', error);
    throw error;
  }
};
