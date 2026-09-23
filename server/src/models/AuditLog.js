import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorEmail: String,
    actorRole: String,
    action: { type: String, required: true, index: true }, // e.g. rides.assignDriver, users.suspend
    targetType: String, // Ride, User, Vehicle, Settings...
    targetId: String,
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String,
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

auditSchema.index({ createdAt: -1 });
auditSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditSchema);
