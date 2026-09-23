import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';
import { Timer, BadgeDollarSign, Plane, CarFront, ArrowRight } from 'lucide-react';
import PageHero, { HeroActions } from '../../components/marketing/PageHero.jsx';
import Section, { SectionHead } from '../../components/marketing/Section.jsx';
import CtaBand from '../../components/marketing/CtaBand.jsx';
import IconTile from '../../components/marketing/IconTile.jsx';
import { SERVICES } from '../../data/services.js';
import { resolveServiceIcon } from '../../data/serviceIcons.js';
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
      <PageHero
        eyebrow="World-class transportation"
        title="Exacting precision."
        accent="Immaculate rides."
        subtitle="From corporate airport transfers and as-directed hourly charters to special events and gala execution — our late-model luxury fleet and professional chauffeurs serve demanding corporate partners and discerning private travelers alike."
      >
        <HeroActions bookTo={bookUrl} bookLabel="Book a ride now" />
      </PageHero>

      {/* ============ SERVICE GRID ============ */}
      <Section>
        <SectionHead
          eyebrow="Full-service chauffeur travel"
          title="Explore our services"
          sub="From elegant executive sedans to luxury SUVs and spacious Sprinter vans — every vehicle is designed to meet the highest standards of luxury and safety."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => {
            const Icon = resolveServiceIcon(s);
            return (
              <Reveal key={s.slug} delay={(i % 3) * 90} className="h-full">
                <Link
                  to={`/services/${s.slug}`}
                  className="card-lift group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white p-7 ring-1 ring-accent-200/60"
                >
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-brand-gradient opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="flex items-start justify-between">
                    <IconTile>
                      <Icon className="h-7 w-7 text-brand-700" />
                    </IconTile>
                    <span className="rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
                      {s.tagline}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-ink">{s.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{s.summary}</p>
                  <div className="mt-5 flex-1" />
                  <span className="inline-flex items-center gap-1.5 border-t border-accent-100 pt-5 text-sm font-semibold text-brand-700">
                    Learn more
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* ============ PROMISES ============ */}
      <Section band>
        <SectionHead
          eyebrow="The Romina standard"
          title="Superior service, every trip"
          sub="No matter where you are headed, your trip will always be professional, comfortable and safe."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((p, i) => (
            <Reveal key={p.title} delay={i * 80} className="h-full">
              <div className="card-lift h-full rounded-3xl bg-white p-7 text-center ring-1 ring-accent-200/60">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient-soft">
                  <p.icon className="h-7 w-7 text-brand-700" />
                </span>
                <h3 className="mt-4 text-base font-bold text-ink">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ============ ENTERPRISE BAND ============ */}
      <Section>
        <CtaBand
          compact
          title="Require a custom enterprise program?"
          sub="Connect with our corporate accounts desk to establish high-frequency route pipelines, unified recurring billing configurations, or multi-city event support programs across Maryland, Virginia, and Washington DC."
        >
          <Link to="/contact">
            <Button size="lg" className="bg-white !text-brand-900 shadow-xl hover:bg-brand-50">
              Inquire for enterprise
            </Button>
          </Link>
        </CtaBand>
      </Section>
    </div>
  );
}