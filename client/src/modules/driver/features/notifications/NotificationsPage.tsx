import { Card, CardTitle } from '../../components/ui/card';
import { SkeletonCard } from '../../../crm/components/ui/skeleton';
import { Bell, CheckCheck, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../services/api.js';
export default function NotificationsPage(){
  const { data, isLoading, isError, refetch } = useQuery({ queryKey:['notifs'], queryFn: async()=>(await api.get('/notifications')).data });
  if(isLoading) return <div className="grid gap-3">{Array.from({length:3}).map((_,i)=><SkeletonCard key={i} />)}</div>;
  if(isError) return <Card className="text-center py-12"><AlertCircle className="h-10 w-10 mx-auto text-amber-500" /><p className="mt-2 font-medium">Could not load notifications</p><button onClick={()=>refetch()} className="mt-3 rounded-full btn-brand-gradient px-5 py-2 text-sm text-white">Retry</button></Card>;
  const list:any[]=(data as any)?.notifications??[];
  return (<div className="space-y-6"><h1 className="font-display text-2xl font-bold dark:text-white">Notifications</h1><Card><div className="flex items-center justify-between"><CardTitle>Recent</CardTitle><button className="rounded-full bg-accent-50 px-3 py-1.5 text-xs font-semibold hover:bg-accent-100 dark:bg-white/5"><CheckCheck className="mr-1 inline h-3 w-3" />Mark all read</button></div>{list.length ? <ul className="mt-4 space-y-2">{list.slice(0,10).map((n:any)=><li key={n._id} className="flex gap-3 rounded-2xl border border-accent-200 p-4 hover:bg-accent-50 dark:border-white/5 dark:hover:bg-white/5"><Bell className="h-4 w-4 shrink-0 text-brand-600" /><div><p className="font-medium dark:text-white">{n.title}</p><p className="text-sm text-muted">{n.message}</p><p className="text-xs text-muted">{new Date(n.createdAt).toLocaleString()}</p></div></li>)}</ul> : <div className="mt-6 text-center py-12"><Bell className="h-12 w-12 mx-auto text-accent-300" /><p className="mt-2 font-medium dark:text-white">No notifications</p><p className="text-sm text-muted">Ride requests, payments, dispatch messages and system updates appear here</p></div>}</Card></div>);
}