import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const tokenSubSchema = new mongoose.Schema(
  {
    token: { type: String },
    expiresAt: { type: Date },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['passenger', 'driver', 'admin', 'super_admin', 'dispatcher', 'manager', 'finance', 'support'], default: 'passenger' },
    avatar: { type: String, default: '' },
    emailVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    // Web-push subscriptions (endpoint + VAPID keys) for browser notifications
    pushSubscriptions: [
      {
        endpoint: { type: String, required: true },
        keys: {
          p256dh: String,
          auth: String,
        },
      },
    ],
    // Incremented on logout / password reset to invalidate outstanding JWTs
    tokenVersion: { type: Number, default: 1 },
    verificationToken: { type: tokenSubSchema, default: null },
    resetToken: { type: tokenSubSchema, default: null },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'facebook', 'phone'],
      default: 'local',
    },
    driverDetails: {
      vehicleType: {
        type: String,
        enum: [
          'executive-sedan',
          'economy-sedan',
          'economy-suv',
          'premium-suv',
          'luxury-suv',
          'van',
          'mini-coach',
          'school-bus',
          'motorcoach',
        ],
        default: 'economy-sedan',
      },
      plateNumber: { type: String, default: '' },
      licenseNo: { type: String, default: '' },
      isAvailable: { type: Boolean, default: false },
      // Uber-like driver metrics
      stats: {
        totalRides: { type: Number, default: 0 },
        rating: { type: Number, default: 0 }, // average 0-5
        ratingCount: { type: Number, default: 0 },
        compliments: {
          clean: { type: Number, default: 0 },
          professional: { type: Number, default: 0 },
          friendly: { type: Number, default: 0 },
          safe: { type: Number, default: 0 },
        },
      },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email }).select('+password');
};

userSchema.statics.findByPhone = function (phone) {
  return this.findOne({ phone }).select('+password');
};

userSchema.statics.findByLogin = function (identifier) {
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  return isEmail ? this.findByEmail(identifier) : this.findByPhone(identifier);
};

const User = mongoose.model('User', userSchema);
export default User;