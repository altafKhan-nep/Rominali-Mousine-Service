// Uber-style vehicle icons — top-down view, heading-rotatable, premium
// Inspired by Uber Driver: clean silhouette, soft shadow, heading arrow
const svgWrap = (body, size) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" aria-hidden="true">${body}</svg>`;

// Top-down sedan: rounded rectangle body, windshield, roof, wheels, heading chevron
const uberSedan = (color = '#0b0d0f') => svgWrap(`
  <g filter="url(#s)">
  <rect x="9" y="4" width="14" height="24" rx="3.5" fill="${color}" stroke="white" stroke-width="1.2"/>
  <rect x="10.5" y="7" width="11" height="6" rx="1" fill="white" opacity="0.95"/>
  <rect x="10.5" y="19" width="11" height="4" rx="1" fill="white" opacity="0.9"/>
  <circle cx="10" cy="10" r="1.2" fill="#1a1a1a"/><circle cx="22" cy="10" r="1.2" fill="#1a1a1a"/>
  <circle cx="10" cy="22" r="1.2" fill="#1a1a1a"/><circle cx="22" cy="22" r="1.2" fill="#1a1a1a"/>
  <path d="M16 2.5 L18 5.5 H14 Z" fill="${color}" stroke="white" stroke-width="0.8"/>
  </g>
  <defs><filter id="s" x="0" y="0" width="32" height="32" filterUnits="userSpaceOnUse"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/></filter></defs>
`, 32);

const uberSuv = (color = '#0b0d0f') => svgWrap(`
  <g filter="url(#s)">
  <rect x="8" y="3" width="16" height="26" rx="3" fill="${color}" stroke="white" stroke-width="1.2"/>
  <rect x="9.5" y="7" width="13" height="7" rx="1.2" fill="white" opacity="0.95"/>
  <rect x="9.5" y="19.5" width="13" height="4.5" rx="1" fill="white" opacity="0.9"/>
  <circle cx="9.5" cy="10" r="1.3" fill="#1a1a1a"/><circle cx="22.5" cy="10" r="1.3" fill="#1a1a1a"/>
  <circle cx="9.5" cy="22.5" r="1.3" fill="#1a1a1a"/><circle cx="22.5" cy="22.5" r="1.3" fill="#1a1a1a"/>
  <path d="M16 1.5 L19 5 H13 Z" fill="${color}" stroke="white" stroke-width="0.8"/>
  </g>
  <defs><filter id="s" x="0" y="0" width="32" height="32"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/></filter></defs>
`, 32);

const uberVan = (color = '#0b0d0f') => svgWrap(`
  <g filter="url(#s)">
  <rect x="7" y="2" width="18" height="28" rx="2.5" fill="${color}" stroke="white" stroke-width="1.2"/>
  <rect x="9" y="6" width="14" height="14" rx="1" fill="white" opacity="0.92"/>
  <circle cx="9" cy="9" r="1.2" fill="#1a1a1a"/><circle cx="23" cy="9" r="1.2" fill="#1a1a1a"/>
  <circle cx="9" cy="23" r="1.2" fill="#1a1a1a"/><circle cx="23" cy="23" r="1.2" fill="#1a1a1a"/>
  <path d="M16 1 L19 4.5 H13 Z" fill="${color}" stroke="white" stroke-width="0.8"/>
  </g>
  <defs><filter id="s" x="0" y="0" width="32" height="32"><feDropShadow dx="0" dy="2" stdDeviation="2.2" flood-opacity="0.28"/></filter></defs>
`, 32);

// Legacy side-view (kept for fallback, but new top-down is Uber-style)
const svg = (body, size, strokeWidth = 2) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const PIN_CAR = svg(
  '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  16, 2.2
);
export const PIN_SUV = svg(
  '<path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8"/><path d="M7 14h.01"/><path d="M17 14h.01"/><rect width="18" height="8" x="3" y="10" rx="2"/><path d="M5 18v2"/><path d="M19 18v2"/>',
  16, 2.2
);
export const PIN_BUS = svg(
  '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>',
  16, 2.2
);
export const PIN_FLAG = svg(
  '<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/>',
  13, 2.4
);
export const PIN_USER = svg(
  '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  13, 2.2
);

// Uber top-down exports — heading-rotatable via CSS transform
export const UBER_SEDAN = uberSedan('#0b0d0f');
export const UBER_SUV = uberSuv('#0b0d0f');
export const UBER_VAN = uberVan('#0b0d0f');
export const UBER_SEDAN_GOLD = uberSedan('#a11c1c');
