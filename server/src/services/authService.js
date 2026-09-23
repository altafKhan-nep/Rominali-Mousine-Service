import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import OtpCode from '../models/OtpCode.js';
import { generateToken, hashToken } from '../utils/tokens.js';
import { sendMail } from './mailService.js';
import { sendSms, isSmsConfigured } from './smsService.js';

const fail = (message, statusCode) => Object.assign(new Error(message), { statusCode });

const signAccess = (user) =>
  jwt.sign({ id: user._id, role: user.role, v: user.tokenVersion }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  });

const refreshTtlMs = (rememberMe) => {
  const raw = rememberMe ? process.env.REMEMBER_ME_EXPIRY : process.env.REFRESH_TOKEN_EXPIRY;
  // Support both "30d" and plain milliseconds.
  const match = /^(\d+)([smhd])$/.exec(raw || '');
  if (match) {
    const n = Number(match[1]);
    return n * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]];
  }
  return 7 * 24 * 60 * 60 * 1000;
};

// Issues a short-lived access JWT + a server-side opaque refresh token.
// The refresh token is stored hashed, so it can be rotated and revoked per device.
export const issueTokens = async (user, { rememberMe = false, userAgent = '', ip = '' } = {}) => {
  const rawToken = generateToken();
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + refreshTtlMs(rememberMe)),
    rememberMe,
    userAgent: (userAgent || '').slice(0, 200),
    ip,
  });
  return { accessToken: signAccess(user), refreshToken: rawToken };
};

export const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar,
  emailVerified: user.emailVerified,
  authProvider: user.authProvider,
  driverDetails: user.driverDetails,
});

/* ---------- refresh (rotates the token, killing the one presented) ---------- */
export const refresh = async (rawToken) => {
  if (!rawToken) throw fail('Missing refresh token', 400);

  // Atomically "claim" the token: the filter matches only a live token, and the
  // $set revokes it in the same op. Under concurrent replays of the same token,
  // exactly one request matches — the rest see revokedAt set and get 401.
  const claimed = await RefreshToken.findOneAndUpdate(
    { tokenHash: hashToken(rawToken), revokedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { revokedAt: new Date() } },
    { returnDocument: 'before' }
  );
  if (!claimed) throw fail('Session ended', 401);

  const user = await User.findById(claimed.user);
  if (!user) throw fail('Session ended', 401);
  if (user.isSuspended) throw fail('Account suspended', 403);

  const tokens = await issueTokens(user, {
    rememberMe: claimed.rememberMe,
    userAgent: claimed.userAgent,
    ip: claimed.ip,
  });
  return tokens;
};

/* ---------- logout: revoke the presented device token ---------- */
export const logout = async (userId, rawToken) => {
  if (rawToken) {
    await RefreshToken.updateOne({ user: userId, tokenHash: hashToken(rawToken) }, { revokedAt: new Date() });
  }
  return { success: true };
};

/* ---------- logout everywhere (e.g. password reset / security) ---------- */
export const logoutAll = async (userId) => {
  await RefreshToken.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date() });
  await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
  return { success: true };
};

/* ---------- validation ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s()-]{7,}$/;

const validateRegistration = ({ name, email, phone, password }) => {
  if (!name || !name.trim()) return 'Full name is required';
  if (!email || !EMAIL_RE.test(email)) return 'A valid email address is required';
  if (!password || password.length < 6) return 'Password must be at least 6 characters';
  if (phone && !PHONE_RE.test(phone)) return 'Please enter a valid phone number';
  return null;
};

/* ---------- email helpers ---------- */
const appUrl = () => process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const devLink = (link) => (process.env.NODE_ENV === 'production' ? undefined : link);

const sendVerificationEmail = async (user, rawToken) => {
  const link = `${appUrl()}/verify-email?token=${rawToken}`;
  await sendMail({
    to: user.email,
    subject: 'Verify your email — Romina Limousine Service',
    html: `<p>Hi ${user.name},</p><p>Confirm your email address to finish setting up your account:</p>
      <p><a href="${link}">Verify my email</a></p>
      <p>This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>`,
  });
  return devLink(link);
};

