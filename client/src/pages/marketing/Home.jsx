import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone, MapPin, Flag, Check, ArrowRight, Star, ShieldCheck, Receipt, Timer, UserRound,
  BadgeDollarSign, Plane, Clock, CarFront, Briefcase, Users, Baby, Wifi, Droplets, PlugZap, Languages,
  Landmark, Building2, Route,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { useWebGLSupport } from '../../components/three/useWebGLSupport.js';
import { SERVICES, FEATURED_SERVICES } from '../../data/services.js';
import { BRAND_NAME, PHONE_TEL, PHONE_DISPLAY } from '../../data/site.js';

// Lazy-loaded so the WebGL/three bundle only downloads when the taxi actually renders.
const HeroTaxiScene = lazy(() => import('../../components/three/HeroTaxiScene.jsx'));

const STATS = [
  { value: '24/7', label: 'Concierge dispatch, every day' },
  { value: '15 min', label: 'Curbside staging at BWI' },
  { value: '3', label: 'Major airports served' },
  { value: '5.0', label: 'Passenger rating' },
];

const TRUST = [
  { icon: ShieldCheck, label: 'Absolute punctuality guarantee' },
  { icon: Receipt, label: 'Fixed rate pricing, zero surge' },
  { icon: Plane, label: 'Real-time flight tracking' },
  { icon: Star, label: 'Late-model luxury fleet' },
];

const FEATURES = [
  {
    icon: UserRound,
    title: 'Professional Limousine',
    desc: 'Elite drivers are reliable hospitality partners, rigorously vetted and familiar with optimal MD, VA, and DC routes.',
    points: ['Comprehensive background checks', 'Advanced professional training', 'Local route & traffic expertise', 'Uncompromising customer service'],
  },
  {
    icon: BadgeDollarSign,
    title: 'Fixed Rate Pricing',
    desc: 'Fully transparent pricing with zero surprises. What you are quoted is exactly what you pay — guaranteed.',
    points: ['Absolute zero surge pricing', 'No hidden fees or fuel surcharges', 'All-inclusive corporate rates', 'Streamlined monthly billing'],
  },
  {
    icon: Plane,
    title: 'Flight Tracking',
    desc: 'We monitor your flight matrix in real time and adjust gate pickup windows automatically. No charges for delays.',
    points: ['Real-time flight monitoring', 'Automatic gate adjustment', 'No penalty for late arrivals', 'Complete travel peace of mind'],
  },
  {
    icon: CarFront,
    title: 'Luxury Fleet',
    desc: 'Late-model luxury vehicles maintained to flawless aesthetic standards and detailed before every dispatch.',
    points: ['Immaculate late-model selection', 'Rigorous safety maintenance', 'Sanitized & detailed daily', 'Sedans, SUVs & Sprinters'],
  },
  {
    icon: Clock,
    title: '24/7 Service',
    desc: 'Round-the-clock live availability for early-morning flights, late connections and sudden itinerary revisions.',
    points: ['Live operators 24/7/365', 'Last-minute booking management', 'Dedicated concierge dispatch', 'Emergency fallback support'],
  },
  {
    icon: Timer,
    title: 'On-Time Guarantee',
    desc: 'Your dedicated chauffeur arrives staged and ready ahead of schedule every single time — guaranteed.',
    points: ['Punctual curbside meet-up', 'Complimentary luggage handling', 'Optimized routing for BWI', 'Staged early-morning pickups'],
  },
];

const AIRPORT_SERVICES = [
  {
    icon: Plane,
    name: 'BWI Airport Car Service',
    text: 'Reliable, door-to-door luxury transportation to and from Baltimore/Washington International with real-time gate staging.',
  },
  {
    icon: Plane,
    name: 'Washington Dulles (IAD)',
    text: 'Premium car service to and from Washington Dulles International Airport for seamless international and domestic global travel.',
  },
  {
    icon: Plane,
    name: 'Reagan National (DCA)',
    text: 'Private car service for executive and leisure travel, ensuring meticulous, timely terminal drop-offs at Reagan National.',
  },
  {
    icon: Timer,
    name: 'Hourly Charter Service',
    text: 'Flexible as-directed hourly booking for corporate meetings, roadshows, or events with a dedicated personal chauffeur.',
  },
  {
    icon: Briefcase,
    name: 'Corporate Executive Travel',
    text: 'Sophisticated corporate black-car solutions designed for business professionals, executives, and high-frequency accounts.',
  },
  {
    icon: Users,
    name: 'Luxury Group Fleet',
    text: 'High-capacity Mercedes Sprinter vans and premium SUVs tailored for executive group airport transfers and events.',
  },
];

