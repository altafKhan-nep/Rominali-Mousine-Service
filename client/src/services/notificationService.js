import api from './api.js';

// Notifications
export const listNotifications = () => api.get('/notifications');
export const unreadCount = () => api.get('/notifications/unread-count');
export const markRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllRead = () => api.patch('/notifications/read-all');
export const subscribePush = (subscription) => api.post('/notifications/subscribe', { subscription });
export const unsubscribePush = (endpoint) => api.post('/notifications/unsubscribe', { endpoint });

export default { listNotifications, unreadCount, markRead, markAllRead, subscribePush, unsubscribePush };
