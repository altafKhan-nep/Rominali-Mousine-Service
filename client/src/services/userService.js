import api from './api.js';

// User profile
export const getProfile = () => api.get('/users/me');
export const updateProfile = (payload) => api.patch('/users/me', payload);
export const setAvatar = (dataUrl) => api.post('/users/me/avatar', { dataUrl });
export const removeAvatar = () => api.delete('/users/me/avatar');
export const changePassword = (payload) => api.patch('/users/me/password', payload);

export default { getProfile, updateProfile, setAvatar, removeAvatar, changePassword };
