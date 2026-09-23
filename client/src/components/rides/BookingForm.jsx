import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Flag } from 'lucide-react';
import { createRide, nearbyDrivers } from '../../services/rideService.js';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import LocationSearch from './LocationSearch.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { VEHICLES } from '../../data/vehicles.js';
import { SERVICES } from '../../data/services.js';

export default function BookingForm({ pickup, dropoff, onPickupChange, onDropoffChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [when, setWhen] = useState('now');
  const [vehicleType, setVehicleType] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);
  const [bags, setBags] = useState(0);
  const [extra, setExtra] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [driverCount, setDriverCount] = useState(null);

  useEffect(() => {
    if (pickup?.lat != null && dropoff?.lat != null && !loading) {
      nearbyDrivers({ lat: pickup.lat, lng: pickup.lng })
        .then(({ data }) => setDriverCount(data.drivers.length))
        .catch(() => setDriverCount(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup, dropoff]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!pickup?.lat || !dropoff?.lat) {
      setError('Please select both pickup and dropoff locations on the map.');
      return;
    }
    if (!vehicleType) {
      setError('Please select your vehicle type.');
      return;
    }
    // serviceType optional — defaults to '' (general)
    if (!user) {
      navigate('/login', { state: { from: '/' } });
      return;
    }

    setLoading(true);
    try {
      const { data } = await createRide({
        pickup,
        dropoff,
        vehicleType,
        serviceType,
        passengerCount,
        bags,
        when,
        extra,
      });
      navigate(`/rides/track/${data.ride._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book your ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const [showMore, setShowMore] = useState(false);
  const field =
    'input-pill min-h-11 w-full border border-accent-200 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-accent-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus-visible:ring-2 focus-visible:ring-brand-500';

  return (
    <form onSubmit={submit} className="flex h-full flex-col gap-5 p-6">
      <div className="rise-in">
        <h2 className="text-xl font-bold">Book your ride</h2>
        <p className="mt-1 text-sm text-muted">Plan your trip with a live fare estimate.</p>
      </div>

      {/* When */}
      <div className="grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1">
        {['now', 'later'].map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setWhen(w)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
              when === w ? 'bg-white text-brand-700 shadow-sm' : 'text-muted'
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      {when === 'later' && (
        <Input type="datetime-local" label="Schedule for" min={new Date().toISOString().slice(0, 16)} />
      )}

      {/* Locations */}
      <div className="space-y-3">
        <LocationSearch
          label="Pick up location"
          icon={MapPin}
          placeholder="Search pickup address"
          value={pickup}
          onSelect={onPickupChange}
        />
        <LocationSearch
          label="Drop off location"
          icon={Flag}
          placeholder="Search dropoff address"
          value={dropoff}
          onSelect={onDropoffChange}
        />
      </div>

      {/* Live availability chip */}
      {driverCount !== null && pickup && dropoff && (
        <div
          className={`rise-in flex items-center gap-2 rounded-full px-4 py-2.5 text-sm ${
            driverCount > 0
              ? 'bg-accent-50 text-accent-700'
              : 'bg-accent-50 text-accent-700'
          }`}
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              driverCount > 0 ? 'animate-pulse bg-brand-500' : 'bg-brand-500'
            }`}
          />
          {driverCount > 0
            ? `${driverCount} driver${driverCount === 1 ? '' : 's'} available nearby`
            : 'No drivers currently online nearby'}
        </div>
      )}

      {/* Essentials only — progressive disclosure */}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Vehicle</span>
        <select
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          className={field}
          aria-label="Vehicle type"
        >
          <option value="" disabled>Choose vehicle — fare updates instantly</option>
          {VEHICLES.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label} — {v.desc}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={() => setShowMore(v => !v)}
        className="text-left text-sm font-medium text-brand-700 hover:text-brand-800 focus-visible:ring-2 focus-visible:ring-brand-500 rounded-full"
        aria-expanded={showMore}
      >
        {showMore ? '− Fewer options' : '+ More options (passengers, bags, service)'}
      </button>

      {showMore && (
        <div className="space-y-3 rounded-2xl border border-accent-100 bg-accent-50/50 p-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Service type</span>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className={field}
            >
              <option value="" disabled>Select service (optional)</option>
              {SERVICES.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Passengers</span>
              <select value={passengerCount} onChange={(e) => setPassengerCount(+e.target.value)} className={field}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Bags</span>
              <select value={bags} onChange={(e) => setBags(+e.target.value)} className={field}>
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
          <Input
            label="Notes for driver (optional)"
            placeholder="Luggage, accessibility, flight number"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
          />
        </div>
      )}

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error} <button type="button" onClick={() => setError('')} className="ml-2 font-semibold underline">Dismiss</button></p>}

      {/* Sticky CTA — always 44px, guest can see fare before login */}
      <div className="sticky bottom-0 -mx-6 -mb-6 mt-auto bg-white/95 px-6 pb-6 pt-3 backdrop-blur lg:static lg:bg-transparent lg:p-0">
        <Button type="submit" size="lg" loading={loading} className="w-full min-h-11 py-3.5 text-[15px] focus-visible:ring-2 focus-visible:ring-brand-500">
          {user ? 'Request taxi — see fare' : 'See fare estimate (no login needed)'}
        </Button>
        {!user && <p className="mt-2 text-center text-xs text-muted">You’ll sign in only to confirm — fare is shown first.</p>}
      </div>
    </form>
  );
}