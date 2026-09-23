import mongoose from 'mongoose';

// One-time SMS verification codes (phone OTP login). Stored hashed; the TTL
// index auto-deletes expired codes. `attempts` guards brute force.
const otpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const OtpCode = mongoose.model('OtpCode', otpSchema);

export default OtpCode;