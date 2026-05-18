import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Kpi from "@/components/ui/Kpi";
import RevenueLine from "@/components/charts/RevenueLine";
import { outletById } from "@/lib/data/outlets";
import { DAILY_BY_REGION } from "@/lib/data/sales";
import { fmtCompact, fmtCurrency } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

export default function OutletDetail({ params }: { params: { id: string } }) {
  const o = outletById(params.id);
  if (!o) notFound();
  const base = DAILY_BY_REGION[o.region];
  const share = o.weeklyVolume / 60_000;
  const series = base.map((d) => ({ ...d, revenue: Math.floor(d.revenue * share) }));

  return (
    <div className="space-y-6">
      <Link href="/outlets" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text"><ChevronLeft className="w-4 h-4" /> Back to outlets</Link>
      <div className="flex items-end justify-between">
        <div>
          <div className="label">{o.region} · {o.city}</div>
          <h1 className="text-2xl font-semibold">{o.name}</h1>
          <div className="text-sm text-muted font-mono mt-1">{o.id} · {o.channel}</div>
        </div>
        <span className={`chip ${o.performance === "above" ? "chip-good" : o.performance === "below" ? "chip-bad" : ""}`}>
          {o.performance === "above" ? "Above target" : o.performance === "below" ? "Below target" : "On target"}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Doors" value={o.doors.toString()} />
        <Kpi label="Weekly volume" value={fmtCompact(o.weeklyVolume)} />
        <Kpi label="Est. weekly revenue" value={fmtCurrency(o.weeklyVolume * 1.35)} />
        <Kpi label="Channel" value={o.channel} />
      </div>

      <Card>
        <CardHeader title="Outlet revenue · 90 days (estimated)" />
        <CardBody><RevenueLine data={series} height={260} color="#22d3ee" /></CardBody>
      </Card>
    </div>
  );
}
