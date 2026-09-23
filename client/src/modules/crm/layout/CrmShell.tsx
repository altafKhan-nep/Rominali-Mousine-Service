import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Radio, Map, CalendarDays, Users, Car, Wallet, BarChart3, LifeBuoy, Bell, ShieldCheck, Settings, Moon, Sun, Menu, X, LogOut, Phone } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/dispatch', label: 'Dispatch', icon: Radio },
  { to: '/admin/operations', label: 'Live Map', icon: Map },
  { to: '/admin/reservations', label: 'Reservations', icon: CalendarDays },
  { to: '/admin/drivers', label: 'Drivers', icon: Car },
  { to: '/admin/passengers', label: 'Passengers', icon: Users },
  { to: '/admin/fleet', label: 'Fleet', icon: Car },
  { to: '/admin/finance', label: 'Finance', icon: Wallet },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/support', label: 'Support', icon: LifeBuoy },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/audit', label: 'Audit Log', icon: ShieldCheck },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function CrmShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false); // default light like http://localhost:5173/ white; user toggles to dark explicitly
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    if (dark) localStorage.setItem('crm-dark', '1');
    else localStorage.removeItem('crm-dark');
  }, [dark]);
  // force light on first mount if user previously had dark stuck (fixes black-in-light bug)
  useEffect(() => { localStorage.removeItem('crm-dark'); document.documentElement.classList.remove('dark'); }, []);

  const [helpOpen, setHelpOpen] = useState(false);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === '?') { e.preventDefault(); setHelpOpen(v=>!v); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); navigate('/admin/reservations'); }
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [navigate]);

  const SidebarInner = (
    <div className="flex h-full flex-col">
      {/* Brand band — mirrors Navbar Home: bg-brand-gradient + gold accent */}
      <div className="relative overflow-hidden bg-brand-gradient px-4 py-5 text-white">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-6 h-20 w-20 rounded-full bg-gold-500/15 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-sm font-bold text-brand-800 shadow-sm">E</span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-display text-[15px] font-bold leading-none tracking-tight">Romina <span className="text-gold-300">Limousine</span></p>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-medium tracking-widest text-white/70 uppercase"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-400" /> CRM • Dispatch</p>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setDark(v => !v)} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white hover:bg-white/15" title="Toggle theme">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {!collapsed && (
          <div className="relative mt-4 flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-gold-400" />
            <span className="text-xs font-medium text-white/85">24/7 Live Operations</span>
            <a href="tel:2403510826" className="ml-auto hidden items-center gap-1 text-xs font-semibold text-gold-300 sm:flex"><Phone className="h-3 w-3" /> (240) 351-0826</a>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto bg-white px-2 py-3 dark:bg-accent-900">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end as any}
            className={({ isActive }) => `mb-0.5 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-100 dark:bg-brand-950 dark:text-gold-300 dark:ring-white/10' : 'text-muted hover:bg-accent-50 hover:text-ink dark:hover:bg-white/5'}`}
          >
            {Icon ? <Icon className="h-[18px] w-[18px] shrink-0" /> : null} {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-accent-200 bg-white px-3 py-3 dark:border-accent-800 dark:bg-accent-900">
        <div className="flex items-center gap-3">
          {user?.avatar ? <img src={user.avatar} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-brand-100" /> : <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 ring-1 ring-brand-200">{user?.name?.[0]}</div>}
          {!collapsed && <div className="min-w-0 flex-1"><p className="truncate font-display text-sm font-semibold">{user?.name}</p><p className="truncate text-xs capitalize text-muted">{user?.role}</p></div>}
          <button onClick={logout} title="Sign out" className="grid h-8 w-8 place-items-center rounded-full bg-accent-50 hover:bg-accent-100 dark:bg-white/5 dark:hover:bg-white/10"><LogOut className="h-4 w-4" /></button>
        </div>
        {!collapsed && <Link to="/" className="mt-3 block text-center text-xs text-muted hover:text-ink">← Back to website</Link>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-ink dark:bg-accent-900 dark:text-white">
      <aside className={`fixed inset-y-0 left-0 z-[1001] hidden border-r border-accent-200 bg-white shadow-sm transition-all dark:border-accent-800 dark:bg-accent-900 lg:block ${collapsed ? 'w-20' : 'w-72'}`}>
        {SidebarInner}
        <button onClick={() => setCollapsed(v => !v)} className="absolute -right-3 top-24 grid h-7 w-7 place-items-center rounded-full border border-accent-200 bg-surface text-xs shadow-md hover:bg-accent-50 dark:border-accent-700 dark:bg-accent-800">{collapsed ? '›' : '‹'}</button>
      </aside>

      <div className="sticky top-0 z-[1001] flex h-[56px] items-center gap-3 border-b border-accent-200 bg-brand-gradient px-4 text-white shadow-md dark:border-accent-800 lg:hidden">
        <button onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10"><Menu className="h-5 w-5" /></button>
        <span className="font-display font-bold tracking-tight">Romina <span className="text-gold-300">Limousine</span></span>
        <div className="ml-auto flex items-center gap-1">
          <span className="text-xs text-white/70">CRM</span>
        </div>
      </div>
      {mobileOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)}>
          <motion.aside initial={{ x: -320 }} animate={{ x: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 260 }} className="h-full w-[300px] overflow-hidden rounded-r-3xl bg-surface shadow-2xl dark:bg-accent-900" onClick={e => e.stopPropagation()}>
            <div className="flex h-14 items-center justify-between border-b border-accent-200 px-4 dark:border-accent-800"><span className="font-display font-bold">Menu</span><button onClick={() => setMobileOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-accent-50 dark:bg-white/5"><X className="h-4 w-4" /></button></div>
            {SidebarInner}
          </motion.aside>
        </motion.div>
      )}

      <main id="main" className={`${collapsed ? 'lg:pl-20' : 'lg:pl-72'} transition-all`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink shadow">Skip to content</a>
        <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
      {helpOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 backdrop-blur-sm p-4" onClick={()=>setHelpOpen(false)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-accent-900" onClick={e=>e.stopPropagation()}>
            <h3 className="font-display font-bold">Quick help</h3>
            <ul className="mt-3 space-y-1 text-sm text-muted">
              <li><span className="font-semibold text-ink dark:text-white">?</span> Toggle this help</li>
              <li><span className="font-semibold">⌘K</span> Search reservations</li>
              <li><span className="font-semibold">44px</span> All buttons meet touch target</li>
            </ul>
            <button onClick={()=>setHelpOpen(false)} className="mt-4 w-full rounded-full btn-brand-gradient py-2.5 text-sm font-semibold text-white">Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}
