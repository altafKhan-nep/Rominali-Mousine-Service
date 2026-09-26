import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Phone, Mail, ArrowRight, ChevronDown, Clock, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { SERVICES } from '../../data/services.js';
import { useSiteContent } from '../../hooks/useSiteContent.js';
import { resolveServiceIcon } from '../../data/serviceIcons.js';
import NotificationsBell from './NotificationsBell.jsx';
import { PHONE_TEL, PHONE_DISPLAY, EMAIL, BRAND_SERVICE_AREA } from '../../data/site.js';

// Desktop nav keeps Services as a dropdown, injected between Fleet and Rates.
const HEAD_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/fleet', label: 'Fleet' },
];
const TAIL_LINKS = [
  { to: '/rates', label: 'Rates' },
  { to: '/contact', label: 'Contact' },
];

// Elegant uppercase nav link: soft gold underline grows in from the left.
const navItem = ({ isActive }) =>
  `relative py-1 text-[0.78rem] font-semibold uppercase tracking-[0.16em] transition-colors duration-200 after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:rounded-full after:origin-left after:bg-gold-400 after:transition-transform after:duration-300 after:content-[''] ${
    isActive
      ? 'text-gold-300 after:scale-x-100'
      : 'text-white/75 after:scale-x-0 hover:text-white hover:after:scale-x-100'
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const services = useSiteContent('services', SERVICES);
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [utilityVisible, setUtilityVisible] = useState(
    () => sessionStorage.getItem('nav-utility-dismissed') !== '1'
  );
  const dropdownRef = useRef(null);

  const dismissUtility = () => {
    setUtilityVisible(false);
    sessionStorage.setItem('nav-utility-dismissed', '1');
  };

  // Deepen the shadow once the page scrolls; also collapses the top utility bar.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    <header className="sticky top-0 z-[1001]">
      {/* Utility bar — dismissible via the X, collapses on scroll */}
      <div
        className={`hidden overflow-hidden bg-brand-950 transition-all duration-300 md:block ${
          scrolled || !utilityVisible ? 'h-0 opacity-0' : 'h-9 opacity-100'
        }`}
      >
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <p className="flex items-center gap-1.5 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-white/50">
            <Clock className="h-3 w-3 text-gold-400" aria-hidden />
            {BRAND_SERVICE_AREA}
          </p>
          <div className="hidden items-center gap-5 text-[0.7rem] sm:flex">
            <a
              href={PHONE_TEL}
              className="flex items-center gap-1.5 font-semibold text-gold-300 transition-colors hover:text-gold-200"
            >
              <Phone className="h-3 w-3" aria-hidden />
              {PHONE_DISPLAY}
            </a>
            <span className="h-3 w-px bg-white/15" aria-hidden />
            <a
              href={`mailto:${EMAIL}`}
              className="flex items-center gap-1.5 text-white/60 transition-colors hover:text-gold-300"
            >
              <Mail className="h-3 w-3" aria-hidden />
              {EMAIL}
            </a>
            <span className="h-3 w-px bg-white/15" aria-hidden />
            <Link to="/reservations" className="font-semibold text-white/70 transition-colors hover:text-gold-300">
              Client Portal
            </Link>
          </div>
          <button
            type="button"
            onClick={dismissUtility}
            aria-label="Dismiss utility bar"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>

      {/* Main nav */}
      <div
        className={`bg-navy-gradient transition-shadow duration-300 ${
          scrolled ? 'shadow-xl shadow-black/40' : 'shadow-lg'
        }`}
      >
        <div className="h-0.5 bg-gradient-to-r from-transparent via-gold-400/90 to-transparent" />
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" onClick={() => setOpen(false)} className="flex shrink-0 items-center gap-3">
            <img
              src="/logo.png"
              alt="Romina Limousine Service logo"
              className="h-14 w-auto drop-shadow sm:h-16"
            />
            <span className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              Romina <span className="text-gold-gradient">Limousine</span>
            </span>
          </Link>

          {/* Centered desktop nav */}
          <div className="hidden flex-1 items-center justify-center gap-7 lg:flex">
            {HEAD_LINKS.map((l) => (
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
                className={`flex items-center gap-1 py-1 text-[0.78rem] font-semibold uppercase tracking-[0.16em] transition-colors duration-200 ${
                  servicesOpen ? 'text-gold-300' : 'text-white/75 hover:text-white'
                }`}
              >
                Services
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`} aria-hidden />
              </button>

              {servicesOpen && (
                <div className="absolute left-1/2 top-full w-[560px] -translate-x-1/2 pt-3">
                  <div className="overflow-hidden rounded-2xl border-t-2 border-t-gold-400 bg-white shadow-2xl shadow-black/30 ring-1 ring-accent-200">
                    <div className="grid grid-cols-2 gap-1 p-3">
                      {services.map((s) => {
                        const Icon = resolveServiceIcon(s);
                        return (
                        <button
                          key={s.slug}
                          onClick={() => go(`/services/${s.slug}`)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-brand-50"
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient-soft">
                            <Icon className="h-5 w-5 text-brand-700" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-ink">{s.name}</span>
                            <span className="block text-xs text-muted">{s.tagline}</span>
                          </span>
                        </button>
                        );
                      })}
                    </div>
                    <div className="border-t border-accent-100 p-2">
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

            {TAIL_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={navItem}>
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Phone (large screens) */}
            <a
              href={PHONE_TEL}
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-gold-300 transition-colors hover:bg-white/5 hover:text-gold-200 xl:flex"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/5">
                <Phone className="h-4 w-4" />
              </span>
              {PHONE_DISPLAY}
            </a>

            <div className="hidden items-center gap-2 lg:flex">
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
                  <Link
                    to="/reservations"
                    className="rounded-full bg-gold-gradient px-4 py-2 text-sm font-semibold !text-navy-950 transition-transform hover:-translate-y-0.5"
                  >
                    Book Now
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="rounded-full border border-white/15 px-3.5 py-2 text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="rounded-full px-3 py-2 text-sm font-medium text-white/75 transition-colors hover:text-gold-300">
                    Sign in
                  </Link>
                  <Link
                    to="/reservations"
                    className="flex items-center gap-1.5 rounded-full bg-gold-gradient px-5 py-2 text-sm font-semibold !text-navy-950 shadow-lg shadow-gold-400/20 transition-transform hover:-translate-y-0.5"
                  >
                    Book Now
                    <ArrowRight className="h-4 w-4" aria-hidden />
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
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-gold-400/15 bg-navy-gradient lg:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6">
            <Link
              to="/reservations"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 rounded-full bg-gold-gradient px-4 py-3 text-sm font-semibold !text-navy-950"
            >
              Book Now
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>

            <div className="mt-2 rounded-2xl border border-white/10">
              <button onClick={() => go('/')} className="block w-full rounded-t-2xl px-4 py-3 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/10">
                Home
              </button>
              <button onClick={() => go('/about')} className="block w-full border-t border-white/10 px-4 py-3 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/10">
                About
              </button>

              {/* Services expander */}
              <div className="border-t border-white/10 transition-colors hover:bg-white/10">
                <button
                  onClick={() => setServicesOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-white/90"
                >
                  Services
                  <ChevronDown className={`h-4 w-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} aria-hidden />
                </button>
                {servicesOpen && (
                  <div className="space-y-0.5 px-2 pb-2">
                    {services.map((s) => {
                      const Icon = resolveServiceIcon(s);
                      return (
                      <button
                        key={s.slug}
                        onClick={() => go(`/services/${s.slug}`)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-left text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-gold-300" />
                        <span>{s.name}</span>
                      </button>
                      );
                    })}
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

              <button onClick={() => go('/fleet')} className="block w-full border-t border-white/10 px-4 py-3 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/10">
                Fleet
              </button>
              <button onClick={() => go('/rates')} className="block w-full border-t border-white/10 px-4 py-3 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/10">
                Rates
              </button>
              <button onClick={() => go('/contact')} className="block w-full border-t border-white/10 px-4 py-3 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/10">
                Contact
              </button>
            </div>

            <a
              href={PHONE_TEL}
              className="flex w-full items-center gap-2.5 rounded-2xl border border-gold-400/30 px-4 py-3 text-left text-sm font-semibold text-gold-300"
            >
              <Phone className="h-4 w-4" />
              {PHONE_DISPLAY}
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="flex w-full items-center gap-2.5 px-4 py-1.5 text-left text-sm text-white/60"
            >
              <Mail className="h-4 w-4" />
              {EMAIL}
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
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
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
                    className="rounded-full border border-gold-400/40 px-4 py-2 text-sm font-semibold text-gold-300 transition-colors hover:bg-gold-400/10"
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