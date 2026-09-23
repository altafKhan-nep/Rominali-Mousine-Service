// Brand-tinted icon tile. `size="sm"` for compact rows, default for cards.
export default function IconTile({ size = 'md', className = '', children }) {
  const tile = size === 'sm' ? 'h-12 w-12 rounded-xl' : 'h-14 w-14 rounded-2xl';
  return (
    <span className={`grid shrink-0 place-items-center bg-brand-gradient-soft ${tile} ${className}`}>
      {children}
    </span>
  );
}