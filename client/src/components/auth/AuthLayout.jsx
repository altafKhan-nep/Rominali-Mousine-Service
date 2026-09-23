import { Link } from 'react-router-dom';
import { Phone, MapPin, ShieldCheck, Clock, Star } from 'lucide-react';
import { PHONE_TEL, PHONE_DISPLAY, BRAND_NAME, BRAND_SERVICE_AREA, BRAND_ESTABLISHED } from '../../data/site.js';

const TRUST = [
  { icon: ShieldCheck, label: 'Licensed & insured chauffeurs' },
  { icon: Clock, label: '24/7 dispatch, fixed flat rates' },
  { icon: MapPin, label: 'Every airport · BWI, IAD, DCA' },
];

// Premium split-screen auth shell: left red brand panel (editorial serif
// headline, trust chips, gold rating, phone CTA), right form card on paper.
// Navbar/Footer are hidden on auth routes in App.jsx so this is immersive.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper lg:flex-row">
      {/* Brand panel — desktop only */}
      <aside className="bg-brand-gradient relative hidden overflow-hidden lg:flex lg:w-[45%] lg:shrink-0 lg:flex-col">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-gold-500/15 blur-3xl" />
          <div className="absolute left-1/2 top-2/3 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:px-14 xl:py-12">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="" className="h-12 w-auto drop-shadow-lg" />
            <span className="text-2xl font-bold tracking-tight">
              Romina <span className="text-gold-300">Limousine</span>
            </span>
          </Link>

          <div className="my-10">
            <span className="eyebrow eyebrow-on-dark">Est. {BRAND_ESTABLISHED} · Maryland</span>
            <h1 className="mt-5 text-[2.75rem] font-bold leading-[1.05] tracking-tight drop-shadow-sm xl:text-5xl">
              Private travel,
              <span className="block text-gold-300">
                reinvented
                <span className="text-white">.</span>
              </span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/80">
              Late-model fleet, professional chauffeurs and door-to-door service
              across the region — every single trip.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <span className="flex gap-0.5 text-gold-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </span>
              <span className="text-sm font-semibold text-white/85">5.0 · Loved by riders</span>
            </div>

            <div className="mt-8 space-y-3">
              {TRUST.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10">
                    <Icon className="h-4 w-4 text-gold-300" />
                  </span>
                  {label}
                </div>
              ))}
            </div>
          </div>

          <a
            href={PHONE_TEL}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-900 shadow-lg transition-colors hover:bg-brand-50"
          >
            <Phone className="h-4 w-4 text-brand-700" />
            {PHONE_DISPLAY}
          </a>
        </div>
      </aside>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[26rem]">
          {/* Compact brand mark for mobile/tablet */}
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <img src="/logo.png" alt="" className="h-10 w-auto" />
            <span className="text-xl font-bold tracking-tight text-brand-700">
              Romina <span className="text-brand-500">Limousine</span>
            </span>
          </Link>

          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>}

          <div className="mt-7 rounded-3xl bg-white p-6 shadow-[0_24px_60px_-28px_rgba(24,24,28,0.28)] ring-1 ring-accent-200/60 sm:p-8">
            {children}
          </div>

          {footer && <div className="mt-6">{footer}</div>}

          <p className="mt-8 text-center text-xs text-muted">
            © {new Date().getFullYear()} {BRAND_NAME} · {BRAND_SERVICE_AREA}
          </p>
        </div>
      </div>
    </div>
  );
}