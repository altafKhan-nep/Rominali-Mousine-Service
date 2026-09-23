import AppSetting from '../models/AppSetting.js';

const fail = (message, statusCode) => Object.assign(new Error(message), { statusCode });

// Key/value settings. `defaults` documents every known key so reads always
// return a value even before an admin has touched Settings.
const DEFAULTS = {
  // Fare model overrides (null = use the built-in per-vehicle rates)
  baseFare: null,
  perKm: null,
  perMin: null,
  // Toggles
  paymentsEnabled: true,
  // Support info shown in the app
  supportPhone: '(240) 351-0826',
  supportEmail: 'Rominalimo2023@gmail.com',
};

// Coerce + validate each known key so a malformed value can't corrupt the app.
const VALIDATORS = {
  baseFare: (v) => (v === null || v === '' ? null : Number(v)),
  perKm: (v) => (v === null || v === '' ? null : Number(v)),
  perMin: (v) => (v === null || v === '' ? null : Number(v)),
  paymentsEnabled: (v) => v === true || v === 'true' || v === 1 || v === '1',
  supportPhone: (v) => String(v).trim(),
  supportEmail: (v) => String(v).trim(),
};

export const getSettings = async () => {
  const rows = await AppSetting.find();
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULTS, ...stored };
};

export const getPublicSettings = async () => {
  const all = await getSettings();
  // Only expose what the client legitimately needs.
  return {
    paymentsEnabled: all.paymentsEnabled,
    supportPhone: all.supportPhone,
    supportEmail: all.supportEmail,
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
  };
};

export const updateSettings = async (patch) => {
  const entries = [];
  for (const [key, raw] of Object.entries(patch || {})) {
    if (!(key in DEFAULTS)) continue;
    const value = VALIDATORS[key](raw);
    if (key.endsWith('Fare') || key.startsWith('per')) {
      if (value !== null && (!Number.isFinite(value) || value < 0)) {
        throw fail(`${key} must be a non-negative number`, 400);
      }
    }
    if (key === 'supportEmail' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw fail('supportEmail must be a valid email address', 400);
    }
    if (key === 'supportPhone' && !value) throw fail('supportPhone cannot be empty', 400);
    entries.push([key, value]);
  }
  if (!entries.length) return getSettings();

  await Promise.all(
    entries.map(([key, value]) =>
      AppSetting.updateOne({ key }, { $set: { value } }, { upsert: true })
    )
  );
  return getSettings();
};
