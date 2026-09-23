// Section band with consistent gutters + rhythm. `band="soft"` renders the
// warm off-white wash band, otherwise a plain light section.
export default function Section({ band = false, className = '', children }) {
  if (band) {
    return (
      <section className={`bg-brand-gradient-soft py-20 lg:py-24 ${className}`}>
        <div className="shell">{children}</div>
      </section>
    );
  }
  return (
    <section className={`section ${className}`}>
      <div className="shell">{children}</div>
    </section>
  );
}

// Centered section header triad: gold-dot eyebrow + Fraunces H2 + muted body.
// Pass `dark` for use on red bands (gold eyebrow + white headings).
export function SectionHead({ eyebrow, title, sub, dark = false, className = '' }) {
  return (
    <div className={`mx-auto max-w-2xl text-center ${className}`}>
      <span className={dark ? 'eyebrow eyebrow-on-dark' : 'eyebrow'}>{eyebrow}</span>
      <h2
        className={`mt-4 text-3xl font-bold tracking-tight sm:text-4xl ${
          dark ? 'text-white' : 'text-ink'
        }`}
      >
        {title}
      </h2>
      {sub && (
        <p className={`mt-4 text-[15px] leading-relaxed ${dark ? 'text-white/75' : 'text-muted'}`}>
          {sub}
        </p>
      )}
    </div>
  );
}