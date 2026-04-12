// axios.js - Configured axios instance that auto-attaches the JWT token
import axios from 'axios';

// Create an axios instance pointing to our backend
const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Before every request, attach the token from localStorage if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default api;
