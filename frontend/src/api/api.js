import axios from 'axios';

const isBrowser = typeof window !== 'undefined';
const defaultApiBaseUrl = isBrowser ? '/api' : 'http://localhost:8085/api';
const defaultWsBaseUrl = isBrowser
  ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
  : 'ws://localhost:8085/ws';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl).replace(/\/$/, '');
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || defaultWsBaseUrl;
export const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export const getFullImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://localhost:8085/uploads')) {
    return BACKEND_BASE_URL + url.substring('http://localhost:8085'.length);
  }
  if (url.startsWith('/uploads')) {
    return BACKEND_BASE_URL + url;
  }
  return url;
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

const SESSION_KEY_BY_ROLE_SEGMENT = {
  owner: 'owner_session',
  admin: 'admin_session',
  captain: 'captain_session',
  kitchen: 'kitchen_session',
};

const STAFF_ROLE_SEGMENTS = ['owner', 'admin', 'captain', 'kitchen'];

const SESSION_KEYS = ['owner_session', 'admin_session', 'captain_session', 'kitchen_session'];

const parseSession = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return { key, ...parsed };
  } catch (_) {
    return null;
  }
};

const getSessionToken = (session) => {
  if (!session) return null;
  const token = session.token || session.accessToken || session.jwt;
  return typeof token === 'string' && token.trim() ? token.trim() : null;
};

const getRouteContext = () => {
  const path = window.location.pathname;
  const scopedPath = path.match(/^\/([^/]+)\/(owner|admin|captain|kitchen|menu|login|tracker|bill|review)(?:\/|$)/);
  return {
    hotelIdFromPath: scopedPath?.[1] || null,
    roleSegment: scopedPath?.[2] || null,
  };
};

const resolveHotelId = () => {
  const routeContext = getRouteContext();

  const urlParams = new URLSearchParams(window.location.search);
  let hotelId = urlParams.get('hotelId');

  if (!hotelId && routeContext.hotelIdFromPath) {
    hotelId = routeContext.hotelIdFromPath;
  }

  if (!hotelId) {
    const legacyPath = window.location.pathname.match(/\/(dashboard|admin|menu)\/(\d+)/);
    if (legacyPath) hotelId = legacyPath[2];
  }

  if (!hotelId) {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const reserved = new Set(['admin', 'owner', 'captain', 'kitchen', 'menu', 'login', 'tracker', 'bill', 'review', 'register', 'saas-admin']);
    if (pathSegments.length > 0 && !reserved.has(pathSegments[0])) {
      hotelId = pathSegments[0];
    }
  }

  if (!hotelId) {
    for (const key of SESSION_KEYS) {
      const parsed = parseSession(key);
      if (parsed?.hotelId) {
        hotelId = String(parsed.hotelId);
        break;
      }
    }
  }

  if (!hotelId) {
    hotelId = localStorage.getItem('hotelId');
  }

  return hotelId;
};

const resolveToken = () => {
  const resolvedHotelId = resolveHotelId();
  const routeContext = getRouteContext();

  // 1) Prefer token from current route role session (owner/admin/captain/kitchen), scoped by hotel.
  const preferredKey = SESSION_KEY_BY_ROLE_SEGMENT[routeContext.roleSegment];
  if (preferredKey) {
    const preferredSession = parseSession(preferredKey);
    const preferredToken = getSessionToken(preferredSession);
    if (preferredToken) {
      // Legacy sessions may not persist hotelId; prefer current role token in that case.
      if (!resolvedHotelId || !preferredSession?.hotelId || String(preferredSession?.hotelId) === String(resolvedHotelId)) {
        return preferredToken;
      }
    }
  }

  // 2) Otherwise use any session that matches the resolved hotel.
  for (const key of SESSION_KEYS) {
    const session = parseSession(key);
    const token = getSessionToken(session);
    if (!token) continue;
    if (resolvedHotelId && String(session?.hotelId) === String(resolvedHotelId)) {
      return token;
    }
  }

  // 3) Last fallback: any available token.
  for (const key of SESSION_KEYS) {
    const token = getSessionToken(parseSession(key));
    if (token) return token;
  }

  const fallbackToken = localStorage.getItem('token') || localStorage.getItem('auth_token');
  if (typeof fallbackToken === 'string' && fallbackToken.trim()) {
    return fallbackToken.trim();
  }
  return null;
};

const attachCommonHeaders = (config) => {
  const nextConfig = config;
  nextConfig.headers = nextConfig.headers || {};

  const hasExplicitHotelHeader =
    nextConfig.headers['X-Hotel-Id'] ||
    nextConfig.headers['x-hotel-id'] ||
    nextConfig.headers['X-Tenant-ID'] ||
    nextConfig.headers['x-tenant-id'];

  if (!hasExplicitHotelHeader) {
    const hotelId = resolveHotelId();
    if (hotelId) {
      nextConfig.headers['X-Hotel-Id'] = hotelId;
    } else {
      nextConfig.headers['X-Hotel-Id'] = 'master';
    }
  }

  const hasExplicitAuthHeader =
    nextConfig.headers.Authorization || nextConfig.headers.authorization;

  if (!hasExplicitAuthHeader) {
    const token = resolveToken();
    if (token) {
      nextConfig.headers.Authorization = `Bearer ${token}`;
    }
  }

  return nextConfig;
};

api.interceptors.request.use(
  (config) => attachCommonHeaders(config),
  (error) => Promise.reject(error)
);

axios.interceptors.request.use(
  (config) => attachCommonHeaders(config),
  (error) => Promise.reject(error)
);

const clearStaffSessions = () => {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem('token');
  localStorage.removeItem('auth_token');
};

const resolveLoginPathFromRoute = () => {
  const routeContext = getRouteContext();
  if (!routeContext?.hotelIdFromPath || !routeContext?.roleSegment) {
    return '/login';
  }

  const loginRoleSegment = routeContext.roleSegment;
  if (!STAFF_ROLE_SEGMENTS.includes(loginRoleSegment)) {
    const queryParams = new URLSearchParams(window.location.search);
    const tableId = queryParams.get('tableId') || queryParams.get('tableid');
    const tableSuffix = tableId ? `?tableId=${encodeURIComponent(tableId)}` : '';
    return `/${routeContext.hotelIdFromPath}/login${tableSuffix}`;
  }

  return `/${routeContext.hotelIdFromPath}/${loginRoleSegment}/login`;
};

const handleUnauthorized = (error) => {
  const status = error?.response?.status;
  if (status !== 401 || typeof window === 'undefined') {
    return Promise.reject(error);
  }

  const currentPath = window.location.pathname || '';
  if (currentPath.includes('/login')) {
    return Promise.reject(error);
  }

  const routeContext = getRouteContext();
  const isStaffRoute = STAFF_ROLE_SEGMENTS.includes(routeContext?.roleSegment || '');
  if (!isStaffRoute) {
    return Promise.reject(error);
  }

  clearStaffSessions();
  window.location.assign(resolveLoginPathFromRoute());
  return Promise.reject(error);
};

api.interceptors.response.use(
  (response) => response,
  (error) => handleUnauthorized(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => handleUnauthorized(error)
);

export default api;
