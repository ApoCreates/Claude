import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Kpi from "@/components/ui/Kpi";
import SharePie from "@/components/charts/SharePie";
import { COMPETITORS, categoryShare } from "@/lib/data/competition";
import { CATEGORIES } from "@/lib/data/products";
import { ArrowRight, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function CompetitionPage() {
  const high = COMPETITORS.filter((c) => c.threatLevel === "high").length;

  return (
    <div className="space-y-6">
      <div>
        <div className="label">Intelligence</div>
        <h1 className="text-2xl font-semibold">Competition</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Tracked competitors" value={COMPETITORS.length.toString()} />
        <Kpi label="High-threat" value={high.toString()} sub="needs response" />
        <Kpi label="Categories covered" value={CATEGORIES.length.toString()} />
        <Kpi label="Updated" value="hourly" sub="from market intel feed" />
      </div>

      <Card>
        <CardHeader title="Competitor landscape" action={<span className="chip">Click for AI brief</span>} />
        <CardBody className="!p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-muted text-xs">
              <tr className="border-b border-border">
                <th className="px-4 py-2 font-medium">Competitor</th>
                <th className="px-4 py-2 font-medium">HQ</th>
                <th className="px-4 py-2 font-medium">Categories</th>
                <th className="px-4 py-2 font-medium text-right">Share</th>
                <th className="px-4 py-2 font-medium text-right">Trend</th>
                <th className="px-4 py-2 font-medium text-right">Threat</th>
              </tr>
            </thead>
            <tbody>
              {COMPETITORS.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-panel2">
                  <td className="px-4 py-2">
                    <Link href={`/competition/${c.id}`} className="hover:underline inline-flex items-center gap-1.5">
                      {c.threatLevel === "high" && <AlertTriangle className="w-3.5 h-3.5 text-warn" />}
                      {c.name}
                      <ArrowRight className="w-3 h-3 text-muted" />
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted">{c.hq}</td>
                  <td className="px-4 py-2 text-muted">{c.categories.join(", ")}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{c.marketSharePct}%</td>
                  <td className="px-4 py-2 text-right">
                    {c.trend === "up" ? <TrendingUp className="w-4 h-4 text-good inline" /> :
                     c.trend === "down" ? <TrendingDown className="w-4 h-4 text-bad inline" /> :
                     <Minus className="w-4 h-4 text-muted inline" />}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className={`chip ${c.threatLevel === "high" ? "chip-bad" : c.threatLevel === "medium" ? "chip-warn" : "chip-good"}`}>{c.threatLevel}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {["Soda", "Energy"].map((cat) => (
          <Card key={cat}>
            <CardHeader title={`${cat} · category share`} />
            <CardBody><SharePie data={categoryShare(cat)} nameKey="brand" valueKey="share" /></CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
