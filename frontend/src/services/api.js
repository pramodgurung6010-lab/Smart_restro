import axios from 'axios';

const getAuthToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return user.token || '';
  } catch {
    return '';
  }
};

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5002/api',
});

// Always attach fresh token on every request
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export default api;
