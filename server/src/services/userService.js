import { Buffer } from 'node:buffer';
import User from '../models/User.js';

const fail = (message, statusCode) => Object.assign(new Error(message), { statusCode });

// Only allow editable profile fields.
const EDITABLE = ['name', 'phone'];

export const publicProfile = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar,
  emailVerified: user.emailVerified,
  authProvider: user.authProvider,
  driverDetails: user.driverDetails,
  createdAt: user.createdAt,
});

export const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw fail('User not found', 404);
  return publicProfile(user);
};

export const updateProfile = async (userId, body) => {
  const update = {};
  for (const field of EDITABLE) {
    if (body[field] !== undefined) update[field] = String(body[field]).trim();
  }
  if (update.name && !update.name) throw fail('Name cannot be empty', 400);
  if (!Object.keys(update).length) throw fail('Nothing to update', 400);

  const user = await User.findByIdAndUpdate(userId, update, { new: true });
  if (!user) throw fail('User not found', 404);
  return publicProfile(user);
};

// Avatars are stored as a data-URL (base64) in Mongo — no external storage.
// Validate it's a real image and keep it small enough for a 1mb JSON limit.
const AVATAR_MAX_BYTES = 512 * 1024;

export const setAvatar = async (userId, dataUrl) => {
  if (typeof dataUrl !== 'string' || !/^data:image\/(png|jpe?g|gif|webp);base64,/.test(dataUrl)) {
    throw fail('Provide a valid image (PNG/JPEG/GIF/WebP) as a data URL', 400);
  }
  const base64 = dataUrl.split(',')[1];
  const bytes = Buffer.from(base64, 'base64').length;
  if (bytes > AVATAR_MAX_BYTES) throw fail('Image must be under 512KB', 400);

  const user = await User.findByIdAndUpdate(userId, { avatar: dataUrl }, { new: true });
  if (!user) throw fail('User not found', 404);
  return publicProfile(user);
};

export const removeAvatar = async (userId) => {
  const user = await User.findByIdAndUpdate(userId, { avatar: '' }, { new: true });
  if (!user) throw fail('User not found', 404);
  return publicProfile(user);
};

// Change password: verify the current one, then update. Keeps the current
// session — full sign-out-everywhere is handled by the reset-password flow.
export const changePassword = async (userId, { currentPassword, newPassword }) => {
  if (!currentPassword) throw fail('Enter your current password', 400);
  if (!newPassword || newPassword.length < 6) {
    throw fail('New password must be at least 6 characters', 400);
  }

  const user = await User.findById(userId).select('+password');
  if (!user) throw fail('User not found', 404);
  if (!(await user.matchPassword(currentPassword))) {
    throw fail('Current password is incorrect', 400);
  }
  if (await user.matchPassword(newPassword)) {
    throw fail('New password must be different from the current one', 400);
  }

  user.password = newPassword;
  await user.save();
  return { success: true };
};
