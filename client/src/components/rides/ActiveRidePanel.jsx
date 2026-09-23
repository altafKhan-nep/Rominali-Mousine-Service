import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, AttributionControl } from 'react-leaflet';
import L from 'leaflet';
import { MapViewSelector, MAP_VIEWS } from '../maps/MapViewSelector.jsx';
import { PIN_FLAG, PIN_USER, UBER_SEDAN } from '../maps/pinIcons.js';
import { Button } from '../ui/Button.jsx';

const pickupIcon = L.divIcon({
  className: '',
  html: `<div class="map-pin-start"><span>●</span></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const dropoffIcon = L.divIcon({
  className: '',
  html: `<div class="map-pin map-pin-dropoff"><span>${PIN_FLAG}</span></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const passengerIcon = L.divIcon({
  className: '',
  html: `<div class="map-pin map-pin-passenger"><span>${PIN_USER}</span></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const uberDriverIcon = (heading = 0) => L.divIcon({
  className: '',
  html: `<div style="transform: rotate(${heading}deg); transition: transform 0.6s; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.28));">${UBER_SEDAN}</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const STATUS_TEXT = {
  accepted: 'Head to the pickup',
  arriving: 'You are arriving',
  in_progress: 'Trip in progress',
};

// Driver's view of the active ride: live passenger + own position, route, and
// status controls. `driverPos` is the driver's own geolocation; `passengerPos`
// is the streamed live passenger position (falls back to the pickup point).
export default function ActiveRidePanel({ ride, driverPos, passengerPos, onStatus, busyStatus }) {
  const [view, setView] = useState('streets');
  const activeView = MAP_VIEWS.find((v) => v.id === view) || MAP_VIEWS[0];
  const routePositions = useMemo(
    () => (ride?.route?.length ? ride.route.map((p) => [p.lat, p.lng]) : []),
    [ride?.route]
  );

  const center =
    driverPos ||
    (ride?.pickup?.lat != null ? [ride.pickup.lat, ride.pickup.lng] : [39.203, -76.857]);
  const pax =
    passengerPos ||
    (ride?.pickup?.lat != null ? { lat: ride.pickup.lat, lng: ride.pickup.lng } : null);

  const status = ride?.status;

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div>
          <h2 className="font-bold">Active ride</h2>
          <p className="text-sm text-muted">
            Passenger: <span className="font-medium text-ink">{ride?.passenger?.name || '—'}</span>
          </p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 capitalize">
          {STATUS_TEXT[status] || String(status || '').replace('_', ' ')}
        </span>
      </div>

      <div className="grid lg:grid-cols-3">
        {/* Map */}
        <div className="relative h-[360px] lg:col-span-2 lg:h-[460px]">
          <MapContainer
            center={center}
            zoom={14}
            className="h-full w-full"
            attributionControl={false}
          >
            <AttributionControl position="bottomleft" />
            <TileLayer
              url={activeView.url}
              attribution={activeView.attribution}
              {...(activeView.subdomains ? { subdomains: activeView.subdomains } : {})}
            />
            {ride?.pickup?.lat != null && (
              <Marker position={[ride.pickup.lat, ride.pickup.lng]} icon={pickupIcon}>
                <Popup>Pickup</Popup>
              </Marker>
            )}
            {ride?.dropoff?.lat != null && (
              <Marker position={[ride.dropoff.lat, ride.dropoff.lng]} icon={dropoffIcon}>
                <Popup>Dropoff</Popup>
              </Marker>
            )}
            {pax && (
              <Marker position={[pax.lat, pax.lng]} icon={passengerIcon}>
                <Popup>Passenger{passengerPos ? ' (live)' : ' (pickup)'}</Popup>
              </Marker>
            )}
            {driverPos && (
              <Marker position={[driverPos.lat, driverPos.lng]} icon={uberDriverIcon(driverPos.heading || 0)}>
                <Popup>You — heading {Math.round(driverPos.heading || 0)}°</Popup>
              </Marker>
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

          <div className="absolute left-4 top-4 z-[1000] flex flex-wrap gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-medium shadow-sm backdrop-blur">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-600" /> You
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#2563eb]" /> Passenger
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Pickup
            </span>
          </div>

          <MapViewSelector view={view} onChange={setView} />
        </div>

        {/* Details + status controls */}
        <div className="space-y-4 border-slate-100 p-5 lg:border-l">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Pickup</dt>
              <dd className="text-right font-medium text-ink">{ride?.pickup?.address}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Dropoff</dt>
              <dd className="text-right font-medium text-ink">{ride?.dropoff?.address}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Vehicle</dt>
              <dd className="font-medium">{ride?.vehicleType || '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Fare</dt>
              <dd className="font-bold text-brand-700">
                ${(ride?.fare?.estimated || 0).toFixed(2)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Distance</dt>
              <dd className="font-medium">
                {ride?.fare?.distanceKm ?? '—'} km · ~{ride?.fare?.durationMin ?? '—'} min
              </dd>
            </div>
            {ride?.passenger?.phone && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Passenger</dt>
                <dd className="font-medium">{ride.passenger.phone}</dd>
              </div>
            )}
          </dl>

          {status === 'accepted' && (
            <Button className="w-full" loading={busyStatus === 'arriving'} onClick={() => onStatus('arriving')}>
              Arriving at pickup
            </Button>
          )}
          {status === 'arriving' && (
            <Button className="w-full" loading={busyStatus === 'in_progress'} onClick={() => onStatus('in_progress')}>
              Start trip
            </Button>
          )}
          {status === 'in_progress' && (
            <Button className="w-full" loading={busyStatus === 'completed'} onClick={() => onStatus('completed')}>
              Complete trip
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}