import passport from '../config/passport.js';

// Protects routes via the Passport JWT strategy (stateless Bearer token).
// Same 401 shape as before: { code: 'TOKEN_EXPIRED' } lets the client refresh.
export const protect = (req, res, next) =>
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      const expired = info?.name === 'TokenExpiredError';
      return res.status(401).json({
        message: expired ? 'Token expired' : 'Not authorized, invalid token',
        ...(expired ? { code: 'TOKEN_EXPIRED' } : {}),
      });
    }
    // Suspended accounts are rejected even with a valid token.
    if (user.isSuspended) {
      return res.status(403).json({ message: 'Account suspended', code: 'ACCOUNT_SUSPENDED' });
    }
    req.user = user;
    next();
  })(req, res, next);

export const requireRole = (...roles) => (req, res, next) => {
  // Support expanded CRM roles; legacy 'admin' is super_admin equivalent
  const role = req.user?.role;
  const effective = role === 'admin' ? ['admin', 'super_admin'] : [role];
  const allowed = roles.flatMap((r) => (r === 'admin' ? ['admin', 'super_admin'] : [r]));
  if (!allowed.some((r) => effective.includes(r) || roles.includes(role))) {
    if (!roles.includes(role) && !allowed.includes(role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
  }
  next();
};

// Permission matrix for granular CRM access (resource:action)
const MATRIX = {
  super_admin: ['*'],
  admin: ['*'],
  dispatcher: ['rides:*', 'drivers:read', 'drivers:assign', 'map:read', 'passengers:read'],
  manager: ['rides:read', 'analytics:read', 'drivers:read', 'passengers:read', 'finance:read'],
  finance: ['finance:*', 'rides:read', 'payments:read', 'analytics:read'],
  support: ['tickets:*', 'passengers:read', 'rides:read', 'notifications:read'],
  driver: ['rides:read_own', 'rides:update_own'],
};
export const requirePerm = (perm) => (req, res, next) => {
  const role = req.user?.role;
  if (['super_admin', 'admin'].includes(role)) return next();
  const perms = MATRIX[role] || [];
  if (perms.includes('*') || perms.includes(perm) || perms.includes(perm.split(':')[0] + ':*')) return next();
  return res.status(403).json({ message: `Forbidden: need ${perm}` });
};