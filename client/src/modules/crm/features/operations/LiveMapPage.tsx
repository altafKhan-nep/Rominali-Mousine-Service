import { useCrmLiveOps } from '../../hooks/useCrmQuery';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardTitle } from '../../components/ui/card';
import { SkeletonCard } from '../../components/ui/skeleton';
import { MapPin, AlertCircle } from 'lucide-react';
import { useMemo } from 'react';
const driverIcon = L.divIcon({ className:'', html:'<div class="map-pin-driver"><span>●</span></div>', iconSize:[30,30], iconAnchor:[15,28] });
const pickupIcon = L.divIcon({ className:'', html:'<div class="map-pin-start"><span>●</span></div>', iconSize:[22,22] });
export default function LiveMapPage() {
  const { data, isLoading, isError, refetch } = useCrmLiveOps() as any;
  if(isLoading) return <div className="h-[70vh] animate-pulse rounded-3xl bg-accent-100 dark:bg-white/5" />;
  if(isError) return <Card className="text-center py-12"><AlertCircle className="h-10 w-10 mx-auto text-amber-500" /><p className="mt-2 font-medium">Could not load live map</p><button onClick={()=>refetch()} className="mt-3 rounded-full btn-brand-gradient px-5 py-2 text-sm text-white">Retry</button></Card>;
  const center: [number,number] = [39.20, -76.85];
  const drivers: any[] = data?.drivers ?? [];
  const rides: any[] = data?.activeRides ?? [];
  return (
    <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-2xl font-bold dark:text-white">Live Operations Map</h1><span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700"><span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />{drivers.length} drivers • {rides.length} active</span></div>
      <div className="overflow-hidden rounded-3xl border border-accent-200 shadow-sm dark:border-white/10">
        <MapContainer center={center} zoom={11} style={{ height: '72vh', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          {drivers.map((d:any)=> {
            const lat = d.coordinates?.coordinates?.[1]; const lng = d.coordinates?.coordinates?.[0];
            if (lat==null||lng==null) return null;
            return <Marker key={d._id} position={[lat,lng]} icon={driverIcon}><Popup><b>{d.driver?.name}</b><br/>{d.driver?.driverDetails?.vehicleType}</Popup></Marker>;
          })}
          {rides.map((r:any)=> (<div key={r._id}><Marker position={[r.pickup.lat,r.pickup.lng]} icon={pickupIcon}><Popup>Pickup: {r.pickup.address}</Popup></Marker><Polyline positions={[[r.pickup.lat,r.pickup.lng],[r.dropoff.lat,r.dropoff.lng]] as any} pathOptions={{ color:'#c62828', weight:4 }} /></div>))}
        </MapContainer>
      </div>
      <Card><CardTitle>Traffic & Airport</CardTitle><p className="text-sm text-muted">Live driver and ride positions refresh every 8s via React Query. Route polyline <code className="rounded bg-accent-100 px-1 dark:bg-white/10">#c62828</code> per palette rule.</p></Card>
    </div>
  );
}