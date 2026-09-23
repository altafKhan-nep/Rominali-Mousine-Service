// One-time production migration: rename demo accounts @ellicot.com -> @rominalimo.com.
// NON-DESTRUCTIVE: updates 3 user docs in place, creates them only if missing.
// Rides, payments, locations and all other data are untouched.
// Usage: MONGO_URI="<prod-atlas-uri>" node scripts/migrate-demo-emails.js
// (dotenv never overrides an explicit env var, so the prod URI wins over server/.env)
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Location from '../src/models/Location.js';
import AppSetting from '../src/models/AppSetting.js';
import { connectDB } from '../src/config/db.js';

dotenv.config();

const ACCOUNTS = [
  {
    oldEmail: 'admin@ellicot.com',
    newEmail: 'admin@rominalimo.com',
    defaults: {
      name: 'Admin', phone: '+1 555 010 0000', password: 'admin123',
      role: 'admin', emailVerified: true,
    },
  },
  {
    oldEmail: 'passenger@ellicot.com',
    newEmail: 'passenger@rominalimo.com',
    defaults: {
      name: 'John Passenger', phone: '+1 555 010 1000', password: 'pass123',
      role: 'passenger', emailVerified: true,
    },
  },
  {
    oldEmail: 'alex@ellicot.com',
    newEmail: 'alex@rominalimo.com',
    defaults: {
      name: 'Driver Alex', phone: '+1 555 010 2001', password: 'driver123',
      role: 'driver', emailVerified: true,
      driverDetails: {
        vehicleType: 'executive-sedan', plateNumber: 'ABC-123',
        licenseNo: 'DL-88213', isAvailable: true,
      },
    },
  },
];

const SPOTS = [
  { lat: 39.207, lng: -76.857 },
  { lat: 39.213, lng: -76.865 },
];

const SETTING_DEFAULTS = [
  { key: 'paymentsEnabled', value: true },
  { key: 'supportPhone', value: '(240) 351-0826' },
  { key: 'supportEmail', value: 'Rominalimo2023@gmail.com' },
];

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. Refusing to run.');
    process.exit(1);
  }
  await connectDB();
  const summary = [];
  let spotIdx = 0;

  for (const acct of ACCOUNTS) {
    const byNew = await User.findOne({ email: acct.newEmail });
    if (byNew) {
      summary.push(`${acct.newEmail} already present (${byNew.role}) - untouched`);
    } else {
      const byOld = await User.findOne({ email: acct.oldEmail });
      if (byOld) {
        byOld.email = acct.newEmail;
        await byOld.save();
        summary.push(`${acct.oldEmail} -> ${acct.newEmail} renamed (rides/payments kept)`);
      } else {
        await User.create({ ...acct.defaults, email: acct.newEmail });
        summary.push(`${acct.newEmail} created (was missing entirely)`);
      }
    }
    const user = await User.findOne({ email: acct.newEmail });
    if (user && user.role === 'driver') {
      const hasLoc = await Location.findOne({ driver: user._id });
      if (!hasLoc) {
        const spot = SPOTS[spotIdx++ % SPOTS.length];
        await Location.create({
          driver: user._id,
          coordinates: { type: 'Point', coordinates: [spot.lng, spot.lat] },
          updatedAt: new Date(),
        });
        summary.push(`  + seeded live position for ${acct.newEmail}`);
      }
    }
  }

  for (const s of SETTING_DEFAULTS) {
    const exists = await AppSetting.findOne({ key: s.key });
    if (!exists) {
      await AppSetting.create(s);
      summary.push(`setting ${s.key} created (was missing)`);
    }
  }

  console.log('Migration complete:');
  summary.forEach((line) => console.log(`  ${line}`));
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
