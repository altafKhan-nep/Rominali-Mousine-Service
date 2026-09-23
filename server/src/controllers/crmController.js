import { asyncHandler } from '../middleware/error.js';
import Ride from '../models/Ride.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Ticket from '../models/Ticket.js';
import AuditLog from '../models/AuditLog.js';
import Location from '../models/Location.js';

export const timeseries = asyncHandler(async (req, res) => {
  const days = Math.min(90, Math.max(1, Number(req.query.days) || 14));
  const since = new Date(Date.now() - days * 86400000);
  const rows = await Ride.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, bookings: { $sum: 1 }, revenue: { $sum: '$fare.final' } } },
    { $sort: { _id: 1 } },
  ]);
  res.json({ series: rows.map((r) => ({ date: r._id, bookings: r.bookings, revenue: Math.round(r.revenue * 100) / 100 })) });
});

export const heatmap = asyncHandler(async (req, res) => {
  const rides = await Ride.find({ 'pickup.lat': { $exists: true } }).select('pickup dropoff status').limit(500).lean();
  res.json({ points: rides.map((r) => ({ lat: r.pickup.lat, lng: r.pickup.lng, status: r.status })) });
});

export const markNoShow = asyncHandler(async (req, res) => {
  const ride = await Ride.findOne({ _id: req.params.id, status: { $nin: ['completed', 'cancelled', 'refunded'] } });
  if (!ride) return res.status(404).json({ message: 'Ride not found or not markable' });
  ride.status = 'no_show';
  ride.noShowReason = req.body.reason || '';
  ride.timestamps.noShow = new Date();
  await ride.save();
  const io = req.app.get('io');
  io?.to(`ride:${ride._id}`).emit('ride:update', { ride, status: 'no_show' });
  res.json({ ride });
});

export const listVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find().sort({ createdAt: -1 }).limit(100).lean();
  res.json({ vehicles });
});
export const createVehicle = asyncHandler(async (req, res) => {
  const v = await Vehicle.create(req.body);
  res.status(201).json({ vehicle: v });
});
export const updateVehicle = asyncHandler(async (req, res) => {
  const v = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!v) return res.status(404).json({ message: 'Vehicle not found' });
  res.json({ vehicle: v });
});

export const listPassengers = asyncHandler(async (req, res) => {
  const { search = '', page = 1, limit = 20 } = req.query;
  const q = { role: 'passenger' };
  if (search) q.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }];
  const passengers = await User.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).lean();
  const total = await User.countDocuments(q);
  res.json({ passengers, total });
});
export const getPassenger = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) return res.status(404).json({ message: 'Passenger not found' });
  const rides = await Ride.find({ passenger: user._id }).sort({ createdAt: -1 }).limit(20).lean();
  res.json({ user, rides, ltv: rides.filter((r) => r.status === 'completed').reduce((s, r) => s + (r.fare.final || 0), 0) });
});

export const liveOps = asyncHandler(async (req, res) => {
  const locations = await Location.find().populate('driver', 'name driverDetails').lean();
  const activeRides = await Ride.find({ status: { $in: ['accepted', 'arriving', 'in_progress'] } }).select('pickup dropoff driver passenger status').lean();
  res.json({ drivers: locations, activeRides });
});

export const listTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: -1 }).limit(50).populate('passenger ride').lean();
  res.json({ tickets });
});
export const createTicket = asyncHandler(async (req, res) => {
  const t = await Ticket.create({ ...req.body, assignee: req.user._id });
  res.status(201).json({ ticket: t });
});
export const updateTicket = asyncHandler(async (req, res) => {
  const t = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!t) return res.status(404).json({ message: 'Ticket not found' });
  res.json({ ticket: t });
});

export const listAudit = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100).lean();
  res.json({ logs });
});
