import * as React from 'react';
export function Card({ className='', children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card-lift group relative overflow-hidden rounded-3xl border border-accent-200 bg-surface p-7 shadow-sm dark:border-accent-800 dark:bg-accent-900 dark:text-white ${className}`} {...p}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-brand-gradient opacity-0 transition-opacity group-hover:opacity-100" />
      {children}
    </div>
  );
}
export function CardHeader({ className='', ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`mb-4 flex items-center justify-between ${className}`} {...p} />;
}
export function CardTitle({ className='', ...p }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`font-display text-[15px] font-bold tracking-tight text-ink dark:text-white ${className}`} {...p} />;
}
export function StatTile({ children }: { children: React.ReactNode }) {
  return <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-gradient-soft text-brand-700">{children}</span>;
}
