import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { briefForDate } from "@/lib/data/briefs";
import { ChevronLeft } from "lucide-react";

export default function BriefByDate({ params }: { params: { date: string } }) {
  const b = briefForDate(params.date);
  if (!b) notFound();
  return (
    <div className="space-y-6">
      <Link href="/morning-brief" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text"><ChevronLeft className="w-4 h-4" /> Back to today</Link>
      <Card>
        <CardHeader title={b.headline} kicker={b.date} />
        <CardBody className="space-y-4">
          <p className="text-sm">{b.summary}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {b.sections.map((s) => (
              <div key={s.title}>
                <div className="label mb-1">{s.title}</div>
                <div className="text-sm leading-relaxed">{s.body}</div>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-border">
            <div className="label mb-1">Recommended actions</div>
            <ul className="text-sm list-disc list-inside space-y-1 text-text/90">
              {b.actions.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
