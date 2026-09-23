import api from './api.js';

export const createRide = (payload) => api.post('/rides', payload);

export const listRides = (params) => api.get('/rides', { params });

export const getRide = (id) => api.get(`/rides/${id}`);

export const editRide = (id, payload) => api.patch(`/rides/${id}`, payload);

export const acceptRide = (id) => api.patch(`/rides/${id}/accept`);

export const updateRideStatus = (id, payload) => api.patch(`/rides/${id}/status`, payload);

export const cancelRide = (id, reason) => api.patch(`/rides/${id}/cancel`, { reason });

export const rateRide = (id, payload) => api.post(`/rides/${id}/rate`, payload);

export const nearbyDrivers = (params) => api.get('/drivers/nearby', { params });

export const driverEta = (driverId, to, from) =>
  api.get(`/drivers/${driverId}/eta`, {
    params: { toLat: to.lat, toLng: to.lng, ...(from ? { fromLat: from.lat, fromLng: from.lng } : {}) },
  });

export const searchPlaces = (q) => api.get('/places/search', { params: { q } });

export const reverseGeocode = (lat, lng) => api.get('/places/reverse', { params: { lat, lng } });

export const setAvailability = (isAvailable) =>
  api.patch('/drivers/availability', { isAvailable });

export const updateLocation = (payload) => api.post('/drivers/location', payload);

export const driverStats = () => api.get('/drivers/stats');

export const adminAnalytics = () => api.get('/admin/analytics');

export const adminRides = (params) => api.get('/admin/rides', { params });

export const adminDrivers = () => api.get('/admin/drivers');

export default {
  createRide,
  listRides,
  getRide,
  editRide,
  acceptRide,
  updateRideStatus,
  cancelRide,
  rateRide,
  nearbyDrivers,
  driverEta,
  searchPlaces,
  reverseGeocode,
  setAvailability,
  updateLocation,
  driverStats,
  adminAnalytics,
  adminRides,
  adminDrivers,
};