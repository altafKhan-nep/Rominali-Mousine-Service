export function Spinner({ size = 'md', label }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <span
        className={`${sizes[size]} inline-block animate-spin rounded-full border-2 border-slate-300 border-t-brand-600`}
      />
      {label}
    </div>
  );
}