import axios from 'axios';

// In dev, API is same-origin via the Vite proxy. In production, point to the
// deployed backend with VITE_API_URL (e.g. https://your-api.onrender.com).
export const API_ROOT = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL: `${API_ROOT}/api` });

// Tokens are stored PER ROLE (rt_admin_* / rt_driver_* / rt_passenger_*) so an
// admin and a driver can stay signed in at the same time in different tabs —
// one role's login never overwrites another role's session. Each tab tracks its
// own "active role" in sessionStorage (per-tab, not shared), so both dashboards
// keep working side by side.
const ROLES = ['passenger', 'driver', 'admin'];

function roleFromUrl() {
  const p = window.location.pathname;
  if (p.startsWith('/driver')) return 'driver';
  if (p.startsWith('/admin')) return 'admin';
  return 'passenger';
}

let activeRole = sessionStorage.getItem('rt_active_role') || roleFromUrl();

const store = {
  get role() {
    return activeRole;
  },
  setActiveRole(role) {
    activeRole = ROLES.includes(role) ? role : 'passenger';
    sessionStorage.setItem('rt_active_role', activeRole);
  },
  key(role = activeRole) {
    return `rt_${role}`;
  },
  get access() {
    return localStorage.getItem(`${store.key()}_access`);
  },
  get refresh() {
    return localStorage.getItem(`${store.key()}_refresh`);
  },
  setTokens(access, refresh, role = activeRole) {
    localStorage.setItem(`${store.key(role)}_access`, access);
    localStorage.setItem(`${store.key(role)}_refresh`, refresh);
  },
  clear(role = activeRole) {
    localStorage.removeItem(`${store.key(role)}_access`);
    localStorage.removeItem(`${store.key(role)}_refresh`);
  },
  // Pick which role's session a freshly-opened tab should use: the tab's own
  // active role first, otherwise the first remembered session we find.
  resolveRole() {
    if (localStorage.getItem(`${store.key()}_access`)) return activeRole;
    return ROLES.find((r) => localStorage.getItem(`${store.key(r)}_access`)) || 'passenger';
  },
};
export const tokenStore = store;

let isRefreshing = false;
let queue = [];

const onRefreshed = (token) => {
  queue.forEach((cb) => cb(token));
  queue = [];
};

api.interceptors.request.use((config) => {
  const token = store.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && !original._retry && store.refresh) {
      if (isRefreshing) {
        return new Promise((resolve) => queue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        }));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_ROOT}/api/auth/refresh`, {
          refreshToken: store.refresh,
        });
        store.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
        onRefreshed(data.tokens.accessToken);
        original.headers.Authorization = `Bearer ${data.tokens.accessToken}`;
        return api(original);
      } catch (refreshError) {
        store.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 403 "Insufficient permissions" means the stored token belongs to a different
    // role/user than the one the app believes is logged in (e.g. a second role was
    // signed in in the same browser and overwrote localStorage). Force a fresh login
    // instead of leaving a broken dashboard showing errors forever.
    if (status === 403 && error.response?.data?.message === 'Insufficient permissions') {
      store.clear();
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;