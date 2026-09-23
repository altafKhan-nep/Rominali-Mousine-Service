import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';
import { Timer, BadgeDollarSign, Plane, CarFront, Phone, ArrowRight } from 'lucide-react';
import { SERVICES } from '../../data/services.js';
import { resolveServiceIcon } from '../../data/serviceIcons.js';
import { PHONE_TEL, PHONE_DISPLAY } from '../../data/site.js';
import { useSiteContent } from '../../hooks/useSiteContent.js';

const PROMISES = [
  { icon: Timer, title: 'On-time guaranteed', desc: 'Your chauffeur is staged and ready ahead of schedule, every single time.' },
  { icon: BadgeDollarSign, title: 'Fixed rate pricing', desc: 'What you are quoted is what you pay — zero surge, no hidden fees.' },
  { icon: Plane, title: 'Flight tracking', desc: 'Gate pickups adjust automatically to your flight. No charges for delays.' },
  { icon: CarFront, title: 'Luxury fleet', desc: 'Immaculate late-model sedans, SUVs & Sprinters, detailed before every dispatch.' },
];

export default function Services() {
  const { user } = useAuth();
  const bookUrl = user ? '/reservations' : '/login';
  const services = useSiteContent('services', SERVICES);

  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="bg-brand-gradient relative overflow-hidden text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-gold-500/15 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white/85 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-gold-400" />
            World-class transportation
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Exacting precision. <span className="text-gold-300">Immaculate rides.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
            From corporate airport transfers and as-directed hourly charters to special events and
            gala execution — our late-model luxury fleet and professional chauffeurs serve demanding
            corporate partners and discerning private travelers alike.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to={bookUrl}>
              <Button size="lg" className="bg-white !text-brand-900 shadow-xl hover:bg-brand-50">
                Book a ride now
              </Button>
            </Link>
            <a
              href={PHONE_TEL}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Phone className="h-4 w-4" />
              {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      {/* ============ SERVICE GRID ============ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            Full-service chauffeur travel
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Explore our services
          </h2>
          <p className="mt-4 leading-relaxed text-muted">
            From elegant executive sedans to luxury SUVs and spacious Sprinter vans — every vehicle
            is designed to meet the highest standards of luxury and safety.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => {
            const Icon = resolveServiceIcon(s);
            return (
            <Reveal key={s.slug} delay={(i % 3) * 90} className="h-full">
              <Link
                to={`/services/${s.slug}`}
                className="card-lift group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <div className="absolute inset-x-0 top-0 h-1.5 bg-brand-gradient opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="flex items-start justify-between">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient-soft">
                    <Icon className="h-7 w-7 text-brand-700" />
                  </span>
                  <span className="rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
                    {s.tagline}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-ink">{s.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{s.summary}</p>
                <div className="mt-5 flex-1" />
                <span className="inline-flex items-center gap-1.5 border-t border-slate-100 pt-5 text-sm font-semibold text-brand-700">
                  Learn more
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </Reveal>
            );
          })}
        </div>
      </section>

      {/* ============ PROMISES ============ */}
      <section className="bg-brand-gradient-soft py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              The Romina standard
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Superior service, every trip
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              No matter where you are headed, your trip will always be professional, comfortable
              and safe.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PROMISES.map((p, i) => (
              <Reveal key={p.title} delay={i * 80} className="h-full">
                <div className="card-lift h-full rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient-soft">
                    <p.icon className="h-7 w-7 text-brand-700" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-ink">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ENTERPRISE BAND ============ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="rounded-3xl bg-brand-gradient px-8 py-12 text-white sm:px-12">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Require a custom enterprise program?</h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/80">
                Connect with our corporate accounts desk to establish high-frequency route
                pipelines, unified recurring billing configurations, or multi-city event support
                programs across Maryland, Virginia, and Washington DC.
              </p>
            </div>
            <Link to="/contact">
              <Button size="lg" className="bg-white !text-brand-900 shadow-xl hover:bg-brand-50">
                Inquire for enterprise
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}