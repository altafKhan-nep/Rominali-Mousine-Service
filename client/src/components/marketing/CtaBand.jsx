// Rounded red CTA band used at the end of marketing sections and pages.
export default function CtaBand({ title, sub, children, className = '', compact = false }) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-brand-gradient text-white ${
        compact ? 'px-8 py-10 sm:px-12' : 'px-6 py-14 sm:px-12'
      } ${className}`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-gold-500/15 blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">{title}</h2>
          {sub && <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/80">{sub}</p>}
        </div>
        {children && <div className="flex shrink-0 flex-wrap items-center justify-center gap-3">{children}</div>}
      </div>
    </div>
  );
}