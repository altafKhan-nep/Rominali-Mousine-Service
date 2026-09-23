import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    plateNumber: { type: String, required: true, unique: true, trim: true },
    vin: String,
    make: String,
    model: String,
    year: Number,
    type: {
      type: String,
      enum: ['executive-sedan','economy-sedan','economy-suv','premium-suv','luxury-suv','van','mini-coach','school-bus','motorcoach'],
      default: 'economy-sedan',
    },
    capacity: Number,
    status: { type: String, enum: ['active','maintenance','retired'], default: 'active' },
    assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    insuranceExpiry: Date,
    inspectionExpiry: Date,
    registrationExpiry: Date,
    mileage: Number,
    fuelType: String,
    images: [String], // Cloudinary URLs
    notes: String,
  },
  { timestamps: true }
);
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ type: 1 });
export default mongoose.model('Vehicle', vehicleSchema);
