import { Card, CardTitle } from '../../components/ui/card';
import { FileText, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { SkeletonCard } from '../../../crm/components/ui/skeleton';
const DOCS = [
  { name:'Driver License', status:'verified', expiry:'2027-03-15' },
  { name:'Vehicle Registration', status:'verified', expiry:'2026-11-20' },
  { name:'Insurance', status:'pending', expiry:'2026-08-12' },
  { name:'Taxi Permit', status:'verified', expiry:'2027-01-10' },
  { name:'Airport Permit', status:'verified', expiry:'2026-12-05' },
  { name:'Medical Certificate', status:'pending', expiry:'2026-09-30' },
  { name:'Background Check', status:'verified', expiry:'2027-05-22' },
  { name:'Profile Photo', status:'verified', expiry:'—' },
];
export default function DocumentsPage(){
  return (<div className="space-y-6"><h1 className="font-display text-2xl font-bold dark:text-white">Documents</h1><p className="text-sm text-muted">Upload, verify and track expiry — renew 30 days before to stay online.</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{DOCS.map(doc=> <Card key={doc.name} className="relative"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-brand-600" /><p className="font-medium text-sm dark:text-white">{doc.name}</p></div><div className="mt-3 flex gap-2"><button className="min-h-11 flex-1 rounded-full border border-accent-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-accent-50 dark:border-white/10 dark:bg-transparent">Replace</button><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${doc.status==='verified'?'bg-green-50 text-green-700':doc.status==='pending'?'bg-amber-50 text-amber-700':'bg-red-50 text-red-700'}`}>{doc.status==='verified'?<CheckCircle className="h-3 w-3" />:doc.status==='pending'?<Clock className="h-3 w-3" />:<AlertCircle className="h-3 w-3" />}{doc.status}</span></div><p className="mt-2 text-xs text-muted">Expiry {doc.expiry} {doc.status==='pending' && '• Renew reminder sent'}</p></Card>)}</div></div>);
}