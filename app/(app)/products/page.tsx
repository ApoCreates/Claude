import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Kpi from "@/components/ui/Kpi";
import { PRODUCTS, BRANDS, CATEGORIES } from "@/lib/data/products";
import { fmtCurrency, fmtPct } from "@/lib/utils";

export default function ProductsPage() {
  const byStatus = (status: string) => PRODUCTS.filter((p) => p.status === status).length;
  return (
    <div className="space-y-6">
      <div>
        <div className="label">Portfolio</div>
        <h1 className="text-2xl font-semibold">Products</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Total SKUs"  value={PRODUCTS.length.toString()} sub={`${BRANDS.length} brands · ${CATEGORIES.length} categories`} />
        <Kpi label="Core"        value={byStatus("Core").toString()}   sub="established performers" />
        <Kpi label="Growth"      value={byStatus("Growth").toString()} sub="trending up" />
        <Kpi label="Watch/Decline" value={(byStatus("Watch") + byStatus("Decline")).toString()} sub="needs attention" />
      </div>

      <Card>
        <CardHeader title="All SKUs" action={<span className="chip">Click a product for detail</span>} />
        <CardBody className="!p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-muted text-xs">
              <tr className="border-b border-border">
                <th className="px-4 py-2 font-medium">SKU</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Brand</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Pack</th>
                <th className="px-4 py-2 font-medium text-right">Price</th>
                <th className="px-4 py-2 font-medium text-right">Margin</th>
                <th className="px-4 py-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.map((p) => (
                <tr key={p.sku} className="border-b border-border last:border-0 hover:bg-panel2">
                  <td className="px-4 py-2 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-2"><Link href={`/products/${p.sku}`} className="hover:underline">{p.name}</Link></td>
                  <td className="px-4 py-2 text-muted">{p.brand}</td>
                  <td className="px-4 py-2"><span className="chip">{p.category}</span></td>
                  <td className="px-4 py-2 text-muted">{p.pack}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{fmtCurrency(p.unitPrice)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{fmtPct(p.marginPct, 0)}</td>
                  <td className="px-4 py-2 text-right">
                    <span className={`chip ${p.status === "Growth" ? "chip-good" : p.status === "Decline" ? "chip-bad" : p.status === "Watch" ? "chip-warn" : ""}`}>
                      {p.status}
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
