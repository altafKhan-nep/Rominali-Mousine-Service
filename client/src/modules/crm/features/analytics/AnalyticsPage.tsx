import { useCrmTimeseries } from '../../hooks/useCrmQuery';
import { Card, CardTitle } from '../../components/ui/card';
export default function AnalyticsPage(){
  const { data }=useCrmTimeseries(30) as any; const s=data?.series??[];
  return (<div className="space-y-4"><h1 className="text-2xl font-bold">Analytics</h1><div className="grid gap-4 lg:grid-cols-2"><Card><CardTitle>Revenue trend (30d)</CardTitle><div className="mt-4 flex h-48 items-end gap-1">{s.map((p:any)=><div key={p.date} className="flex-1 rounded-t bg-gold-400" style={{height: `${Math.max(6, Math.min(180, (p.revenue||0)/5))}px`}} title={`${p.date} $${p.revenue}`} />)}</div></Card><Card><CardTitle>Demand (bookings)</CardTitle><div className="mt-4 flex h-48 items-end gap-1">{s.map((p:any)=><div key={p.date} className="flex-1 rounded-t bg-brand-600" style={{height: `${Math.max(6, p.bookings*12)}px`}} title={`${p.date} ${p.bookings}`} />)}</div></Card></div><p className="text-xs text-muted">Heatmaps, airport stats, driver utilization, forecasting → add /crm/analytics/heatmap + aggregations.</p></div>);
}
