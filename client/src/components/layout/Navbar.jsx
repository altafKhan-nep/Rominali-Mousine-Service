import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Phone, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { SERVICES } from '../../data/services.js';
import NotificationsBell from './NotificationsBell.jsx';
import { PHONE_TEL, PHONE_DISPLAY } from '../../data/site.js';

const MAIN_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/fleet', label: 'Fleet' },
  { to: '/rates', label: 'Rates' },
  { to: '/contact', label: 'Contact' },
];

const navItem = ({ isActive }) =>
  `rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  const go = (to) => {
    setOpen(false);
    setServicesOpen(false);
    navigate(to);
  };

  // Close the services dropdown on outside click
  useEffect(() => {
    if (!servicesOpen) return;
    const onDown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setServicesOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [servicesOpen]);

  return (
    <header className="bg-brand-gradient sticky top-0 z-[1001] shadow-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Romina Limousine Service logo"
            className="h-9 w-auto drop-shadow"
          />
          <span className="text-lg font-bold tracking-tight text-white sm:text-xl">
            Romina <span className="text-gold-300">Limousine</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 lg:flex">
          {MAIN_LINKS.filter((l) => l.to !== '/services').map((l) => (
            <NavLink key={l.to} to={l.to} className={navItem}>
              {l.label}
            </NavLink>
          ))}

          {/* Services dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              aria-expanded={servicesOpen}
              onClick={() => setServicesOpen((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                servicesOpen ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              Services
              <svg viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} aria-hidden="true">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
              </svg>
            </button>

            {servicesOpen && (
              <div className="absolute left-1/2 top-full w-[560px] -translate-x-1/2 pt-2">
                <div className="overflow-hidden rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-slate-200">
                  <div className="grid grid-cols-2 gap-1">
                    {SERVICES.map((s) => (
                      <button
                        key={s.slug}
                        onClick={() => go(`/services/${s.slug}`)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-brand-50"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient-soft">
                          <s.icon className="h-5 w-5 text-brand-700" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-ink">{s.name}</span>
                          <span className="block text-xs text-muted">{s.tagline}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-1 border-t border-slate-100 pt-2">
                    <button
                      onClick={() => go('/services')}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                    >
                      View all services
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Phone + portal (desktop) */}
          <a
            href={PHONE_TEL}
            className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 xl:flex"
          >
            <Phone className="h-4 w-4" />
            {PHONE_DISPLAY}
          </a>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              to="/reservations"
              className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Client Portal
            </Link>
            {user ? (
              <div className="flex items-center gap-2">
                <NotificationsBell />
                {user.role === 'driver' && (
                  <NavLink to="/driver" className={navItem}>Driver</NavLink>
                )}
                {user.role === 'admin' && (
                  <NavLink to="/admin" className={navItem}>Admin</NavLink>
                )}
                <NavLink to="/profile" className={navItem}>Profile</NavLink>
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-white/10 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="rounded-full px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: notifications + hamburger */}
          {user && (
            <div className="lg:hidden">
              <NotificationsBell />
            </div>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-full text-white transition-colors hover:bg-white/10 lg:hidden"
          >
            <div className="space-y-1.5">
              <span className={`block h-0.5 w-5 bg-white transition-transform ${open ? 'translate-y-2 rotate-45' : ''}`} />
              <span className={`block h-0.5 w-5 bg-white transition-opacity ${open ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-5 bg-white transition-transform ${open ? '-translate-y-2 -rotate-45' : ''}`} />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-white/10 bg-brand-gradient lg:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6">
            <button onClick={() => go('/')} className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/10">
              Home
            </button>
            <button onClick={() => go('/about')} className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/10">
              About
            </button>

            {/* Services expander */}
            <div className="rounded-2xl transition-colors hover:bg-white/10">
              <button
                onClick={() => setServicesOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-white/90"
              >
                Services
                <svg viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} aria-hidden="true">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
              {servicesOpen && (
                <div className="space-y-0.5 px-2 pb-2">
                  {SERVICES.map((s) => (
                    <button
                      key={s.slug}
                      onClick={() => go(`/services/${s.slug}`)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-left text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <s.icon className="h-4 w-4 shrink-0 text-gold-300" />
                      <span>{s.name}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => go('/services')}
                    className="mt-1 flex w-full items-center justify-between rounded-xl border border-white/20 px-4 py-2.5 text-left text-sm font-semibold text-gold-300 transition-colors hover:bg-white/10"
                  >
                    View all services
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => go('/fleet')} className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/10">
              Fleet
            </button>
            <button onClick={() => go('/rates')} className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/10">
              Rates
            </button>
            <button onClick={() => go('/contact')} className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/10">
              Contact
            </button>
            <button onClick={() => go('/reservations')} className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/10">
              Client Portal
            </button>
            <a
              href={PHONE_TEL}
              className="flex w-full items-center gap-2.5 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-gold-300"
            >
              <Phone className="h-4 w-4" />
              {PHONE_DISPLAY}
            </a>

            {user && user.role === 'driver' && (
              <button onClick={() => go('/driver')} className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/10">
                Driver dashboard
              </button>
            )}
            {user && user.role === 'admin' && (
              <button onClick={() => go('/admin')} className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/10">
                Admin dashboard
              </button>
            )}
            {user && (
              <button onClick={() => go('/profile')} className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/10">
                Profile
              </button>
            )}

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                >
                  Sign out ({user.name})
                </button>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="rounded-full px-4 py-2 text-sm font-medium text-white/80 hover:text-white">
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}