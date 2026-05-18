import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { INTEGRATIONS } from "@/lib/data/integrations";
import { CheckCircle2, Loader2, AlertCircle, Clock } from "lucide-react";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="label">Platform</div>
        <h1 className="text-2xl font-semibold">Integrations</h1>
        <p className="text-sm text-muted mt-1">The data sources powering Pulse. In production these run on schedule and feed the warehouse before the morning brief is generated.</p>
      </div>

      <Card>
        <CardHeader title="Data sources" />
        <CardBody className="!p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-muted text-xs">
              <tr className="border-b border-border">
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Source</th>
                <th className="px-4 py-2 font-medium">Vendor</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Last sync</th>
                <th className="px-4 py-2 font-medium text-right">Records</th>
                <th className="px-4 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {INTEGRATIONS.map((i) => (
                <tr key={i.id} className="border-b border-border last:border-0 hover:bg-panel2">
                  <td className="px-4 py-2">
                    {i.status === "connected" && <span className="inline-flex items-center gap-1 text-good"><CheckCircle2 className="w-4 h-4" /> Connected</span>}
                    {i.status === "syncing"   && <span className="inline-flex items-center gap-1 text-accent"><Loader2 className="w-4 h-4 animate-spin" /> Syncing</span>}
                    {i.status === "error"     && <span className="inline-flex items-center gap-1 text-bad"><AlertCircle className="w-4 h-4" /> Error</span>}
                    {i.status === "pending"   && <span className="inline-flex items-center gap-1 text-muted"><Clock className="w-4 h-4" /> Pending</span>}
                  </td>
                  <td className="px-4 py-2">{i.name}</td>
                  <td className="px-4 py-2 text-muted">{i.vendor}</td>
                  <td className="px-4 py-2"><span className="chip">{i.category}</span></td>
                  <td className="px-4 py-2 text-muted font-mono text-xs">{i.lastSync}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{i.recordsLastSync.toLocaleString()}</td>
                  <td className="px-4 py-2 text-muted text-xs">{i.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
