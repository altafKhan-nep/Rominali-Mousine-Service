import crypto from 'crypto';
import { setTimeout as delay } from 'node:timers/promises';
import Stripe from 'stripe';
import Payment from '../models/Payment.js';
import Ride from '../models/Ride.js';
import { getSettings } from './settingsService.js';

const fail = (message, statusCode) => Object.assign(new Error(message), { statusCode });

const txId = (prefix) =>
  `${prefix}_${crypto.randomBytes(12).toString('hex')}`;

// Real Stripe gateway (test/live mode) when configured; otherwise the app falls
// back to the sandbox simulator so every flow stays testable without keys.
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const stripeEnabled = !!stripe;

const cents = (amount) => Math.round(amount * 100);

const assertPayable = async (userId, rideId) => {
  const settings = await getSettings();
  if (settings.paymentsEnabled === false) {
    throw fail('Online payments are disabled by the operator. Pay by cash or contact support.', 403);
  }
  const ride = await Ride.findOne({
    _id: rideId,
    passenger: userId,
    status: { $nin: ['cancelled'] },
  });
  if (!ride) throw fail('Ride not found or not yours to pay for', 404);
  return ride;
};

const settledPayment = async (rideId) => {
  // A ride is settled once an online payment succeeded OR the passenger chose
  // to pay in cash — either way it must not be charged again.
  const existing = await Payment.findOne({
    ride: rideId,
    status: { $in: ['succeeded', 'cash'] },
  });
  return existing;
};

const rideAmount = (ride) =>
  ride.status === 'completed' ? ride.fare?.final : ride.fare?.estimated;

// POST /api/rides/:rideId/payment-intent
// Returns a Stripe client secret for the Passenger-side Payment Element. The
// intent amount locks the fare; confirmPayment completes it client-side and the
// caller then records the result via processPayment({ method:'card',
// paymentIntentId }). Idempotent per ride.
export const createPaymentIntent = async (userId, rideId) => {
  if (!stripeEnabled) {
    throw fail('Stripe is not configured. Online card payments are unavailable.', 503);
  }
  const ride = await assertPayable(userId, rideId);
  if (await settledPayment(rideId)) {
    throw fail('This ride has already been paid for.', 409);
  }
  const amount = rideAmount(ride);
  if (!amount || amount <= 0) throw fail('Cannot charge a ride with no fare', 400);

  const intent = await stripe.paymentIntents.create(
    {
      amount: cents(amount),
      currency: 'usd',
      // Uses the account's payment-method configuration (Stripe Dashboard
      // "Payment methods" page — the STRIPE_PAYMENT_METHOD_DOMAIN domain id
      // scopes which methods are offered for this account).
      automatic_payment_methods: { enabled: true },
      metadata: { rideId: String(rideId), userId: String(userId) },
    },
    { idempotencyKey: `rideIntent:${rideId}` }
  );

  return { clientSecret: intent.client_secret, amount };
};

// Charge for a ride. Idempotent: a settled payment (succeeded or cash) for the
// ride is returned as-is.
export const processPayment = async (userId, rideId, opts = {}) => {
  const { method = 'card', idempotencyKey, cardLast4, paymentIntentId } = opts;

  // Cash — no online charge; recorded so the driver collects at the end.
  if (method === 'cash') {
    const ride = await Ride.findOne({
      _id: rideId,
      passenger: userId,
      status: { $nin: ['cancelled'] },
    });
    if (!ride) throw fail('Ride not found or not yours to pay for', 404);

    const existing = await settledPayment(rideId);
    if (existing) return existing;

    const amount = rideAmount(ride);
    if (!amount || amount <= 0) throw fail('Cannot record a cash payment with no fare', 400);

    const payment = await Payment.create({
      user: userId,
      ride: rideId,
      amount,
      method: 'cash',
      provider: 'cash',
      status: 'cash',
      idempotencyKey: idempotencyKey || `ride:${rideId}:cash`,
    });

    ride.payment = { method: 'cash', status: 'paid' };
    await ride.save();
    return payment;
  }

  if (stripeEnabled) {
    if (!paymentIntentId) {
      throw fail('Card payments go through Stripe. Please try again with a fresh payment.', 400);
    }
    return processStripePayment(userId, rideId, { paymentIntentId, idempotencyKey });
  }

  return processSandboxPayment(userId, rideId, { idempotencyKey, cardLast4 });
};