const AMENITIES = [
  { icon: Baby, label: 'Child Seats' },
  { icon: Wifi, label: 'Free Wi-Fi' },
  { icon: Droplets, label: 'Bottled Water' },
  { icon: PlugZap, label: 'USB Ports' },
  { icon: Languages, label: 'Bilingual Drivers' },
  { icon: Clock, label: '24/7 Support' },
  { icon: Briefcase, label: 'Corporate Pay' },
];

const STEPS = [
  { n: '01', t: 'Book your ride', d: 'Reserve online in seconds and see your flat, fixed rate upfront — zero surge, zero hidden fees. Pre-booking secures a dedicated chauffeur.' },
  { n: '02', t: 'Your chauffeur arrives', d: 'Synchronized fleet staging gets you a curbside meet at BWI within 15 minutes. Your driver monitors flights in real time, so delays never cost you.' },
  { n: '03', t: 'Track & ride', d: 'Follow your chauffeur live on the map, share the trip with loved ones, and rate your ride when it ends.' },
];

const TESTIMONIALS = [
  {
    quote:
      'My flight into BWI was delayed three hours and my chauffeur simply waited — no phone call, no charge. Curbside the moment I cleared baggage. Flawless.',
    name: 'Danielle R.',
    detail: 'Baltimore, MD · BWI airport transfer',
  },
  {
    quote:
      'They staged two luxury SUVs for our wedding weekend. Immaculate vehicles, gracious chauffeurs and perfectly on time from rehearsal dinner to send-off.',
    name: 'Marcus & Priya',
    detail: 'Annapolis, MD · Wedding',
  },
  {
    quote:
      'We rely on Romina for all executive travel — the same great driver every morning, a spotless luxury sedan and consolidated monthly billing.',
    name: 'Jennifer W.',
    detail: 'Gaithersburg, MD · Corporate account',
  },
];

const MARYLAND = [
  'Baltimore', 'Annapolis', 'Columbia', 'Frederick', 'Rockville', 'Gaithersburg', 'Bethesda',
  'Silver Spring', 'Towson', 'Bowie', 'Ellicott City', 'Easton', 'Hagerstown', 'Ocean City',
  'Salisbury', 'Laurel', 'Greenbelt', 'College Park',
];

const DC = ['Downtown DC', 'Capitol Hill', 'Georgetown', 'Dupont Circle', 'Foggy Bottom', 'Adams Morgan', 'Navy Yard', 'NoMa'];

const NOVA = ['Arlington', 'Alexandria', 'McLean', 'Tysons Corner', 'Reston', 'Herndon', 'Fairfax', 'Springfield'];

