import axios from 'axios';
import { API_URL, SOCIAL_API_URL } from '../config';

// ========== LIKES ==========

export const toggleLike = async (targetType, targetId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${SOCIAL_API_URL}/likes/toggle`,
      { targetType, targetId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Toggle like error:', error);
    throw error;
  }
};

export const checkLike = async (targetType, targetId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${SOCIAL_API_URL}/likes/check`, {
      params: { targetType, targetId },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Check like error:', error);
    throw error;
  }
};

export const getLikeCount = async (targetType, targetId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${SOCIAL_API_URL}/likes/count`, {
      params: { targetType, targetId },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get like count error:', error);
    throw error;
  }
};

export const getMultipleLikeCounts = async (targets) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${SOCIAL_API_URL}/likes/counts`,
      { targets },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Get multiple like counts error:', error);
    throw error;
  }
};

export const getMyLikes = async (targetType, limit = 20, skip = 0) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${SOCIAL_API_URL}/likes/me`, {
      params: { targetType, limit, skip },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get my likes error:', error);
    throw error;
  }
};

// ========== FOLLOWS ==========

export const followUser = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${SOCIAL_API_URL}/follow/${userId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Follow user error:', error);
    throw error;
  }
};

export const unfollowUser = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${SOCIAL_API_URL}/unfollow/${userId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Unfollow user error:', error);
    throw error;
  }
};

export const checkFollowStatus = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${SOCIAL_API_URL}/follow/status/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Check follow status error:', error);
    throw error;
  }
};

export const getFollowers = async (userId, limit = 20, skip = 0) => {
  try {
    const token = localStorage.getItem('token');
    const url = userId 
      ? `${SOCIAL_API_URL}/followers/${userId}` 
      : `${SOCIAL_API_URL}/followers`;
    const response = await axios.get(url, {
      params: { limit, skip },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get followers error:', error);
    throw error;
  }
};

export const getFollowing = async (userId, limit = 20, skip = 0) => {
  try {
    const token = localStorage.getItem('token');
    const url = userId 
      ? `${SOCIAL_API_URL}/following/${userId}` 
      : `${SOCIAL_API_URL}/following`;
    const response = await axios.get(url, {
      params: { limit, skip },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get following error:', error);
    throw error;
  }
};

export const getFollowCounts = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const url = userId 
      ? `${SOCIAL_API_URL}/follow/counts/${userId}` 
      : `${SOCIAL_API_URL}/follow/counts`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get follow counts error:', error);
    throw error;
  }
};

export const getFollowSuggestions = async (limit = 10) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${SOCIAL_API_URL}/follow/suggestions`, {
      params: { limit },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get follow suggestions error:', error);
    throw error;
  }
};

export const searchUsers = async (query, limit = 20, skip = 0) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${SOCIAL_API_URL}/users/search`, {
      params: { q: query, limit, skip },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Search users error:', error);
    throw error;
  }
};

// ========== COMMENTS ==========

export const addComment = async (targetType, targetId, content, parentCommentId = null) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${SOCIAL_API_URL}/comments`,
      { targetType, targetId, content, parentCommentId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Add comment error:', error);
    throw error;
  }
};

export const getComments = async (targetType, targetId, limit = 20, skip = 0, sortBy = 'newest') => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${SOCIAL_API_URL}/comments`, {
      params: { targetType, targetId, limit, skip, sortBy },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get comments error:', error);
    throw error;
  }
};

export const getComment = async (commentId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${SOCIAL_API_URL}/comments/${commentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get comment error:', error);
    throw error;
  }
};

export const editComment = async (commentId, content) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${SOCIAL_API_URL}/comments/${commentId}`,
      { content },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Edit comment error:', error);
    throw error;
  }
};

export const deleteComment = async (commentId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${SOCIAL_API_URL}/comments/${commentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Delete comment error:', error);
    throw error;
  }
};

export const getUserComments = async (userId, limit = 20, skip = 0) => {
  try {
    const token = localStorage.getItem('token');
    const url = userId 
      ? `${SOCIAL_API_URL}/comments/user/${userId}` 
      : `${SOCIAL_API_URL}/comments/user`;
    const response = await axios.get(url, {
      params: { limit, skip },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get user comments error:', error);
    throw error;
  }
};

export const likeComment = async (commentId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${SOCIAL_API_URL}/comments/${commentId}/like`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Like comment error:', error);
    throw error;
  }
};

export const unlikeComment = async (commentId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${SOCIAL_API_URL}/comments/${commentId}/unlike`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Unlike comment error:', error);
    throw error;
  }
};

// ========== BOARDS ==========

export const createBoard = async (boardData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${SOCIAL_API_URL}/boards`,
      boardData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Create board error:', error);
    throw error;
  }
};

export const getPublicBoards = async (limit = 20, skip = 0, tag, sortBy = 'newest') => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${SOCIAL_API_URL}/boards`, {
      params: { limit, skip, tag, sortBy },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get public boards error:', error);
    throw error;
  }
};

export const getUserBoards = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const url = userId 
      ? `${SOCIAL_API_URL}/boards/user/${userId}` 
      : `${SOCIAL_API_URL}/boards/user`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get user boards error:', error);
    throw error;
  }
};

export const getBoard = async (boardId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${SOCIAL_API_URL}/boards/${boardId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get board error:', error);
    throw error;
  }
};

export const updateBoard = async (boardId, boardData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${SOCIAL_API_URL}/boards/${boardId}`,
      boardData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Update board error:', error);
    throw error;
  }
};

export const deleteBoard = async (boardId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${SOCIAL_API_URL}/boards/${boardId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Delete board error:', error);
    throw error;
  }
};

export const addItemToBoard = async (boardId, itemData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${SOCIAL_API_URL}/boards/${boardId}/items`,
      itemData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Add item to board error:', error);
    throw error;
  }
};

export const removeItemFromBoard = async (boardId, itemId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.delete(
      `${SOCIAL_API_URL}/boards/${boardId}/items/${itemId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Remove item from board error:', error);
    throw error;
  }
};

export const addCollaborator = async (boardId, userId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${SOCIAL_API_URL}/boards/${boardId}/collaborators`,
      { userId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Add collaborator error:', error);
    throw error;
  }
};

export const removeCollaborator = async (boardId, userId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.delete(
      `${SOCIAL_API_URL}/boards/${boardId}/collaborators/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Remove collaborator error:', error);
    throw error;
  }
};

export const followBoard = async (boardId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${SOCIAL_API_URL}/boards/${boardId}/follow`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Follow board error:', error);
    throw error;
  }
};

export const unfollowBoard = async (boardId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${SOCIAL_API_URL}/boards/${boardId}/unfollow`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Unfollow board error:', error);
    throw error;
  }
};

export const searchBoards = async (query, limit = 20, skip = 0) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${SOCIAL_API_URL}/boards/search`, {
      params: { q: query, limit, skip },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Search boards error:', error);
    throw error;
  }
};
