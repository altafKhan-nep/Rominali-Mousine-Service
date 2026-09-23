import AppSetting from '../models/AppSetting.js';

// Key/value settings. `defaults` documents every known key so reads always
// return a value even before an admin has touched Settings.
const DEFAULTS = {
  // Fare model overrides (0/null = use the built-in per-vehicle rates)
  baseFare: null,
  perKm: null,
  perMin: null,
  // Toggles
  paymentsEnabled: true,
  // Support info shown in the app
  supportPhone: '(240) 351-0826',
  supportEmail: 'Rominalimo2023@gmail.com',
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
  const allowed = Object.keys(DEFAULTS);
  const entries = [];
  for (const [key, value] of Object.entries(patch || {})) {
    if (!allowed.includes(key)) continue;
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
