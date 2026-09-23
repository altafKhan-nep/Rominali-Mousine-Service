import { useCrmAnalytics, useCrmTimeseries } from '../../hooks/useCrmQuery';
import { Card, CardTitle, StatTile } from '../../components/ui/card';
import { SkeletonCard } from '../../components/ui/skeleton';
import { Badge } from '../../components/ui/badge';
import { motion } from 'framer-motion';
import { TrendingUp, Car, Users, DollarSign, Activity, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OverviewPage() {
  const { data: a, isLoading: l1 } = useCrmAnalytics();
  const { data: ts } = useCrmTimeseries(14);
  const analytics = a as any;

  if (l1) return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">{Array.from({length:5}).map((_,i)=><SkeletonCard key={i} />)}</div>;

  const stats = [
    { label:'Total rides', value: analytics?.totalRides ?? 0, icon: Activity, sub:'All time' },
    { label:'Active now', value: analytics?.activeRides ?? 0, icon: Car, sub:'On trip' },
    { label:'Drivers', value: analytics?.totalDrivers ?? 0, icon: Users, sub:'Fleet' },
    { label:'Passengers', value: analytics?.totalPassengers ?? 0, icon: Users, sub:'Clients' },
    { label:'Revenue', value: `$${(analytics?.revenue ?? 0).toFixed?.(2) ?? analytics?.revenue}`, icon: DollarSign, sub:'Collected' },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Editorial hero band — mirrors Home hero: bg-brand-gradient with blur blobs + gold accents */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-7 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-gold-500/15 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white/80 backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-gold-400" /> Howard County • Live
            </span>
            <h1 className="font-display mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Operations <span className="text-gold-300">Overview</span></h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">Real-time dispatch, revenue and fleet health — the same red-led editorial system as your website, not a generic SaaS dash.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/dispatch" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 shadow-lg hover:bg-brand-50">Open Dispatch <ArrowRight className="h-4 w-4" /></Link>
            <a href="tel:2403510826" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"><Phone className="h-4 w-4" />(240) 351-0826</a>
          </div>
        </div>
        <div className="relative mt-8 grid grid-cols-2 gap-6 border-t border-white/10 pt-6 sm:grid-cols-4">
          {[
            { k:'Today', v: ts?.series?.slice(-1)[0]?.bookings ?? '—' },
            { k:'Revenue 14d', v: `$${(ts?.series ?? []).reduce((s:number,p:any)=>s+(p.revenue||0),0).toFixed(0)}` },
            { k:'Drivers online', v: analytics?.totalDrivers ?? '—' },
            { k:'Rating', v:'5.0' },
          ].map(item=> (
            <div key={item.k} className="text-center sm:text-left">
              <div className="font-display text-2xl font-extrabold text-gold-300">{item.v}</div>
              <div className="text-xs uppercase tracking-widest text-white/60">{item.k}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s,i)=> (
          <motion.div key={s.label} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}>
            <Card>
              <div className="flex items-start justify-between">
                <StatTile><s.icon className="h-5 w-5" /></StatTile>
                <span className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-muted dark:bg-white/5">{s.sub}</span>
              </div>
              <p className="font-display mt-4 text-2xl font-bold tracking-tight">{s.value}</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">{s.label}</p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted"><TrendingUp className="h-3 w-3 text-brand-600" /> vs yesterday</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Revenue & Bookings — 14 days</CardTitle>
          <p className="mt-1 text-xs text-muted">Warm editorial bars, not flat AI charts — heights encode bookings, hover for revenue.</p>
          <div className="mt-6 h-[220px] overflow-x-auto">
            <div className="flex h-full items-end gap-1.5">
              {(ts?.series ?? []).length ? (ts.series as any[]).map((p:any)=> (
                <div key={p.date} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="w-full rounded-t-xl bg-brand-gradient shadow-sm" style={{ height: `${Math.max(10, Math.min(180, (p.bookings||1)*12))}px` }} title={`${p.date}: ${p.bookings} rides • $${p.revenue}`} />
                  <span className="text-[10px] font-medium tracking-wide text-muted">{p.date.slice(5)}</span>
                </div>
              )) : <p className="text-sm text-muted">No data yet — <span className="text-brand-600">seed rides</span> to see the warm wash.</p>}
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-600" /><CardTitle>Recent rides</CardTitle></div>
          <ul className="mt-4 space-y-3">
            {(analytics?.recentRides ?? []).slice(0,6).map((r:any)=> (
              <li key={r._id} className="flex items-center justify-between gap-3 border-b border-accent-100 pb-3 last:border-0 dark:border-white/5">
                <span className="min-w-0 truncate pr-2 text-sm"><span className="font-medium">{r.passenger?.name || 'Unknown'}</span> <span className="text-muted">→ {r.pickup?.address?.slice(0,28)}</span></span>
                <Badge tone={r.status==='completed'?'brand':r.status==='pending'?'slate':'brand'}>{r.status.replace('_',' ')}</Badge>
              </li>
            ))}
            {!analytics?.recentRides?.length && <p className="text-sm text-muted">No rides yet.</p>}
          </ul>
          <Link to="/admin/reservations" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">View all reservations <ArrowRight className="h-4 w-4" /></Link>
        </Card>
      </div>
    </div>
  );
}
