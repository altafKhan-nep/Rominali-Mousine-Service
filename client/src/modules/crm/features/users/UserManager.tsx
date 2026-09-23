import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../../services/api.js';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/Modal';

const VEHICLE_TYPES = ['executive-sedan','economy-sedan','economy-suv','premium-suv','luxury-suv','van','mini-coach','school-bus','motorcoach'];

const INPUT = 'input-pill w-full border border-accent-200 bg-white px-3 py-2 text-sm outline-none dark:border-accent-700 dark:bg-accent-800 dark:text-white';

const emptyForm = (role: 'passenger' | 'driver') => ({
  name: '', email: '', phone: '', password: '',
  role, emailVerified: true, isSuspended: false,
  driverDetails: { vehicleType: 'economy-sedan', plateNumber: '', licenseNo: '', isAvailable: true },
});

export default function UserManager({ role }: { role: 'passenger' | 'driver' }) {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any|null>(null);
  const [form, setForm] = useState<any>(emptyForm(role));
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['crm','users',role,q],
    queryFn: async () => (await api.get('/crm/users', { params: { search: q, role } })).data,
  });
  const users: any[] = (data as any)?.users ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ['crm','users'] });

  const save = useMutation({
    mutationFn: async () => {
      const body: any = { ...form };
      if (!editing) delete body.isSuspended;
      if (body.role !== 'driver') delete body.driverDetails;
      if (!body.password) delete body.password;
      if (editing) await api.patch(`/crm/users/${editing._id}`, body);
      else await api.post('/crm/users', body);
      setError('');
    },
    onSuccess: () => { invalidate(); setOpen(false); },
    onError: (e: any) => setError(e?.response?.data?.message || 'Save failed'),
  });

  const setSuspend = useMutation({
    mutationFn: async (u: any) => {
      if (u.isSuspended) await api.patch(`/crm/users/${u._id}/unsuspend`);
      else await api.patch(`/crm/users/${u._id}/suspend`);
    },
    onSuccess: invalidate,
    onError: (e: any) => alert(e?.response?.data?.message || 'Failed'),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      if (!confirm('Permanently delete this user and all their rides/payments?')) return;
      await api.delete(`/crm/users/${id}`);
    },
    onSuccess: invalidate,
    onError: (e: any) => alert(e?.response?.data?.message || 'Delete failed'),
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm(role)); setError(''); setOpen(true); };
  const openEdit = (u: any) => {
    setEditing(u);
    setForm({
      name: u.name, email: u.email, phone: u.phone || '', password: '',
      role: u.role, emailVerified: !!u.emailVerified, isSuspended: !!u.isSuspended,
      driverDetails: {
        vehicleType: u.driverDetails?.vehicleType || 'economy-sedan',
        plateNumber: u.driverDetails?.plateNumber || '',
        licenseNo: u.driverDetails?.licenseNo || '',
        isAvailable: !!u.driverDetails?.isAvailable,
      },
    });
    setError('');
    setOpen(true);
  };

  const set = (patch: any) => setForm({ ...form, ...patch });
  const setDD = (patch: any) => setForm({ ...form, driverDetails: { ...form.driverDetails, ...patch } });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold capitalize">{role} Management</h1>
        <button onClick={openCreate} className="rounded-full btn-brand-gradient px-5 py-2 text-sm font-medium text-white">
          + Add {role}
        </button>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={`Search ${role}s by name / email / phone…`}
        className="input-pill w-full max-w-md border border-accent-200 px-4 py-2 text-sm outline-none dark:border-accent-700 dark:bg-accent-800 dark:text-white"
      />

      <div className="space-y-3">
        {isLoading && <div className="h-24 animate-pulse rounded-2xl bg-accent-200 dark:bg-accent-800" />}
        {users.map((u: any) => (
          <Card key={u._id} className="flex flex-wrap items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-gradient-soft text-sm font-bold text-brand-700">
              {u.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {u.name}
                {u.isSuspended && <Badge tone="red">Suspended</Badge>}
                <Badge tone={u.emailVerified ? 'green' : 'slate'}>{u.emailVerified ? 'Verified' : 'Unverified'}</Badge>
              </p>
              <p className="truncate text-xs text-muted">{u.email} · {u.phone || '—'}</p>
              {u.role === 'driver' && (
                <p className="mt-0.5 text-xs text-muted">
                  {u.driverDetails?.vehicleType} · Plate {u.driverDetails?.plateNumber || '—'} · License {u.driverDetails?.licenseNo || '—'}
                  <Badge tone={u.driverDetails?.isAvailable ? 'green' : 'slate'}>{u.driverDetails?.isAvailable ? 'Online' : 'Offline'}</Badge>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openEdit(u)} className="rounded-full border border-accent-200 px-3 py-1.5 text-xs font-medium hover:bg-accent-50 dark:border-accent-700 dark:hover:bg-white/5">Edit</button>
              <button onClick={() => setSuspend.mutate(u)} className="rounded-full border border-accent-200 px-3 py-1.5 text-xs font-medium hover:bg-accent-50 dark:border-accent-700 dark:hover:bg-white/5">
                {u.isSuspended ? 'Unsuspend' : 'Suspend'}
              </button>
              <button onClick={() => del.mutate(u._id)} className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950">Delete</button>
            </div>
          </Card>
        ))}
        {!isLoading && users.length === 0 && <p className="text-sm text-muted">No {role}s found.</p>}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit ${role}` : `Add ${role}`}
        wide
        footer={
          <>
            {error && <p className="w-full text-sm text-red-600">{error}</p>}
            <button onClick={() => setOpen(false)} className="rounded-full border border-accent-200 px-4 py-2 text-sm dark:border-accent-700">Cancel</button>
            <button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-full btn-brand-gradient px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Name *
            <input value={form.name} onChange={(e) => set({ name: e.target.value })} className={`${INPUT} mt-1`} />
          </label>
          <label className="text-sm">Email *
            <input value={form.email} onChange={(e) => set({ email: e.target.value })} className={`${INPUT} mt-1`} />
          </label>
          <label className="text-sm">Phone
            <input value={form.phone} onChange={(e) => set({ phone: e.target.value })} className={`${INPUT} mt-1`} />
          </label>
          <label className="text-sm">Password {editing ? '(leave blank to keep)' : '*'}
            <input type="password" value={form.password} onChange={(e) => set({ password: e.target.value })} className={`${INPUT} mt-1`} />
          </label>
          <label className="text-sm">Role
            <select value={form.role} onChange={(e) => set({ role: e.target.value })} className={`${INPUT} mt-1`}>
              <option value="passenger">Passenger</option>
              <option value="driver">Driver</option>
            </select>
          </label>
          <label className="flex items-center gap-2 pt-5 text-sm">
            <input type="checkbox" checked={form.emailVerified} onChange={(e) => set({ emailVerified: e.target.checked })} className="h-4 w-4" /> Email verified
          </label>
          <label className="flex items-center gap-2 pt-5 text-sm">
            <input type="checkbox" checked={!!form.isSuspended} onChange={(e) => set({ isSuspended: e.target.checked })} className="h-4 w-4" /> Suspended
          </label>
        </div>

        {(form.role === 'driver') && (
          <div className="mt-4 rounded-2xl bg-accent-50 p-4 dark:bg-white/5">
            <p className="text-sm font-semibold">Driver details</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">Vehicle type
                <select value={form.driverDetails.vehicleType} onChange={(e) => setDD({ vehicleType: e.target.value })} className={`${INPUT} mt-1`}>
                  {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label className="text-sm">Plate number
                <input value={form.driverDetails.plateNumber} onChange={(e) => setDD({ plateNumber: e.target.value })} className={`${INPUT} mt-1`} />
              </label>
              <label className="text-sm">License no.
                <input value={form.driverDetails.licenseNo} onChange={(e) => setDD({ licenseNo: e.target.value })} className={`${INPUT} mt-1`} />
              </label>
              <label className="flex items-center gap-2 pt-5 text-sm">
                <input type="checkbox" checked={!!form.driverDetails.isAvailable} onChange={(e) => setDD({ isAvailable: e.target.checked })} className="h-4 w-4" /> Available (online)
              </label>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}