import { useCrmRides } from '../../hooks/useCrmQuery';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/Modal';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../../services/api.js';

const STATUSES = ['pending','scheduled','accepted','arriving','in_progress','completed','cancelled','no_show','refunded'];
const ACTIVE = ['accepted','arriving','in_progress'];

const toneOf = (s: string) =>
  s === 'completed' ? 'green' : (s === 'cancelled' || s === 'no_show' || s === 'refunded') ? 'red' : 'brand';

const pretty = (s: string = '') => s.replace(/_/g, ' ');

const vehicleLabel = (t: string = '') =>
  t.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || '—';

export default function ReservationsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const { data, refetch, isLoading } = useCrmRides(status ? { status } : {}) as any;

  const [fareModal, setFareModal] = useState<any | null>(null);
  const [fareVal, setFareVal] = useState(0);
  const [cancelModal, setCancelModal] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const driversQuery = useQuery({ queryKey: ['crm','drivers'], queryFn: async () => (await api.get('/crm/drivers')).data });
  const drivers: any[] = (driversQuery.data as any)?.drivers ?? [];

  const rides: any[] = (data?.rides ?? []).filter((r: any) =>
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

  const openFare = (ride: any) => { setFareVal(ride.fare?.final ?? ride.fare?.estimated ?? 0); setFareModal(ride); };
  const saveFare = () => { if (!fareModal) return; run(() => api.patch(`/crm/rides/${fareModal._id}`, { fareFinal: Number(fareVal) })); setFareModal(null); };

  const openCancel = (ride: any) => { setCancelReason('Cancelled by dispatch'); setCancelModal(ride); };
  const saveCancel = () => { if (!cancelModal) return; changeStatus(cancelModal, 'cancelled', { cancelReason }); setCancelModal(null); };

  const activeCount = rides.filter((r) => ACTIVE.includes(r.status)).length;
  const revenue = rides.filter((r) => r.status === 'completed').reduce((s, r) => s + (r.fare?.final || 0), 0);

  const Actions = ({ r }: { r: any }) => (
    <div className="flex flex-wrap gap-1.5">
      {ACTIVE.includes(r.status) && <button onClick={() => changeStatus(r, 'completed')} className="rounded-full border border-green-200 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50 dark:border-green-900">Complete</button>}
      {ACTIVE.includes(r.status) && <button onClick={() => changeStatus(r, 'no_show')} className="rounded-full border border-accent-200 px-3 py-1 text-xs hover:bg-accent-50 dark:border-accent-700 dark:hover:bg-white/5">No-show</button>}
      {['pending','accepted','arriving','in_progress'].includes(r.status) && <button onClick={() => openCancel(r)} className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950">Cancel</button>}
      {['cancelled','no_show'].includes(r.status) && <button onClick={() => changeStatus(r, 'pending')} className="rounded-full border border-accent-200 px-3 py-1 text-xs hover:bg-accent-50 dark:border-accent-700 dark:hover:bg-white/5">Reopen</button>}
      {r.status !== 'refunded' && <button onClick={() => openFare(r)} className="rounded-full border border-accent-200 px-3 py-1 text-xs hover:bg-accent-50 dark:border-accent-700 dark:hover:bg-white/5">Fare…</button>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reservations</h1>
          <p className="text-sm text-muted">Dispatch, complete, no-show or cancel rides.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-accent-200 bg-white p-4 dark:border-accent-800 dark:bg-accent-900">
          <p className="text-xs text-muted">Loaded</p>
          <p className="text-xl font-bold">{rides.length}</p>
        </div>
        <div className="rounded-2xl border border-accent-200 bg-white p-4 dark:border-accent-800 dark:bg-accent-900">
          <p className="text-xs text-muted">Active</p>
          <p className="text-xl font-bold text-brand-600">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-accent-200 bg-white p-4 dark:border-accent-800 dark:bg-accent-900">
          <p className="text-xs text-muted">Pending</p>
          <p className="text-xl font-bold text-gold-500">{rides.filter((r) => r.status === 'pending').length}</p>
        </div>
        <div className="rounded-2xl border border-accent-200 bg-white p-4 dark:border-accent-800 dark:bg-accent-900">
          <p className="text-xs text-muted">Revenue (completed)</p>
          <p className="text-xl font-bold text-green-600">${revenue.toFixed(2)}</p>
        </div>
      </div>

      <Card className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search passenger / address…" className="input-pill min-w-[220px] flex-1 border border-accent-200 px-4 py-2 text-sm outline-none dark:border-accent-700 dark:bg-accent-800 dark:text-white" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-pill border border-accent-200 px-3 py-2 text-sm dark:border-accent-700 dark:bg-accent-800 dark:text-white">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Card>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-accent-200 bg-surface dark:border-accent-800 dark:bg-accent-900 md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-accent-50 text-xs uppercase tracking-wide text-muted dark:bg-accent-800">
              <tr>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Passenger</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Fare</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent-100 dark:divide-accent-800">
              {isLoading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-muted">Loading…</td></tr>
              : rides.map((r: any) => (
                <tr key={r._id} className="align-top hover:bg-accent-50 dark:hover:bg-accent-800/50">
                  <td className="px-4 py-3"><Badge tone={toneOf(r.status)}>{pretty(r.status)}</Badge></td>
                  <td className="px-4 py-3">{r.passenger?.name}<div className="text-xs text-muted">{r.passenger?.phone}</div></td>
                  <td className="px-4 py-3 text-xs text-muted">{vehicleLabel(r.vehicleType)}</td>
                  <td className="max-w-[260px] truncate px-4 py-3 text-muted">{r.pickup?.address} → {r.dropoff?.address}</td>
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
                  <td className="px-4 py-3 text-xs text-muted">{r.createdAt ? new Date(r.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}</td>
                  <td className="px-4 py-3 text-right"><Actions r={r} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {isLoading && <div className="h-24 animate-pulse rounded-2xl bg-accent-200 dark:bg-accent-800" />}
        {rides.map((r: any) => (
          <Card key={r._id} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient-soft text-sm font-bold text-brand-700">
                  {r.passenger?.name?.[0]?.toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold leading-tight">{r.passenger?.name || 'Passenger'}</p>
                  <p className="text-xs text-muted">{r.passenger?.phone || '—'} · {vehicleLabel(r.vehicleType)}</p>
                </div>
              </div>
              <Badge tone={toneOf(r.status)}>{pretty(r.status)}</Badge>
            </div>
            <p className="text-xs leading-relaxed text-muted">{r.pickup?.address} → {r.dropoff?.address}</p>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-accent-100 pt-2 text-xs text-muted dark:border-accent-800">
              <span className="font-semibold text-ink dark:text-white">${(r.fare?.final ?? r.fare?.estimated ?? 0).toFixed(2)}</span>
              <span>{r.driver?.name ? `Driver: ${r.driver.name}` : 'Unassigned'}</span>
              <select
                value={r.driver?._id || r.driver || ''}
                onChange={(e) => dispatch(r, e.target.value)}
                className="input-pill max-w-[130px] border border-accent-200 bg-white px-2 py-1 text-xs dark:border-accent-700 dark:bg-accent-800 dark:text-white"
                disabled={!['pending','accepted'].includes(r.status)}
              >
                <option value="">Assign…</option>
                {drivers.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <Actions r={r} />
          </Card>
        ))}
        {!isLoading && rides.length === 0 && <p className="text-sm text-muted">No reservations found.</p>}
      </div>

      {/* Fare modal */}
      <Modal
        open={!!fareModal}
        onClose={() => setFareModal(null)}
        title={`Adjust final fare — ${fareModal?.passenger?.name || 'ride'}`}
        footer={
          <>
            {fareModal && <p className="w-full text-xs text-muted">Was estimating: ${(fareModal.fare?.estimated ?? 0).toFixed(2)}</p>}
            <button onClick={() => setFareModal(null)} className="rounded-full border border-accent-200 px-4 py-2 text-sm dark:border-accent-700">Cancel</button>
            <button onClick={saveFare} className="rounded-full btn-brand-gradient px-5 py-2 text-sm font-medium text-white">Save fare</button>
          </>
        }
      >
        <label className="block text-sm">
          <span className="font-medium">Final fare (USD)</span>
          <span className="mt-1 block">
            <input
              type="number" min={0} step="0.01"
              value={fareVal}
              onChange={(e) => setFareVal(Number(e.target.value))}
              className="input-pill w-full border border-accent-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-accent-700 dark:bg-accent-800 dark:text-white"
            />
          </span>
        </label>
      </Modal>

      {/* Cancel modal */}
      <Modal
        open={!!cancelModal}
        onClose={() => setCancelModal(null)}
        title="Cancel reservation"
        footer={
          <>
            <button onClick={() => setCancelModal(null)} className="rounded-full border border-accent-200 px-4 py-2 text-sm dark:border-accent-700">Keep ride</button>
            <button onClick={saveCancel} className="rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-white">Cancel ride</button>
          </>
        }
      >
        <label className="block text-sm">
          <span className="font-medium">Reason</span>
          <span className="mt-1 block">
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="input-pill w-full border border-accent-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-accent-700 dark:bg-accent-800 dark:text-white"
            />
          </span>
        </label>
      </Modal>
    </div>
  );
}