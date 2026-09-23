import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../../../services/api.js';
import { Card } from '../../components/ui/card';
import { useState, useEffect } from 'react';
export default function SettingsPage(){
  const { data }=useQuery({ queryKey:['admin','settings'], queryFn: async()=>(await api.get('/admin/settings')).data });
  const [s,setS]=useState<any>(null); useEffect(()=>{ if((data as any)?.settings) setS((data as any).settings); },[data]);
  const mut=useMutation({ mutationFn: async()=>(await api.patch('/admin/settings', s)).data });
  if(!s) return <div className="h-32 animate-pulse rounded-2xl bg-accent-200 dark:bg-accent-800" />;
  return (<div className="max-w-2xl space-y-4"><h1 className="text-2xl font-bold">Global Settings</h1><Card><h3 className="font-semibold">Branding & Pricing</h3><div className="mt-3 grid gap-3 sm:grid-cols-3">{['baseFare','perKm','perMin'].map(k=><label key={k} className="text-sm">{k}<input type="number" step="0.01" value={s[k]??''} onChange={e=>setS({...s,[k]:e.target.value===''?null:Number(e.target.value)})} className="mt-1 w-full input-pill border px-3 py-2 dark:border-accent-700 dark:bg-accent-800" /></label>)}</div></Card><Card><h3 className="font-semibold">Support</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><input value={s.supportPhone||''} onChange={e=>setS({...s,supportPhone:e.target.value})} className="input-pill border px-3 py-2 text-sm dark:border-accent-700 dark:bg-accent-800" placeholder="Phone" /><input value={s.supportEmail||''} onChange={e=>setS({...s,supportEmail:e.target.value})} className="input-pill border px-3 py-2 text-sm dark:border-accent-700 dark:bg-accent-800" placeholder="Email" /></div></Card><Card><p className="text-sm text-muted">Extend: taxes, payment gateways, maps, Cloudinary, SMTP, Twilio, API keys, security → add to AppSetting model.</p><button onClick={()=>mut.mutate()} className="mt-3 rounded-full btn-brand-gradient px-5 py-2 text-sm font-medium text-white">{mut.isPending?'Saving…':'Save'}</button></Card></div>);
}
