import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  // Register new user
  register: (userData) => api.post('/auth/register', userData),
  
  // Login user
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Logout user
  logout: () => api.post('/auth/logout'),
  
  // Get current user
  getCurrentUser: () => api.get('/auth/user'),
  
  // Check authentication status
  checkAuth: () => api.get('/auth/check'),
  
  // Update user profile
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
};

// Clinical Trials API calls
export const trialsAPI = {
  // Get all trials with optional filters
  getTrials: (params = {}) => api.get('/trials', { params }),
  
  // Get single trial by ID
  getTrial: (id) => api.get(`/trials/${id}`),
  
  // Create new trial
  createTrial: (trialData) => api.post('/trials', trialData),
  
  // Update trial
  updateTrial: (id, trialData) => api.put(`/trials/${id}`, trialData),
  
  // Delete trial
  deleteTrial: (id) => api.delete(`/trials/${id}`),
  
  // Add note to trial
  addNote: (id, noteData) => api.post(`/trials/${id}/notes`, noteData),
  
  // Get statistics overview
  getStats: () => api.get('/trials/stats/overview'),
};

// Utility functions for handling API responses
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { data, status } = error.response;
    
    if (data.messages && Array.isArray(data.messages)) {
      return data.messages.join(', ');
    }
    
    if (data.message) {
      return data.message;
    }
    
    if (data.error) {
      return data.error;
    }
    
    return `Server error (${status})`;
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection.';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred';
  }
};

export const handleApiSuccess = (response) => {
  return response.data;
};

export default api;
