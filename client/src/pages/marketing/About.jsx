import { Link } from 'react-router-dom';
import { UserRound, Timer, Receipt, ShieldCheck, CarFront, Plane, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';
import { BRAND_NAME, PHONE_TEL, PHONE_DISPLAY } from '../../data/site.js';

const WHY_US = [
  {
    icon: UserRound,
    title: 'Professional Limousine',
    desc: 'Elite, rigorously vetted chauffeurs who are reliable hospitality partners familiar with optimal MD, VA, and DC routes.',
  },
  {
    icon: Receipt,
    title: 'Fixed Rate Pricing',
    desc: 'What you are quoted is exactly what you pay. Absolute zero surge pricing, no hidden fees and no fuel surcharges — guaranteed.',
  },
  {
    icon: Plane,
    title: 'Flight Tracking',
    desc: 'We monitor your flight in real time and adjust gate pickups automatically. No penalty charges for delayed arrivals, ever.',
  },
  {
    icon: CarFront,
    title: 'Luxury Fleet',
    desc: 'Late-model sedans, premium SUVs and executive Sprinters maintained to flawless aesthetic standards and detailed before every dispatch.',
  },
  {
    icon: Timer,
    title: '24/7 & On-Time',
    desc: 'Live concierge dispatch around the clock and an absolute on-time guarantee — your chauffeur is staged and ready ahead of schedule.',
  },
  {
    icon: ShieldCheck,
    title: 'Commercially insured',
    desc: 'Your safety is our top priority. Every ride is backed by comprehensive coverage, background-checked drivers and rigorous maintenance.',
  },
];

export default function About() {
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
            About us
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Setting the <span className="text-gold-300">gold standard</span> in private travel
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
            Romina Limousine Service offers bespoke airport transfers, elite corporate travel and
            sophisticated chauffeur services across Maryland, Virginia, and Washington DC — with
            an elite, late-model private fleet and an absolute punctuality guarantee.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to={bookUrl}>
              <Button size="lg" className="bg-white !text-brand-900 shadow-xl hover:bg-brand-50">
                Book your ride
              </Button>
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>

      {/* ============ STORY ============ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              Our story
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              A chauffeur network that puts people first
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted">
              Established in 2026 in Maryland, Romina Limousine Service was founded on a simple
              belief: private travel should be seamless, punctual and genuinely luxurious. We
              built an elite fleet — luxury sedans, premium SUVs and executive Sprinter vans — and
              paired it with chauffeurs who treat every trip as the most important one.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted">
              With highly synchronized fleet staging, a professional chauffeur can be curbside at
              BWI within 15 minutes of your request. We track your flight in real time, adjust gate
              pickups automatically and never charge for delays — because your peace of mind is the
              standard we measure ourselves against.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted">
              From discreet executive sedans to expansive SUVs for corporate luggage and customized
              group transit, we deliver uncompromised reliability to destinations including Easton,
              Frederick, Arlington and York.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl bg-brand-gradient text-white shadow-xl">
            <div className="p-8 sm:p-10">
              <div className="flex items-center gap-4">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10">
                  <CarFront className="h-8 w-8 text-white" />
                </span>
                <div>
                  <div className="text-xl font-bold">{BRAND_NAME}</div>
                  <div className="text-sm text-white/70">Maryland · Est. 2026</div>
                </div>
              </div>
              <p className="mt-6 text-[15px] leading-relaxed text-white/85">
                “We do not just move you from A to B — we take care of you the whole way like a
                private concierge. Punctual, transparent and genuinely luxurious. That is the
                Romina way.”
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={PHONE_TEL}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-brand-900 shadow-sm transition-colors hover:bg-brand-50"
                >
                  <Phone className="h-4 w-4" />
                  {PHONE_DISPLAY}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ WHY CHOOSE US ============ */}
      <section className="bg-brand-gradient-soft py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              Why choose us
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              The gold standard in premium travel
            </h2>
            <p className="mt-4 text-muted">
              You have many options when it comes to transportation. With Romina Limousine Service,
              you get an unparalleled journey that combines luxury, punctuality, personalized
              service and safety.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_US.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 80} className="h-full">
                <div className="card-lift h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient-soft">
                    <f.icon className="h-7 w-7 text-brand-700" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-ink">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="rounded-3xl bg-brand-gradient px-6 py-14 text-center text-white sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Choose {BRAND_NAME} for your next journey
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/80">
            Reserve online in seconds or call our 24/7 concierge dispatch — we take care of the
            rest with style and peace of mind.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to={bookUrl}>
              <Button size="lg" className="bg-white !text-brand-900 shadow-xl hover:bg-brand-50">
                Book now
              </Button>
            </Link>
            <Link
              to="/careers"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              Drive with us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}