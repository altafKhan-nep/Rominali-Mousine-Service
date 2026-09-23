import dotenv from 'dotenv';

dotenv.config();

const GEOCODE_URL = 'https://nominatim.openstreetmap.org/search';
const REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

// Howard County, MD bounding box for bias: [minLon, minLat, maxLon, maxLat] — corrected (was inverted lat)
const DEFAULT_VIEWBOX = '-77.4,38.7,-76.4,39.7';

export const searchPlaces = async (query, { limit = 6, viewbox = DEFAULT_VIEWBOX } = {}) => {
  const url = new URL(GEOCODE_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('viewbox', viewbox);
  url.searchParams.set('bounded', '1');

  const res = await fetch(url, { headers: { 'User-Agent': 'RominaLimousine/1.0' } });
  if (!res.ok) throw Object.assign(new Error('Place search failed'), { statusCode: 502 });
  const data = await res.json();

  return data.map((d) => ({
    id: d.place_id,
    address: d.display_name,
    lat: +d.lat,
    lng: +d.lon,
    type: d.type,
  }));
};

// Turn coordinates into a human-readable address (used when the passenger's
// geolocation is auto-selected as the pickup — show the real place, not a
// generic "Current location" label).
export const reverseGeocode = async (lat, lng) => {
  const url = new URL(REVERSE_URL);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url, { headers: { 'User-Agent': 'RominaLimousine/1.0' } });
  if (!res.ok) throw Object.assign(new Error('Reverse geocode failed'), { statusCode: 502 });
  const data = await res.json();
  if (!data || data.lat === undefined) return null;

  // Build a compact, readable address (e.g. "1600 Pennsylvania Ave NW,
  // Washington, DC 20500") instead of Nominatim's long display_name.
  const a = data.address || {};
  const road = [a.house_number, a.road || a.pedestrian || a.neighbourhood]
    .filter(Boolean)
    .join(' ');
  const city = a.suburb || a.city || a.town || a.village || a.municipality || a.county;
  const state = a.state;
  const postal = a.postcode;
  const country = a.country === 'United States' ? 'US' : a.country;
  const address =
    [road, city, [state, postal].filter(Boolean).join(' '), country]
      .filter(Boolean)
      .join(', ') || data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  return {
    address,
    lat: +data.lat,
    lng: +data.lon,
  };
};