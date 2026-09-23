import { asyncHandler } from '../middleware/error.js';
import * as placeService from '../services/placeService.js';

// GET /api/places/search?q=...
export const search = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ places: [] });

  const places = await placeService.searchPlaces(q, {
    limit: Math.min(+req.query.limit || 6, 10),
  });
  res.json({ places });
});

// GET /api/places/reverse?lat=&lng=  ->  { place: { address, lat, lng } | null }
export const reverse = asyncHandler(async (req, res) => {
  const lat = +req.query.lat;
  const lng = +req.query.lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({ message: 'Invalid coordinates' });
  }
  const place = await placeService.reverseGeocode(lat, lng);
  res.json({ place });
});