/* ---------- register ---------- */
export const register = async ({ name, email, phone, password, role, driverDetails }, meta = {}) => {
  const validationError = validateRegistration({ name, email, phone, password });
  if (validationError) throw fail(validationError, 400);

  const emailInUse = await User.findOne({ email: email.toLowerCase() });
  if (emailInUse) throw fail('This email is already registered. Try signing in.', 409);

  // RBAC: public registration may only create passenger|driver — admin roles are seed/CRM-only
  const ALLOWED_PUBLIC_ROLES = ['passenger', 'driver'];
  const safeRole = ALLOWED_PUBLIC_ROLES.includes(role) ? role : 'passenger';
  const safeDriverDetails = safeRole === 'driver' ? driverDetails : undefined;
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    phone: phone || '',
    password,
    role: safeRole,
    emailVerified: false,
    authProvider: 'local',
    driverDetails: safeDriverDetails,
  });

  const rawToken = generateToken();
  user.verificationToken = { token: hashToken(rawToken), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) };
  await user.save();

  const verificationLink = await sendVerificationEmail(user, rawToken);
  const tokens = await issueTokens(user, meta);

  return { user: publicUser(user), tokens, verificationLink };
};

/* ---------- email verification ---------- */
export const verifyEmail = async (token) => {
  const hash = hashToken(token);
  const user = await User.findOne({ 'verificationToken.token': hash });
  if (!user || !user.verificationToken || user.verificationToken.expiresAt < new Date()) {
    throw fail('Verification link is invalid or has expired.', 400);
  }
  user.emailVerified = true;
  user.verificationToken = null;
  await user.save();
  return { user: publicUser(user) };
};

export const resendVerification = async (email) => {
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user) throw fail('No account found with that email.', 404);
  if (user.emailVerified) throw fail('Your email is already verified.', 400);
  const rawToken = generateToken();
  user.verificationToken = { token: hashToken(rawToken), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) };
  await user.save();
  const link = await sendVerificationEmail(user, rawToken);
  return { verificationLink: link };
};

/* ---------- forgot / reset password ---------- */
export const forgotPassword = async (email) => {
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user) throw fail('No account found with that email.', 404);

  const rawToken = generateToken();
  user.resetToken = { token: hashToken(rawToken), expiresAt: new Date(Date.now() + 60 * 60 * 1000) };
  await user.save();

  const link = `${appUrl()}/reset-password?token=${rawToken}`;
  await sendMail({
    to: user.email,
    subject: 'Reset your password — Romina Limousine Service',
    html: `<p>Hi ${user.name},</p><p>We received a request to reset your password. Click below to choose a new one:</p>
      <p><a href="${link}">Reset my password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
  });
  return { resetLink: devLink(link) };
};

export const resetPassword = async ({ token, password }) => {
  if (!password || password.length < 6) throw fail('Password must be at least 6 characters', 400);
  const hash = hashToken(token);
  const user = await User.findOne({ 'resetToken.token': hash }).select('+password');
  if (!user || !user.resetToken || user.resetToken.expiresAt < new Date()) {
    throw fail('Reset link is invalid or has expired.', 400);
  }
  user.password = password;
  user.resetToken = null;
  await user.save();

  // Security: resetting the password signs out every device.
  await logoutAll(user._id);
  return { success: true };
};

/* ---------- phone OTP login ---------- */
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

export const sendOtp = async (phone) => {
  if (!phone || !PHONE_RE.test(phone)) throw fail('Enter a valid phone number.', 400);

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await OtpCode.deleteMany({ phone });
  await OtpCode.create({
    phone,
    codeHash: hashToken(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    attempts: 0,
  });

  await sendSms({
    to: phone,
    body: `Your Romina Limousine Service verification code is ${code}. It expires in 10 minutes.`,
  });
  // In dev (no Twilio) return the code so the flow can be tested end-to-end.
  return { devCode: isSmsConfigured() ? undefined : code };
};

export const verifyOtp = async ({ phone, code, userAgent = '', ip = '' }) => {
  if (!phone || !code) throw fail('Phone number and code are required', 400);

  const otp = await OtpCode.findOne({ phone });
  if (!otp || otp.expiresAt < new Date()) {
    if (otp) await otp.deleteOne();
    throw fail('Code expired. Request a new one.', 400);
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await otp.deleteOne();
    throw fail('Too many attempts. Request a new code.', 400);
  }
  if (otp.codeHash !== hashToken(String(code).trim())) {
    otp.attempts += 1;
    await otp.save();
    throw fail('Invalid code.', 400);
  }
  await otp.deleteOne();

  // Find-or-create a passenger account keyed by phone.
  const phoneDigits = phone.replace(/\D/g, '');
  let user = await User.findOne({ phone });
  if (!user) {
    user = await User.create({
      name: `User ${phoneDigits.slice(-4)}`,
      email: `${phoneDigits}@phone.local`,
      phone,
      password: generateToken(), // OTP users don't use a password
      emailVerified: true,
      authProvider: 'phone',
    });
  }

  const tokens = await issueTokens(user, { rememberMe: true, userAgent, ip });
  return { user: publicUser(user), tokens };
};