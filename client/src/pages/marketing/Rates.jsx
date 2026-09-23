import { Link } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';
import { PHONE_TEL, PHONE_DISPLAY } from '../../data/site.js';

const RATES = [
  { route: 'Washington DC', area: 'Downtown, Capitol Hill, Georgetown', sedan: '$125', suv: '$170', time: '45–60 mins' },
  { route: 'Baltimore', area: 'Downtown, Inner Harbor, Fells Point', sedan: '$75', suv: '$95', time: '20–30 mins' },
  { route: 'Annapolis', area: 'State Capital, Naval Academy', sedan: '$99', suv: '$115', time: '30–40 mins' },
  { route: 'Columbia', area: 'Howard County, Corporate Centers', sedan: '$55', suv: '$95', time: '25–35 mins' },
  { route: 'Rockville', area: 'Montgomery County, Corporate Parks', sedan: '$121', suv: '$170', time: '50–65 mins' },
  { route: 'Silver Spring', area: 'Downtown, Corporate Offices', sedan: '$90', suv: '$115', time: '40–50 mins' },
  { route: 'Frederick', area: 'Historic Downtown, Business Hubs', sedan: '$110', suv: '$145', time: '50–65 mins' },
  { route: 'Bethesda', area: 'NIH, Medical Centers, Offices', sedan: '$105', suv: '$140', time: '45–55 mins' },
  { route: 'York, PA', area: 'York Galleria, Suburban Areas', sedan: '$230', suv: '$308', time: '70–90 mins' },
  { route: 'Reagan Airport (DCA)', area: 'Washington DC Airport Transfers', sedan: '$135', suv: '$180', time: '45–60 mins' },
  { route: 'Dulles Airport (IAD)', area: 'International Airport Transfers', sedan: '$160', suv: '$210', time: '60–75 mins' },
  { route: 'Philadelphia', area: 'Center City, Business District', sedan: '$320', suv: '$420', time: '2–2.5 hrs' },
  { route: 'New York City', area: 'Manhattan, Brooklyn, Queens', sedan: '$650', suv: '$850', time: '4–5 hrs' },
  { route: 'Virginia Beach', area: 'Coastal Travel & Resorts', sedan: '$380', suv: '$520', time: '3.5–4.5 hrs' },
];

export default function Rates() {
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
            Transparent luxury pricing
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            BWI airport rates <span className="text-gold-300">&amp; destinations</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
            Professional airport transportation with premium comfort, reliable chauffeurs and
            fixed pricing. What you are quoted is exactly what you pay — zero surge, no hidden
            fees.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to={bookUrl}>
              <Button size="lg" className="bg-white !text-brand-900 shadow-xl hover:bg-brand-50">
                Book your ride
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

      {/* ============ RATES TABLE ============ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-brand-gradient text-white">
                <th className="px-6 py-5 text-sm font-semibold">Route &amp; Destination</th>
                <th className="px-6 py-5 text-sm font-semibold">Luxury Sedan 1–4 Passengers</th>
                <th className="px-6 py-5 text-sm font-semibold">Premium SUV 1–6 Passengers</th>
                <th className="px-6 py-5 text-sm font-semibold">Est. Travel Time</th>
              </tr>
            </thead>
            <tbody>
              {RATES.map((r, i) => (
                <tr
                  key={r.route}
                  className={`border-b border-slate-100 transition-colors hover:bg-brand-50/40 ${i % 2 ? 'bg-slate-50/50' : 'bg-white'}`}
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-ink">{r.route}</div>
                    <div className="text-xs text-muted">{r.area}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-brand-700">{r.sedan}</td>
                  <td className="px-6 py-4 font-semibold text-brand-700">{r.suv}</td>
                  <td className="px-6 py-4 text-sm text-muted">{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Reveal delay={80}>
          <div className="mt-10 rounded-3xl bg-brand-gradient px-8 py-10 text-white sm:px-12">
            <div className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
              <div>
                <h3 className="text-xl font-bold">Need a custom route?</h3>
                <p className="mt-1 text-sm text-white/80">
                  Our dispatch team is available 24/7/365 to handle custom routing or provide
                  immediate pricing over the phone.
                </p>
              </div>
              <a
                href={PHONE_TEL}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-semibold text-brand-900 shadow-lg transition-colors hover:bg-brand-50"
              >
                <Phone className="h-4 w-4" />
                Call 24/7 dispatch {PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}