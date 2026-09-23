import { Link, useParams } from 'react-router-dom';
import { Phone, Check, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';
import { SERVICES } from '../../data/services.js';
import { PHONE_TEL, PHONE_DISPLAY } from '../../data/site.js';
import { useSiteContent } from '../../hooks/useSiteContent.js';

export default function ServiceDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const bookUrl = user ? '/reservations' : '/login';
  const services = useSiteContent('services', SERVICES);
  const service = services.find((s) => s.slug === slug);
  const others = services.filter((s) => s.slug !== slug);

  if (!service) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-muted">We could not find that service.</p>
        <Link to="/services" className="mt-6 inline-block">
          <Button>View all services</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="bg-brand-gradient relative overflow-hidden text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-gold-500/15 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 backdrop-blur">
              <service.icon className="h-7 w-7 text-white" />
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white/85 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-gold-400" />
              {service.short}
            </span>
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {service.name}
          </h1>
          <p className="mt-2 text-lg font-semibold text-gold-300">{service.tagline}</p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">{service.summary}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to={bookUrl}>
              <Button size="lg" className="bg-white !text-brand-900 shadow-xl hover:bg-brand-50">
                Book this service
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

      {/* ============ DETAIL ============ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              What to expect
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {service.name} done right
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted">
              {service.summary} Whether it is a single ride or a full itinerary, our coordinators
              work with you to plan every detail — and our uniformed, background-checked drivers
              carry it out with care.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Every ride is tracked, rated and quality-monitored, so you always know what to
              expect: a prompt pickup, a comfortable vehicle and a professional driver.
            </p>
            <div className="mt-8 rounded-3xl bg-brand-gradient-soft p-8">
              <h3 className="text-lg font-bold text-brand-900">Planning ahead?</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-950/70">
                Pre-bookings and custom itineraries are welcome. Tell us your schedule and we will
                handle the rest.
              </p>
              <Link to={bookUrl} className="mt-5 inline-block">
                <Button>Start planning</Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-base font-bold text-ink">Why riders choose us</h3>
              <ul className="mt-5 space-y-4">
                {service.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm font-medium text-ink">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-100 text-accent-700">
                      <Check className="h-3 w-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8 border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">5-star rated</span>
                  <span className="flex gap-0.5 text-gold-400" aria-label="Five stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">Available</span>
                  <span className="text-sm font-semibold text-brand-600">24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ OTHER SERVICES ============ */}
      <section className="bg-brand-gradient-soft py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
                More ways to ride
              </span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Explore our other services
              </h2>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 rounded-full border border-brand-600 px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              All services <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {others.slice(0, 6).map((s, i) => (
              <Reveal key={s.slug} delay={(i % 3) * 90} className="h-full">
                <Link
                  to={`/services/${s.slug}`}
                  className="card-lift group flex h-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-gradient-soft">
                    <s.icon className="h-6 w-6 text-brand-700" />
                  </span>
                  <span>
                    <span className="block font-bold text-ink">{s.name}</span>
                    <span className="block text-xs text-muted">{s.tagline}</span>
                  </span>
                  <ArrowRight className="ml-auto h-4 w-4 text-brand-700" aria-hidden />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
