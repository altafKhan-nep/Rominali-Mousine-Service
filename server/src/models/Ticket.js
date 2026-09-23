import mongoose from 'mongoose';
const ticketSchema = new mongoose.Schema({
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
  subject: { type: String, required: true },
  description: String,
  category: { type: String, enum: ['complaint','refund','general','incident'], default: 'general' },
  status: { type: String, enum: ['open','pending','resolved','closed'], default: 'open', index: true },
  priority: { type: String, enum: ['low','medium','high','urgent'], default: 'medium' },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  messages: [{ from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, body: String, at: { type: Date, default: Date.now } }],
}, { timestamps: true });
ticketSchema.index({ status: 1, createdAt: -1 });
export default mongoose.model('Ticket', ticketSchema);
