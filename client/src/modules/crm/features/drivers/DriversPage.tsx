import { useQuery } from '@tanstack/react-query';
import api from '../../../../services/api.js';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
export default function DriversPage(){
  const { data } = useQuery({ queryKey:['crm','drivers'], queryFn: async()=>(await api.get('/crm/drivers')).data });
  const drivers:any[] = data?.drivers ?? [];
  return (<div className="space-y-4"><h1 className="text-2xl font-bold">Driver Management</h1><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{drivers.map((d:any)=><Card key={d._id}><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">{d.name?.[0]}</div><div><p className="font-semibold">{d.name}</p><p className="text-xs text-muted">{d.email} • {d.driverDetails?.vehicleType}</p></div><Badge tone={d.driverDetails?.isAvailable?'green':'slate'}>{d.driverDetails?.isAvailable?'Online':'Offline'}</Badge></div><p className="mt-2 text-xs text-muted">Plate {d.driverDetails?.plateNumber||'—'} • License {d.driverDetails?.licenseNo||'—'}</p><p className="text-xs text-muted">Docs, insurance, ratings, earnings, acceptance rate → extend via Vehicle + Ticket models.</p></Card>)}</div></div>);
}
