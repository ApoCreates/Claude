import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SCENARIOS } from "@/lib/data/scenarios";
import { fmtCurrency, fmtPct } from "@/lib/utils";
import { ArrowUpRight, Sparkles } from "lucide-react";

export default function ScenariosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="label">Intelligence</div>
          <h1 className="text-2xl font-semibold">Predictive scenarios</h1>
        </div>
        <Link href="/scenarios/new" className="btn btn-primary"><Sparkles className="w-4 h-4" /> New scenario</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SCENARIOS.map((s) => {
          const lift = (s.projectedRevenue - s.baselineRevenue) / s.baselineRevenue;
          return (
            <Card key={s.id}>
              <CardHeader
                title={s.title}
                kicker={`${s.id} · ${s.owner} · ${s.horizonMonths}mo horizon`}
                action={<span className={`chip ${s.status === "endorsed" ? "chip-good" : s.status === "modeled" ? "chip-warn" : ""}`}>{s.status}</span>}
              />
              <CardBody className="space-y-3">
                <div className="text-sm text-muted">{s.question}</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="label">Baseline</div>
                    <div className="text-sm">{fmtCurrency(s.baselineRevenue)}</div>
                  </div>
                  <div>
                    <div className="label">Projected</div>
                    <div className="text-sm">{fmtCurrency(s.projectedRevenue)}</div>
                  </div>
                  <div>
                    <div className="label">Lift</div>
                    <div className={`text-sm flex items-center gap-1 ${lift >= 0 ? "text-good" : "text-bad"}`}>
                      {lift >= 0 && <ArrowUpRight className="w-3.5 h-3.5" />}
                      {fmtPct(lift)} · confidence {fmtPct(s.confidence, 0)}
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="label mb-1">Recommendation</div>
                  <div className="text-sm">{s.recommendation}</div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
