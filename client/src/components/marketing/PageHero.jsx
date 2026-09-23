import { Link } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { PHONE_TEL, PHONE_DISPLAY } from '../../data/site.js';

// Shared marketing sub-page hero. Red gradient band, gold live-dot eyebrow,
// Fraunces display title (pass `accent` to gold-highlight a word), subtitle
// and an optional actions row. Replaces the copy-pasted hero on every sub-page.
export default function PageHero({ eyebrow, title, subtitle, accent, children }) {
  return (
    <section className="bg-brand-gradient relative overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-gold-500/15 blur-3xl" />
        <div className="absolute left-1/3 top-1/3 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl" />
      </div>
      <div className="shell relative z-10 py-20 lg:py-28">
        <span className="eyebrow eyebrow-on-dark border border-white/15 bg-white/10 px-4 py-1.5 backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-gold-400" />
          {eyebrow}
        </span>
        <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight drop-shadow-sm sm:text-5xl lg:text-[3.5rem]">
          {title}
          {accent && <span className="text-gold-300"> {accent}</span>}
        </h1>
        {subtitle && (
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            {subtitle}
          </p>
        )}
        {children && <div className="mt-8 flex flex-wrap items-center gap-4">{children}</div>}
      </div>
    </section>
  );
}

// Ghost pill used for every secondary hero action (call / contact / drive-with-us).
export const heroSecondary =
  'inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-6 py-3 text-base font-semibold text-white backdrop-blur transition-colors hover:bg-white/15';

// The two hero action idioms used everywhere: a white-on-red primary and a
// ghost phone pill (plus optional secondary links passed as children). Kept
// here so every page renders them identically.
export function HeroActions({ bookTo, bookLabel, children }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {bookTo && (
        <Link to={bookTo}>
          <Button size="lg" className="bg-white !text-brand-900 shadow-xl hover:bg-brand-50">
            {bookLabel || 'Book a ride'}
          </Button>
        </Link>
      )}
      {children}
      <a href={PHONE_TEL} className={heroSecondary}>
        <Phone className="h-4 w-4" />
        {PHONE_DISPLAY}
      </a>
    </div>
  );
}