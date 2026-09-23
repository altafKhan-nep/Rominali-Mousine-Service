import { useEffect, useState, useRef } from 'react';
import useGeolocation from '../../hooks/useGeolocation.js';
import {
  updateLocation,
  setAvailability,
  driverStats,
  acceptRide,
  listRides,
  updateRideStatus,
} from '../../services/rideService.js';
import {
  emitDriverLocation,
  onRideNew,
  offRideNew,
  onRideUpdate,
  offRideUpdate,
  onNotification,
  offNotification,
  joinRideRoom,
  onPassengerLocation,
  offPassengerLocation,
} from '../../services/socketService.js';
import { Button } from '../../components/ui/Button.jsx';
import { Switch } from '../../components/ui/Switch.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { vehicleLabel } from '../../data/vehicles.js';
import { getProfile } from '../../services/userService.js';
import ActiveRidePanel from '../../components/rides/ActiveRidePanel.jsx';

const ACTIVE = ['accepted', 'arriving', 'in_progress'];

export default function Dashboard() {
  const { position } = useGeolocation();
  const [online, setOnline] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [passengerPos, setPassengerPos] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [busyStatus, setBusyStatus] = useState('');
  const [feedMsg, setFeedMsg] = useState('');
  const [error, setError] = useState('');
  const [statsError, setStatsError] = useState('');
  const lastSent = useRef(0);

  // Own location broadcast: while online OR serving a ride, throttle to 1 per 2s.
  useEffect(() => {
    if ((!online && !activeRide) || !position) return;

    const tick = () => {
      const now = Date.now();
      if (now - lastSent.current < 2000) return;
      lastSent.current = now;
      updateLocation({
        lat: position.lat,
        lng: position.lng,
        heading: 0,
        speed: 0,
      }).catch(() => {});
      emitDriverLocation(position.lat, position.lng);
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, [online, activeRide, position]);

  // Restore the real on/off duty state from the server so a page refresh
  // doesn't leave the UI showing "Off duty" while the driver is still available.
  useEffect(() => {
    getProfile()
      .then(({ data }) => {
        if (data.user?.driverDetails?.isAvailable) setOnline(true);
      })
      .catch(() => {});
  }, []);

  // Restore an in-progress ride on page load (e.g. after refresh or admin dispatch).
  const refreshActiveRide = async () => {
    try {
      const { data } = await listRides();
      const act = (data.rides || []).find((r) => ACTIVE.includes(r.status));
      setActiveRide((prev) => (act && act._id === prev?._id ? act : act || null));
    } catch {
      /* surface via UI */
    }
  };

  useEffect(() => {
    refreshActiveRide();
  }, []);

  // Live ride requests pushed by the server for nearby, matching drivers.
  useEffect(() => {
    onRideNew(({ ride }) => {
      setRequests((prev) => (prev.some((r) => r._id === ride._id) ? prev : [ride, ...prev]));
    });
    return () => offRideNew();
  }, []);

  // Admin dispatch / removals arrive as notifications before any ride:update
  // reaches this socket (driver may not have joined the ride room yet).
  useEffect(() => {
    onNotification((n) => {
      if (n?.data?.rideId) refreshActiveRide();
    });
    return () => offNotification();
  }, []);

  // Join the ride room + subscribe to the passenger's live position.
  useEffect(() => {
    if (!activeRide?._id) return;
    joinRideRoom(activeRide._id);
    setPassengerPos(null);
    onPassengerLocation(({ lat, lng }) => setPassengerPos({ lat, lng }));
    return () => offPassengerLocation();
  }, [activeRide?._id]);

  // Ride status changes for the current active ride.
  useEffect(() => {
    if (!activeRide?._id) return;
    onRideUpdate(({ ride, status }) => {
      if (ride?._id !== activeRide._id) return;
      if (ACTIVE.includes(status)) setActiveRide(ride);
      else {
        setActiveRide(null);
        setPassengerPos(null);
      }
    });
    return () => offRideUpdate();
  }, [activeRide?._id]);

  useEffect(() => {
    driverStats()
      .then(({ data }) => setStats(data.stats))
      .catch(() => setStatsError('Could not load stats'));
  }, []);

  const toggle = async () => {
    const next = !online;
    setToggling(true);
    try {
      await setAvailability(next);
      setOnline(next);
      if (!next) setRequests([]);
    } catch {
      /* surface via UI */
    } finally {
      setToggling(false);
    }
  };

  const accept = async (ride) => {
    setBusyId(ride._id);
    setFeedMsg('');
    try {
      const { data } = await acceptRide(ride._id);
      setActiveRide(data.ride);
      setRequests((prev) => prev.filter((r) => r._id !== ride._id));
      setFeedMsg(`Accepted — head to ${ride.pickup.address}.`);
    } catch (err) {
      setRequests((prev) => prev.filter((r) => r._id !== ride._id));
      setFeedMsg(err.response?.data?.message || 'Could not accept this ride');
    } finally {
      setBusyId('');
    }
  };

  const setStatus = async (status) => {
    if (!activeRide) return;
    setBusyStatus(status);
    try {
      const { data } = await updateRideStatus(activeRide._id, { status });
      if (status === 'completed') {
        setActiveRide(null);
        setPassengerPos(null);
      } else {
        setActiveRide(data.ride);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update status');
    } finally {
      setBusyStatus('');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Driver dashboard</h1>
      <p className="mt-1 text-sm text-muted">
        Go online to receive ride requests. Your location is shared while online.
      </p>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}

      {/* Status card */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                {online && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex h-3 w-3 rounded-full ${online ? 'bg-brand-500' : 'bg-slate-400'}`}
                />
              </span>
              <p className="text-sm font-semibold">Status: {online ? 'On duty' : 'Off duty'}</p>
              <Switch checked={online} onChange={toggle} disabled={toggling} />
            </div>
            <p className="mt-1.5 text-sm text-muted">
              {online
                ? 'You are visible to nearby passengers. Slide the switch off when you need a break.'
                : 'Slide the switch on to start receiving requests. Your location is shared while on duty.'}
            </p>
          </div>
        </div>
      </div>

      {/* Active ride: live map + passenger location + status controls */}
      {activeRide && (
        <ActiveRidePanel
          ride={activeRide}
          driverPos={position}
          passengerPos={passengerPos}
          onStatus={setStatus}
          busyStatus={busyStatus}
        />
      )}

      {/* Ride requests (hidden while serving a ride) */}
      {online && !activeRide && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Ride requests</h2>
            {requests.length > 0 && (
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                {requests.length} new
              </span>
            )}
          </div>

          {feedMsg && <p className="mt-2 text-sm font-medium text-brand-700">{feedMsg}</p>}

          {requests.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Waiting for nearby requests…</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {requests.map((r) => (
                <li key={r._id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold text-ink">{r.pickup.address}</p>
                      <p className="mt-1 text-muted">→ {r.dropoff.address}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                        <span>{vehicleLabel(r.vehicleType)}</span>
                        <span>{r.fare.distanceKm} km · ~{r.fare.durationMin} min</span>
                        <span className="font-semibold text-brand-700">
                          ${(r.fare.estimated || 0).toFixed(2)}
                        </span>
                        <span>{r.passengerCount} pax{r.bags ? ` · ${r.bags} bags` : ''}</span>
                      </div>
                    </div>
                    <Button size="sm" loading={busyId === r._id} onClick={() => accept(r)}>
                      Accept
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total rides', value: stats?.totalRides ?? '–' },
          { label: 'Completed', value: stats?.completedRides ?? '–' },
          { label: 'Earnings', value: stats ? `$${stats.totalEarnings.toFixed(2)}` : '–' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-1 whitespace-nowrap text-3xl font-bold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {!stats && statsError && (
        <p className="mt-4 text-sm text-muted">
          {statsError} — sign in again if your session changed.
        </p>
      )}

      {!stats && !statsError && (
        <div className="mt-6 flex justify-center">
          <Spinner label="Loading stats…" />
        </div>
      )}
    </div>
  );
}