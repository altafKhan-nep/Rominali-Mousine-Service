import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, AttributionControl } from 'react-leaflet';
import L from 'leaflet';
import useGeolocation from '../../hooks/useGeolocation.js';
import { getRide, cancelRide, driverEta } from '../../services/rideService.js';
import { requestRefund, listPayments } from '../../services/paymentService.js';
import { MapViewSelector, MAP_VIEWS } from '../../components/maps/MapViewSelector.jsx';
import { UBER_SEDAN } from '../../components/maps/pinIcons.js';
import { vehicleLabel } from '../../data/vehicles.js';
import {
  joinRideRoom,
  onDriverFound,
  onRideUpdate,
  onDriverLocation,
  offDriverLocation,
  offRideUpdate,
  emitPassengerLocation,
} from '../../services/socketService.js';
import { Button } from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import PaymentModal from '../../components/rides/PaymentModal.jsx';
import EditRideModal from '../../components/rides/EditRideModal.jsx';
import RatingModal from '../../components/rides/RatingModal.jsx';
import RideChat from '../../components/rides/RideChat.jsx';

const uberDriverIcon = (heading = 0) => L.divIcon({
  className: '',
  html: `<div style="transform: rotate(${heading}deg); transition: transform 0.6s; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.28));">${UBER_SEDAN}</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const pickupIcon = L.divIcon({
  className: '',
  html: `<div class="map-pin-start"><span>●</span></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -14],
});

const STATUS_TEXT = {
  pending: 'Finding you a driver…',
  accepted: 'Driver on the way',
  arriving: 'Driver arriving',
  in_progress: 'On your way',
  completed: 'Trip completed',
  cancelled: 'Trip cancelled',
};

