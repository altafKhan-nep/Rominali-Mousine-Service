import mongoose from 'mongoose';

// Server-side refresh tokens: opaque, stored as SHA-256 hashes so a DB leak
// can't be replayed. Rotation + per-device revocation (see authService).
// The TTL index (expiresAt) lets MongoDB auto-clean expired sessions — no
// cron needed, which keeps this horizontally scalable.
const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    revokedAt: { type: Date, default: null },
    rememberMe: { type: Boolean, default: false },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
  },
  { timestamps: true }
);

refreshTokenSchema.index({ user: 1, revokedAt: 1 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;