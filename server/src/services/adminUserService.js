import User from '../models/User.js';
import Location from '../models/Location.js';
import RefreshToken from '../models/RefreshToken.js';
import Ride from '../models/Ride.js';
import Payment from '../models/Payment.js';

const fail = (message, statusCode) => Object.assign(new Error(message), { statusCode });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Admin can only manage passenger/driver accounts — staff & admins are protected.
export const MANAGED_ROLES = ['passenger', 'driver'];
export const VEHICLE_TYPES = [
  'executive-sedan',
  'economy-sedan',
  'economy-suv',
  'premium-suv',
  'luxury-suv',
  'van',
  'mini-coach',
  'school-bus',
  'motorcoach',
];

const pickVehicle = (v) => (VEHICLE_TYPES.includes(v) ? v : undefined);
const isStaff = (role) => !MANAGED_ROLES.includes(role);

const sanitizeDriverDetails = (dd = {}) => ({
  vehicleType: pickVehicle(dd.vehicleType) || 'economy-sedan',
  plateNumber: String(dd.plateNumber ?? '').trim(),
  licenseNo: String(dd.licenseNo ?? '').trim(),
  isAvailable: dd.isAvailable === true,
});

// POST /api/admin/users — create a passenger or driver account.
export const createUser = async (body = {}) => {
  const { name, email, phone, password, role = 'passenger', driverDetails } = body;
  if (!name || !String(name).trim()) throw fail('Name is required', 400);
  const cleanEmail = String(email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(cleanEmail)) throw fail('Valid email required', 400);
  if (!password || String(password).length < 6) throw fail('Password must be at least 6 characters', 400);
  if (!MANAGED_ROLES.includes(role)) throw fail('Role must be passenger or driver', 400);
  if (await User.findOne({ email: cleanEmail })) throw fail('Email already in use', 409);
  const cleanPhone = String(phone ?? '').trim();
  if (cleanPhone && (await User.findOne({ phone: cleanPhone }))) throw fail('Phone already in use', 409);

  const user = await User.create({
    name: String(name).trim(),
    email: cleanEmail,
    phone: cleanPhone,
    password,
    role,
    emailVerified: body.emailVerified === true,
    driverDetails: role === 'driver' ? sanitizeDriverDetails(driverDetails) : undefined,
  });
  return User.findById(user._id).select('-password');
};

// GET /api/admin/users?search=&role=&page=&limit=
export const listUsers = async ({ search = '', role = '', page = 1, limit = 20 }) => {
  const query = {};
  if (role) query.role = role;
  if (search) {
    const rx = new RegExp(escapeRx(String(search)), 'i');
    query.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(query).select('-password').sort({ createdAt: -1 }).skip((+page - 1) * +limit).limit(+limit),
    User.countDocuments(query),
  ]);
  return { users, total, page: +page, limit: +limit };
};

// PATCH /api/admin/users/:id — edit name/email/phone/role/password,
// driver details (vehicle type, plate, license, availability), verification, suspension.
export const updateUser = async (userId, body = {}) => {
  const user = await User.findById(userId);
  if (!user) throw fail('User not found', 404);
  if (isStaff(user.role)) throw fail('Staff & admin accounts cannot be edited here', 400);

  if (body.name !== undefined) {
    if (!String(body.name).trim()) throw fail('Name cannot be empty', 400);
    user.name = String(body.name).trim();
  }
  if (body.email !== undefined) {
    const email = String(body.email).trim().toLowerCase();
    if (!EMAIL_RE.test(email)) throw fail('Valid email required', 400);
    if (await User.findOne({ email, _id: { $ne: userId } })) throw fail('Email already in use', 409);
    user.email = email;
  }
  if (body.phone !== undefined) {
    const phone = String(body.phone).trim();
    if (phone && (await User.findOne({ phone, _id: { $ne: userId } }))) throw fail('Phone already in use', 409);
    user.phone = phone;
  }
  if (body.password !== undefined && body.password !== '') {
    if (String(body.password).length < 6) throw fail('Password must be at least 6 characters', 400);
    user.password = body.password; // hashed by the pre-save hook
  }
  if (body.role !== undefined && body.role !== user.role) {
    if (!MANAGED_ROLES.includes(body.role)) throw fail('Role must be passenger or driver', 400);
    user.role = body.role;
  }
  if (body.emailVerified !== undefined) user.emailVerified = body.emailVerified === true;
  if (body.isSuspended !== undefined) user.isSuspended = body.isSuspended === true;

  const dd = body.driverDetails;
  if (dd && typeof dd === 'object') {
    if (!user.driverDetails) user.driverDetails = {};
    const vt = pickVehicle(dd.vehicleType);
    if (vt) user.driverDetails.vehicleType = vt;
    if (dd.plateNumber !== undefined) user.driverDetails.plateNumber = String(dd.plateNumber).trim();
    if (dd.licenseNo !== undefined) user.driverDetails.licenseNo = String(dd.licenseNo).trim();
    if (dd.isAvailable !== undefined) user.driverDetails.isAvailable = dd.isAvailable === true;
  }

  await user.save();

  if (user.isSuspended) {
    await RefreshToken.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() });
  }
  return User.findById(user._id).select('-password');
};

// PATCH /api/admin/users/:id/suspend
export const suspendUser = async (userId) => {
  const user = await User.findByIdAndUpdate(userId, { isSuspended: true }, { new: true }).select('-password');
  if (!user) throw fail('User not found', 404);
  await RefreshToken.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() });
  return user;
};

// PATCH /api/admin/users/:id/unsuspend
export const unsuspendUser = async (userId) => {
  const user = await User.findByIdAndUpdate(userId, { isSuspended: false }, { new: true }).select('-password');
  if (!user) throw fail('User not found', 404);
  return user;
};

// DELETE /api/admin/users/:id — permanently delete a user + their data.
export const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw fail('User not found', 404);
  if (user.role === 'admin') throw fail('Cannot delete an admin account', 400);

  await Promise.all([
    User.deleteOne({ _id: user._id }),
    Location.deleteMany({ driver: user._id }),
    RefreshToken.deleteMany({ user: user._id }),
    Ride.deleteMany({ $or: [{ passenger: user._id }, { driver: user._id }] }),
    Payment.deleteMany({ user: user._id }),
  ]);
  return { success: true };
};