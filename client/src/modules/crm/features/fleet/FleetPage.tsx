import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../../services/api.js';
import { Card, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useState } from 'react';

export default function FleetPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey:['crm','fleet'], queryFn: async()=>(await api.get('/crm/fleet/vehicles')).data });
  const vehicles:any[] = data?.vehicles ?? [];
  const [form, setForm] = useState({ plateNumber:'', make:'', model:'', type:'economy-sedan', status:'active' });
  const mut = useMutation({
    mutationFn: async()=> (await api.post('/crm/fleet/vehicles', form)).data,
    onSuccess: ()=> { qc.invalidateQueries({queryKey:['crm','fleet']}); setForm({ plateNumber:'', make:'', model:'', type:'economy-sedan', status:'active' }); },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Fleet Management</h1>
      <Card>
        <CardTitle>Add vehicle (Cloudinary images via URL for now)</CardTitle>
        <div className="mt-3 grid gap-2 sm:grid-cols-5">
          <input placeholder="Plate *" value={form.plateNumber} onChange={e=>setForm({...form,plateNumber:e.target.value})} className="input-pill border px-3 py-2 text-sm dark:border-accent-700 dark:bg-accent-800" />
          <input placeholder="Make" value={form.make} onChange={e=>setForm({...form,make:e.target.value})} className="input-pill border px-3 py-2 text-sm dark:border-accent-700 dark:bg-accent-800" />
          <input placeholder="Model" value={form.model} onChange={e=>setForm({...form,model:e.target.value})} className="input-pill border px-3 py-2 text-sm dark:border-accent-700 dark:bg-accent-800" />
          <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="input-pill border px-3 py-2 text-sm dark:border-accent-700 dark:bg-accent-800"><option>economy-sedan</option><option>executive-sedan</option><option>van</option><option>mini-coach</option><option>school-bus</option><option>motorcoach</option></select>
          <button onClick={()=>mut.mutate()} disabled={!form.plateNumber||mut.isPending} className="rounded-full btn-brand-gradient px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{mut.isPending?'Saving…':'Add'}</button>
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((v:any)=> (
          <Card key={v._id}><div className="flex items-center justify-between"><span className="font-semibold">{v.plateNumber}</span><Badge tone={v.status==='active'?'green':v.status==='maintenance'?'gold':'slate'}>{v.status}</Badge></div><p className="text-sm text-muted">{v.make} {v.model} • {v.type}</p><p className="mt-2 text-xs text-muted">Insurance: {v.insuranceExpiry?new Date(v.insuranceExpiry).toLocaleDateString():'—'} • Inspection: {v.inspectionExpiry?new Date(v.inspectionExpiry).toLocaleDateString():'—'}</p></Card>
        ))}
        {vehicles.length===0 && <p className="text-sm text-muted">No vehicles yet — add one above. Maintenance/inspections/ fuel/reminders extend this model.</p>}
      </div>
    </div>
  );
}
