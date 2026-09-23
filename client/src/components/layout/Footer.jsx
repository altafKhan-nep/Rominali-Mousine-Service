import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { SERVICES } from '../../data/services.js';
import {
  BRAND_NAME, EMAIL, PHONE_TEL, PHONE_DISPLAY, PHONE_ALT_TEL, PHONE_ALT_DISPLAY,
  FACEBOOK, INSTAGRAM, WHATSAPP,
} from '../../data/site.js';

const SOCIALS = [
  { label: 'Facebook', href: FACEBOOK },
  { label: 'Instagram', href: INSTAGRAM },
  { label: 'WhatsApp', href: WHATSAPP },
];

export default function Footer() {
  return (
    <footer className="mt-auto bg-brand-gradient text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="text-lg font-bold text-white">
            Romina <span className="text-gold-300">Limousine Service</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            Setting the gold standard in premium private travel — bespoke airport transfers, elite
            corporate travel and sophisticated chauffeur services across MD, VA, and Washington DC.
            Available 24/7, the Ladies Driver network included.
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href={PHONE_TEL}
              aria-label="Call us"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <Phone className="h-4 w-4" />
            </a>
            <a
              href={`mailto:${EMAIL}`}
              aria-label="Email us"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <Mail className="h-4 w-4" />
            </a>
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs font-bold transition-colors hover:bg-white/20"
              >
                {s.label[0]}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white">Company</h4>
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
          <h4 className="text-sm font-semibold text-white">Services</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            {SERVICES.slice(0, 7).map((s) => (
              <li key={s.slug}>
                <Link to={`/services/${s.slug}`} className="transition-colors hover:text-white">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white">Contact Concierge</h4>
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
      <div className="border-t border-white/15 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} {BRAND_NAME}. Secure &amp; private transport. All rights reserved. · Maryland
      </div>
    </footer>
  );
}