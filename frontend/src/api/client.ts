import axios from 'axios';

const DEFAULT_API_PORT = '5082';

export const getApiBaseUrl = (): string => {
  const fromEnv = import.meta.env?.VITE_API_URL;
  if (fromEnv) {
    return String(fromEnv).replace(/\/+$/, '');
  }

  if (import.meta.env.PROD) {
    return '/api';
  }

  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const scheme = window.location.protocol === 'https:' ? 'https:' : 'http:';
      return `${scheme}//${hostname}:${DEFAULT_API_PORT}/api`;
    }
  }

  return `http://localhost:${DEFAULT_API_PORT}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

export const getFileUrl = (filePath: string): string => {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  const baseUrl = API_BASE_URL.replace(/\/api$/, '');
  return `${baseUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('workdex_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('workdex_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 403 && !error.response.data?.message) {
      const existing = typeof error.response.data === 'object' && error.response.data !== null
        ? error.response.data
        : {};
      error.response.data = {
        ...existing,
        message: "Bu amalni bajarish uchun sizning rolingizda ruxsat yo'q."
      };
    }

    return Promise.reject(error);
  }
);
