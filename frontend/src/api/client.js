// Centralized API Client for Mini Attendance System
const API_BASE_URL = '/api';

export const getAuthToken = () => {
  return localStorage.getItem('twite_auth_token');
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('twite_auth_token', token);
  } else {
    localStorage.removeItem('twite_auth_token');
  }
};

export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('twite_auth_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const setCurrentUser = (user) => {
  if (user) {
    localStorage.setItem('twite_auth_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('twite_auth_user');
  }
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    // Session expired or invalid
    setAuthToken(null);
    setCurrentUser(null);
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Session expired. Please log in again.');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
};
