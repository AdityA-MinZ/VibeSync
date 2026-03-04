import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

export const getNotifications = async (options = {}) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/notifications`, {
      params: options,
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get notifications error:', error);
    throw error;
  }
};

export const getUnreadCount = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get unread count error:', error);
    throw error;
  }
};

export const markAsRead = async (notificationId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${API_URL}/notifications/${notificationId}/read`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Mark as read error:', error);
    throw error;
  }
};

export const markAllAsRead = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${API_URL}/notifications/read-all`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Mark all as read error:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.delete(
      `${API_URL}/notifications/${notificationId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Delete notification error:', error);
    throw error;
  }
};
