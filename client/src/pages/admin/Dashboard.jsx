import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import {
  adminAnalytics,
  adminRides,
  adminDrivers,
} from '../../services/rideService.js';
import {
  adminUsers,
  adminSuspendUser,
  adminUnsuspendUser,
  adminDeleteUser,
  adminPayments,
  adminSettings,
  adminUpdateSettings,
  adminAssignDriver,
} from '../../services/adminService.js';
import { onRideUpdate, offRideUpdate, onRideNew, offRideNew } from '../../services/socketService.js';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { vehicleLabel } from '../../data/vehicles.js';

const STATUS_STYLE = {
  pending: 'bg-accent-50 text-accent-700',
  accepted: 'bg-blue-50 text-blue-700',
  arriving: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-brand-50 text-brand-700',
  completed: 'bg-brand-50 text-brand-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

const PAY_STYLE = {
  succeeded: 'bg-green-50 text-green-700',
  cash: 'bg-gold-100 text-gold-700',
  failed: 'bg-red-50 text-red-700',
  refunded: 'bg-blue-50 text-blue-700',
  pending: 'bg-yellow-50 text-yellow-700',
};

const PAY_ACCENT = {
  succeeded: { dot: 'bg-green-500', text: 'text-green-700', top: 'border-t-green-500' },
  cash: { dot: 'bg-gold-500', text: 'text-gold-700', top: 'border-t-gold-500' },
  failed: { dot: 'bg-red-500', text: 'text-red-700', top: 'border-t-red-500' },
  refunded: { dot: 'bg-blue-500', text: 'text-blue-700', top: 'border-t-blue-500' },
  pending: { dot: 'bg-yellow-500', text: 'text-yellow-700', top: 'border-t-yellow-500' },
};

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [rides, setRides] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [payments, setPayments] = useState([]);
  const [paySummary, setPaySummary] = useState({});
  const [settings, setSettings] = useState(null);
  const [active, setActive] = useState('overview');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [assignSel, setAssignSel] = useState({});

  const load = async () => {
    try {
      const [a, r, d] = await Promise.all([adminAnalytics(), adminRides(), adminDrivers()]);
      setAnalytics(a.data);
      setRides(r.data.rides);
      setDrivers(d.data.drivers);
    } catch {
      setError('Could not load CRM data');
    }
  };

  const loadUsers = async (search = '') => {
    try {
      const { data } = await adminUsers({ search });
      setUsers(data.users);
    } catch {
      setError('Could not load users');
    }
  };

  const loadPayments = async () => {
    try {
      const { data } = await adminPayments({});
      setPayments(data.payments);
      setPaySummary(data.summary);
    } catch {
      setError('Could not load payments');
    }
  };

  const loadSettings = async () => {
    try {
      const { data } = await adminSettings();
      setSettings(data.settings);
    } catch {
      setError('Could not load settings');
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (active === 'users') loadUsers(userSearch);
    if (active === 'payments') loadPayments();
    if (active === 'settings') loadSettings();
    if (active === 'rides') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Live refresh of the rides table when dispatch assigns/removes or a new
  // reservation arrives (admin socket is joined to the `admins` room).
  useEffect(() => {
    if (active !== 'rides') return;
    const refresh = () => load();
    onRideUpdate(refresh);
    onRideNew(refresh);
    return () => {
      offRideUpdate();
      offRideNew();
    };
  }, [active]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'rides', label: 'Rides' },
    { id: 'drivers', label: 'Drivers' },
    { id: 'users', label: 'Users' },
    { id: 'payments', label: 'Payments' },
    { id: 'settings', label: 'Settings' },
  ];

  if (error) return <p className="px-4 py-16 text-center text-muted">{error}</p>;

  const toggleSuspend = async (u) => {
    setBusy(u._id);
    try {
      if (u.isSuspended) await adminUnsuspendUser(u._id);
      else await adminSuspendUser(u._id);
      await loadUsers(userSearch);
    } catch {
      setError('Could not update user');
    } finally {
      setBusy('');
    }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Delete ${u.name} permanently? Their rides and payments are removed too.`)) return;
    setBusy(u._id);
    try {
      await adminDeleteUser(u._id);
      await loadUsers(userSearch);
    } catch {
      setError('Could not delete user');
    } finally {
      setBusy('');
    }
  };

  const saveSettings = async () => {
    setBusy('settings');
    try {
      const { data } = await adminUpdateSettings(settings);
      setSettings(data.settings);
      setError('');
    } catch {
      setError('Could not save settings');
    } finally {
      setBusy('');
    }
  };

  const setSetting = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  const assignDriver = async (r) => {
    const driverId = assignSel[r._id];
    if (!driverId) return;
    setBusy(r._id);
    try {
      await adminAssignDriver(r._id, driverId);
      setError('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not assign driver');
    } finally {
      setBusy('');
    }
  };

  const removeDriver = async (r) => {
    if (!window.confirm(`Remove ${r.driver?.name} from this ride?`)) return;
    setBusy(r._id);
    try {
      await adminAssignDriver(r._id, null);
      setError('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove driver');
    } finally {
      setBusy('');
    }
  };

  const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">CRM dashboard</h1>
          <p className="mt-1 text-sm text-muted">Ops overview for {analytics?.totalRides ?? '…'} rides.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 sm:inline-flex">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-none ${
              active === t.id ? 'bg-white text-ink shadow-sm' : 'text-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === 'overview' && !analytics && (
        <div className="mt-8 flex justify-center">
          <Spinner label="Loading analytics…" />
        </div>
      )}

      {active === 'overview' && analytics && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: 'Total rides', value: analytics.totalRides },
              { label: 'Active now', value: analytics.activeRides },
              { label: 'Drivers', value: analytics.totalDrivers },
              { label: 'Passengers', value: analytics.totalPassengers },
              { label: 'Revenue', value: `$${analytics.revenue}` },
            ].map((s) => (
              <div key={s.label} className={card}>
                <p className="text-sm text-muted">{s.label}</p>
                <p className="mt-1 text-2xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold">Recent rides</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {analytics.recentRides.slice(0, 5).map((r) => (
                <li key={r._id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0">
                  <span>
                    {r.passenger?.name || 'Unknown'} → {r.pickup.address}
                  </span>
                  <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {active === 'rides' && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Passenger</th>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Pickup</th>
                  <th className="px-4 py-3">Dropoff</th>
                  <th className="px-4 py-3">Fare</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rides.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLE[r.status]}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">{r.passenger?.name || '—'}</td>
                    <td className="px-4 py-3">
                      {r.driver ? r.driver.name : <span className="text-muted">Unassigned</span>}
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-muted">{r.pickup.address}</td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-muted">{r.dropoff.address}</td>
                    <td className="px-4 py-3 font-medium">
                      ${(r.status === 'completed' ? r.fare.final : r.fare.estimated).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {['pending', 'accepted', 'arriving', 'in_progress'].includes(r.status) &&
                        (r.driver ? (
                          <div className="flex justify-end">
                            <Button
                              variant="danger"
                              size="sm"
                              loading={busy === r._id}
                              onClick={() => removeDriver(r)}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <select
                              value={assignSel[r._id] || ''}
                              onChange={(e) =>
                                setAssignSel((m) => ({ ...m, [r._id]: e.target.value }))
                              }
                              className="input-pill border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-brand-500"
                            >
                              <option value="">Select driver…</option>
                              {drivers.map((d) => (
                                <option key={d._id} value={d._id}>
                                  {d.name} · {vehicleLabel(d.driverDetails?.vehicleType)}
                                </option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              loading={busy === r._id}
                              disabled={!assignSel[r._id]}
                              onClick={() => assignDriver(r)}
                            >
                              Assign
                            </Button>
                          </div>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {active === 'drivers' && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drivers.map((d) => (
            <div key={d._id} className={card}>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                  {d.name?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{d.name}</p>
                  <p className="truncate text-xs text-muted">{d.email}</p>
                </div>
                <span
                  className={`ml-auto rounded-full px-2.5 py-1 text-xs font-medium ${
                    d.driverDetails?.isAvailable
                      ? 'bg-brand-50 text-brand-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {d.driverDetails?.isAvailable ? 'Online' : 'Offline'}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted">
                {vehicleLabel(d.driverDetails?.vehicleType)} · {d.driverDetails?.plateNumber || 'No plate'}
              </p>
            </div>
          ))}
        </div>
      )}

      {active === 'users' && (
        <div className="mt-6">
          <div className="mb-4 flex max-w-sm items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5">
            <Search className="h-4 w-4 text-muted" aria-hidden="true" />
            <input
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                loadUsers(e.target.value);
              }}
              placeholder="Search name, email or phone…"
              className="w-full text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                            {u.name?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted">{u.role}</td>
                    <td className="px-4 py-3">
                      {u.isSuspended ? (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">Suspended</span>
                      ) : (
                        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant={u.isSuspended ? 'secondary' : 'outline'}
                          size="sm"
                          loading={busy === u._id}
                          onClick={() => toggleSuspend(u)}
                        >
                          {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </Button>
                        {u.role !== 'admin' && (
                          <Button variant="danger" size="sm" loading={busy === u._id} onClick={() => deleteUser(u)}>
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {active === 'payments' && (
        <div className="mt-6">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {(['succeeded', 'cash', 'pending', 'failed', 'refunded']).map((s) => (
              <div key={s} className={`${card} border-t-4 ${PAY_ACCENT[s].top}`}>
                <p className="flex items-center gap-2 text-sm capitalize text-muted">
                  <span className={`h-2 w-2 rounded-full ${PAY_ACCENT[s].dot}`} />
                  {s}
                </p>
                <p className={`mt-1 text-xl font-bold ${PAY_ACCENT[s].text}`}>
                  {paySummary[s] ? `$${paySummary[s].total.toFixed(2)}` : '$0.00'}
                </p>
                <p className="text-xs text-muted">{paySummary[s]?.count || 0} payments</p>
              </div>
            ))}
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${PAY_STYLE[p.status]}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="capitalize">{p.method}</span>
                      {p.provider === 'stripe' && (
                        <span className="ml-1.5 rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-semibold text-accent-700">
                          Stripe
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{p.user?.name || '—'}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-muted">
                      {p.ride ? `${p.ride.pickup.address} → ${p.ride.dropoff.address}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium">${p.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {active === 'settings' && settings && (
        <div className="mt-6 max-w-2xl space-y-4">
          <div className={card}>
            <h2 className="font-bold">Fare model overrides</h2>
            <p className="mt-1 text-sm text-muted">Leave empty to use the built-in per-vehicle rates.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                { key: 'baseFare', label: 'Base fare ($)' },
                { key: 'perKm', label: 'Per km ($)' },
                { key: 'perMin', label: 'Per min ($)' },
              ].map((f) => (
                <label key={f.key} className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink">{f.label}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={settings[f.key] ?? ''}
                    onChange={(e) =>
                      setSetting(f.key, e.target.value === '' ? null : Number(e.target.value))
                    }
                    className="input-pill w-full border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className={card}>
            <h2 className="font-bold">Payments</h2>
            <label className="mt-4 flex items-center justify-between gap-4">
              <span className="text-sm text-ink">
                <span className="block font-medium">Enable online payments</span>
                <span className="text-xs text-muted">Hide the Pay button when off.</span>
              </span>
              <input
                type="checkbox"
                checked={Boolean(settings.paymentsEnabled)}
                onChange={(e) => setSetting('paymentsEnabled', e.target.checked)}
                className="h-5 w-5 accent-brand-600"
              />
            </label>
          </div>

          <div className={card}>
            <h2 className="font-bold">Support info</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Phone</span>
                <input
                  value={settings.supportPhone || ''}
                  onChange={(e) => setSetting('supportPhone', e.target.value)}
                  className="input-pill w-full border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Email</span>
                <input
                  value={settings.supportEmail || ''}
                  onChange={(e) => setSetting('supportEmail', e.target.value)}
                  className="input-pill w-full border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </label>
            </div>
          </div>

          <Button loading={busy === 'settings'} onClick={saveSettings}>
            Save settings
          </Button>
        </div>
      )}
    </div>
  );
}
