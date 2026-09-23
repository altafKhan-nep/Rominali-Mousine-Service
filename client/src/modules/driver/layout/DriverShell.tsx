import { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Radio, Navigation, CalendarDays, History, Wallet, Car, FileText, Star, TrendingUp, Bell, LifeBuoy, Settings, LogOut, Menu, X, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useDriverProfile, useToggleAvailability } from '../hooks/useDriverQuery';
import { Switch } from '../../../components/ui/Switch.jsx';
import NotificationsBell from '../../../components/layout/NotificationsBell.jsx';

const PRIMARY_NAV = [
  { to: '/driver', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/driver/requests', label: 'Ride Requests', icon: Radio },
  { to: '/driver/current', label: 'Current Ride', icon: Navigation },
  { to: '/driver/history', label: 'Trip History', icon: History },
  { to: '/driver/earnings', label: 'Earnings', icon: TrendingUp },
];
const MORE_NAV = [
  { to: '/driver/upcoming', label: 'Upcoming', icon: CalendarDays },
  { to: '/driver/wallet', label: 'Wallet', icon: Wallet },
  { to: '/driver/vehicle', label: 'Vehicle', icon: Car },
  { to: '/driver/documents', label: 'Documents', icon: FileText },
  { to: '/driver/ratings', label: 'Ratings', icon: Star },
  { to: '/driver/performance', label: 'Performance', icon: TrendingUp },
  { to: '/driver/notifications', label: 'Notifications', icon: Bell },
  { to: '/driver/support', label: 'Support', icon: LifeBuoy },
  { to: '/driver/settings', label: 'Settings', icon: Settings },
];

export default function DriverShell() {
  const { user, logout } = useAuth();
  const { data: profile } = useDriverProfile() as any;
  const driver = profile?.user || user;
  const online = !!driver?.driverDetails?.isAvailable;
  const toggle = useToggleAvailability();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="relative overflow-hidden bg-brand-gradient px-4 py-5 text-white">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-6 h-20 w-20 rounded-full bg-gold-500/15 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-sm font-bold text-brand-800 shadow-sm">E</span>
          {!collapsed && <div className="min-w-0"><p className="font-display text-[15px] font-bold leading-none">Romina <span className="text-gold-300">Limousine</span></p><p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-medium tracking-widest text-white/70 uppercase"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-400" /> Driver • {online ? 'Online' : 'Offline'}</p></div>}
          <div className="ml-auto flex items-center gap-1">
            <span className="h-7 w-7 place-items-center rounded-full bg-white/10 text-white">{dark ? '☀' : '☾'}</span>
          </div>
        </div>
        {!collapsed && (
          <div className="relative mt-4 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-gold-400 animate-pulse' : 'bg-white/40'}`} /><span className="text-xs font-semibold text-white">{online ? 'On duty' : 'Off duty'}</span></div>
              <Switch checked={online} onChange={() => toggle.mutate(!online)} disabled={toggle.isPending} />
            </div>
            <p className="mt-1 text-xs text-white/70">{online ? 'Receiving nearby requests' : 'Go online to receive rides'}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto bg-white px-2 py-3 dark:bg-accent-900" aria-label="Driver navigation">
        {PRIMARY_NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end as any} className={({ isActive }) => `mb-0.5 flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 ${isActive ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-100 dark:bg-brand-950 dark:text-gold-300' : 'text-muted hover:bg-accent-50 hover:text-ink dark:hover:bg-white/5'}`}>
            {Icon ? <Icon className="h-[18px] w-[18px] shrink-0" /> : null} {!collapsed && label}
          </NavLink>
        ))}
        {!collapsed && (
          <details className="mt-2">
            <summary className="flex cursor-pointer items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold uppercase tracking-widest text-muted hover:bg-accent-50 dark:hover:bg-white/5">More ▾</summary>
            <div className="mt-1 space-y-0.5">
              {MORE_NAV.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-brand-500 ${isActive ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-gold-300' : 'text-muted hover:bg-accent-50 hover:text-ink dark:hover:bg-white/5'}`}>
                  {Icon ? <Icon className="h-[18px] w-[18px] shrink-0" /> : null} {label}
                </NavLink>
              ))}
            </div>
          </details>
        )}
      </nav>

      <div className="border-t border-accent-200 bg-white px-3 py-3 dark:border-accent-800 dark:bg-accent-900">
        <div className="flex items-center gap-3">
          {driver?.avatar ? <img src={driver.avatar} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-brand-100" /> : <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">{driver?.name?.[0]}</div>}
          {!collapsed && <div className="min-w-0 flex-1"><p className="truncate font-display text-sm font-semibold">{driver?.name}</p><p className="truncate text-xs text-muted">{driver?.driverDetails?.vehicleType || 'Driver'} • {driver?.driverDetails?.plateNumber || '—'}</p></div>}
          <button onClick={logout} className="grid h-8 w-8 place-items-center rounded-full bg-accent-50 hover:bg-accent-100 dark:bg-white/5"><LogOut className="h-4 w-4" /></button>
        </div>
        {!collapsed && <div className="mt-3 flex items-center justify-between text-xs"><a href="tel:2403510826" className="inline-flex items-center gap-1 font-semibold text-brand-700"><Phone className="h-3 w-3" />(240) 351-0826</a><Link to="/" className="text-muted hover:text-ink">← Website</Link></div>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-ink dark:bg-accent-900 dark:text-white">
      <aside className={`fixed inset-y-0 left-0 z-[1001] hidden border-r border-accent-200 bg-white shadow-sm dark:border-accent-800 dark:bg-accent-900 lg:block ${collapsed ? 'w-20' : 'w-72'}`}>
        {SidebarInner}
        <button onClick={() => setCollapsed(v=>!v)} className="absolute -right-3 top-24 grid h-7 w-7 place-items-center rounded-full border border-accent-200 bg-white text-xs shadow-md dark:border-accent-700 dark:bg-accent-800">{collapsed?'›':'‹'}</button>
      </aside>
      <div className="sticky top-0 z-[1001] flex h-[56px] items-center gap-3 border-b border-accent-200 bg-brand-gradient px-4 text-white shadow-md lg:hidden">
        <button onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10"><Menu className="h-5 w-5" /></button>
        <span className="font-display font-bold">Romina <span className="text-gold-300">Driver</span></span>
        <div className="ml-auto flex items-center gap-1">
          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${online ? 'bg-gold-400 text-ink' : 'bg-white/15 text-white'}`}><span className={`h-2 w-2 rounded-full ${online ? 'bg-ink animate-pulse' : 'bg-white/60'}`} />{online ? 'Online' : 'Offline'}</span>
        </div>
      </div>
      {mobileOpen && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden" onClick={()=>setMobileOpen(false)}>
          <motion.aside initial={{x:-320}} animate={{x:0}} className="h-full w-[300px] overflow-hidden rounded-r-3xl bg-white shadow-2xl dark:bg-accent-900" onClick={e=>e.stopPropagation()}>
            <div className="flex h-12 items-center justify-between border-b px-4"><span className="font-display font-bold dark:text-white">Menu</span><button onClick={()=>setMobileOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-accent-50"><X className="h-4 w-4" /></button></div>
            {SidebarInner}
          </motion.aside>
        </motion.div>
      )}
      <main className={`${collapsed ? 'lg:pl-20' : 'lg:pl-72'} transition-all`}>
        <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
