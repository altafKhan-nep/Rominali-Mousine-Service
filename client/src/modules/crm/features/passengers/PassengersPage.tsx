import { useQuery } from '@tanstack/react-query';
import api from '../../../../services/api.js';
import { Card } from '../../components/ui/card';
import { useState } from 'react';
export default function PassengersPage(){
  const [q,setQ]=useState(''); const { data }=useQuery({ queryKey:['crm','passengers',q], queryFn: async()=>(await api.get('/crm/passengers',{params:{search:q}})).data });
  const list:any[]=(data as any)?.passengers??[];
  return (<div className="space-y-4"><h1 className="text-2xl font-bold">Passenger CRM</h1><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search name/email/phone…" className="input-pill w-full max-w-md border px-4 py-2 text-sm dark:border-accent-700 dark:bg-accent-800" /><div className="grid gap-3">{list.map((u:any)=><Card key={u._id} className="flex items-center justify-between"><div><p className="font-medium">{u.name}</p><p className="text-xs text-muted">{u.email} • {u.phone}</p></div><span className="text-xs text-muted">{new Date(u.createdAt).toLocaleDateString()}</span></Card>)}</div><p className="text-xs text-muted">Detail drill: ride history, LTV, saved places, tickets → GET /crm/passengers/:id</p></div>);
}
