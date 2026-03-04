import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

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
    throw error;
  }
};

export const getUserStats = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const url = userId 
      ? `${API_URL}/users/${userId}/stats` 
      : `${API_URL}/users/me/stats`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get user stats error:', error);
    throw error;
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