// Card via Stripe — verify the already-confirmed PaymentIntent, then record it.
const processStripePayment = async (userId, rideId, { paymentIntentId, idempotencyKey }) => {
  const ride = await assertPayable(userId, rideId);

  const existing = await settledPayment(rideId);
  if (existing) return existing;

  const seen = await Payment.findOne({ transactionId: paymentIntentId });
  if (seen) return seen;

  const intent = await stripe.paymentIntents.retrieve(paymentIntentId).catch(() => null);
  if (!intent) throw fail('Payment could not be verified with the provider.', 400);
  if (intent.status !== 'succeeded') {
    throw fail(
      intent.status === 'requires_payment_method'
        ? 'The card was not charged. Please try again.'
        : `Payment not settled (${intent.status}).`,
      400
    );
  }

  const amount = rideAmount(ride);
  if (!amount || amount <= 0) throw fail('Cannot charge a ride with no fare', 400);
  if (intent.amount !== cents(amount)) {
    throw fail('Payment amount does not match the ride fare.', 400);
  }

  let last4 = '';
  try {
    if (intent.payment_method) {
      const pm = await stripe.paymentMethods.retrieve(intent.payment_method);
      last4 = pm?.card?.last4 || '';
    }
  } catch {
    // last4 is cosmetic only — non-fatal if the method is already gone.
  }

  const payment = await Payment.create({
    user: userId,
    ride: rideId,
    amount,
    method: 'card',
    provider: 'stripe',
    status: 'succeeded',
    transactionId: paymentIntentId,
    cardLast4: last4,
    idempotencyKey: idempotencyKey || `pi:${paymentIntentId}`,
  });

  ride.payment = {
    method: 'card',
    status: 'paid',
    transactionId: paymentIntentId,
  };
  await ride.save();

  return payment;
};

// Sandbox gateway: deterministic behavior driven by the card so flows are
// testable. Any card ending in "0002" declines (Stripe-style test card);
// "0000" is always approved; anything else succeeds ~95% of the time.
const chargeCard = async (amount, { cardLast4 }) => {
  await delay(1200); // simulated processing delay
  if (cardLast4 && cardLast4.endsWith('0002')) {
    return { ok: false, reason: 'Card was declined by the issuer.' };
  }
  if (cardLast4 && !cardLast4.endsWith('0000') && Math.random() < 0.05) {
    return { ok: false, reason: 'Insufficient funds.' };
  }
  return { ok: true, transactionId: txId('txn') };
};

const processSandboxPayment = async (userId, rideId, { idempotencyKey, cardLast4 }) => {
  const ride = await assertPayable(userId, rideId);

  const existing = await settledPayment(rideId);
  if (existing) return existing;

  let key = idempotencyKey || `ride:${rideId}`;
  const seen = await Payment.findOne({ idempotencyKey: key });
  if (seen) {
    throw fail('Payment request already processed. Check your payment status.', 409);
  }

  const amount = rideAmount(ride);
  if (!amount || amount <= 0) throw fail('Cannot charge a ride with no fare', 400);

  const payment = await Payment.create({
    user: userId,
    ride: rideId,
    amount,
    method: 'card',
    provider: 'sandbox',
    idempotencyKey: key,
    cardLast4: cardLast4 || '',
    status: 'pending',
  });

  const result = await chargeCard(amount, { cardLast4 });

  if (!result.ok) {
    payment.status = 'failed';
    payment.failureReason = result.reason;
    await payment.save();
    return payment;
  }

  payment.status = 'succeeded';
  payment.transactionId = result.transactionId;
  await payment.save();

  ride.payment = {
    method: 'card',
    status: 'paid',
    transactionId: result.transactionId,
  };
  await ride.save();

  return payment;
};

