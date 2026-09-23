import jwt from 'jsonwebtoken';
import Ride from '../models/Ride.js';
import User from '../models/User.js';

export const initSocket = (io) => {
  // JWT auth for sockets — prefers verified token, falls back to legacy userId/role during transition
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (token) {
        const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        const user = await User.findById(payload.id).select('role isSuspended tokenVersion');
        if (!user || user.isSuspended || user.tokenVersion !== payload.v) return next(new Error('UNAUTHORIZED'));
        socket.userId = String(user._id);
        socket.role = user.role;
        socket.tokenPayload = payload;
        return next();
      }
      // Legacy fallback: allow userId/role sent by older clients (less secure, but keeps dispatch working)
      const { userId, role } = socket.handshake.auth || {};
      if (userId) {
        const user = await User.findById(userId).select('role isSuspended');
        if (!user || user.isSuspended) return next(new Error('UNAUTHORIZED'));
        socket.userId = String(user._id);
        socket.role = role || user.role;
        return next();
      }
      return next(); // anon for public pages
    } catch {
      return next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} user:${socket.userId || 'anon'} role:${socket.role || '-'}`);

    // Associate: supports both {token} and legacy {userId, role}
    const associate = async (payload = {}) => {
      const { token, userId, role } = payload;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
          const user = await User.findById(decoded.id).select('role isSuspended tokenVersion');
          if (!user || user.isSuspended || user.tokenVersion !== decoded.v) return;
          if (socket.userId) socket.leave(`user:${socket.userId}`);
          socket.userId = String(user._id);
          socket.role = user.role;
          socket.join(`user:${socket.userId}`);
          if (socket.role === 'driver') socket.join('drivers');
          if (['admin', 'super_admin', 'dispatcher', 'manager'].includes(socket.role)) socket.join('admins');
          return;
        } catch { return; }
      }
      if (userId) {
        // Legacy path
        if (socket.userId) socket.leave(`user:${socket.userId}`);
        socket.userId = String(userId);
        socket.role = role;
        socket.join(`user:${socket.userId}`);
        if (role === 'driver') socket.join('drivers');
        if (['admin', 'super_admin', 'dispatcher'].includes(role)) socket.join('admins');
        return;
      }
      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
        if (socket.role === 'driver') socket.join('drivers');
        if (['admin', 'super_admin', 'dispatcher', 'manager'].includes(socket.role)) socket.join('admins');
      }
    };

    // auto-join rooms for JWT-authenticated sockets on connect
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      if (socket.role === 'driver') socket.join('drivers');
      if (['admin', 'super_admin', 'dispatcher', 'manager'].includes(socket.role)) socket.join('admins');
    }
    socket.on('authenticate', associate);

    // Join a ride-scoped room so passenger + driver share live events. Only the
    // ride's passenger, its assigned driver, or an admin may join (location data
    // flows through these rooms, so unauthenticated joins are rejected).
    socket.on('ride:join', async ({ rideId } = {}) => {
      if (!rideId || !socket.userId) return;
      const ride = await Ride.findOne({ _id: rideId }).select('passenger driver').lean();
      if (!ride) return;
      const isAdmin = socket.role === 'admin';
      const isParticipant =
        String(ride.passenger) === String(socket.userId) ||
        (ride.driver && String(ride.driver) === String(socket.userId));
      if (isAdmin || isParticipant) socket.join(`ride:${rideId}`);
    });

    // Driver publishes position -> forward to the ride room the driver is serving
    socket.on('driver:location', async ({ lat, lng, heading = 0, speed = 0 } = {}) => {
      const driverId = socket.userId;
      if (!driverId || lat == null || lng == null) return;

      const activeRide = await Ride.findOne({
        driver: driverId,
        status: { $in: ['accepted', 'arriving', 'in_progress'] },
      }).select('_id').lean();

      const payload = { driverId, lat, lng, heading, speed };
      if (activeRide) {
        io.to(`ride:${activeRide._id}`).emit('driver:location', payload);
      }
    });

    // Passenger publishes position -> forward to the ride room so the assigned
    // driver can find them live (mirror of driver:location).
    socket.on('passenger:location', async ({ lat, lng, heading = 0, speed = 0 } = {}) => {
      const passengerId = socket.userId;
      if (!passengerId || lat == null || lng == null) return;

      const activeRide = await Ride.findOne({
        passenger: passengerId,
        status: { $in: ['accepted', 'arriving', 'in_progress'] },
      }).select('_id').lean();

      const payload = { passengerId, lat, lng, heading, speed };
      if (activeRide) {
        io.to(`ride:${activeRide._id}`).emit('passenger:location', payload);
      }
    });

    // Uber-like live chat: passenger ↔ driver in ride room (only participants)
    socket.on('ride:message', async ({ rideId, text } = {}) => {
      if (!rideId || !text || !socket.userId) return;
      const trimmed = String(text).trim().slice(0, 500);
      if (!trimmed) return;
      const ride = await Ride.findOne({ _id: rideId }).select('passenger driver').lean();
      if (!ride) return;
      const isParticipant = String(ride.passenger) === String(socket.userId) || (ride.driver && String(ride.driver) === String(socket.userId));
      if (!isParticipant) return;
      await Ride.findByIdAndUpdate(rideId, { $push: { messages: { sender: socket.userId, text: trimmed, at: new Date() } } });
      io.to(`ride:${rideId}`).emit('ride:message', { rideId, sender: socket.userId, text: trimmed, at: new Date(), senderRole: socket.role });
    });

    // Removed insecure client-triggered ride:cancel broadcast — cancellations must go via REST POST /api/rides/:id/cancel (validated in rideService.cancelRide)

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};