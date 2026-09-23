import api from './api.js';

// Payments
export const payRide = (rideId, payload) => api.post(`/rides/${rideId}/pay`, payload);
export const createPaymentIntent = (rideId) => api.post(`/rides/${rideId}/payment-intent`);
export const listPayments = () => api.get('/payments');
export const getPayment = (id) => api.get(`/payments/${id}`);
export const refundPayment = (id) => api.post(`/payments/${id}/refund`);
export const requestRefund = (id, reason) => api.post(`/payments/${id}/request-refund`, { reason });
export const listRefundRequests = () => api.get('/payments/requests');
export const decideRefund = (requestId, approve, note) => api.post(`/payments/requests/${requestId}/decision`, { approve, note });

export default { payRide, createPaymentIntent, listPayments, getPayment, refundPayment };
