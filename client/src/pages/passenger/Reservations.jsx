import { useEffect, useState } from 'react';
import { Car, CarFront, Bus } from 'lucide-react';
import { BookingMap } from '../../components/maps/BookingMap.jsx';
import BookingForm from '../../components/rides/BookingForm.jsx';
import useGeolocation from '../../hooks/useGeolocation.js';
import { nearbyDrivers, driverEta, reverseGeocode } from '../../services/rideService.js';

const DEFAULT_CENTER = [39.267, -76.799]; // Ellicott City, MD

const vehicleIcon = (type) => {
  const t = String(type || '');
  if (t.includes('van') || t.includes('coach') || t.includes('bus')) return Bus;
  if (t.includes('suv')) return CarFront;
  return Car;
};

export default function Reservations() {
  const { position, error: geoError, locate } = useGeolocation();
  const [locateRequested, setLocateRequested] = useState(false);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [driverRoute, setDriverRoute] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  // When the browser resolves the user's location, auto-select it as the
  // pickup so the map and driver search immediately reflect the current area.
  // The position is reverse-geocoded so the pickup shows the user's REAL
  // address (e.g. "9009 Main St, Ellicott City, MD") instead of a generic
  // "Current location" label.
  useEffect(() => {
    if (!position) return;
    if (pickup && !locateRequested) return;
    let cancelled = false;
    (async () => {
      let address = 'Current location';
      try {
        const { data } = await reverseGeocode(position.lat, position.lng);
        if (!cancelled && data?.place?.address) address = data.place.address;
      } catch {
        /* keep the generic fallback */
      }
      if (!cancelled) {
        setPickup({ lat: position.lat, lng: position.lng, address });
        setLocateRequested(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [position, pickup, locateRequested]);

  // Explicit "Use my location" — re-fetch the position and move the pickup to
  // it even if the user already picked something else.
  const useMyLocation = () => {
    setLocateRequested(true);
    locate();
  };

  // Load nearby drivers once pickup is chosen + live poll every 8s (moving cars)
  useEffect(() => {
    if (!pickup?.lat) {
      setDrivers([]);
      return;
    }
    let cancelled = false;
    const fetchDrivers = () => {
      setLoadingDrivers(true);
      nearbyDrivers({ lat: pickup.lat, lng: pickup.lng, radius: 10000 })
        .then(({ data }) => {
          if (!cancelled) setDrivers(data.drivers || []);
        })
        .catch(() => {})
        .finally(() => !cancelled && setLoadingDrivers(false));
    };
    fetchDrivers();
    const id = setInterval(fetchDrivers, 8000); // live moving Premium cars
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pickup?.lat, pickup?.lng]);

  // Fetch route + ETA from a selected driver's LIVE location to pickup (no DB staleness)
  const selectDriver = async (d) => {
    if (!pickup) return;
    setSelectedDriver(d);
    setDriverRoute(null);
    try {
      const { data } = await driverEta(d._id, { lat: pickup.lat, lng: pickup.lng }, { lat: d.lat, lng: d.lng });
      setDriverRoute(data.route || []);
    } catch {
      setDriverRoute([]);
    }
  };

  // Interactive map: first click sets pickup, second sets dropoff
  const handlePick = (p) => {
    if (!pickup) setPickup({ ...p, address: `Lat ${p.lat.toFixed(4)}, Lng ${p.lng.toFixed(4)}` });
    else if (!dropoff) setDropoff({ ...p, address: `Lat ${p.lat.toFixed(4)}, Lng ${p.lng.toFixed(4)}` });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero header */}
      <section className="bg-brand-gradient-soft mb-6 overflow-hidden rounded-3xl px-6 py-8 sm:px-10 sm:py-12">
        <h1 className="text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
          Reservations
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-brand-950/70 sm:text-base">
          Book a taxi, see the fare upfront, and track your driver live from pickup to dropoff —
          with clear arrival time and route, every step of the way.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-brand-800 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            Live driver tracking
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-brand-800 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            Upfront fare estimate
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-brand-800 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            Sedan · SUV · Van
          </span>
        </div>
      </section>

      {/* One-tap location + guest estimate — always visible */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={useMyLocation}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          aria-label="Use my current location for pickup"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          Use my location
        </button>
        <span className="text-xs text-muted">or tap the map — fare estimate works without sign-in</span>
      </div>
      {geoError && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">We couldn't access your location{geoError ? ` (${geoError})` : ''}.</p>
        </div>
      )}

      {/* Booking card */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-5">
          {/* Form */}
          <div className="border-slate-200 lg:col-span-2 lg:border-r">
            <BookingForm
              pickup={pickup}
              dropoff={dropoff}
              onPickupChange={setPickup}
              onDropoffChange={setDropoff}
            />
          </div>

          {/* Map */}
          <div className="relative lg:col-span-3">
            <div className="absolute left-4 top-4 z-[1000] rounded-full bg-white/95 px-4 py-2 text-xs font-medium text-brand-900 shadow-sm backdrop-blur">
              {pickup && !dropoff
                ? 'Tap the map to set dropoff'
                : !pickup
                  ? 'Tap the map to set pickup'
                  : 'Pickup set'}
            </div>
            <div className="h-[380px] sm:h-[440px] lg:h-full lg:min-h-[560px]">
              <BookingMap
                center={position || DEFAULT_CENTER}
                pickup={pickup}
                dropoff={dropoff}
                drivers={drivers}
                route={driverRoute}
                userPosition={position}
                onLocate={useMyLocation}
                onPick={handlePick}
              />
            </div>
          </div>
        </div>

        {/* Nearby drivers strip */}
        <div className="border-t border-slate-200 bg-slate-50/60 px-6 py-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">
              {pickup ? 'Drivers near your pickup' : 'Drivers in the area'}
              {loadingDrivers && <span className="ml-2 text-xs font-normal text-muted">Loading…</span>}
            </h3>
            <span className="flex items-center gap-1.5 text-xs font-medium text-brand-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
              {drivers.length} available
            </span>
          </div>

          {drivers.length === 0 && !loadingDrivers ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">
                {pickup && (pickup.lat < 38 || pickup.lat > 40 || pickup.lng < -77.5 || pickup.lng > -76)
                  ? `No drivers in ${pickup.address?.slice(0,40)} — Service area is Maryland, DC, VA. Tap "Use my location" when in MD/DC/VA.`
                  : pickup
                    ? 'No drivers within 50km. They may be offline — use "Use my location" near BWI / Ellicott City or try Executive Sedan / Premium SUV.'
                    : 'Choose a pickup in Maryland, DC, or Virginia to find drivers. Service area: MD, VA, Washington DC.'}
              </p>
              <p className="mt-1 text-xs text-amber-700">Service area: Maryland, DC, Virginia.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {drivers.map((d) => (
                <button
                  key={d._id}
                  type="button"
                  onClick={() => selectDriver(d)}
                  className={`card-lift flex items-center gap-3 rounded-2xl border bg-white p-3 text-left transition-all ${
                    selectedDriver?._id === d._id
                      ? 'border-brand-500 ring-2 ring-brand-200'
                      : 'border-accent-200 hover:border-brand-300'
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    {(() => {
                      const Icon = vehicleIcon(d.vehicleType);
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{d.name}</span>
                    <span className="block text-xs capitalize text-muted">
                      {d.vehicleType} · {d.plateNumber}
                    </span>
                  </span>
                  <span className="ml-auto text-xs font-semibold text-brand-600">
                    {selectedDriver?._id === d._id ? 'ETA…' : 'Select'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}