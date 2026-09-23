export function Badge({ children, tone='slate' }: { children: React.ReactNode; tone?: 'brand'|'green'|'red'|'slate'|'gold'|'blue' }) {
  const map: any = {
    brand:'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200',
    green:'bg-brand-50 text-brand-700', red:'bg-brand-50 text-brand-700',
    slate:'bg-accent-100 text-muted dark:bg-accent-800 dark:text-accent-300',
    gold:'bg-gold-100 text-gold-700', blue:'bg-accent-100 text-accent-700',
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${map[tone]}`}>{children}</span>;
}
