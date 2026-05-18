import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Kpi from "@/components/ui/Kpi";
import SharePie from "@/components/charts/SharePie";
import AIBrief from "@/components/ai/AIBrief";
import { competitorById, categoryShare } from "@/lib/data/competition";
import { ChevronLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function CompetitorDetail({ params }: { params: { id: string } }) {
  const c = competitorById(params.id);
  if (!c) notFound();

  return (
    <div className="space-y-6">
      <Link href="/competition" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text"><ChevronLeft className="w-4 h-4" /> Back to competition</Link>
      <div className="flex items-end justify-between">
        <div>
          <div className="label">{c.hq} · founded {c.founded}</div>
          <h1 className="text-2xl font-semibold">{c.name}</h1>
          <div className="text-sm text-muted mt-1">{c.categories.join(" · ")}</div>
        </div>
        <span className={`chip ${c.threatLevel === "high" ? "chip-bad" : c.threatLevel === "medium" ? "chip-warn" : "chip-good"}`}>
          Threat: {c.threatLevel}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Estimated share" value={`${c.marketSharePct}%`} sub="overall beverage" />
        <Kpi label="Trend" value={c.trend} sub={c.trend === "up" ? "gaining" : c.trend === "down" ? "losing" : "stable"} />
        <Kpi label="Categories" value={c.categories.length.toString()} />
        <Kpi label="Since" value={c.founded.toString()} />
      </div>

      <Card>
        <CardHeader title="AI competitive brief" />
        <CardBody>
          <AIBrief endpoint="/api/ai/competition" payload={{ id: c.id }} title={`Brief: ${c.name}`} />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Notable" />
          <CardBody className="text-sm leading-relaxed">{c.notable}</CardBody>
        </Card>
        <Card>
          <CardHeader title={`${c.categories[0]} · category share`} />
          <CardBody><SharePie data={categoryShare(c.categories[0])} nameKey="brand" valueKey="share" /></CardBody>
        </Card>
      </div>
    </div>
  );
}
