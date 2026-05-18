import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Kpi from "@/components/ui/Kpi";
import RevenueLine from "@/components/charts/RevenueLine";
import { DAILY_BY_REGION } from "@/lib/data/sales";
import { OUTLETS, REGIONS, type Region } from "@/lib/data/outlets";
import { fmtCurrency, fmtCompact, pctDelta } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

export default function RegionDetail({ params }: { params: { region: string } }) {
  const region = decodeURIComponent(params.region) as Region;
  if (!REGIONS.includes(region)) notFound();
  const series = DAILY_BY_REGION[region];
  const r30 = series.slice(-30).reduce((s, p) => s + p.revenue, 0);
  const p30 = series.slice(-60, -30).reduce((s, p) => s + p.revenue, 0);
  const outlets = OUTLETS.filter((o) => o.region === region);

  return (
    <div className="space-y-6">
      <Link href="/sales" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text"><ChevronLeft className="w-4 h-4" /> Back to sales</Link>
      <div>
        <div className="label">Region</div>
        <h1 className="text-2xl font-semibold">{region}</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Revenue (30d)" value={fmtCurrency(r30)} delta={pctDelta(r30, p30)} sub="vs prior 30d" />
        <Kpi label="Outlets" value={outlets.length.toString()} sub={`${outlets.filter((o) => o.performance === "above").length} above target`} />
        <Kpi label="Doors" value={fmtCompact(outlets.reduce((s, o) => s + o.doors, 0))} />
        <Kpi label="Weekly volume" value={fmtCompact(outlets.reduce((s, o) => s + o.weeklyVolume, 0))} />
      </div>

      <Card>
        <CardHeader title={`Revenue · ${region} · 90 days`} />
        <CardBody><RevenueLine data={series} height={280} color="#22c55e" /></CardBody>
      </Card>

      <Card>
        <CardHeader title="Outlets in region" />
        <CardBody className="!p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-muted text-xs">
              <tr className="border-b border-border">
                <th className="px-4 py-2 font-medium">Outlet</th>
                <th className="px-4 py-2 font-medium">Channel</th>
                <th className="px-4 py-2 font-medium text-right">Doors</th>
                <th className="px-4 py-2 font-medium text-right">Weekly volume</th>
                <th className="px-4 py-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {outlets.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-panel2">
                  <td className="px-4 py-2"><Link href={`/outlets/${o.id}`} className="hover:underline">{o.name}</Link></td>
                  <td className="px-4 py-2 text-muted">{o.channel}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{o.doors}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{fmtCompact(o.weeklyVolume)}</td>
                  <td className="px-4 py-2 text-right">
                    <span className={`chip ${o.performance === "above" ? "chip-good" : o.performance === "below" ? "chip-bad" : ""}`}>
                      {o.performance === "above" ? "Above" : o.performance === "below" ? "Below" : "On"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
