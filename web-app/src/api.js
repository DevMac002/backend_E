import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function setAccessToken(token) {
  localStorage.setItem('accessToken', token);
}

export function clearAccessToken() {
  localStorage.removeItem('accessToken');
}

export default api;
