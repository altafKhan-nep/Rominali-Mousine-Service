import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap, AttributionControl } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapViewSelector, MAP_VIEWS } from './MapViewSelector.jsx';
import { PIN_FLAG, UBER_SEDAN, UBER_SUV, UBER_VAN } from './pinIcons.js';

const pickupIcon = L.divIcon({
  className: '',
  html: `<div class="map-pin-start"><span>●</span></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -14],
});

const dropoffIcon = L.divIcon({
  className: '',
  html: `<div class="map-pin map-pin-dropoff"><span>${PIN_FLAG}</span></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

// "You are here" — the user's resolved location on the booking map
const userIcon = L.divIcon({
  className: '',
  html: `<div class="map-pin-user"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -12],
});

// Premium top-down car icons — heading-rotatable like Premium Driver
const uberIconFor = (type, heading = 0) => {
  const t = String(type || '');
  let glyph = UBER_SEDAN;
  if (t.includes('van') || t.includes('coach') || t.includes('bus')) glyph = UBER_VAN;
  else if (t.includes('suv')) glyph = UBER_SUV;
  const rot = Number.isFinite(heading) ? heading : 0;
  return L.divIcon({
    className: '',
    html: `<div style="transform: rotate(${rot}deg); transition: transform 0.6s cubic-bezier(0.22,1,0.36,1); filter: drop-shadow(0 3px 6px rgba(0,0,0,0.28));">${glyph}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Captures map clicks and reports lat/lng
function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Leaflet's `center` prop only applies on mount. Geolocation resolves AFTER the
// first render, so this flies the map to the user's position the moment it's known.
function CenterFollower({ center, zoom }) {
  const map = useMap();
  const prev = useRef('');
  useEffect(() => {
    if (center?.lat == null || center?.lng == null) return;
    const key = `${center.lat.toFixed(6)},${center.lng.toFixed(6)}`;
    if (prev.current === key) return;
    prev.current = key;
    map.flyTo([center.lat, center.lng], map.getZoom() || zoom || 13, {
      animate: true,
      duration: 0.6,
    });
  }, [center?.lat, center?.lng, map, zoom]);
  return null;
}

// Floating "use my location" control — re-requests geolocation and re-centers.
function LocateButton({ onLocate, userPosition }) {
  const map = useMap();
  return (
    <button
      type="button"
      aria-label="Use my location"
      title="Use my location"
      onClick={() => {
        onLocate?.();
        if (userPosition) {
          map.flyTo([userPosition.lat, userPosition.lng], map.getZoom() || 13, { animate: true });
        }
      }}
      className="absolute bottom-20 right-3 z-[1000] grid h-11 w-11 place-items-center rounded-full bg-white text-brand-900 shadow-lg ring-1 ring-slate-200 transition-colors hover:bg-brand-50"
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5.5 w-5.5">
        <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" fill="currentColor" opacity="0.45" />
        <path d="M12 2v3m0 14v3M2 12h3m14 0h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export function BookingMap({ center, pickup, dropoff, route, drivers = [], userPosition, onLocate, onPick, interactive = true }) {
  const [view, setView] = useState('streets');
  const activeView = MAP_VIEWS.find((v) => v.id === view) || MAP_VIEWS[0];
  const routePositions = useMemo(
    () => (route?.length ? route.map((p) => [p.lat, p.lng]) : []),
    [route]
  );

  // Don't double-stack the blue dot under the green pickup pin when both are
  // the user's location (auto-set "Current location").
  const sameAsPickup =
    pickup &&
    userPosition &&
    Math.abs(pickup.lat - userPosition.lat) < 0.0003 &&
    Math.abs(pickup.lng - userPosition.lng) < 0.0003;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">
      <MapContainer
        center={center || [39.207, -76.857]}
        zoom={13}
        className="h-full w-full"
        scrollWheelZoom
        attributionControl={false}
      >
<AttributionControl position="bottomleft" />
        <TileLayer
          url={activeView.url}
          attribution={activeView.attribution}
          {...(activeView.subdomains ? { subdomains: activeView.subdomains } : {})}
        />
        {interactive && onPick && <ClickHandler onPick={onPick} />}
        <CenterFollower center={center} zoom={13} />
        {interactive && <LocateButton onLocate={onLocate} userPosition={userPosition} />}

        {/* User's own resolved position */}
        {!sameAsPickup && userPosition?.lat != null && userPosition?.lng != null && (
          <Marker position={[userPosition.lat, userPosition.lng]} icon={userIcon} zIndexOffset={1000}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {pickup?.lat != null && pickup?.lng != null && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>Pickup</Popup>
          </Marker>
        )}
        {dropoff?.lat != null && dropoff?.lng != null && (
          <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon}>
            <Popup>Dropoff</Popup>
          </Marker>
        )}

        {/* Nearby available drivers — Premium oriented cars */}
        {drivers.map((d) =>
          d.lat != null && d.lng != null ? (
            <Marker
              key={d._id}
              position={[d.lat, d.lng]}
              icon={uberIconFor(d.vehicleType, d.heading)}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{d.name}</p>
                  <p className="text-xs capitalize text-muted">
                    {d.vehicleType} · {d.plateNumber}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">Available now</p>
                </div>
              </Popup>
            </Marker>
          ) : null
        )}

        {routePositions.length > 0 && (
          <>
            <Polyline
              positions={routePositions}
              pathOptions={{ color: '#ffffff', weight: 9, opacity: 0.7, lineCap: 'round' }}
            />
            <Polyline
              positions={routePositions}
              pathOptions={{ color: '#c62828', weight: 5, opacity: 0.9, lineCap: 'round' }}
            />
          </>
        )}
      </MapContainer>

      <MapViewSelector view={view} onChange={setView} />
    </div>
  );
}