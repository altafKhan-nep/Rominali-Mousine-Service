import { asyncHandler } from '../middleware/error.js';
import * as rideService from '../services/rideService.js';
import { updateLocation } from '../services/driverService.js';
import { notify } from '../services/notificationService.js';

const ioOf = (req) => req.app.get('io');

// POST /api/rides - passenger requests a ride
export const createRide = asyncHandler(async (req, res) => {
  const ride = await rideService.createRide(req.user._id, req.body);
  const io = ioOf(req);

  // Notify nearby, available drivers — progressive radius, service area MD/DC/VA
  let nearby = await rideService.findNearbyDrivers({
    lat: ride.pickup.lat,
    lng: ride.pickup.lng,
    radius: rideService.NOTIFY_RADIUS_M,
    vehicleType: ride.vehicleType,
  });
  // If no nearby drivers, still notify all available drivers in service area
  if (nearby.length === 0) {
    const allAvailable = await rideService.findNearbyDrivers({
      lat: ride.pickup.lat,
      lng: ride.pickup.lng,
      radius: 100000, // 100km covers MD/DC/VA
    });
    nearby = allAvailable;
  }
  for (const driver of nearby) {
    io.to(`user:${driver._id}`).emit('ride:new', { ride });
  }

  // Live dispatch: admins see the new reservation on their rides board.
  io.to('admins').emit('ride:new', { ride });

  // Notify every admin so dispatch can assign a driver if no one accepts.
  const admins = await rideService.findAdmins();
  for (const admin of admins) {
    await notify({
      user: admin._id,
      type: 'ride',
      title: 'New reservation',
      message: `${ride.passenger.name} booked a ride to ${ride.dropoff.address}.`,
      data: { rideId: ride._id },
      io,
    });
  }

  res.status(201).json({ ride });
});

export const listRides = asyncHandler(async (req, res) => {
  const rides = await rideService.listRides(req.user, req.query);
  res.json({ rides });
});

export const getRide = asyncHandler(async (req, res) => {
  const ride = await rideService.getRideById(req.params.id, req.user);
  res.json({ ride });
});

export const editRide = asyncHandler(async (req, res) => {
  const ride = await rideService.editRide(req.params.id, req.user._id, req.body);
  res.json({ ride });
});

export const acceptRide = asyncHandler(async (req, res) => {
  const ride = await rideService.acceptRide(req.params.id, req.user._id);
  const io = ioOf(req);
  io.to(`ride:${ride._id}`).emit('ride:driverFound', { driver: ride.driver, ride });
  // Notify the passenger a driver is on the way
  await notify({
    user: ride.passenger._id,
    type: 'ride',
    title: 'Driver found',
    message: `${ride.driver.name} is on their way to pick you up.`,
    data: { rideId: ride._id },
    io,
  });
  res.json({ ride });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status, lat, lng } = req.body;
  const ride = await rideService.updateStatus(req.params.id, status, req.user._id);
  if (lat != null && lng != null) {
    await updateLocation(req.user._id, { lat, lng });
  }
  const io = ioOf(req);
  io.to(`ride:${ride._id}`).emit('ride:update', { ride, status: ride.status });
  if (status === 'completed') {
    io.to(`ride:${ride._id}`).emit('ride:completed', { ride, fare: ride.fare });
    await notify({
      user: ride.passenger._id,
      type: 'ride',
      title: 'Ride completed',
      message: `Your trip to ${ride.dropoff.address} is complete. Fare: $${(ride.fare.final || ride.fare.estimated).toFixed(2)}.`,
      data: { rideId: ride._id },
      io,
    });
  }
  res.json({ ride });
});

export const cancelRide = asyncHandler(async (req, res) => {
  const ride = await rideService.cancelRide(req.params.id, req.user._id, req.body.reason);
  const io = ioOf(req);
  io.to(`ride:${ride._id}`).emit('ride:update', { ride, status: 'cancelled' });
  // Notify the counterpart (passenger cancels -> driver, and vice versa)
  const cancellerId = req.user._id;
  const counterpart = ride.passenger?.equals?.(cancellerId) ? ride.driver : ride.passenger;
  if (counterpart) {
    await notify({
      user: counterpart._id,
      type: 'ride',
      title: 'Ride cancelled',
      message: `Ride ${ride._id} was cancelled${ride.cancelReason ? `: ${ride.cancelReason}` : '.'}`,
      data: { rideId: ride._id },
      io,
    });
  }
  res.json({ ride });
});

export const rateRide = asyncHandler(async (req, res) => {
  const ride = await rideService.rateRide(req.params.id, req.user._id, req.body);
  res.json({ ride });
});

export const availableRides = asyncHandler(async (req, res) => {
  const rides = await rideService.listAvailableRides(req.user._id);
  res.json({ rides });
});

export const getMessages = asyncHandler(async (req, res) => {
  const ride = await rideService.getRideById(req.params.id, req.user);
  const messages = (ride.messages || []).slice(-50);
  res.json({ messages });
});

export const postMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !String(text).trim()) return res.status(400).json({ message: 'Message required' });
  const ride = await rideService.getRideById(req.params.id, req.user);
  const isParticipant = String(ride.passenger._id||ride.passenger)===String(req.user._id) || (ride.driver && String(ride.driver._id||ride.driver)===String(req.user._id));
  if (!isParticipant) return res.status(403).json({ message: 'Not in this ride' });
  const msg = { sender: req.user._id, text: String(text).trim().slice(0,500), at: new Date() };
  ride.messages.push(msg);
  await ride.save();
  const io = req.app.get('io');
  io.to(`ride:${ride._id}`).emit('ride:message', { rideId: ride._id, sender: req.user._id, text: msg.text, at: msg.at, senderRole: req.user.role, senderName: req.user.name });
  res.status(201).json({ message: msg });
});
