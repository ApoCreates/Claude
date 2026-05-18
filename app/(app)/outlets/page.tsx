import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Kpi from "@/components/ui/Kpi";
import { OUTLETS, REGIONS, CHANNELS } from "@/lib/data/outlets";
import { fmtCompact } from "@/lib/utils";

export default function OutletsPage() {
  const total = OUTLETS.length;
  const above = OUTLETS.filter((o) => o.performance === "above").length;
  const below = OUTLETS.filter((o) => o.performance === "below").length;
  const doors = OUTLETS.reduce((s, o) => s + o.doors, 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="label">Distribution</div>
        <h1 className="text-2xl font-semibold">Outlets</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Total outlets"   value={total.toString()} sub={`${REGIONS.length} regions · ${CHANNELS.length} channels`} />
        <Kpi label="Above target"    value={above.toString()} sub={`${Math.round((above / total) * 100)}% of base`} />
        <Kpi label="Below target"    value={below.toString()} sub={`${Math.round((below / total) * 100)}% of base`} />
        <Kpi label="Total doors"     value={fmtCompact(doors)} sub="shelf footprint" />
      </div>

      <Card>
        <CardHeader title="All outlets" action={<span className="chip">Click an outlet for detail</span>} />
        <CardBody className="!p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-muted text-xs">
              <tr className="border-b border-border">
                <th className="px-4 py-2 font-medium">Outlet</th>
                <th className="px-4 py-2 font-medium">Region</th>
                <th className="px-4 py-2 font-medium">City</th>
                <th className="px-4 py-2 font-medium">Channel</th>
                <th className="px-4 py-2 font-medium text-right">Doors</th>
                <th className="px-4 py-2 font-medium text-right">Weekly volume</th>
                <th className="px-4 py-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {OUTLETS.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-panel2">
                  <td className="px-4 py-2"><Link href={`/outlets/${o.id}`} className="hover:underline">{o.name}</Link></td>
                  <td className="px-4 py-2 text-muted">{o.region}</td>
                  <td className="px-4 py-2 text-muted">{o.city}</td>
                  <td className="px-4 py-2"><span className="chip">{o.channel}</span></td>
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
