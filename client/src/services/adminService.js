import api from './api.js';

// Admin CRM
export const adminUsers = (params) => api.get('/admin/users', { params });
export const adminSuspendUser = (id) => api.patch(`/admin/users/${id}/suspend`);
export const adminUnsuspendUser = (id) => api.patch(`/admin/users/${id}/unsuspend`);
export const adminDeleteUser = (id) => api.delete(`/admin/users/${id}`);
export const adminPayments = (params) => api.get('/admin/payments', { params });
export const adminSettings = () => api.get('/admin/settings');
export const adminUpdateSettings = (payload) => api.patch('/admin/settings', payload);
export const adminAssignDriver = (rideId, driverId) =>
  api.patch(`/admin/rides/${rideId}/driver`, { driverId });

export default { adminUsers, adminSuspendUser, adminUnsuspendUser, adminDeleteUser, adminPayments, adminSettings, adminUpdateSettings, adminAssignDriver };
