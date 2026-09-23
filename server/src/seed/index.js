import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Location from '../models/Location.js';
import AppSetting from '../models/AppSetting.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const users = [
  {
    name: 'Admin',
    email: 'admin@rominalimo.com',
    phone: '+1 555 010 0000',
    password: 'admin123',
    role: 'admin',
    emailVerified: true,
  },
  {
    name: 'John Passenger',
    email: 'passenger@rominalimo.com',
    phone: '+1 555 010 1000',
    password: 'pass123',
    role: 'passenger',
    emailVerified: true,
  },
  {
    name: 'Driver Alex',
    email: 'alex@rominalimo.com',
    phone: '+1 555 010 2001',
    password: 'driver123',
    role: 'driver',
    emailVerified: true,
    driverDetails: {
      vehicleType: 'executive-sedan',
      plateNumber: 'ABC-123',
      licenseNo: 'DL-88213',
      isAvailable: true,
    },
  },
];

const seedLocations = async (drivers) => {
  // Howard County, Maryland area
  const spots = [
    { lat: 39.207, lng: -76.857 },
    { lat: 39.213, lng: -76.865 },
    { lat: 39.198, lng: -76.846 },
  ];
  for (let i = 0; i < drivers.length; i++) {
    await Location.findOneAndUpdate(
      { driver: drivers[i]._id },
      {
        driver: drivers[i]._id,
        coordinates: { type: 'Point', coordinates: [spots[i].lng, spots[i].lat] },
        updatedAt: new Date(),
      },
      { upsert: true }
    );
  }
};

const run = async () => {
  await connectDB();
  await User.deleteMany({});
  await Location.deleteMany({});
  await AppSetting.deleteMany({});

  const created = [];
  for (const u of users) {
    const user = await User.create(u);
    created.push(user);
  }

  const drivers = created.filter((u) => u.role === 'driver');
  await seedLocations(drivers);

  // Default app settings (editable from Admin CRM).
  await AppSetting.create([
    { key: 'paymentsEnabled', value: true },
    { key: 'supportPhone', value: '(240) 351-0826' },
    { key: 'supportEmail', value: 'Rominalimo2023@gmail.com' },
  ]);

  console.log('Seed complete:');
  users.forEach((u) => console.log(`  ${u.role.padEnd(9)} ${u.email} / ${u.password}`));
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});