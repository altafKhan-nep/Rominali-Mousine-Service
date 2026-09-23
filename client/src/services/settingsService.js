import api from './api.js';

// Public app settings (support info, payment toggle)
export const getPublicSettings = () => api.get('/settings');

export default { getPublicSettings };
