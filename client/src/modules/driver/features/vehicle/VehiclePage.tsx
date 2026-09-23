import { Card, CardTitle } from '../../components/ui/card';
import { useDriverProfile } from '../../hooks/useDriverQuery';
export default function VehiclePage(){
  const { data } = useDriverProfile() as any; const d=(data?.user?.driverDetails)||{};
  return (<div className="space-y-4"><h1 className="font-display text-2xl font-bold dark:text-white">Vehicle</h1><Card className="flex gap-6 flex-wrap"><img src="/images/ececutive-sedan.png" alt="vehicle" className="h-32 w-48 rounded-2xl object-cover border border-accent-200" /><div><p className="font-display font-bold">{d.vehicleType || 'economy-sedan'} • {d.plateNumber || '—'}</p><p className="text-sm text-muted">Year 2022 • Insurance • Registration • Inspection • Fuel: Gas • Mileage 42,100 mi</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><span className="rounded-full bg-accent-50 px-2.5 py-1 dark:bg-white/5">Insurance exp 2027-03-12</span><span className="rounded-full bg-gold-50 px-2.5 py-1 text-gold-700">Service due in 1,200 mi</span></div></div></Card></div>);
}
