import { useState } from 'react';
import { editRide } from '../../services/rideService.js';
import { searchPlaces } from '../../services/rideService.js';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { VEHICLES } from '../../data/vehicles.js';

// Edit a pending ride: change pickup/dropoff, vehicle or party size. The server
// re-geocodes changed locations and recomputes the fare + route.
export default function EditRideModal({ ride, onClose, onSaved }) {
  const [form, setForm] = useState({
    pickup: ride.pickup.address,
    dropoff: ride.dropoff.address,
    vehicleType: ride.vehicleType,
    passengerCount: ride.passengerCount,
    bags: ride.bags,
  });
  const [suggestions, setSuggestions] = useState(null);
  const [activeField, setActiveField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSearch = async (field, q) => {
    if (!q || q.length < 3) {
      setSuggestions(null);
      return;
    }
    try {
      const { data } = await searchPlaces(q);
      setSuggestions(data.results || []);
    } catch {
      setSuggestions(null);
    }
  };

  const pick = (place) => {
    const value = place.display_name || place.address;
    setForm((f) => ({ ...f, [activeField]: value }));
    setSuggestions(null);
    setActiveField(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Only send coordinates if the address was changed (else server keeps originals).
      const changed = (field) =>
        form[field] !== (field === 'pickup' ? ride.pickup.address : ride.dropoff.address);
      const payload = {
        vehicleType: form.vehicleType,
        passengerCount: Number(form.passengerCount),
        bags: Number(form.bags),
        pickup: changed('pickup') ? form.pickup : undefined,
        dropoff: changed('dropoff') ? form.dropoff : undefined,
      };
      const { data } = await editRide(ride._id, payload);
      onSaved?.(data.ride);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update ride');
    } finally {
      setLoading(false);
    }
  };

  const locationField = (field, label) => (
    <div className="relative">
      <Input
        label={label}
        value={form[field]}
        onChange={(e) => {
          setForm({ ...form, [field]: e.target.value });
          setActiveField(field);
          onSearch(field, e.target.value);
        }}
        onFocus={() => setActiveField(field)}
        required
      />
      {activeField === field && suggestions && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => pick(s)}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-brand-50"
              >
                {s.display_name || s.address}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-brand-950/50 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold">Edit ride</h2>
        <p className="mt-1 text-sm text-muted">Changes apply while the ride is still pending.</p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          {locationField('pickup', 'Pickup')}
          {locationField('dropoff', 'Dropoff')}

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Vehicle</span>
              <select
                className="input-pill w-full border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                value={form.vehicleType}
                onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
              >
                {VEHICLES.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Passengers</span>
              <input
                type="number"
                min="1"
                max="16"
                className="input-pill w-full border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                value={form.passengerCount}
                onChange={(e) => setForm({ ...form, passengerCount: e.target.value })}
              />
            </label>
          </div>

          <Input
            label="Bags"
            type="number"
            min="0"
            value={form.bags}
            onChange={(e) => setForm({ ...form, bags: e.target.value })}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">Save changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
