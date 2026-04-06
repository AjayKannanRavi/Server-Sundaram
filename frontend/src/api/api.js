import axios from 'axios';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/api').replace(/\/$/, '');
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8085/ws';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor to add Tenant ID to every request
api.interceptors.request.use(
  (config) => {
    // 1. Check URL for hotelId (Customer/Order flow)
    const urlParams = new URLSearchParams(window.location.search);
    let hotelId = urlParams.get('hotelId');

    // 2. Fallback to Local Storage (Staff/Admin flow)
    if (!hotelId) {
      hotelId = localStorage.getItem('hotelId');
    }

    // 3. Fallback to path (e.g. /dashboard/54)
    if (!hotelId) {
      const match = window.location.pathname.match(/\/(dashboard|admin|menu)\/(\d+)/);
      if (match) hotelId = match[2];
    }

    if (hotelId) {
      config.headers['X-Tenant-ID'] = hotelId;
    } else {
      // Default to master for SaaS management APIs
      config.headers['X-Tenant-ID'] = 'master';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
