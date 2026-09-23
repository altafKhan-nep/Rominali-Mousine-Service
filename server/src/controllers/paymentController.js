import { asyncHandler } from '../middleware/error.js';
import * as paymentService from '../services/paymentService.js';
import { notify } from '../services/notificationService.js';

// POST /api/rides/:rideId/payment-intent
export const createIntent = asyncHandler(async (req, res) => {
  const { rideId } = req.params;
  const { clientSecret, amount } = await paymentService.createPaymentIntent(
    req.user._id,
    rideId
  );
  res.json({ clientSecret, amount });
});

// POST /api/rides/:rideId/pay
export const payRide = asyncHandler(async (req, res) => {
  const { rideId } = req.params;
  const payment = await paymentService.processPayment(req.user._id, rideId, req.body);
  const io = req.app.get('io');

  if (payment.status === 'cash') {
    await notify({
      user: req.user._id,
      type: 'payment',
      title: 'Cash payment',
      message: `Pay $${payment.amount.toFixed(2)} in cash to your driver.`,
      data: { rideId, paymentId: payment._id },
      io,
    });
  } else if (payment.status === 'succeeded') {
    await notify({
      user: req.user._id,
      type: 'payment',
      title: 'Payment received',
      message: `Your payment of $${payment.amount.toFixed(2)} for ride ${rideId} succeeded.`,
      data: { rideId, paymentId: payment._id },
      io,
    });
  } else if (payment.status === 'failed') {
    await notify({
      user: req.user._id,
      type: 'payment',
      title: 'Payment failed',
      message: `We couldn't charge your card: ${payment.failureReason}`,
      data: { rideId, paymentId: payment._id },
      io,
    });
  }
  res.json({ payment });
});

export const listPayments = asyncHandler(async (req, res) => {
  res.json({ payments: await paymentService.listPayments(req.user._id) });
});

export const getPayment = asyncHandler(async (req, res) => {
  res.json({ payment: await paymentService.getPayment(req.user._id, req.params.id) });
});

export const refundPayment = asyncHandler(async (req, res) => {
  // Admin only — passenger should POST /:id/request-refund
  const payment = await paymentService.refundPayment(req.user._id, req.params.id, true);
  const io = req.app.get('io');
  await notify({
    user: payment.user,
    type: 'payment',
    title: 'Refund issued',
    message: `Your refund of $${payment.amount.toFixed(2)} was approved and issued.`,
    data: { rideId: payment.ride, paymentId: payment._id },
    io,
  });
  res.json({ payment });
});

export const requestRefund = asyncHandler(async (req, res) => {
  const reqDoc = await paymentService.requestRefund(req.user._id, req.params.id, req.body.reason);
  const io = req.app.get('io');
  // Notify admins via socket + in-app
  const admins = await (await import('../services/rideService.js')).findAdmins();
  for (const admin of admins) {
    await notify({
      user: admin._id,
      type: 'payment',
      title: 'Refund requested',
      message: `Refund $${reqDoc.amount.toFixed(2)} requested: ${reqDoc.reason}`,
      data: { refundRequestId: reqDoc._id, rideId: reqDoc.ride },
      io,
    });
  }
  res.status(201).json({ request: reqDoc });
});

export const listRefundRequests = asyncHandler(async (req, res) => {
  const isAdmin = ['admin','super_admin','finance'].includes(req.user.role);
  const list = await paymentService.listRefundRequests(req.user._id, isAdmin);
  res.json({ requests: list });
});

export const decideRefund = asyncHandler(async (req, res) => {
  const { approve, note } = req.body;
  const result = await paymentService.decideRefund(req.params.requestId, req.user._id, !!approve, note);
  const io = req.app.get('io');
  // Notify passenger of decision
  const targetUser = result.request.user;
  await notify({
    user: targetUser,
    type: 'payment',
    title: approve ? 'Refund approved' : 'Refund rejected',
    message: approve ? `Your refund of $${result.request.amount.toFixed(2)} was approved.` : `Your refund request was rejected. ${note || ''}`,
    data: { refundRequestId: result.request._id },
    io,
  });
  res.json(result);
});
