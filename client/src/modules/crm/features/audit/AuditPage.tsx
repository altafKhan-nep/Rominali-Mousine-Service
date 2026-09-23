import { useCrmAudit } from '../../hooks/useCrmQuery';
import { Card } from '../../components/ui/card';
export default function AuditPage() {
  const { data, isLoading } = useCrmAudit() as any;
  const logs:any[] = data?.logs ?? [];
  if (isLoading) return <div className="h-64 animate-pulse rounded-2xl bg-accent-200 dark:bg-accent-800" />;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Audit Logs</h1>
      <p className="text-sm text-muted">Every admin dispatch, fleet change, ticket update is recorded (action, actor, IP).</p>
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm"><thead className="bg-accent-50 text-xs uppercase text-muted dark:bg-accent-800"><tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">IP</th></tr></thead>
          <tbody className="divide-y dark:divide-accent-800">{logs.map((l:any)=> <tr key={l._id} className="hover:bg-accent-50 dark:hover:bg-accent-800/50"><td className="px-4 py-2 text-xs text-muted">{new Date(l.createdAt).toLocaleString()}</td><td className="px-4 py-2">{l.actorEmail}<div className="text-xs text-muted">{l.actorRole}</div></td><td className="px-4 py-2 font-mono text-xs">{l.action}</td><td className="px-4 py-2 text-xs">{l.targetType}:{l.targetId?.slice?.(0,8)}</td><td className="px-4 py-2 text-xs text-muted">{l.ip}</td></tr>)}</tbody></table>
        </div>
      </Card>
    </div>
  );
}
