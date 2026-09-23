import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, DollarSign, CreditCard, Car, Star, Navigation, Phone } from 'lucide-react';
import { Card, CardTitle } from '../../components/ui/card';
import { acceptRide } from '../../../../services/rideService.js';
import { onRideNew, offRideNew } from '../../../../services/socketService.js';
import api from '../../../../services/api.js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDriverRides } from '../../hooks/useDriverQuery';

export default function RequestsPage() {
  const [live, setLive] = useState<any[]>([]);
  const [error, setError] = useState('');
  const qc = useQueryClient();
  // Fallback: poll pending rides via REST so driver sees requests even if socket missed
  const { data: available } = useQuery({
    queryKey: ['driver','available'],
    queryFn: async () => (await api.get('/rides/available')).data,
    refetchInterval: 8000,
  });
  const fallbackPending = (available as any)?.rides ?? [];
  const { data: myRides } = useDriverRides() as any;
  const activeRide = (myRides?.rides ?? []).find((r:any)=> ['accepted','arriving','in_progress'].includes(r.status));

  useEffect(()=> {
    onRideNew(({ ride }:any)=> setLive(prev=> prev.some(p=>p._id===ride._id) ? prev : [{...ride, _countdown:45}, ...prev].slice(0,5)));
    return ()=> offRideNew();
  }, []);

  const list = live.length ? live : fallbackPending.slice(0,5);

  const accept = async (id:string) => {
    setError('');
    if (activeRide) { setError('You already have an active ride — complete it in Current Ride first.'); return; }
    try { 
      await acceptRide(id); 
      setLive(prev=> prev.filter(p=>p._id!==id));
      qc.invalidateQueries({queryKey:['driver','available']});
      qc.invalidateQueries({queryKey:['driver','rides']});
    } catch (e:any) { 
      setError(e.response?.data?.message || 'Could not accept — maybe already taken. Try another.'); 
    }
  };
  const decline = (id:string) => {
    setLive(prev=> prev.filter(p=>p._id!==id));
    // Also remove from fallback by invalidating (or just hide locally)
  };

  if (activeRide) return <Card><CardTitle>Live Ride Requests</CardTitle><div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950"><p className="font-medium text-amber-800 dark:text-amber-200">You have an active ride — complete it first</p><p className="text-sm text-amber-700 dark:text-amber-300">Go to <a href="/driver/current" className="underline font-semibold">Current Ride</a> to Arrived → Start → Complete. You can’t accept new requests until then.</p></div><p className="mt-3 text-sm text-muted">{list.length} pending in queue will show after you complete.</p></Card>;

  if (!list.length) return <Card><CardTitle>Live Ride Requests</CardTitle><p className="mt-4 text-sm text-muted">No requests right now — stay online, nearby airport/corporate rides appear here via Socket.IO with 45s countdown.</p><div className="mt-6 h-32 rounded-2xl border border-dashed border-accent-200 bg-accent-50 p-6 text-center dark:border-white/10 dark:bg-white/5"><p className="text-sm text-muted">Waiting for dispatch…</p></div></Card>;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold dark:text-white">Live Ride Requests <span className="ml-2 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{list.length} new</span></h1>
      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((r:any)=> (
          <motion.div key={r._id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
            <Card>
              <div className="flex items-start justify-between">
                <div><p className="font-display font-semibold">{r.passenger?.name || 'Passenger'} <span className="ml-1 inline-flex items-center gap-1 text-xs text-muted"><Star className="h-3 w-3 text-gold-400 fill-current" /> {r.passenger?.rating || '5.0'}</span></p><p className="text-xs text-muted">{r.serviceType || 'Airport'} • {r.vehicleType} • {r.passengerCount} pax</p></div>
                <span className="rounded-full bg-gold-50 px-2.5 py-1 text-xs font-bold text-gold-700 animate-pulse">{r._countdown ?? 45}s</span>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <p className="flex gap-2"><MapPin className="h-4 w-4 text-brand-600" />{r.pickup.address}</p>
                <p className="flex gap-2 text-muted"><MapPin className="h-4 w-4 text-accent-400" />{r.dropoff.address}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-accent-50 px-2.5 py-1 dark:bg-white/5"><Clock className="mr-1 inline h-3 w-3" />{r.fare.distanceKm} km • {r.fare.durationMin} min</span>
                <span className="rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-700"><DollarSign className="mr-1 inline h-3 w-3" />${r.fare.estimated.toFixed(2)}</span>
                <span className="rounded-full bg-accent-50 px-2.5 py-1 dark:bg-white/5"><CreditCard className="mr-1 inline h-3 w-3" />{r.payment?.method || 'card'}</span>
                <span className="rounded-full bg-accent-50 px-2.5 py-1 dark:bg-white/5"><Car className="mr-1 inline h-3 w-3" />{r.vehicleType}</span>
              </div>
              {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
              <div className="mt-4 flex gap-2">
                <button onClick={()=>accept(r._id)} disabled={!!activeRide} className="flex-1 rounded-full btn-brand-gradient py-2.5 text-sm font-semibold text-white disabled:opacity-50">Accept Ride</button>
                <button onClick={()=>decline(r._id)} className="rounded-full border border-accent-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-accent-50 dark:border-white/10 dark:bg-transparent">Decline</button>
                <button className="grid h-10 w-10 place-items-center rounded-full border border-accent-200 dark:border-white/10"><Navigation className="h-4 w-4" /></button>
              </div>
              <p className="mt-2 text-xs text-muted">Pickup {r.fare.distanceKm} km away • Airport Terminal {r.flightNumber || '—'} • Notes: {r.notes || '—'}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