// Refund a settled payment — ADMIN ONLY (passenger must request via RefundRequest)
export const refundPayment = async (userId, paymentId, admin = false) => {
  if (!admin) throw fail('Only admin can issue refunds. Please request a refund via support.', 403);
  const query = { _id: paymentId, status: { $in: ['succeeded'] } };
  // admin flag already checked, no user filter needed for admin
  const payment = await Payment.findOne(query);
  if (!payment) throw fail('No successful payment found to refund', 404);

  if (stripeEnabled && payment.provider === 'stripe') {
    await stripe.refunds.create({ payment_intent: payment.transactionId });
  }
  // Sandbox refund is instant and always succeeds.

  payment.status = 'refunded';
  payment.refundedAt = new Date();
  payment.refundTransactionId = txId('refund');
  await payment.save();

  const ride = await Ride.findById(payment.ride);
  if (ride) {
    ride.payment.status = 'refunded';
    await ride.save();
  }

  return payment;
};

export const getPayment = async (userId, paymentId, admin = false) => {
  const query = { _id: paymentId };
  if (!admin) query.user = userId;
  const payment = await Payment.findOne(query).populate('ride', 'pickup dropoff fare status');
  if (!payment) throw fail('Payment not found', 404);
  return payment;
};

export const listPayments = async (userId) =>
  Payment.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('ride', 'pickup dropoff fare status');

export const isStripeEnabled = () => stripeEnabled;

// --- Refund Request flow (passenger asks, admin approves) ---
import RefundRequest from '../models/RefundRequest.js';

export const requestRefund = async (userId, paymentId, reason) => {
  if (!reason || !reason.trim()) throw fail('Please provide a reason for refund', 400);
  const payment = await Payment.findOne({ _id: paymentId, user: userId, status: 'succeeded' });
  if (!payment) throw fail('No successful payment found', 404);
  if (payment.provider === 'cash') throw fail('Cash payments cannot be refunded', 400);
  const existing = await RefundRequest.findOne({ payment: paymentId, status: 'pending' });
  if (existing) throw fail('Refund already requested and pending admin review', 409);
  const alreadyRefunded = await RefundRequest.findOne({ payment: paymentId, status: 'approved' });
  if (alreadyRefunded) throw fail('Already refunded', 409);
  const reqDoc = await RefundRequest.create({
    user: userId,
    ride: payment.ride,
    payment: paymentId,
    amount: payment.amount,
    reason: reason.trim(),
  });
  return reqDoc;
};

export const listRefundRequests = async (userId = null, admin = false) => {
  const query = admin ? {} : { user: userId };
  return RefundRequest.find(query).sort({ createdAt: -1 }).limit(100).populate('user ride payment');
};

export const decideRefund = async (requestId, adminId, approve, note = '') => {
  const reqDoc = await RefundRequest.findOne({ _id: requestId, status: 'pending' });
  if (!reqDoc) throw fail('Refund request not found or already decided', 404);
  if (approve) {
    // Perform actual refund via existing logic (admin)
    const payment = await refundPayment(adminId, reqDoc.payment, true);
    reqDoc.status = 'approved';
    reqDoc.decidedBy = adminId;
    reqDoc.decidedAt = new Date();
    reqDoc.adminNote = note;
    await reqDoc.save();
    return { request: reqDoc, payment };
  } else {
    reqDoc.status = 'rejected';
    reqDoc.decidedBy = adminId;
    reqDoc.decidedAt = new Date();
    reqDoc.adminNote = note;
    await reqDoc.save();
    return { request: reqDoc };
  }
};