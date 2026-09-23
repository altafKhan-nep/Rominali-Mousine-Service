import { Link } from 'react-router-dom';
import { Phone, Check, Users, Luggage, Wifi, Snowflake } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';
import { BRAND_NAME, PHONE_TEL, PHONE_DISPLAY } from '../../data/site.js';

const FLEET = [
  {
    img: '/images/ececutive-sedan.png',
    name: 'Executive Sedan',
    model: 'First class — the global benchmark for executive road travel',
    passengers: '3 Passengers',
    luggage: '3 Luggages',
    perks: ['Free Wi-Fi', 'Climate Zone'],
    tagline: 'Mercedes-Benz S-Class standard of comfort',
    features: ['Mercedes-Benz S-Class configuration', 'Climate-controlled zones', 'Complimentary bottled water', 'Professional chauffeur in uniform'],
  },
  {
    img: '/images/premium-suv.png',
    name: 'Cadillac Escalade Platinum Luxury ESV',
    model: 'Platinum luxury ESV — unmatched road presence and space',
    passengers: '6 Passengers',
    luggage: '6 Luggages',
    perks: ['Onboard Wi-Fi', 'Refreshments'],
    tagline: 'The pinnacle of chauffeur-driven comfort',
    features: ['Platinum luxury ESV, 1–6 passengers', 'Spacious for corporate luggage', 'Climate controlled with water', 'Elite safety standards', 'Perfect for executive & diplomatic missions'],
  },
  {
    img: '/images/Van.png',
    name: 'Mercedes Executive Sprinter',
    model: 'Tailored for corporate offsites, roadshows, and group events',
    passengers: '14 Passengers',
    luggage: '14 Luggages',
    perks: ['USB Outlets', 'Media System'],
    tagline: 'High-occupancy executive group travel',
    features: ['Seats up to 14 with luggage capacity', 'USB outlets throughout', 'Onboard media system', 'Extended rear cargo configuration', 'Professional chauffeur in uniform'],
  },
];

const AMENITIES = [
  { icon: Wifi, label: 'Onboard Wi-Fi' },
  { icon: Snowflake, label: 'Climate Control' },
  { icon: Luggage, label: 'Generous Cargo' },
  { icon: Users, label: 'Child Safety Seats' },
];

export default function Fleet() {
  const { user } = useAuth();
  const bookUrl = user ? '/reservations' : '/login';

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
            Select elite fleet
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            A curated collection of <span className="text-gold-300">elite vehicles</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
            Immaculate, late-model corporate sedans, private SUVs and high-occupancy executive
            Sprinters — configured to exceed standard luxury expectations for every journey.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to={bookUrl}>
              <Button size="lg" className="bg-white !text-brand-900 shadow-xl hover:bg-brand-50">
                Book a vehicle now
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

      {/* ============ FLEET GRID ============ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {FLEET.map((v, i) => (
            <Reveal key={v.name} delay={(i % 3) * 90}>
              <div className="card-lift group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="img-zoom relative bg-gradient-to-b from-brand-50 to-white">
                  <img
                    src={v.img}
                    alt={`${v.name} — ${BRAND_NAME}`}
                    className="h-52 w-full object-contain p-4"
                    loading="lazy"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-brand-gradient px-3 py-1 text-xs font-semibold text-white">
                    {v.model}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-ink">{v.name}</h3>
                  </div>
                  <p className="mt-1 text-sm font-medium text-brand-600">{v.tagline}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <span className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800">
                      <Users className="h-4 w-4" /> {v.passengers}
                    </span>
                    <span className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800">
                      <Luggage className="h-4 w-4" /> {v.luggage}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {v.perks.map((p) => (
                      <span key={p} className="rounded-full border border-gold-300 bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700">
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
                  <div className="flex gap-3">
                    <Link to={bookUrl} className="flex-1">
                      <Button className="w-full">Book this vehicle</Button>
                    </Link>
                    <a
                      href={PHONE_TEL}
                      className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
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

        {/* Custom fleet note */}
        <Reveal delay={120}>
          <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-3xl bg-brand-gradient px-8 py-10 text-white sm:flex-row">
            <div>
              <h3 className="text-xl font-bold">Custom fleet requirements?</h3>
              <p className="mt-1 text-sm text-white/80">
                Need tailored point-to-point staging, multi-vehicle event coordination, or special
                VIP protocols? Our operational dispatch coordinators are ready to support your
                request.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/contact">
                <Button size="lg" className="bg-white !text-brand-900 shadow-lg hover:bg-brand-50">
                  Connect with dispatch
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
        </Reveal>
      </section>
    </div>
  );
}