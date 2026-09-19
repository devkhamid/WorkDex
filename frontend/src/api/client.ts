import axios from 'axios';

// Backend ishlaydigan standart port. Faqat manzil .env da ko'rsatilmagan
// holatda ishlatiladi (WorkDex.Api Program.cs da http://0.0.0.0:5082 ga bog'lanadi).
const DEFAULT_API_PORT = '5082';

export const getApiBaseUrl = (): string => {
  // 1) VITE_API_URL ustun turadi — deploy paytida boshqa domen/port yoki
  //    reverse-proxy orqali ishlatish uchun:
  //    VITE_API_URL=https://api.example.uz/api
  const fromEnv = import.meta.env?.VITE_API_URL;
  if (fromEnv) {
    return String(fromEnv).replace(/\/+$/, '');
  }

  // 2) Aks holda brauzer manzilidan aniqlanadi. Protokol qattiq "http" emas,
  //    window.location.protocol dan olinadi: sayt https orqali ochilganda
  //    http so'rovni brauzer mixed-content sababli bloklaydi.
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const scheme = window.location.protocol === 'https:' ? 'https:' : 'http:';
      return `${scheme}//${hostname}:${DEFAULT_API_PORT}/api`;
    }
  }

  // 3) Lokal ishlab chiqish — avvalgidek.
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

    // 403 — token yaroqli, lekin rol yetarli emas. Bu holatda sessiyani
    // tugatmaymiz (401 dan asosiy farqi shu). ASP.NET Core ning [Authorize]
    // filtri bo'sh javob qaytaradi, shuning uchun sahifalardagi
    // `err.response?.data?.message` har doim bo'sh bo'lib, foydalanuvchi
    // "Xatolik yuz berdi" degan umumiy matnni ko'rardi. Faqat matn
    // bo'lmaganda o'zimiz to'ldiramiz — mavjud xabarlar tegilmaydi.
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
