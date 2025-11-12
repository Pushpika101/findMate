import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, STORAGE_KEYS } from '../utils/constants';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response) {
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      }
      
      return Promise.reject(
        error.response.data?.message || 'An error occurred'
      );
    } else if (error.request) {
      return Promise.reject('Network error. Please check your connection.');
    } else {
      return Promise.reject(error.message);
    }
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (data) => api.post('/auth/resend-verification', data),
  sendOtp: (data) => api.post('/auth/send-otp', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  // OTP-based forgot password (sends 6-digit code to email)
  forgotPasswordOtp: (data) => api.post('/auth/forgot-password-otp', data),
  // verify/reset using otp
  verifyResetOtp: (data) => api.post('/auth/verify-reset-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  resetPasswordWithOtp: (data) => api.post('/auth/reset-password-otp', data),
  getMe: () => api.get('/auth/me')
};

// Items API
export const itemsAPI = {
  getAll: (params) => api.get('/items', { params }),
  getById: (id) => api.get(`/items/${id}`),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'photo1' || key === 'photo2') {
        if (data[key]) {
          formData.append(key, {
            uri: data[key].uri,
            type: 'image/jpeg',
            name: `${key}.jpg`
          });
        }
      } else {
        formData.append(key, data[key]);
      }
    });
    return api.post('/items', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'photo1' || key === 'photo2') {
        if (data[key] && data[key].uri) {
          formData.append(key, {
            uri: data[key].uri,
            type: 'image/jpeg',
            name: `${key}.jpg`
          });
        }
      } else {
        formData.append(key, data[key]);
      }
    });
    return api.put(`/items/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => api.delete(`/items/${id}`),
  getMyItems: (params) => api.get('/items/my-items', { params }),
  claim: (id) => api.post(`/items/${id}/claim`),
  resolve: (id) => api.put(`/items/${id}/resolve`),
  getShareLink: (id) => api.get(`/items/${id}/share`)
};

// Chat API
export const chatAPI = {
  getAll: () => api.get('/chats'),
  getById: (id) => api.get(`/chats/${id}`),
  create: (data) => api.post('/chats', data),
  sendMessage: (chatId, message) => api.post(`/chats/${chatId}/messages`, { message_text: message }),
  markAsRead: (chatId) => api.put(`/chats/${chatId}/read`),
  delete: (id) => api.delete(`/chats/${id}`),
  getUnreadCount: () => api.get('/chats/unread-count')
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  registerToken: (token) => api.post('/notifications/register-token', { token }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`)
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updateProfilePhoto: (photo) => {
    const formData = new FormData();
    formData.append('photo', {
      uri: photo.uri,
      type: 'image/jpeg',
      name: 'profile.jpg'
    });
    return api.post('/users/profile-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  changePassword: (data) => api.put('/users/change-password', data),
  getStatistics: () => api.get('/users/statistics')
};

export default api;