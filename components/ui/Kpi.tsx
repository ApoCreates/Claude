import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "./Card";
import { fmtPct } from "@/lib/utils";

export default function Kpi({
  label, value, delta, sub,
}: { label: string; value: string; delta?: number; sub?: string }) {
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className="p-4">
      <div className="label">{label}</div>
      <div className="kpi mt-1">{value}</div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta !== undefined && (
          <span className={`inline-flex items-center gap-0.5 ${positive ? "text-good" : "text-bad"}`}>
            {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {fmtPct(Math.abs(delta))}
          </span>
        )}
        {sub && <span className="text-muted">{sub}</span>}
      </div>
    </Card>
  );
}
