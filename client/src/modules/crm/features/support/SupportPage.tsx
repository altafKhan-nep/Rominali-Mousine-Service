import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../../services/api.js';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useState } from 'react';
export default function SupportPage(){
  const qc=useQueryClient(); const { data }=useQuery({ queryKey:['crm','tickets'], queryFn: async()=>(await api.get('/crm/tickets')).data }); const [subject,setSubject]=useState('');
  const mut=useMutation({ mutationFn: async()=>(await api.post('/crm/tickets',{subject, description: subject})).data, onSuccess:()=>{qc.invalidateQueries({queryKey:['crm','tickets']}); setSubject('');} });
  const tickets:any[]=(data as any)?.tickets??[];
  return (<div className="space-y-4"><h1 className="text-2xl font-bold">Customer Support Center</h1><Card className="flex gap-2"><input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="New ticket subject…" className="input-pill flex-1 border px-4 py-2 text-sm dark:border-accent-700 dark:bg-accent-800" /><button onClick={()=>mut.mutate()} disabled={!subject} className="rounded-full btn-brand-gradient px-4 py-2 text-sm text-white disabled:opacity-50">Create</button></Card><div className="space-y-2">{tickets.map((t:any)=><Card key={t._id} className="flex items-center justify-between"><div><p className="font-medium">{t.subject}</p><p className="text-xs text-muted">{t.category} • {new Date(t.createdAt).toLocaleString()}</p></div><Badge tone={t.status==='open'?'red':t.status==='resolved'?'green':'slate'}>{t.status}</Badge></Card>)}</div></div>);
}
