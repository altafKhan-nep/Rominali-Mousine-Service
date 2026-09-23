import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../../services/api.js';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/Modal';
import { useState } from 'react';

const VEHICLE_TYPES = ['executive-sedan','economy-sedan','economy-suv','premium-suv','luxury-suv','van','mini-coach','school-bus','motorcoach'];
const INPUT = 'input-pill w-full border border-accent-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-accent-700 dark:bg-accent-800 dark:text-white';

const emptyForm = () => ({
  plateNumber: '', vin: '', make: '', model: '', year: '',
  type: 'economy-sedan', capacity: '', status: 'active',
  assignedDriver: '', insuranceExpiry: '', inspectionExpiry: '', registrationExpiry: '',
  mileage: '', fuelType: '', images: '', notes: '',
});

const toneOf = (s: string) => s === 'active' ? 'green' : s === 'maintenance' ? 'gold' : 'slate';
const daysUntil = (d: any) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null);
const listExpiring = (v: any) =>
  (['insuranceExpiry','inspectionExpiry','registrationExpiry'] as const).filter((k) => {
    const n = daysUntil(v[k]);
    return n != null && n >= 0 && n <= 30;
  });

export default function FleetPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey:['crm','fleet'], queryFn: async()=>(await api.get('/crm/fleet/vehicles')).data });
  const vehicles: any[] = data?.vehicles ?? [];

  const driversQuery = useQuery({ queryKey:['crm','drivers'], queryFn: async()=>(await api.get('/crm/drivers')).data });
  const drivers: any[] = (driversQuery.data as any)?.drivers ?? [];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(emptyForm());
  const [error, setError] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['crm','fleet'] });

  const save = useMutation({
    mutationFn: async () => {
      const body: any = { ...form, year: form.year || undefined, capacity: form.capacity || undefined, mileage: form.mileage || undefined };
      for (const k of ['insuranceExpiry','inspectionExpiry','registrationExpiry']) body[k] = body[k] || undefined;
      if (body.assignedDriver) body.assignedDriver = undefined;
      else body.assignedDriver = null;
      for (const k of ['vin','make','model','fuelType','notes']) body[k] = body[k]?.trim() || undefined;
      body.images = body.images ? body.images.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      if (editing) await api.patch(`/crm/fleet/vehicles/${editing._id}`, body);
      else await api.post('/crm/fleet/vehicles', body);
      setError('');
    },
    onSuccess: () => { invalidate(); setOpen(false); },
    onError: (e: any) => setError(e?.response?.data?.message || 'Save failed'),
  });

  const del = useMutation({
    mutationFn: async (v: any) => {
      if (!confirm(`Delete vehicle ${v.plateNumber} permanently?`)) return;
      await api.delete(`/crm/fleet/vehicles/${v._id}`);
    },
    onSuccess: invalidate,
    onError: (e: any) => alert(e?.response?.data?.message || 'Delete failed'),
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setError(''); setOpen(true); };
  const openEdit = (v: any) => {
    setEditing(v);
    setForm({
      plateNumber: v.plateNumber || '', vin: v.vin || '', make: v.make || '', model: v.model || '',
      year: v.year || '', type: v.type || 'economy-sedan', capacity: v.capacity || '',
      status: v.status || 'active', assignedDriver: v.assignedDriver || '',
      insuranceExpiry: v.insuranceExpiry ? v.insuranceExpiry.slice(0, 10) : '',
      inspectionExpiry: v.inspectionExpiry ? v.inspectionExpiry.slice(0, 10) : '',
      registrationExpiry: v.registrationExpiry ? v.registrationExpiry.slice(0, 10) : '',
      mileage: v.mileage || '', fuelType: v.fuelType || '',
      images: (v.images || []).join(', '), notes: v.notes || '',
    });
    setError('');
    setOpen(true);
  };

  const set = (patch: any) => setForm({ ...form, ...patch });

  const expiringCount = vehicles.filter((v) => listExpiring(v).length > 0).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Fleet Management</h1>
          <p className="text-sm text-muted">Operational vehicles, licensing and maintenance schedules.</p>
        </div>
        <button onClick={openCreate} className="rounded-full btn-brand-gradient px-5 py-2 text-sm font-medium text-white">+ Add vehicle</button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-accent-200 bg-white p-4 dark:border-accent-800 dark:bg-accent-900">
          <p className="text-xs text-muted">Total</p><p className="text-xl font-bold">{vehicles.length}</p>
        </div>
        <div className="rounded-2xl border border-accent-200 bg-white p-4 dark:border-accent-800 dark:bg-accent-900">
          <p className="text-xs text-muted">Active</p><p className="text-xl font-bold text-green-600">{vehicles.filter((v) => v.status === 'active').length}</p>
        </div>
        <div className="rounded-2xl border border-accent-200 bg-white p-4 dark:border-accent-800 dark:bg-accent-900">
          <p className="text-xs text-muted">Maintenance</p><p className="text-xl font-bold text-gold-500">{vehicles.filter((v) => v.status === 'maintenance').length}</p>
        </div>
        <div className="rounded-2xl border border-accent-200 bg-white p-4 dark:border-accent-800 dark:bg-accent-900">
          <p className="text-xs text-muted">Expiring ≤ 30d</p><p className={`text-xl font-bold ${expiringCount ? 'text-red-600' : 'text-green-600'}`}>{expiringCount}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <div className="h-32 animate-pulse rounded-2xl bg-accent-200 dark:bg-accent-800" />}
        {vehicles.map((v: any) => {
          const expiring = listExpiring(v);
          return (
            <Card key={v._id} className="space-y-2 p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">{v.plateNumber}</span>
                <Badge tone={toneOf(v.status)}>{v.status}</Badge>
              </div>
              <p className="text-sm text-muted">{[v.make, v.model, v.year].filter(Boolean).join(' ') || '—'} · <span className="capitalize">{v.type.split('-').join(' ')}</span></p>
              {v.assignedDriver && <p className="text-xs text-muted">Driver: {v.assignedDriver}</p>}
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                {(['insuranceExpiry','inspectionExpiry','registrationExpiry'] as const).map((k) => {
                  const n = daysUntil(v[k]);
                  const isSoon = n != null && n >= 0 && n <= 30;
                  return (
                    <div key={k} className="rounded-xl bg-accent-50 p-2 dark:bg-white/5">
                      <p className="uppercase tracking-wide text-muted">{k.replace('Expiry', '')}</p>
                      <p className={`font-semibold ${isSoon ? 'text-red-600' : n != null && n < 0 ? 'text-red-700' : 'text-green-600'}`}>
                        {n != null ? `${n}d` : '—'}
                      </p>
                    </div>
                  );
                })}
              </div>
              {expiring.length > 0 && (
                <p className="text-xs font-medium text-red-600">⚠ {expiring.map((k) => k.replace('Expiry', '')).join(', ')} {expiring.length > 1 ? 'expire' : 'expires'} soon</p>
              )}
              {v.notes && <p className="text-xs text-muted">{v.notes}</p>}
              <div className="flex justify-end gap-2 border-t border-accent-100 pt-3 dark:border-accent-800">
                {v.mileage && <span className="mr-auto pt-1 text-xs text-muted">{v.mileage.toLocaleString()} mi</span>}
                <button onClick={() => openEdit(v)} className="rounded-full border border-accent-200 px-3 py-1.5 text-xs font-medium hover:bg-accent-50 dark:border-accent-700 dark:hover:bg-white/5">Edit</button>
                <button onClick={() => del.mutate(v)} className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950">Delete</button>
              </div>
            </Card>
          );
        })}
        {!isLoading && vehicles.length === 0 && <p className="text-sm text-muted sm:col-span-2 lg:col-span-3">No vehicles yet — add your first one.</p>}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit ${editing.plateNumber}` : 'Add a fleet vehicle'}
        wide
        footer={
          <>
            {error && <p className="w-full text-sm text-red-600">{error}</p>}
            <button onClick={() => setOpen(false)} className="rounded-full border border-accent-200 px-4 py-2 text-sm dark:border-accent-700">Cancel</button>
            <button onClick={() => save.mutate()} disabled={!form.plateNumber.trim() || save.isPending} className="rounded-full btn-brand-gradient px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
              {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Add vehicle'}
            </button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Plate number *<input value={form.plateNumber} onChange={(e) => set({ plateNumber: e.target.value })} className={`${INPUT} mt-1`} /></label>
          <label className="text-sm">VIN<input value={form.vin} onChange={(e) => set({ vin: e.target.value })} className={`${INPUT} mt-1`} /></label>
          <label className="text-sm">Make<input value={form.make} onChange={(e) => set({ make: e.target.value })} className={`${INPUT} mt-1`} /></label>
          <label className="text-sm">Model<input value={form.model} onChange={(e) => set({ model: e.target.value })} className={`${INPUT} mt-1`} /></label>
          <label className="text-sm">Year<input type="number" value={form.year} onChange={(e) => set({ year: e.target.value })} className={`${INPUT} mt-1`} /></label>
          <label className="text-sm">Vehicle type
            <select value={form.type} onChange={(e) => set({ type: e.target.value })} className={`${INPUT} mt-1`}>
              {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="text-sm">Capacity (pax)<input type="number" value={form.capacity} onChange={(e) => set({ capacity: e.target.value })} className={`${INPUT} mt-1`} /></label>
          <label className="text-sm">Status
            <select value={form.status} onChange={(e) => set({ status: e.target.value })} className={`${INPUT} mt-1`}>
              <option value="active">Active</option><option value="maintenance">Maintenance</option><option value="retired">Retired</option>
            </select>
          </label>
          <label className="text-sm">Assigned driver
            <select value={form.assignedDriver} onChange={(e) => set({ assignedDriver: e.target.value })} className={`${INPUT} mt-1`}>
              <option value="">None</option>
              {drivers.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </label>
          <label className="text-sm">Fuel type<input value={form.fuelType} onChange={(e) => set({ fuelType: e.target.value })} className={`${INPUT} mt-1`} /></label>
          <label className="text-sm">Insurance expiry<input type="date" value={form.insuranceExpiry} onChange={(e) => set({ insuranceExpiry: e.target.value })} className={`${INPUT} mt-1`} /></label>
          <label className="text-sm">Inspection expiry<input type="date" value={form.inspectionExpiry} onChange={(e) => set({ inspectionExpiry: e.target.value })} className={`${INPUT} mt-1`} /></label>
          <label className="text-sm">Registration expiry<input type="date" value={form.registrationExpiry} onChange={(e) => set({ registrationExpiry: e.target.value })} className={`${INPUT} mt-1`} /></label>
          <label className="text-sm">Mileage<input type="number" value={form.mileage} onChange={(e) => set({ mileage: e.target.value })} className={`${INPUT} mt-1`} /></label>
          <div className="sm:col-span-2">
            <label className="text-sm">Images (URLs, comma separated)<input value={form.images} onChange={(e) => set({ images: e.target.value })} className={`${INPUT} mt-1`} /></label>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm">Notes<textarea rows={3} value={form.notes} onChange={(e) => set({ notes: e.target.value })} className={`${INPUT} mt-1`} /></label>
          </div>
        </div>
      </Modal>
    </div>
  );
}