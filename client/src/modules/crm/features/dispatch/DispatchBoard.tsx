import { useCrmRides, useDispatchMutate } from '../../hooks/useCrmQuery';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useState } from 'react';

const COLS: { id:string; label:string; statuses:string[] }[] = [
  { id:'pending', label:'Pending', statuses:['pending','scheduled'] },
  { id:'assigned', label:'Assigned', statuses:['accepted','arriving'] },
  { id:'active', label:'In Progress', statuses:['in_progress'] },
  { id:'done', label:'Completed', statuses:['completed','cancelled','no_show','refunded'] },
];

export default function DispatchBoard() {
  const { data } = useCrmRides({}) as any;
  const rides: any[] = data?.rides ?? [];
  const { mutate, isPending } = useDispatchMutate();
  const [dragId, setDragId] = useState<string|null>(null);

  const onDrop = (e: React.DragEvent, colStatuses: string[]) => {
    e.preventDefault();
    const id = dragId; setDragId(null);
    if (!id) return;
    // simple: if dropping to assigned, prompt assign — for demo, unassign on done
    if (colStatuses.includes('pending')) mutate({ id, driverId: null });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Dispatch Center</h1><span className="text-sm text-muted">Drag rides to re-assign • Real-time via Socket.io</span></div>
      <div className="grid gap-4 lg:grid-cols-4">
        {COLS.map(col => (
          <Card key={col.id} onDragOver={e=>e.preventDefault()} onDrop={e=>onDrop(e,col.statuses)} className="min-h-[420px] p-0">
            <div className="sticky top-0 rounded-t-2xl border-b bg-accent-50 px-4 py-3 dark:border-accent-800 dark:bg-accent-800/50"><h3 className="text-sm font-semibold">{col.label} <span className="ml-2 text-xs font-normal text-muted">{rides.filter(r=>col.statuses.includes(r.status)).length}</span></h3></div>
            <div className="space-y-3 p-3">
              {rides.filter(r=>col.statuses.includes(r.status)).slice(0,20).map(r=> (
                <div key={r._id} draggable onDragStart={()=>setDragId(r._id)} className="cursor-grab rounded-xl border bg-surface p-3 shadow-sm active:cursor-grabbing dark:border-accent-700 dark:bg-accent-900">
                  <div className="flex items-center justify-between"><Badge tone={r.status==='pending'?'slate':r.status==='completed'?'green':'brand'}>{r.status}</Badge><span className="text-xs text-muted">${(r.fare?.estimated ?? 0).toFixed(2)}</span></div>
                  <p className="mt-2 text-sm font-medium">{r.passenger?.name || '—'}</p>
                  <p className="truncate text-xs text-muted">{r.pickup?.address} → {r.dropoff?.address}</p>
                  <p className="text-xs text-muted">{r.driver ? `Driver: ${r.driver.name}` : 'Unassigned'}</p>
                  {isPending && <span className="text-xs text-brand-600">Assigning…</span>}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
