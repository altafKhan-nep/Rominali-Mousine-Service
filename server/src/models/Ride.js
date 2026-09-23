import mongoose from 'mongoose';

const rideSchema = new mongoose.Schema(
  {
    passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    pickup: {
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    dropoff: {
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

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
    serviceType: { type: String, default: '' },
    passengerCount: { type: Number, default: 1, min: 1 },
    bags: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['pending', 'scheduled', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled', 'no_show', 'refunded'],
      default: 'pending',
    },
    cancelReason: { type: String, default: '' },
    scheduledAt: Date,
    noShowReason: String,
    refundReason: String,

    fare: {
      estimated: { type: Number, default: 0 },
      final: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
      distanceKm: { type: Number, default: 0 },
      durationMin: { type: Number, default: 0 },
    },

    // Polyline from OSRM, decodes to {lat,lng}[] on the client
    route: [{ lat: Number, lng: Number }],

    timestamps: {
      requested: { type: Date, default: Date.now },
      accepted: Date,
      arrived: Date,
      started: Date,
      completed: Date,
      cancelled: Date,
      noShow: Date,
      refunded: Date,
    },

    payment: {
      method: { type: String, enum: ['cash', 'card', 'wallet'], default: 'cash' },
      status: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
      transactionId: { type: String, default: '' },
    },

    rating: {
      score: { type: Number, min: 1, max: 5 },
      comment: String,
      compliments: [{ type: String, enum: ['clean', 'professional', 'friendly', 'safe'] }],
      createdAt: Date,
    },

    // Uber-like live chat between passenger and driver (ride room)
    messages: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true, maxlength: 500 },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

rideSchema.index({ status: 1, createdAt: -1 });
rideSchema.index({ passenger: 1, status: 1 });
rideSchema.index({ driver: 1, status: 1 });
rideSchema.index({ driver: 1, createdAt: -1 });
rideSchema.index({ passenger: 1, createdAt: -1 });

const Ride = mongoose.model('Ride', rideSchema);
export default Ride;