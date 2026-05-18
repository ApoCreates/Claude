import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Kpi from "@/components/ui/Kpi";
import RevenueLine from "@/components/charts/RevenueLine";
import CategoryBar from "@/components/charts/CategoryBar";
import SharePie from "@/components/charts/SharePie";
import {
  totalSeries, priorPeriodRevenue, revenueByCategory, revenueByChannel, topSkus,
} from "@/lib/data/sales";
import { latestBrief } from "@/lib/data/briefs";
import { fmtCompact, fmtCurrency, pctDelta } from "@/lib/utils";
import { COMPETITORS } from "@/lib/data/competition";
import Link from "next/link";
import { ArrowRight, TrendingUp, AlertTriangle, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const series = totalSeries();
  const last30 = series.slice(-30);
  const { recent, prior } = priorPeriodRevenue(30);
  const cats = revenueByCategory();
  const chans = revenueByChannel().map((c) => ({ ...c, share: c.share }));
  const skus = topSkus(6);
  const brief = latestBrief();
  const highThreats = COMPETITORS.filter((c) => c.threatLevel === "high");

  const last7 = series.slice(-7).reduce((s, p) => s + p.revenue, 0);
  const prior7 = series.slice(-14, -7).reduce((s, p) => s + p.revenue, 0);
  const last90 = series.reduce((s, p) => s + p.revenue, 0);
  const units30 = series.slice(-30).reduce((s, p) => s + p.units, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="label">Executive overview · trailing 90 days</div>
          <h1 className="text-2xl font-semibold">Good morning. Here's what changed.</h1>
        </div>
        <Link href="/morning-brief" className="btn btn-primary"><Sparkles className="w-4 h-4" /> Open today's brief</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Revenue (30d)"     value={fmtCurrency(recent)} delta={pctDelta(recent, prior)} sub="vs prior 30d" />
        <Kpi label="Revenue (7d)"      value={fmtCurrency(last7)}  delta={pctDelta(last7, prior7)} sub="vs prior 7d" />
        <Kpi label="Units (30d)"       value={fmtCompact(units30)} delta={0.041} sub="vs prior 30d" />
        <Kpi label="Revenue (90d)"     value={fmtCurrency(last90)} delta={0.027} sub="trend" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue · last 90 days" action={<span className="chip">All categories</span>} />
          <CardBody><RevenueLine data={series} /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Today's brief" kicker={brief.date} action={<Link href="/morning-brief" className="text-xs text-accent inline-flex items-center gap-1">Open <ArrowRight className="w-3 h-3" /></Link>} />
          <CardBody className="space-y-3">
            <div className="text-sm font-medium leading-snug">{brief.headline}</div>
            <p className="text-sm text-muted">{brief.summary}</p>
            <div className="pt-2 border-t border-border">
              <div className="label mb-1">Suggested actions</div>
              <ul className="text-sm space-y-1 list-disc list-inside text-text/90">
                {brief.actions.slice(0, 3).map((a) => <li key={a}>{a}</li>)}
              </ul>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Revenue by category" />
          <CardBody><CategoryBar data={cats} xKey="category" yKey="revenue" /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Revenue by channel" />
          <CardBody><SharePie data={chans} nameKey="channel" valueKey="share" /></CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Top SKUs" action={<Link href="/products" className="text-xs text-accent inline-flex items-center gap-1">All products <ArrowRight className="w-3 h-3" /></Link>} />
          <CardBody className="!p-0">
            <table className="w-full text-sm">
              <thead className="text-left text-muted text-xs">
                <tr className="border-b border-border">
                  <th className="px-4 py-2 font-medium">SKU</th>
                  <th className="px-4 py-2 font-medium">Brand</th>
                  <th className="px-4 py-2 font-medium">Category</th>
                  <th className="px-4 py-2 font-medium text-right">Revenue (90d)</th>
                  <th className="px-4 py-2 font-medium text-right">YoY</th>
                </tr>
              </thead>
              <tbody>
                {skus.map((s) => (
                  <tr key={s.sku} className="border-b border-border last:border-0 hover:bg-panel2">
                    <td className="px-4 py-2"><Link href={`/products/${s.sku}`} className="hover:underline">{s.name}</Link></td>
                    <td className="px-4 py-2 text-muted">{s.brand}</td>
                    <td className="px-4 py-2"><span className="chip">{s.category}</span></td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtCurrency(s.revenue)}</td>
                    <td className={`px-4 py-2 text-right tabular-nums ${s.growth >= 0 ? "text-good" : "text-bad"}`}>
                      {(s.growth * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Threat watch" action={<Link href="/competition" className="text-xs text-accent inline-flex items-center gap-1">All <ArrowRight className="w-3 h-3" /></Link>} />
          <CardBody className="space-y-3">
            {highThreats.map((c) => (
              <Link key={c.id} href={`/competition/${c.id}`} className="block p-3 rounded-lg border border-border hover:bg-panel2 transition">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warn" /> {c.name}</div>
                  <span className="chip chip-bad">High</span>
                </div>
                <div className="text-xs text-muted mt-1">{c.notable}</div>
                <div className="mt-1 text-xs text-muted flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {c.marketSharePct}% share · trend {c.trend}
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
