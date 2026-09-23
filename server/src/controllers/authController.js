import passport from '../config/passport.js';
import { asyncHandler } from '../middleware/error.js';
import * as authService from '../services/authService.js';

const meta = (req) => ({
  userAgent: req.headers['user-agent'] || '',
  ip: req.ip || '',
});

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body, meta(req));
  res.status(201).json(result);
});

// Email-OR-phone + password, verified by passport's LocalStrategy.
export const login = (req, res, next) => {
  passport.authenticate('local', { session: false }, async (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info?.message || 'Invalid email/phone or password' });

    try {
      const rememberMe = Boolean(req.body.rememberMe);
      const tokens = await authService.issueTokens(user, { rememberMe, ...meta(req) });
      return res.json({ user: authService.publicUser(user), tokens });
    } catch (e) {
      return next(e);
    }
  })(req, res, next);
};

export const refresh = asyncHandler(async (req, res) => {
  const tokens = await authService.refresh(req.body.refreshToken);
  res.json({ tokens });
});

// Revokes the presented refresh token (this device only).
export const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(req.user._id, req.body.refreshToken);
  res.json(result);
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: authService.publicUser(req.user) });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.body.token);
  res.json(result);
});

export const resendVerification = asyncHandler(async (req, res) => {
  const result = await authService.resendVerification(req.body.email);
  res.json(result);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  res.json(result);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  res.json(result);
});

export const sendOtp = asyncHandler(async (req, res) => {
  const result = await authService.sendOtp(req.body.phone);
  res.json(result);
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyOtp({ ...req.body, ...meta(req) });
  res.json(result);
});

/* ---------- Social OAuth (Passport redirect flow) ---------- */

const clientUrl = () => process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const providerConfigured = (provider) =>
  (provider === 'google' && process.env.GOOGLE_CLIENT_ID) ||
  (provider === 'facebook' && process.env.FACEBOOK_APP_ID);

// Step 1: kick off the OAuth dance at the provider.
export const socialRedirect = (provider) => (req, res, next) => {
  if (!providerConfigured(provider)) {
    return res.status(503).json({ message: 'Social login is not configured.' });
  }
  const opts = { session: false, state: false, scope: ['profile', 'email'] };
  passport.authenticate(provider, opts)(req, res, next);
};

// Step 2: provider bounces back here → issue tokens → bounce to the SPA.
export const socialCallback = (provider) => (req, res, next) => {
  const failRedirect = `${clientUrl()}/auth/social?error=login_failed`;
  passport.authenticate(provider, { session: false, failureRedirect: failRedirect }, async (err, user) => {
    if (err || !user) return res.redirect(failRedirect);
    try {
      const tokens = await authService.issueTokens(user, {
        rememberMe: true,
        ...{ userAgent: req.headers['user-agent'] || '', ip: req.ip || '' },
      });
      const q = `?accessToken=${encodeURIComponent(tokens.accessToken)}&refreshToken=${encodeURIComponent(tokens.refreshToken)}`;
      return res.redirect(`${clientUrl()}/auth/social${q}`);
    } catch (e) {
      return res.redirect(`${failRedirect}&error=${encodeURIComponent(e.message)}`);
    }
  })(req, res, next);
};