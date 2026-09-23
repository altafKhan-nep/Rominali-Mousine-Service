import { useDriverRides } from '../../hooks/useDriverQuery';
import { Card, CardTitle } from '../../components/ui/card';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Phone, MessageCircle, Navigation, MapPin, Flag } from 'lucide-react';
import { updateRideStatus } from '../../../../services/rideService.js';
import { useState, useRef } from 'react';
import RideChat from '../../../../components/rides/RideChat.jsx';

const dropoffFlagIcon = L.divIcon({
  className: '',
  html: `<div class="map-pin map-pin-dropoff"><span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4"><path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/></svg></span></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});
const pickupIcon = L.divIcon({
  className: '',
  html: `<div class="map-pin-start"><span>●</span></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export default function CurrentRidePage() {
  const { data, refetch } = useDriverRides() as any;
  const active = (data?.rides ?? []).find((r:any)=> ['accepted','arriving','in_progress'].includes(r.status));
  const [busy, setBusy] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const go = async (status:string) => {
    if (!active) return; setBusy(status);
    try { await updateRideStatus(active._id, { status }); refetch(); } catch {} finally { setBusy(''); }
  };

  if (!active) return <Card><CardTitle>Current Ride</CardTitle><p className="mt-3 text-sm text-muted">No active ride — accept a request to see passenger, route, ETA and controls here. Map shows driver→passenger→dropoff with traffic.</p></Card>;
  const center:[number,number]=[active.pickup.lat, active.pickup.lng];
  return (
    <div className="space-y-6">
      {/* Header — perfectly aligned, like Uber */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight dark:text-white">Current Ride <span className="ml-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold capitalize text-brand-700">{active.status.replace('_',' ')}</span></h1>
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-muted shadow-sm border border-accent-200 dark:bg-accent-900 dark:border-white/10">{active.fare.distanceKm}km • {active.fare.durationMin}min • {active.vehicleType}</span>
      </div>

      {/* Main grid — left: details + actions, right: map + single chat (no repetition) */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left — Trip details (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6">
            <CardTitle className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-50 text-brand-700"><MapPin className="h-4 w-4" /></span>Trip Details</CardTitle>
            <div className="mt-4 space-y-3">
              <div className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-green-500 ring-4 ring-green-50 dark:ring-green-900/30" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted">Pickup</p>
                  <p className="text-sm font-medium leading-snug dark:text-white">{active.pickup.address}</p>
                </div>
              </div>
              <div className="ml-1 h-6 w-px bg-accent-200 dark:bg-white/10" />
              <div className="flex gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-700"><Flag className="h-3 w-3 text-white" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted">Dropoff</p>
                  <p className="text-sm font-medium leading-snug dark:text-white">{active.dropoff.address}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-accent-50 px-4 py-3 dark:bg-white/5 mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Fare</span>
                  <span className="font-display font-bold text-brand-700">${active.fare.estimated.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-muted">{active.passenger?.name} • {active.passenger?.phone}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 font-medium dark:bg-accent-900">{active.payment?.method || 'cash'}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <a href={`tel:${active.passenger?.phone}`} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-accent-200 bg-white px-3 py-2.5 text-sm font-semibold hover:bg-accent-50 dark:border-white/10 dark:bg-transparent dark:text-white">
                <Phone className="h-4 w-4" /> Call
              </a>
              <button onClick={()=> { setShowChat(v=>!v); setTimeout(()=> chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100); }} className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border px-3 py-2.5 text-sm font-semibold ${showChat ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-accent-200 hover:bg-accent-50 dark:border-white/10 dark:bg-transparent dark:text-white'}`}>
                <MessageCircle className="h-4 w-4" /> {showChat ? 'Hide Chat' : 'Chat'}
              </button>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${active.pickup.lat},${active.pickup.lng}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full btn-brand-gradient px-3 py-2.5 text-sm font-semibold text-white">
                <Navigation className="h-4 w-4" /> Navigate
              </a>
            </div>

            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Trip Progress</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label:'Arrived', status:'arriving', done: ['arriving','in_progress','completed'].includes(active.status) },
                  { label:'Start Trip', status:'in_progress', done: ['in_progress','completed'].includes(active.status) },
                  { label:'Complete', status:'completed', done: active.status==='completed' },
                ].map(b=> (
                  <button key={b.status} onClick={()=>go(b.status)} disabled={!!busy || b.done} className={`min-h-11 rounded-full border py-2.5 text-sm font-semibold transition-all ${b.done ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800' : 'bg-white border-accent-200 hover:bg-accent-50 dark:border-white/10 dark:bg-transparent dark:text-white'} disabled:opacity-50`}>
                    {busy===b.status ? '...' : b.done ? '✓ ' + b.label : b.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right — Map + single Live Chat (no repetition) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="overflow-hidden rounded-3xl border border-accent-200 shadow-sm dark:border-white/10">
            <MapContainer center={center} zoom={13} style={{height:'380px', width:'100%'}}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[active.pickup.lat, active.pickup.lng]} icon={pickupIcon}><Popup>Pickup</Popup></Marker>
              <Marker position={[active.dropoff.lat, active.dropoff.lng]} icon={dropoffFlagIcon}><Popup>Dropoff</Popup></Marker>
              <Polyline positions={[[active.pickup.lat,active.pickup.lng],[active.dropoff.lat,active.dropoff.lng]] as any} pathOptions={{color:'#c62828', weight:5, opacity:0.9}} />
            </MapContainer>
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 text-xs dark:bg-accent-900 border-t border-accent-200 dark:border-white/10">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500" /> Pickup</span>
              <span className="flex items-center gap-1.5"><Flag className="h-3 w-3 text-brand-700" /> Dropoff</span>
              <span className="ml-auto font-medium text-brand-700">{active.fare.distanceKm}km • Live tracking</span>
            </div>
          </div>

          {showChat && (
            <div ref={chatRef}>
              <RideChat rideId={active._id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
