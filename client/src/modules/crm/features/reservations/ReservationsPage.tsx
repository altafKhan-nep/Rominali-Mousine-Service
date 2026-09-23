import { useCrmRides } from '../../hooks/useCrmQuery';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../../services/api.js';

const STATUSES = ['pending','scheduled','accepted','arriving','in_progress','completed','cancelled','no_show','refunded'];
const ACTIVE = ['accepted','arriving','in_progress'];

export default function ReservationsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const { data, refetch, isLoading } = useCrmRides(status ? { status } : {}) as any;

  const driversQuery = useQuery({ queryKey: ['crm','drivers'], queryFn: async () => (await api.get('/crm/drivers')).data });
  const drivers: any[] = (driversQuery.data as any)?.drivers ?? [];

  let rides: any[] = (data?.rides ?? []).filter((r: any) =>
    !q || r.pickup?.address?.toLowerCase().includes(q.toLowerCase()) || r.passenger?.name?.toLowerCase().includes(q.toLowerCase())
  );

  const run = async (fn: () => Promise<any>) => {
    try { await fn(); refetch(); qc.invalidateQueries({ queryKey: ['admin','analytics'] }); }
    catch (e: any) { alert(e?.response?.data?.message || 'Failed'); }
  };

  const dispatch = (ride: any, driverId: string) =>
    run(() => api.patch(`/crm/rides/${ride._id}/dispatch`, { driverId: driverId || null }));

  const changeStatus = (ride: any, next: string, extra: any = {}) =>
    run(() => api.patch(`/crm/rides/${ride._id}`, { status: next, ...extra }));

  const editFare = (ride: any) => {
    const val = prompt('Set final fare (USD):', String(ride.fare?.final ?? ride.fare?.estimated ?? 0));
    if (val === null || val === '') return;
    run(() => api.patch(`/crm/rides/${ride._id}`, { fareFinal: Number(val) }));
  };

  const cancel = (ride: any) => {
    const reason = prompt('Cancellation reason:', 'Cancelled by dispatch');
    if (reason === null) return;
    setStatus(ride, 'cancelled', { cancelReason: reason });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reservations</h1>
      <Card className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search passenger / address…" className="input-pill min-w-[220px] flex-1 border border-accent-200 px-4 py-2 text-sm outline-none dark:border-accent-700 dark:bg-accent-800 dark:text-white" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-pill border border-accent-200 px-3 py-2 text-sm dark:border-accent-700 dark:bg-accent-800 dark:text-white">
          <option value="">All statuses (9)</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Card>
      <div className="overflow-hidden rounded-2xl border border-accent-200 bg-surface dark:border-accent-800 dark:bg-accent-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-accent-50 text-xs uppercase tracking-wide text-muted dark:bg-accent-800">
              <tr><th className="px-4 py-3">Status</th><th className="px-4 py-3">Passenger</th><th className="px-4 py-3">Route</th><th className="px-4 py-3">Fare</th><th className="px-4 py-3">Driver</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-accent-100 dark:divide-accent-800">
              {isLoading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Loading…</td></tr>
              : rides.map((r: any) => (
                <tr key={r._id} className="align-top hover:bg-accent-50 dark:hover:bg-accent-800/50">
                  <td className="px-4 py-3"><Badge tone={r.status === 'completed' ? 'green' : (r.status === 'cancelled' || r.status === 'no_show') ? 'red' : 'brand'}>{r.status.replace('_', ' ')}</Badge></td>
                  <td className="px-4 py-3">{r.passenger?.name}<div className="text-xs text-muted">{r.passenger?.phone}</div></td>
                  <td className="max-w-[280px] truncate px-4 py-3 text-muted">{r.pickup?.address} → {r.dropoff?.address}</td>
                  <td className="px-4 py-3 font-medium">${(r.fare?.final ?? r.fare?.estimated ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={r.driver?._id || r.driver || ''}
                        onChange={(e) => dispatch(r, e.target.value)}
                        className="input-pill max-w-[150px] border border-accent-200 bg-white px-2 py-1 text-xs dark:border-accent-700 dark:bg-accent-800 dark:text-white"
                        disabled={!['pending','accepted'].includes(r.status)}
                      >
                        <option value="">{r.driver ? 'Change…' : 'Assign…'}</option>
                        {drivers.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
                      </select>
                      {r.driver && <button onClick={() => dispatch(r, '')} className="rounded-full border border-accent-200 px-2 py-1 text-xs hover:bg-accent-50 dark:border-accent-700 dark:hover:bg-white/5" title="Remove driver">✕</button>}
                    </div>
                    {r.driver && <div className="mt-1 text-xs text-muted">Assigned: {r.driver?.name}</div>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {ACTIVE.includes(r.status) && <button onClick={() => changeStatus(r, 'completed')} className="rounded-full border border-green-200 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50 dark:border-green-900">Complete</button>}
                      {ACTIVE.includes(r.status) && <button onClick={() => changeStatus(r, 'no_show')} className="rounded-full border border-accent-200 px-3 py-1 text-xs hover:bg-accent-50 dark:border-accent-700 dark:hover:bg-white/5">No-show</button>}
                      {['pending','accepted','arriving','in_progress'].includes(r.status) && <button onClick={() => cancel(r)} className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950">Cancel</button>}
                      {['cancelled','no_show','pending'].includes(r.status) && <button onClick={() => changeStatus(r, 'pending')} className="rounded-full border border-accent-200 px-3 py-1 text-xs hover:bg-accent-50 dark:border-accent-700 dark:hover:bg-white/5">Reopen</button>}
                      {r.status !== 'refunded' && <button onClick={() => editFare(r)} className="rounded-full border border-accent-200 px-3 py-1 text-xs hover:bg-accent-50 dark:border-accent-700 dark:hover:bg-white/5">Fare…</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}