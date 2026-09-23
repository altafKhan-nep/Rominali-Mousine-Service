import { motion } from 'framer-motion';
import { Car, DollarSign, Star, Clock, TrendingUp, MapPin, Phone, Navigation, ShieldAlert, Sun, Cloud, AlertTriangle, LocateFixed } from 'lucide-react';
import { Card, CardTitle, StatTile } from '../../components/ui/card';
import { useDriverStats, useDriverRides, useDriverProfile } from '../../hooks/useDriverQuery';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import useGeolocation from '../../../../hooks/useGeolocation.js';
import { UBER_SEDAN } from '../../../../components/maps/pinIcons.js';

export default function DashboardPage() {
  const { data: statsData, isLoading: sLoading } = useDriverStats() as any;
  const { data: ridesData } = useDriverRides() as any;
  const { data: profile } = useDriverProfile() as any;
  const stats = statsData?.stats;
  const rides: any[] = ridesData?.rides ?? [];
  const active = rides.find((r:any)=> ['accepted','arriving','in_progress'].includes(r.status));
  const upcoming = rides.filter((r:any)=> ['pending','scheduled'].includes(r.status)).slice(0,3);
  const driver = profile?.user;

  const { position: livePos, locate: refreshLocation } = useGeolocation();
  const driverCarIcon = L.divIcon({
    className: '',
    html: `<div style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.28));">${UBER_SEDAN}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
  const kpis = [
    { label:"Today's Earnings", value: stats ? `$${stats.totalEarnings.toFixed(2)}` : '—', sub:'Collected', icon: DollarSign },
    { label:"Today's Trips", value: stats?.completedRides ?? '—', sub:'Completed', icon: Car },
    { label:"Rating", value: '5.0', sub:'★ Top driver', icon: Star },
    { label:"Acceptance", value: '98%', sub:'Excellent', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-6 text-white shadow-xl sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-gold-500/15 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Good Morning</p>
            <h1 className="font-display mt-1 text-3xl dark:text-white font-bold tracking-tight">Hello, {driver?.name || 'Driver'} <span className="text-gold-300">—</span></h1>
            <p className="mt-1 max-w-xl text-sm text-white/75">Premium airport dispatch • {new Date().toLocaleDateString()} • <span className="inline-flex items-center gap-1"><Sun className="h-3 w-3 text-gold-300" /> 18°C <Cloud className="h-3 w-3" /> Traffic normal</span></p>
          </div>
          <div className="flex gap-2">
            <Link to="/driver/requests" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 shadow-lg hover:bg-brand-50">View Requests</Link>
            <Link to="/driver/current" className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15">Current Ride</Link>
          </div>
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:grid-cols-4">
          {[
            { k:'Hours Online', v:'6.2h' },
            { k:'Airport Alerts', v:'BWI normal' },
            { k:'Next pickup', v: upcoming[0]?.pickup?.address?.slice(0,22) || '—' },
            { k:'Support', v:'(240) 351-0826' },
          ].map(i=> <div key={i.k}><p className="text-xs uppercase tracking-widest text-white/60">{i.k}</p><p className="font-display text-sm font-bold text-gold-300">{i.v}</p></div>)}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k,i)=> (
          <motion.div key={k.label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}>
            <Card>
              <div className="flex items-start justify-between"><StatTile><k.icon className="h-5 w-5" /></StatTile><span className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-muted dark:bg-white/5">{k.sub}</span></div>
              <p className="font-display mt-4 text-2xl font-bold dark:text-white">{k.value}</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">{k.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Live Location */}
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-accent-200 p-4 dark:border-white/5">
          <div className="flex items-center gap-2"><LocateFixed className="h-4 w-4 text-brand-600" /><CardTitle>Your Live Location</CardTitle><span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"><span className="h-2 w-2 animate-pulse rounded-full bg-green-500" /> Live sharing</span></div>
          <button onClick={refreshLocation} className="rounded-full border border-accent-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-accent-50 dark:border-white/10 dark:bg-transparent">Refresh</button>
        </div>
        <div className="h-[280px] w-full">
          {livePos ? (
            <MapContainer center={[livePos.lat, livePos.lng]} zoom={14} style={{height:'100%', width:'100%'}} attributionControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
              <Marker position={[livePos.lat, livePos.lng]} icon={driverCarIcon}><Popup>You • {livePos.lat.toFixed(4)}, {livePos.lng.toFixed(4)}<br/>Sharing with dispatch</Popup></Marker>
            </MapContainer>
          ) : (
            <div className="flex h-full items-center justify-center bg-accent-50 dark:bg-white/5"><p className="text-sm text-muted">Getting your location…</p></div>
          )}
        </div>
        <div className="flex items-center justify-between bg-accent-50 px-4 py-2 text-xs dark:bg-white/5">
          <span className="text-muted">{livePos ? `${livePos.lat.toFixed(5)}, ${livePos.lng.toFixed(5)}` : 'Locating...'}</span>
          <span className="font-medium text-brand-700">{livePos ? 'Visible to passengers in 10km' : 'Enable location to appear on map'}</span>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2"><Navigation className="h-4 w-4 text-brand-600" /><CardTitle>Current Ride</CardTitle></div>
          {active ? (
            <div className="mt-4 rounded-2xl border border-accent-200 bg-accent-50 p-4 dark:border-white/5 dark:bg-white/5">
              <p className="font-display font-semibold dark:text-white">{active.passenger?.name} • {active.passenger?.phone}</p>
              <p className="mt-1 text-sm text-muted"><MapPin className="mr-1 inline h-3 w-3" />{active.pickup.address} → {active.dropoff.address}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to="/driver/current" className="rounded-full btn-brand-gradient px-4 py-2 text-sm font-semibold text-white">Open Navigation</Link>
                <a href={`tel:${active.passenger?.phone}`} className="rounded-full border border-accent-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-accent-50 dark:border-white/10 dark:bg-transparent"><Phone className="mr-1 inline h-3 w-3" />Call</a>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-accent-200 bg-accent-50/50 p-6 text-center dark:border-white/10 dark:bg-white/5">
              <p className="font-display font-semibold dark:text-white">Start in 3 steps</p>
              <ol className="mt-2 text-left text-sm text-muted space-y-1 list-decimal list-inside">
                <li>Tap <span className="font-semibold text-ink dark:text-white">Go Online</span> (top bar) — you’ll appear on the map</li>
                <li>Accept the next request — 45s countdown, one tap</li>
                <li>Tap <span className="font-semibold text-ink dark:text-white">Navigate</span> — follow route to pickup</li>
              </ol>
              <Link to="/driver/requests" className="mt-3 inline-flex min-h-11 items-center rounded-full btn-brand-gradient px-5 py-2.5 text-sm font-semibold text-white">View requests →</Link>
            </div>
          )}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[
              { k:'Cancellation', v:'1.2%' },
              { k:'Hours Online', v:'6.2h' },
              { k:'On-time', v:'99%' },
            ].map(s=> <div key={s.k} className="rounded-2xl bg-accent-50 py-3 dark:bg-white/5"><p className="font-display font-bold dark:text-white">{s.v}</p><p className="text-xs uppercase tracking-widest text-muted">{s.k}</p></div>)}
          </div>
        </Card>
        <Card>
          <CardTitle>Upcoming Reservations</CardTitle>
          <ul className="mt-4 space-y-3">
            {upcoming.length ? upcoming.map((r:any)=> (
              <li key={r._id} className="rounded-2xl border border-accent-200 p-3 dark:border-white/5">
                <p className="text-sm font-medium dark:text-white">{r.pickup.address.slice(0,28)}</p>
                <p className="text-xs text-muted">→ {r.dropoff.address.slice(0,28)} • {new Date(r.createdAt).toLocaleTimeString()}</p>
                <p className="mt-1 text-xs font-semibold text-brand-700">${r.fare.estimated.toFixed(2)} • {r.vehicleType}</p>
              </li>
            )) : <p className="text-sm text-muted">No upcoming — airport, corporate, charter slots appear here.</p>}
          </ul>
          <button className="mt-4 w-full rounded-full border border-accent-200 py-2 text-sm font-semibold hover:bg-accent-50 dark:border-white/10">View all</button>
        </Card>
      </div>

      <Card>
        <CardTitle>Revenue Graph • Trips Graph</CardTitle>
        <div className="mt-4 h-28 flex items-end gap-1">
          {Array.from({length:12}).map((_,i)=> <div key={i} className="flex-1 rounded-t-xl bg-brand-gradient" style={{height: `${20 + Math.random()*60}px`}} />)}
        </div>
        <p className="mt-2 text-xs text-muted">Trips by day • Revenue by month — warm editorial bars like the website, not flat AI charts.</p>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link to="/driver/requests" className="rounded-full btn-brand-gradient px-5 py-2.5 text-sm font-semibold text-white">Go Online</Link>
        <button className="rounded-full border border-accent-200 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-accent-50 dark:border-white/10 dark:bg-transparent">Emergency <ShieldAlert className="ml-1 inline h-4 w-4 text-brand-600" /></button>
        <span className="inline-flex items-center gap-1 rounded-full bg-gold-50 px-3 py-1 text-xs font-medium text-gold-700"><AlertTriangle className="h-3 w-3" /> Airport alerts normal</span>
      </div>
    </div>
  );
}
