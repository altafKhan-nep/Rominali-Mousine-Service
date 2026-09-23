import api, { tokenStore } from './api.js';

export const register = (payload) => api.post('/auth/register', payload);

export const login = (payload) => api.post('/auth/login', payload);

export const getMe = () => api.get('/auth/me');

export const verifyEmail = (token) => api.post('/auth/verify-email', { token });

export const resendVerification = (email) => api.post('/auth/resend-verification', { email });

export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });

export const resetPassword = (token, password) => api.post('/auth/reset-password', { token, password });

// Server-side logout revokes this device's refresh token. Best-effort: even if
// it fails, local tokens are always cleared.
export const logout = async () => {
  try {
    if (tokenStore.access) {
      await api.post('/auth/logout', { refreshToken: tokenStore.refresh });
    }
  } catch {
    // ignore — the stored token is revoked locally and invalidated by rotation
  } finally {
    tokenStore.clear();
    window.location.href = '/login';
  }
};

export default { register, login, getMe, verifyEmail, resendVerification, forgotPassword, resetPassword, logout };