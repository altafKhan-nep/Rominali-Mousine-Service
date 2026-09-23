import AuditLog from '../models/AuditLog.js';

export const audit = (action, opts = {}) => async (req, res, next) => {
  const start = Date.now();
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    // fire-and-forget audit write (don't block response)
    AuditLog.create({
      actor: req.user?._id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      action,
      targetType: opts.targetType,
      targetId: req.params?.id || body?.ride?._id || body?.user?._id || undefined,
      after: opts.captureBody ? body : undefined,
      ip: req.ip,
      userAgent: req.get('user-agent')?.slice(0, 300),
      meta: { statusCode: res.statusCode, durationMs: Date.now() - start },
    }).catch(() => {});
    return originalJson(body);
  };
  next();
};
