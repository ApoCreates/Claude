import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { BRIEFS, latestBrief } from "@/lib/data/briefs";
import { Sun, ArrowRight } from "lucide-react";

export default function MorningBriefPage() {
  const today = latestBrief();
  return (
    <div className="space-y-6">
      <div>
        <div className="label">Morning content machine</div>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Sun className="w-6 h-6 text-warn" /> Today's brief</h1>
        <p className="text-sm text-muted mt-1">Generated overnight from sales, scan data, competitive intel, and the scenario library. Designed to read in 90 seconds.</p>
      </div>

      <Card>
        <CardHeader title={today.headline} kicker={today.date} action={<span className="chip chip-good">Generated 06:00 UTC</span>} />
        <CardBody className="space-y-4">
          <p className="text-sm">{today.summary}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {today.sections.map((s) => (
              <div key={s.title}>
                <div className="label mb-1">{s.title}</div>
                <div className="text-sm leading-relaxed">{s.body}</div>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-border">
            <div className="label mb-1">Recommended actions</div>
            <ul className="text-sm list-disc list-inside space-y-1 text-text/90">
              {today.actions.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Archive" />
        <CardBody className="!p-0">
          <ul className="divide-y divide-border">
            {BRIEFS.map((b) => (
              <li key={b.date}>
                <Link href={`/morning-brief/${b.date}`} className="flex items-center justify-between px-4 py-3 hover:bg-panel2">
                  <div>
                    <div className="text-sm font-medium">{b.headline}</div>
                    <div className="text-xs text-muted">{b.date}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
