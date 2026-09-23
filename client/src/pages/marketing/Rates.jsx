import { Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';
import PageHero, { HeroActions, heroSecondary } from '../../components/marketing/PageHero.jsx';
import Section from '../../components/marketing/Section.jsx';
import CtaBand from '../../components/marketing/CtaBand.jsx';
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
      <PageHero
        eyebrow="Transparent luxury pricing"
        title="BWI airport rates"
        accent="& destinations"
        subtitle="Professional airport transportation with premium comfort, reliable chauffeurs and fixed pricing. What you are quoted is exactly what you pay — zero surge, no hidden fees."
      >
        <HeroActions bookTo={bookUrl} bookLabel="Book your ride" />
      </PageHero>

      {/* ============ RATES TABLE ============ */}
      <Section>
        <div className="card-lift overflow-hidden rounded-3xl bg-white ring-1 ring-accent-200/60">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="bg-brand-gradient text-white">
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
                    className={`border-t border-accent-100 transition-colors hover:bg-brand-50/40 ${i % 2 ? 'bg-accent-50/50' : 'bg-white'}`}
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
        </div>

        <Reveal delay={80} className="mt-10">
          <CtaBand
            title="Need a custom route?"
            sub="Our dispatch team is available 24/7/365 to handle custom routing or provide immediate pricing over the phone."
          >
            <a href={PHONE_TEL} className={heroSecondary}>
              <Phone className="h-4 w-4" />
              Call 24/7 dispatch {PHONE_DISPLAY}
            </a>
          </CtaBand>
        </Reveal>
      </Section>
    </div>
  );
}