import { Link } from 'react-router-dom';
import { Phone, Check, Users, Luggage, Wifi, Snowflake } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';
import PageHero, { HeroActions, heroSecondary } from '../../components/marketing/PageHero.jsx';
import Section from '../../components/marketing/Section.jsx';
import CtaBand from '../../components/marketing/CtaBand.jsx';
import { BRAND_NAME, PHONE_TEL, PHONE_DISPLAY } from '../../data/site.js';
import { FLEET } from '../../data/fleet.js';
import { useSiteContent } from '../../hooks/useSiteContent.js';

const AMENITIES = [
  { icon: Wifi, label: 'Onboard Wi-Fi' },
  { icon: Snowflake, label: 'Climate Control' },
  { icon: Luggage, label: 'Generous Cargo' },
  { icon: Users, label: 'Child Safety Seats' },
];

export default function Fleet() {
  const { user } = useAuth();
  const bookUrl = user ? '/reservations' : '/login';
  const vehicles = useSiteContent('fleet', FLEET);

  return (
    <div>
      <PageHero
        eyebrow="Select elite fleet"
        title="A curated collection of"
        accent="elite vehicles"
        subtitle="Immaculate, late-model corporate sedans, private SUVs and high-occupancy executive Sprinters — configured to exceed standard luxury expectations for every journey."
      >
        <HeroActions bookTo={bookUrl} bookLabel="Book a vehicle now" />
      </PageHero>

      {/* ============ FLEET GRID ============ */}
      <Section>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v, i) => (
            <Reveal key={v.name} delay={(i % 3) * 90}>
              <div className="card-lift group flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-accent-200/60">
                <div className="img-zoom relative">
                  <img
                    src={v.img}
                    alt={`${v.name} — ${BRAND_NAME}`}
                    className="h-60 w-full object-cover"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-black/45 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-gold-300 ring-1 ring-white/25 backdrop-blur">
                    {v.tag}
                  </span>
                  <div className="absolute inset-x-5 bottom-4">
                    <h3 className="text-xl font-bold text-white drop-shadow">{v.name}</h3>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <p className="text-sm leading-relaxed text-muted">{v.tagline}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 ring-1 ring-brand-100">
                      <Users className="h-3.5 w-3.5 text-brand-600" /> {v.passengers}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 ring-1 ring-brand-100">
                      <Luggage className="h-3.5 w-3.5 text-brand-600" /> {v.luggage}
                    </span>
                    {v.perks.map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center gap-1.5 rounded-full border border-gold-300/70 bg-gold-50 px-3 py-1.5 text-xs font-semibold text-gold-700"
                      >
                        {p}
                      </span>
                    ))}
                  </div>

                  <ul className="mt-5 space-y-2">
                    {v.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-muted">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex-1" />
                  <div className="flex gap-3 border-t border-accent-100 pt-5">
                    <Link to={bookUrl} className="flex-1">
                      <Button className="w-full">Book this vehicle</Button>
                    </Link>
                    <a
                      href={PHONE_TEL}
                      className="grid h-11 w-11 place-items-center rounded-full border border-accent-200 text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
                      aria-label={`Call about ${v.name}`}
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Amenities strip */}
        <Reveal delay={80}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {AMENITIES.map((a) => (
              <span
                key={a.label}
                className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-sm"
              >
                <a.icon className="h-4 w-4 text-brand-600" />
                {a.label}
              </span>
            ))}
          </div>
        </Reveal>

        {/* Custom fleet band */}
        <Reveal delay={120}>
          <div className="mt-12">
            <CtaBand
              title="Custom fleet requirements?"
              sub="Need tailored point-to-point staging, multi-vehicle event coordination, or special VIP protocols? Our operational dispatch coordinators are ready to support your request."
            >
              <Link to="/contact">
                <Button size="lg" className="bg-white !text-brand-900 shadow-lg hover:bg-brand-50">
                  Connect with dispatch
                </Button>
              </Link>
              <a href={PHONE_TEL} className={heroSecondary}>
                <Phone className="h-4 w-4" />
                {PHONE_DISPLAY}
              </a>
            </CtaBand>
          </div>
        </Reveal>
      </Section>
    </div>
  );
}