export default function Home() {
  const { user } = useAuth();
  const bookUrl = user ? '/reservations' : '/login';

  // 3D taxi: hidden on mobile and when WebGL is unavailable; tablets get a compact variant.
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const webgl = useWebGLSupport();
  const showTaxi = !isMobile && webgl;

  const featured = FEATURED_SERVICES.map((slug) => SERVICES.find((s) => s.slug === slug));

  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="bg-brand-gradient relative overflow-hidden text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-gold-500/15 blur-3xl" />
        </div>

        <div className="relative">
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white/85 backdrop-blur">
                <span className="h-2 w-2 animate-pulse rounded-full bg-gold-400" />
                Maryland · Virginia · Washington DC · Baltimore
              </span>

              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Experience the <span className="text-gold-300">pinnacle</span> of private travel
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
                An elite, late-model private fleet of luxury sedans, premium SUVs and executive
                Sprinters with an absolute punctuality guarantee — seamless airport transfers to
                BWI, Dulles (IAD) and Reagan National (DCA).
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to={bookUrl}>
                  <Button size="lg" className="bg-white !text-brand-900 shadow-xl hover:bg-brand-50">
                    Book your ride online
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

              <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                {TRUST.map((t) => (
                  <div key={t.label} className="flex items-center gap-2 text-sm text-white/75">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10">
                      <t.icon className="h-4 w-4" />
                    </span>
                    {t.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick quote card */}
            <div className="relative z-10">
              <div className="rounded-3xl bg-white p-6 text-ink shadow-2xl sm:p-8">
                <h3 className="text-xl font-bold">Plan your trip</h3>
                <p className="mt-1 text-sm text-muted">
                  Fixed flat rates · live availability
                </p>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-3">
                    <MapPin className="h-4 w-4 text-brand-600" />
                    <span className="text-sm text-slate-500">Pickup — where are you?</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-3">
                    <Flag className="h-4 w-4 text-brand-600" />
                    <span className="text-sm text-slate-500">Dropoff — where to?</span>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-brand-gradient-soft px-5 py-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-brand-800">Concierge dispatch</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
                      24/7 online
                    </span>
                  </div>
                </div>

                <Link to={bookUrl} className="mt-6 block">
                  <Button size="lg" className="w-full py-3.5">
                    Get a fare estimate
                  </Button>
                </Link>
                <p className="mt-3 text-center text-xs text-muted">
                  No sign-up needed to preview the price.
                </p>
              </div>
            </div>
          </div>

          {/* 3D taxi — behind the booking card for depth, never blocking interaction */}
          {showTaxi && (
            <div
              className="taxi-fade-in pointer-events-none absolute inset-0 z-[6]"
              aria-hidden="true"
            >
              <Suspense fallback={null}>
                <HeroTaxiScene variant={isDesktop ? 'desktop' : 'tablet'} />
              </Suspense>
            </div>
          )}
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-black/10">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-extrabold text-gold-300 sm:text-3xl">{s.value}</div>
                <div className="mt-1 text-sm text-white/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WELCOME / ABOUT BLURB ============ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              Welcome to {BRAND_NAME}
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              The premier choice for <span className="text-brand-gradient">luxury BWI car service</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted">
              Looking for a seamless, upscale transfer to or from Baltimore/Washington
              International? We are the premier choice for luxury BWI airport car service, proudly
              serving Baltimore, Maryland and the surrounding metropolitan regions — a professional
              chauffeur can be curbside at BWI within 15 minutes of your request.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Avoid the uncertainty and long lines of rideshares or taxi queues. Our meticulously
              maintained black-car solutions transition you from terminal to destination safely,
              privately and strictly on schedule — with a dedicated premium chauffeur trained to
              monitor your flight status in real time.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800">
              <Check className="h-4 w-4" />
              We also provide Ladies Driver
            </div>
            <ul className="mt-6 space-y-3">
              {['Comprehensive background-checked drivers', 'Fixed rate pricing with zero surge', 'Real-time flight tracking, no delay penalties', 'On-time curbside arrival guarantee'].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-medium text-ink">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-100 text-accent-700">
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Get a quote card */}
          <div className="overflow-hidden rounded-3xl bg-brand-gradient text-white shadow-xl">
            <div className="p-8 sm:p-10">
              <h3 className="text-2xl font-bold">Book online or call</h3>
              <a
                href={PHONE_TEL}
                className="mt-2 block text-3xl font-extrabold tracking-tight text-gold-300"
              >
                {PHONE_DISPLAY}
              </a>
              <p className="mt-4 text-[15px] leading-relaxed text-white/80">
                Get a free, no-obligation quote for airport transfers to BWI, Dulles (IAD) or
                Reagan (DCA), events, corporate accounts and group travel. Our concierge dispatch
                team is here 24/7.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to={bookUrl}>
                  <Button size="lg" className="bg-white !text-brand-900 shadow-lg hover:bg-brand-50">
                    Get a free quote
                  </Button>
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
                >
                  About us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURED SERVICES ============ */}
      <section className="bg-brand-gradient-soft py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
                What we offer
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Sophisticated transportation for every occasion
              </h2>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 rounded-full border border-brand-600 px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              View all services <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((s, i) => (
              <Reveal key={s.slug} delay={(i % 3) * 100} className="h-full">
                <Link
                  to={`/services/${s.slug}`}
                  className="card-lift group relative flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
                >
                  <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-3xl bg-brand-gradient opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient-soft">
                    <s.icon className="h-7 w-7 text-brand-700" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-ink">{s.name}</h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
                    {s.tagline}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{s.summary}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                    Learn more
                    <span className="transition-transform group-hover:translate-x-1">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ IMAGE BAND ============ */}
      <section className="relative overflow-hidden">
        <img
          src="/images/ececutive-sedan.png"
          alt="Romina Limousine Service executive sedan"
          className="h-72 w-full object-cover sm:h-96"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950/80 via-brand-900/40 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <div className="max-w-lg">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Immaculate vehicles. Professional chauffeurs. Every single time.
              </h2>
              <p className="mt-3 text-sm text-white/80 sm:text-base">
                Late-model luxury vehicles maintained to flawless aesthetic standards and detailed
                comprehensively before every dispatch — sanitized five-star comfort, guaranteed.
              </p>
              <Link
                to="/fleet"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-900 shadow-lg transition-colors hover:bg-brand-50"
              >
                Explore the fleet <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ WHY ROMINA / FEATURES ============ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            The Romina standard
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Book your luxury airport car service now
          </h2>
          <p className="mt-4 text-muted">
            Six reasons discerning travelers across Maryland, Virginia and Washington DC trust us
            with every journey.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 100} className="h-full">
              <div className="card-lift h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient-soft">
                  <f.icon className="h-7 w-7 text-brand-700" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
                <ul className="mt-4 space-y-2">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-ink">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ AIRPORT SERVICES ============ */}
      <section className="bg-brand-gradient-soft py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              Airport transportation services
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Serving every major regional airport
            </h2>
            <p className="mt-4 text-muted">
              Professional chauffeurs and luxury vehicles across all Maryland, Virginia and
              Washington DC airports — 24/7 premium availability.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {AIRPORT_SERVICES.map((a, i) => (
              <Reveal key={a.name} delay={(i % 3) * 90} className="h-full">
                <div className="card-lift h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient-soft">
                    <a.icon className="h-6 w-6 text-brand-700" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-ink">{a.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{a.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Amenities strip */}
          <Reveal delay={60}>
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
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            Simple &amp; swift booking
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Booking is effortless
          </h2>
          <p className="mt-4 text-muted">
            From request to curbside arrival in three simple steps — on the web or on our mobile app.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 120} className="h-full">
              <div className="card-lift h-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="text-brand-gradient text-4xl font-extrabold">{s.n}</div>
                <h3 className="mt-4 text-lg font-bold text-ink">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="bg-brand-gradient py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-gold-300">
              Testimonials
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Our clients share the love
            </h2>
            <div className="mt-4 flex justify-center gap-0.5 text-gold-400" aria-label="Five star reviews">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={(i % 3) * 110} className="h-full">
                <figure className="card-lift h-full rounded-3xl border border-white/15 bg-white/10 p-7 backdrop-blur">
                  <div className="flex gap-0.5 text-gold-400" aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-4 text-[15px] leading-relaxed text-white/90">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-6 border-t border-white/15 pt-4">
                    <div className="font-semibold text-white">{t.name}</div>
                    <div className="mt-0.5 text-sm text-white/70">{t.detail}</div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SERVICE AREAS ============ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            Luxury coverage
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Areas we serve
          </h2>
          <p className="mt-4 text-muted">
            Our professional limousine network will drive you anywhere in Maryland, Virginia,
            Washington DC — and beyond.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Maryland Cities',
              icon: Landmark,
              blurb: 'Baltimore waterfront to the Eastern Shore',
              cities: MARYLAND,
            },
            {
              title: 'Washington DC',
              icon: Building2,
              blurb: 'The Capitol, Georgetown &amp; beyond',
              cities: DC,
            },
            {
              title: 'Northern Virginia',
              icon: Route,
              blurb: 'Arlington to the Dulles corridor',
              cities: NOVA,
            },
          ].map((region, ri) => (
            <Reveal key={region.title} delay={ri * 90} className="h-full">
              <div className="card-lift h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-gradient-soft">
                    <region.icon className="h-6 w-6 text-brand-700" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-ink">{region.title}</h3>
                    <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-brand-600">
                      {region.blurb}
                    </p>
                  </div>
                  <span className="ml-auto shrink-0 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                    {region.cities.length} cities
                  </span>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-2">
                  {region.cities.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50/60 px-3 py-1.5 text-sm font-medium text-brand-900"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={60}>
          <div className="mt-10 overflow-hidden rounded-3xl bg-brand-gradient px-8 py-10 text-white sm:px-12">
            <div className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
              <div>
                <h3 className="text-xl font-bold">Private aviation terminals (FBO)</h3>
                <p className="mt-1 max-w-xl text-sm text-white/80">
                  Seamless ramp-side tarmac coordination and black-car transfers directly to
                  executive airfields — Signature Flight Support, Atlantic Aviation and private
                  hangars.
                </p>
              </div>
              <a
                href={PHONE_TEL}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-semibold text-brand-900 shadow-lg transition-colors hover:bg-brand-50"
              >
                <Phone className="h-4 w-4" />
                Call 24/7 dispatch
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ CTA ============ */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-brand-gradient-soft px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
            Ready for an unforgettable ride?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-brand-950/70">
            Reserve online in seconds, or call our 24/7 concierge dispatch team and we will take
            care of the rest.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to={bookUrl}>
              <Button size="lg" className="py-3.5">
                Book a ride now
              </Button>
            </Link>
            <a
              href={PHONE_TEL}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-brand-800 shadow-sm transition-colors hover:bg-brand-50"
            >
              <Phone className="h-4 w-4" />
              {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}