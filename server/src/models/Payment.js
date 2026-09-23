import mongoose from 'mongoose';

// Payment record. Providers: sandbox (simulated) and stripe (real card). A
// 'cash' payment is recorded when the passenger chooses to pay the driver in
// cash — no online charge is made.
const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    method: { type: String, enum: ['card', 'wallet', 'cash'], default: 'card' },
    // 'sandbox' = simulated gateway, 'stripe' = real Stripe, 'cash' = no charge.
    provider: { type: String, enum: ['sandbox', 'stripe', 'cash'], default: 'sandbox' },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded', 'cash'],
      default: 'pending',
    },
    // Set only on success; sparse so pending/failed payments don't collide.
    // For Stripe this is the PaymentIntent id (pi_...).
    transactionId: { type: String, unique: true, sparse: true },
    // Caller-supplied idempotency key; unique index prevents double-charging.
    idempotencyKey: { type: String, unique: true, sparse: true },
    failureReason: { type: String, default: '' },
    cardLast4: { type: String, default: '' },
    refundedAt: Date,
    refundTransactionId: { type: String, default: '' },  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;