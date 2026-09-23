import { Link, useParams } from 'react-router-dom';
import { Check, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';
import PageHero, { HeroActions } from '../../components/marketing/PageHero.jsx';
import Section from '../../components/marketing/Section.jsx';
import IconTile from '../../components/marketing/IconTile.jsx';
import { SERVICES } from '../../data/services.js';
import { resolveServiceIcon } from '../../data/serviceIcons.js';
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
      <PageHero eyebrow={service.short} title={service.name} subtitle={service.summary}>
        <HeroActions bookTo={bookUrl} bookLabel="Book this service" />
      </PageHero>

      {/* ============ DETAIL ============ */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <span className="eyebrow">What to expect</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
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
            <div className="card-lift mt-8 rounded-3xl bg-brand-gradient-soft p-8">
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
            <div className="card-lift rounded-3xl bg-white p-8 ring-1 ring-accent-200/60">
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
              <div className="mt-8 border-t border-accent-100 pt-6">
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
      </Section>

      {/* ============ OTHER SERVICES ============ */}
      <Section band>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">More ways to ride</span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
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
          {others.slice(0, 6).map((s, i) => {
            const Icon = resolveServiceIcon(s);
            return (
              <Reveal key={s.slug} delay={(i % 3) * 90} className="h-full">
                <Link
                  to={`/services/${s.slug}`}
                  className="card-lift group flex h-full items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-accent-200/60"
                >
                  <IconTile size="sm">
                    <Icon className="h-6 w-6 text-brand-700" />
                  </IconTile>
                  <span>
                    <span className="block font-bold text-ink">{s.name}</span>
                    <span className="block text-xs text-muted">{s.tagline}</span>
                  </span>
                  <ArrowRight className="ml-auto h-4 w-4 text-brand-700" aria-hidden />
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Section>
    </div>
  );
}