export default function RideTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [driverPos, setDriverPos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eta, setEta] = useState(null);
  const [driverRoute, setDriverRoute] = useState([]);
  const [mapView, setMapView] = useState('streets');
  const [showPay, setShowPay] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const timer = useRef(null);
  const lastPax = useRef(0);
  const { position } = useGeolocation();

  const stopPolling = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  // Share the passenger's live position with the assigned driver while active.
  useEffect(() => {
    if (!['accepted', 'arriving', 'in_progress'].includes(ride?.status) || !position) return;
    const tick = () => {
      const now = Date.now();
      if (now - lastPax.current < 2000) return; // throttle to 1 per 2s
      lastPax.current = now;
      emitPassengerLocation(position.lat, position.lng);
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, [ride?.status, position]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await getRide(id);
        if (cancelled) return;
        setRide(data.ride);
        joinRideRoom(id);
        setLoading(false);

        if (['completed', 'cancelled'].includes(data.ride.status)) stopPolling();
        else timer.current = setInterval(load, 15000);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Could not load ride');
        setLoading(false);
      }
    };
    load();

    onDriverFound(({ ride: updatedRide }) => {
      setRide(updatedRide);
      setEta(null);
    });
    onRideUpdate(({ ride: updatedRide }) => setRide(updatedRide));
    onDriverLocation(({ driverId, lat, lng, heading }) => {
      if (driverId === driverRef.current) setDriverPos({ lat, lng, heading });
    });

    return () => {
      cancelled = true;
      stopPolling();
      offRideUpdate();
      offDriverLocation();
    };
  }, [id]);

  // Keep the driver id current for the socket handler (avoids stale closures).
  const driverRef = useRef(null);
  useEffect(() => {
    driverRef.current = ride?.driver?._id || null;
  }, [ride?.driver?._id]);

  useEffect(() => {
    if (ride?.status === 'accepted' && ride?.driver) setDriverPos(null);
  }, [ride?.status, ride?.driver]);

  // When the driver is heading to pickup, show their live route + ETA
  useEffect(() => {
    if (ride?.status !== 'accepted' || !ride?.driver?._id) return;
    let cancelled = false;

    const loadEta = async () => {
      try {
        const { data } = await driverEta(ride.driver._id, {
          lat: ride.pickup.lat,
          lng: ride.pickup.lng,
        });
        if (cancelled) return;
        setEta(data.durationMin);
        setDriverRoute(data.route || []);
      } catch {
        if (!cancelled) setEta(null);
      }
    };
    loadEta();
    const t = setInterval(loadEta, 20000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [ride?.status, ride?.driver?._id, ride?.pickup?.lat, ride?.pickup?.lng]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this ride?')) return;
    try {
      await cancelRide(id, 'Cancelled by passenger');
      stopPolling();
      navigate('/rides/history');
    } catch {
      setError('Could not cancel ride');
    }
  };

  const [refundReason, setRefundReason] = useState('');
  const [showRefund, setShowRefund] = useState(false);
  const handleRefund = async () => {
    if (!refundReason.trim()) { setError('Please enter a reason'); return; }
    try {
      const { data } = await listPayments();
      const payment = (data.payments || []).find(
        (p) => p.transactionId && p.transactionId === ride.payment?.transactionId
      );
      if (!payment) { setError('Payment record not found'); return; }
      await requestRefund(payment._id, refundReason);
      setError('Refund requested — admin will review in Reports');
      setShowRefund(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not request refund');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner label="Loading ride…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted">{error}</p>
        <Button className="mt-4" onClick={() => navigate('/')}>Back home</Button>
      </div>
    );
  }

  const status = ride.status;
  const route = ride.route || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="relative h-[480px]">
            <MapContainer
              center={driverPos ? [driverPos.lat, driverPos.lng] : [ride.pickup.lat, ride.pickup.lng]}
              zoom={14}
              className="h-full w-full"
              attributionControl={false}
            >
              <AttributionControl position="bottomleft" />
              <TileLayer
                url={(MAP_VIEWS.find((v) => v.id === mapView) || MAP_VIEWS[0]).url}
                attribution={(MAP_VIEWS.find((v) => v.id === mapView) || MAP_VIEWS[0]).attribution}
              />
              {ride.pickup && (
                <Marker position={[ride.pickup.lat, ride.pickup.lng]} icon={pickupIcon} />
              )}
              {driverPos && (
                <Marker position={[driverPos.lat, driverPos.lng]} icon={uberDriverIcon(driverPos.heading || 0)} />
              )}
              {driverRoute.length > 0 && (
                <>
                  <Polyline
                    positions={driverRoute.map((p) => [p.lat, p.lng])}
                    pathOptions={{ color: '#ffffff', weight: 9, opacity: 0.7, lineCap: 'round', dashArray: '8 10' }}
                  />
                  <Polyline
                    positions={driverRoute.map((p) => [p.lat, p.lng])}
                    pathOptions={{ color: '#c62828', weight: 5, opacity: 0.9, lineCap: 'round', dashArray: '8 10' }}
                  />
                </>
              )}
              {driverRoute.length === 0 && route.length > 0 && (
                <>
                  <Polyline positions={route.map((p) => [p.lat, p.lng])} pathOptions={{ color: '#ffffff', weight: 9, opacity: 0.7, lineCap: 'round' }} />
                  <Polyline positions={route.map((p) => [p.lat, p.lng])} pathOptions={{ color: '#c62828', weight: 5, opacity: 0.9, lineCap: 'round' }} />
                </>
              )}
            </MapContainer>

            {/* Status badge */}
            <div className="absolute left-4 top-4 z-[1000] flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold shadow-sm">
              {['arriving', 'in_progress'].includes(status) && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-600" />
                </span>
              )}
              {STATUS_TEXT[status]}
            </div>

            <MapViewSelector view={mapView} onChange={setMapView} />
          </div>
        </div>

        {/* Details panel */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Trip details</h2>

            <div className="mt-4 space-y-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
                  <span className="my-1 w-px flex-1 bg-slate-200" />
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                </div>
                <div className="space-y-6 text-sm">
                  <div>
                    <p className="font-medium text-ink">{ride.pickup.address}</p>
                    <p className="text-xs text-muted">Pickup</p>
                  </div>
                  <div>
                    <p className="font-medium text-ink">{ride.dropoff.address}</p>
                    <p className="text-xs text-muted">Dropoff</p>
                  </div>
                </div>
              </div>
            </div>

            <dl className="mt-6 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Vehicle</dt>
                <dd className="font-medium">{vehicleLabel(ride.vehicleType)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Distance</dt>
                <dd className="font-medium">{ride.fare.distanceKm} km</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Est. duration</dt>
                <dd className="font-medium">{ride.fare.durationMin} min</dd>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2">
                <dt className="font-medium">Estimated fare</dt>
                <dd className="font-bold text-brand-700">
                  ${(ride.fare.estimated || 0).toFixed(2)}
                </dd>
              </div>
            </dl>
          </div>

          {['pending', 'accepted', 'arriving'].includes(status) && (
            <Button variant="danger" className="w-full" onClick={handleCancel}>
              Cancel ride
            </Button>
          )}

          {status === 'pending' && (
            <Button variant="secondary" className="w-full" onClick={() => setShowEdit(true)}>
              Edit ride
            </Button>
          )}

          {status === 'completed' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Trip total</p>
                  <p className="text-xl font-bold text-brand-700">
                    ${(ride.fare.final || ride.fare.estimated || 0).toFixed(2)}
                  </p>
                </div>
                {ride.payment?.status === 'paid' && (
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    ride.payment?.method === 'cash' ? 'bg-gold-100 text-gold-700' : 'bg-green-50 text-green-700'
                  }`}>
                    {ride.payment?.method === 'cash' ? 'Cash' : 'Paid'}
                  </span>
                )}
                {ride.payment?.status === 'refunded' && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Refunded
                  </span>
                )}
                {ride.payment?.status === 'pending' && (
                  <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                    Unpaid
                  </span>
                )}
              </div>
              {ride.payment?.status === 'pending' && (
                <Button className="mt-3 w-full" onClick={() => setShowPay(true)}>
                  Pay ${(ride.fare.final || ride.fare.estimated || 0).toFixed(2)}
                </Button>
              )}
              {ride.payment?.status === 'paid' && ride.payment?.method !== 'cash' && (
                <>
                  <Button variant="secondary" className="mt-3 w-full" onClick={()=>setShowRefund(true)}>
                    Request Refund (Admin Approval)
                  </Button>
                  {showRefund && (
                    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-medium text-amber-800">Report Issue — Request Refund</p>
                      <textarea value={refundReason} onChange={e=>setRefundReason(e.target.value)} placeholder="Reason for $27.70 refund — e.g., overcharged, driver issue" className="mt-2 w-full rounded-xl border border-amber-300 bg-white p-2 text-sm" rows={3} />
                      <div className="mt-2 flex gap-2"><button onClick={()=>setShowRefund(false)} className="flex-1 rounded-full border border-accent-200 py-2 text-sm">Cancel</button><button onClick={handleRefund} className="flex-1 rounded-full bg-amber-600 py-2 text-sm font-semibold text-white">Send Request</button></div>
                    </div>
                  )}
                </>
              )}
              {ride.status === 'completed' && ride.payment?.status === 'paid' && !ride.rating?.score && (
                <Button className="mt-3 w-full" onClick={()=>setShowRating(true)}>
                  Rate your driver ★
                </Button>
              )}
              {ride.rating?.score && (
                <div className="mt-3 rounded-2xl bg-gold-50 border border-gold-200 p-4 text-center">
                  <p className="font-display font-bold text-gold-700">You rated ★ {ride.rating.score}</p>
                  <p className="text-xs text-muted">{ride.rating.compliments?.join(' • ')}</p>
                  {ride.rating.comment && <p className="mt-1 text-sm">“{ride.rating.comment}”</p>}
                </div>
              )}
            </div>
          )}

          {showPay && (
            <PaymentModal
              ride={ride}
              onClose={() => setShowPay(false)}
              onPaid={(payment) =>
                setRide((r) => ({
                  ...r,
                  payment: {
                    ...r.payment,
                    status: 'paid',
                    method: payment.method,
                    transactionId: payment.transactionId,
                  },
                }))
              }
            />
          )}

          {showEdit && (
            <EditRideModal ride={ride} onClose={() => setShowEdit(false)} onSaved={setRide} />
          )}

          {showRating && (
            <RatingModal ride={ride} onClose={()=>setShowRating(false)} onRated={(updated)=>{ setRide(updated); setShowRating(false); }} />
          )}

          {eta && status === 'accepted' && (
            <div className="rounded-2xl bg-brand-500/10 px-5 py-4 text-sm">
              <div className="flex items-center gap-2 font-semibold text-brand-600">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
                </span>
                Driver is on the way
              </div>
              <p className="mt-1 text-ink">
                Arriving in <span className="font-bold text-brand-700">~{eta} min</span>
              </p>
            </div>
          )}

          {['accepted','arriving','in_progress'].includes(status) && (
            <RideChat rideId={id} />
          )}
        </div>
      </div>
    </div>
  );
}