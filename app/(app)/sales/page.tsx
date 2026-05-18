import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Kpi from "@/components/ui/Kpi";
import RevenueLine from "@/components/charts/RevenueLine";
import CategoryBar from "@/components/charts/CategoryBar";
import { DAILY_BY_REGION, revenueByChannel, totalSeries } from "@/lib/data/sales";
import { REGIONS } from "@/lib/data/outlets";
import { fmtCompact, fmtCurrency, pctDelta } from "@/lib/utils";

export default function SalesPage() {
  const series = totalSeries();
  const last30 = series.slice(-30).reduce((s, p) => s + p.revenue, 0);
  const prior30 = series.slice(-60, -30).reduce((s, p) => s + p.revenue, 0);
  const last7 = series.slice(-7).reduce((s, p) => s + p.revenue, 0);
  const prior7 = series.slice(-14, -7).reduce((s, p) => s + p.revenue, 0);

  const regionAgg = REGIONS.map((r) => {
    const arr = DAILY_BY_REGION[r];
    const r30 = arr.slice(-30).reduce((s, p) => s + p.revenue, 0);
    const p30 = arr.slice(-60, -30).reduce((s, p) => s + p.revenue, 0);
    return { region: r, revenue: r30, delta: pctDelta(r30, p30) };
  }).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      <div>
        <div className="label">Commercial</div>
        <h1 className="text-2xl font-semibold">Sales & revenue</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Revenue (30d)" value={fmtCurrency(last30)} delta={pctDelta(last30, prior30)} sub="vs prior 30d" />
        <Kpi label="Revenue (7d)"  value={fmtCurrency(last7)}  delta={pctDelta(last7, prior7)}  sub="vs prior 7d" />
        <Kpi label="Top region"    value={regionAgg[0].region} sub={fmtCurrency(regionAgg[0].revenue)} />
        <Kpi label="Lagging region" value={regionAgg[regionAgg.length - 1].region} sub={fmtCurrency(regionAgg[regionAgg.length - 1].revenue)} />
      </div>

      <Card>
        <CardHeader title="Revenue trend · all regions" />
        <CardBody><RevenueLine data={series} height={300} /></CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Region performance · last 30 days" />
          <CardBody><CategoryBar data={regionAgg} xKey="region" yKey="revenue" /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Channel mix · last 90 days" />
          <CardBody><CategoryBar data={revenueByChannel()} xKey="channel" yKey="revenue" /></CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Region breakdown" action={<span className="chip">Click a region for detail</span>} />
        <CardBody className="!p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-muted text-xs">
              <tr className="border-b border-border">
                <th className="px-4 py-2 font-medium">Region</th>
                <th className="px-4 py-2 font-medium text-right">Revenue (30d)</th>
                <th className="px-4 py-2 font-medium text-right">Δ vs prior</th>
                <th className="px-4 py-2 font-medium text-right">Trend</th>
              </tr>
            </thead>
            <tbody>
              {regionAgg.map((r) => (
                <tr key={r.region} className="border-b border-border last:border-0 hover:bg-panel2">
                  <td className="px-4 py-2">
                    <Link href={`/sales/${encodeURIComponent(r.region)}`} className="hover:underline">{r.region}</Link>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{fmtCurrency(r.revenue)}</td>
                  <td className={`px-4 py-2 text-right tabular-nums ${r.delta >= 0 ? "text-good" : "text-bad"}`}>
                    {(r.delta * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-2 text-right text-muted tabular-nums">{fmtCompact(r.revenue / 30)}/day</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
