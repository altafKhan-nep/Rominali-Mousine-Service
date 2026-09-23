import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    // GeoJSON Point for 2dsphere queries: coordinates = [lng, lat]
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    heading: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// 2dsphere index for $near queries
locationSchema.index({ coordinates: '2dsphere' });

// TTL index: remove driver positions not updated in 24 hours (was 10 min, too aggressive for nearby search)
locationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

const Location = mongoose.model('Location', locationSchema);
export default Location;