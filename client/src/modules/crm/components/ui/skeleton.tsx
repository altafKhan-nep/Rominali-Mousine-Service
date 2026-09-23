export function Skeleton({ className='' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-accent-200 dark:bg-accent-800 ${className}`} />;
}
export function SkeletonCard() {
  return <div className="rounded-2xl border border-accent-200 bg-surface p-5 shadow-sm dark:border-accent-800 dark:bg-accent-900"><Skeleton className="h-4 w-24" /><Skeleton className="mt-3 h-7 w-20" /></div>;
}
