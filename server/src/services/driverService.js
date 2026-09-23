import User from '../models/User.js';
import Location from '../models/Location.js';
import Ride from '../models/Ride.js';
import { getRoute } from './rideService.js';

export const getDriverPosition = async (driverId) => {
  const loc = await Location.findOne({ driver: driverId });
  if (!loc) return null;
  return { lat: loc.coordinates.coordinates[1], lng: loc.coordinates.coordinates[0] };
};

// Route + ETA from the driver's last known position to a target point
export const getDriverEta = async (driverId, to) => {
  const from = await getDriverPosition(driverId);
  if (!from) {
    throw Object.assign(new Error('Driver location unknown'), { statusCode: 404 });
  }
  const { distanceKm, durationMin, polyline } = await getRoute(from, to);
  return { distanceKm, durationMin, route: polyline, from };
};

export const updateAvailability = async (driverId, isAvailable) => {
  const driver = await User.findById(driverId);
  if (!driver || driver.role !== 'driver') {
    throw Object.assign(new Error('Driver not found'), { statusCode: 404 });
  }

  driver.driverDetails.isAvailable = isAvailable;
  await driver.save();
  return driver;
};

export const updateLocation = async (driverId, { lat, lng, heading = 0, speed = 0 }) => {
  await Location.findOneAndUpdate(
    { driver: driverId },
    {
      driver: driverId,
      coordinates: { type: 'Point', coordinates: [lng, lat] },
      heading,
      speed,
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );
};

export const getDriverStats = async (driverId) => {
  const [completed, totalEarnings, rideCount] = await Promise.all([
    Ride.countDocuments({ driver: driverId, status: 'completed' }),
    Ride.aggregate([
      { $match: { driver: driverId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$fare.final' } } },
    ]),
    Ride.countDocuments({ driver: driverId }),
  ]);

  return {
    completedRides: completed,
    totalRides: rideCount,
    totalEarnings: rideCount ? totalEarnings[0]?.total || 0 : 0,
  };
};