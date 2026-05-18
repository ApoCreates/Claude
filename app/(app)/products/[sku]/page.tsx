import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Kpi from "@/components/ui/Kpi";
import RevenueLine from "@/components/charts/RevenueLine";
import { productBySku } from "@/lib/data/products";
import { totalSeries, topSkus } from "@/lib/data/sales";
import { fmtCurrency, fmtPct } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

export default function ProductDetail({ params }: { params: { sku: string } }) {
  const p = productBySku(params.sku);
  if (!p) notFound();
  const series = totalSeries().map((d) => ({
    ...d,
    revenue: Math.floor(d.revenue * (p.status === "Growth" ? 0.08 : p.status === "Core" ? 0.05 : p.status === "Watch" ? 0.025 : 0.015)),
  }));
  const ranked = topSkus(99).find((t) => t.sku === p.sku);

  return (
    <div className="space-y-6">
      <Link href="/products" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text"><ChevronLeft className="w-4 h-4" /> Back to products</Link>
      <div className="flex items-end justify-between">
        <div>
          <div className="label">{p.brand} · {p.category}</div>
          <h1 className="text-2xl font-semibold">{p.name}</h1>
          <div className="text-sm text-muted font-mono mt-1">{p.sku} · {p.pack} · launched {p.launchedYear}</div>
        </div>
        <span className={`chip ${p.status === "Growth" ? "chip-good" : p.status === "Decline" ? "chip-bad" : p.status === "Watch" ? "chip-warn" : ""}`}>{p.status}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Unit price" value={fmtCurrency(p.unitPrice)} />
        <Kpi label="Margin"     value={fmtPct(p.marginPct, 0)} />
        <Kpi label="Revenue (90d)" value={fmtCurrency(ranked?.revenue ?? 0)} delta={ranked?.growth} sub="YoY" />
        <Kpi label="Age" value={`${new Date().getFullYear() - p.launchedYear}y`} sub="years in market" />
      </div>

      <Card>
        <CardHeader title="Estimated revenue trend (last 90 days)" />
        <CardBody><RevenueLine data={series} height={280} color="#e11d48" /></CardBody>
      </Card>

      <Card>
        <CardHeader title="Notes" />
        <CardBody className="space-y-2 text-sm text-text/90">
          <p>{p.name} sits in the {p.category.toLowerCase()} segment under the {p.brand} brand. Its current status is <b>{p.status}</b>, with a unit margin of {fmtPct(p.marginPct, 0)}.</p>
          <p className="text-muted">For deeper analysis ask the <Link href="/analyst" className="text-accent hover:underline">AI data analyst</Link> a question, e.g. <i>"What's driving {p.name}'s share in convenience?"</i></p>
        </CardBody>
      </Card>
    </div>
  );
}
