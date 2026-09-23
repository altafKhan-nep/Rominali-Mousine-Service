import { asyncHandler } from '../middleware/error.js';
import { getPublicSettings } from '../services/settingsService.js';

// GET /api/settings - public subset for the booking form / support info
export const publicSettings = asyncHandler(async (req, res) => {
  res.json({ settings: await getPublicSettings() });
});
