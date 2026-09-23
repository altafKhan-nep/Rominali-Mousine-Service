import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../../services/api.js';
import { Card, CardTitle } from '../../components/ui/card';
import { useState } from 'react';
export default function FinancePage(){
  const { data }=useQuery({ queryKey:['crm','payments'], queryFn: async()=>(await api.get('/admin/payments')).data });
  const summary:any=(data as any)?.summary??{}; const payments:any[]=(data as any)?.payments??[];
  const qc = useQueryClient();
  const { data: reqData } = useQuery({ queryKey:['crm','refundRequests'], queryFn: async()=>(await api.get('/payments/requests')).data });
  const requests:any[] = (reqData as any)?.requests ?? [];
  const pending = requests.filter((r:any)=>r.status==='pending');
  const decide = useMutation({
    mutationFn: async ({ id, approve, note }:{id:string, approve:boolean, note?:string}) => (await api.post(`/payments/requests/${id}/decision`, { approve, note })).data,
    onSuccess: ()=> { qc.invalidateQueries({queryKey:['crm','refundRequests']}); qc.invalidateQueries({queryKey:['crm','payments']}); }
  });
  const [note, setNote] = useState('');
  return (<div className="space-y-6"><h1 className="font-display text-2xl font-bold dark:text-white">Finance — Reconciliation</h1><div className="grid gap-4 sm:grid-cols-4">{Object.entries(summary).map(([k,v]:any)=><Card key={k}><CardTitle className="capitalize">{k}</CardTitle><p className="mt-1 text-xl font-bold dark:text-white">${(v.total??0).toFixed(2)}</p><p className="text-xs text-muted">{v.count} payments</p></Card>)}</div>
  <Card><CardTitle>Refund Requests — Admin Only</CardTitle><p className="text-xs text-muted">Passengers request via “Request Refund” in Reports; only admin/finance can approve. {pending.length} pending.</p>
    {pending.length===0 ? <p className="mt-3 text-sm text-muted">No pending refunds — all clear.</p> : <ul className="mt-3 space-y-3">{pending.map((r:any)=><li key={r._id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium dark:text-white">${r.amount.toFixed(2)} • {r.payment?.provider} • {r.user?.name}</p><p className="text-xs text-muted">Ride {String(r.ride?._id||r.ride).slice(0,8)} • {new Date(r.createdAt).toLocaleString()}</p><p className="mt-1 text-sm">Reason: {r.reason}</p></div><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Pending</span></div><div className="mt-3 flex gap-2"><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Admin note (optional)" className="input-pill flex-1 border border-accent-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-transparent" /><button onClick={()=>decide.mutate({id:r._id, approve:true, note})} disabled={decide.isPending} className="rounded-full bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50">Approve Refund</button><button onClick={()=>decide.mutate({id:r._id, approve:false, note})} disabled={decide.isPending} className="rounded-full bg-white border border-accent-200 px-4 py-2 text-xs font-semibold hover:bg-accent-50 dark:border-white/10 dark:bg-transparent">Reject</button></div></li>)}</ul>}
  </Card>
  <Card><CardTitle>Recent transactions (Stripe + cash)</CardTitle><ul className="mt-3 space-y-2 text-sm">{payments.slice(0,10).map((p:any)=><li key={p._id} className="flex justify-between border-b py-2 last:border-0 dark:border-white/5"><span>{p.provider} {p.method} {p.status}</span><span className="font-medium">${p.amount.toFixed(2)}</span></li>)}</ul><p className="mt-3 text-xs text-muted">Refunds now require admin approval — passenger “Request Refund” creates a ticket, admin approves here.</p></Card></div>);
}
