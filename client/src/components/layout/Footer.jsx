import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { SERVICES } from '../../data/services.js';
import { useSiteContent } from '../../hooks/useSiteContent.js';
import {
  BRAND_NAME, EMAIL, PHONE_TEL, PHONE_DISPLAY, PHONE_ALT_TEL, PHONE_ALT_DISPLAY,
  FACEBOOK, INSTAGRAM, WHATSAPP,
} from '../../data/site.js';

const FacebookGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.55-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
  </svg>
);

const InstagramGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
  </svg>
);

const SOCIALS = [
  { label: 'Facebook', href: FACEBOOK, Icon: FacebookGlyph },
  { label: 'Instagram', href: INSTAGRAM, Icon: InstagramGlyph },
  { label: 'WhatsApp', href: WHATSAPP, Icon: () => <MessageCircle className="h-4 w-4" /> },
];

const COLUMN_HEAD = 'text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-gold-300';

export default function Footer() {
  const services = useSiteContent('services', SERVICES);
  return (
    <footer className="mt-auto bg-brand-gradient text-white">
      <div className="h-0.5 bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt={BRAND_NAME} className="h-20 w-auto drop-shadow" />
            <div className="text-2xl font-bold text-white">
              Romina <span className="text-gold-300">Limousine Service</span>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            Setting the gold standard in premium private travel — bespoke airport transfers, elite
            corporate travel and sophisticated chauffeur services across MD, VA, and Washington DC.
            Available 24/7, the Ladies Driver network included.
          </p>
          <div className="mt-4 flex gap-2.5">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/80 transition-all hover:-translate-y-0.5 hover:bg-gold-500 hover:text-brand-950"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className={COLUMN_HEAD}>Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            <li><Link to="/" className="transition-colors hover:text-white">Home</Link></li>
            <li><Link to="/about" className="transition-colors hover:text-white">About</Link></li>
            <li><Link to="/services" className="transition-colors hover:text-white">Services</Link></li>
            <li><Link to="/fleet" className="transition-colors hover:text-white">Fleet</Link></li>
            <li><Link to="/rates" className="transition-colors hover:text-white">Rates</Link></li>
            <li><Link to="/contact" className="transition-colors hover:text-white">Contact</Link></li>
            <li><Link to="/careers" className="transition-colors hover:text-white">Careers</Link></li>
            <li><Link to="/reservations" className="transition-colors hover:text-white">Client Portal</Link></li>
          </ul>
        </div>

        <div>
          <h4 className={COLUMN_HEAD}>Services</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            {services.slice(0, 7).map((s) => (
              <li key={s.slug}>
                <Link to={`/services/${s.slug}`} className="transition-colors hover:text-white">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className={COLUMN_HEAD}>Contact Concierge</h4>
          <ul className="mt-3 space-y-2.5 text-sm text-white/75">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Maryland · Serving MD, VA &amp; Washington DC</span>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0" />
              <a href={PHONE_TEL} className="transition-colors hover:text-white">{PHONE_DISPLAY}</a>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0" />
              <a href={PHONE_ALT_TEL} className="transition-colors hover:text-white">{PHONE_ALT_DISPLAY}</a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              <a href={`mailto:${EMAIL}`} className="break-all transition-colors hover:text-white">{EMAIL}</a>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>24/7 dispatch &amp; support</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gold-400/25 bg-black/20 py-5 text-center text-xs text-white/60">
        © {new Date().getFullYear()} {BRAND_NAME}. Secure &amp; private transport. All rights reserved. · Maryland
      </div>
    </footer>
  );
}