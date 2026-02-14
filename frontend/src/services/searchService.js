import axios from 'axios';

const API_URL = 'http://localhost:4000/api/search';

// Search all content types
export const searchAll = async (query, type = 'all', limit = 20) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(API_URL, {
      params: { q: query, type, limit },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

// Advanced search with filters
export const advancedSearch = async (params) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/advanced`, params, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Advanced search error:', error);
    throw error;
  }
};

// Get search suggestions
export const getSuggestions = async (query) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/suggestions`, {
      params: { q: query },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Suggestions error:', error);
    return { suggestions: [] };
  }
};

// Get trending searches
export const getTrendingSearches = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/trending`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Trending error:', error);
    return { trending: [] };
  }
};
