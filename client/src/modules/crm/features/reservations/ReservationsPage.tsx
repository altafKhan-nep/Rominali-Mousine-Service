import { useCrmRides } from '../../hooks/useCrmQuery';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useState } from 'react';
import api from '../../../../services/api.js';

const STATUSES = ['pending','scheduled','accepted','arriving','in_progress','completed','cancelled','no_show','refunded'];

export default function ReservationsPage() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const { data, refetch, isLoading } = useCrmRides(status?{status}:{}) as any;
  let rides: any[] = (data?.rides ?? []).filter((r:any)=> !q || r.pickup?.address?.toLowerCase().includes(q.toLowerCase()) || r.passenger?.name?.toLowerCase().includes(q.toLowerCase()));

  const markNoShow = async (id:string) => {
    if (!confirm('Mark as no-show?')) return;
    await api.post(`/crm/rides/${id}/no-show`, { reason: 'Passenger no-show' });
    refetch();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reservations</h1>
      <Card className="flex flex-wrap gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search passenger / address…" className="input-pill min-w-[220px] flex-1 border border-accent-200 px-4 py-2 text-sm outline-none dark:border-accent-700 dark:bg-accent-800" />
        <select value={status} onChange={e=>setStatus(e.target.value)} className="input-pill border border-accent-200 px-3 py-2 text-sm dark:border-accent-700 dark:bg-accent-800"><option value="">All statuses (9)</option>{STATUSES.map(s=> <option key={s} value={s}>{s}</option>)}</select>
      </Card>
      <div className="overflow-hidden rounded-2xl border border-accent-200 bg-surface dark:border-accent-800 dark:bg-accent-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-accent-50 text-xs uppercase tracking-wide text-muted dark:bg-accent-800"><tr><th className="px-4 py-3">Status</th><th className="px-4 py-3">Passenger</th><th className="px-4 py-3">Route</th><th className="px-4 py-3">Fare</th><th className="px-4 py-3">When</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-accent-100 dark:divide-accent-800">
              {isLoading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Loading…</td></tr> : rides.map((r:any)=> (
                <tr key={r._id} className="hover:bg-accent-50 dark:hover:bg-accent-800/50">
                  <td className="px-4 py-3"><Badge tone={r.status==='completed'?'green':r.status==='cancelled'?'red':r.status==='no_show'?'red':'brand'}>{r.status.replace('_',' ')}</Badge></td>
                  <td className="px-4 py-3">{r.passenger?.name}<div className="text-xs text-muted">{r.passenger?.phone}</div></td>
                  <td className="max-w-[320px] truncate px-4 py-3 text-muted">{r.pickup?.address} → {r.dropoff?.address}</td>
                  <td className="px-4 py-3 font-medium">${(r.fare?.final ?? r.fare?.estimated ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-muted">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{['accepted','arriving','in_progress'].includes(r.status) && <button onClick={()=>markNoShow(r._id)} className="rounded-full border px-3 py-1 text-xs hover:bg-accent-50 dark:border-accent-700">No-show</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
