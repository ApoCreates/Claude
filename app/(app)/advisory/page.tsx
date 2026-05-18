import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Crown, Target, Shield, Flame } from "lucide-react";

const RECOMMENDATIONS = [
  {
    icon: Target,
    pillar: "Where to win",
    title: "Double down on Energy in convenience",
    body: "Volt Berry Rush is overtaking Amperion in scan data — this is a once-in-three-years opportunity to lock convenience shelf for 24 months. The 8-week pilot in scn-001 should be approved and scaled aggressively if elasticity confirms.",
    actions: ["Approve scn-001 (Volt Berry Rush -8% in convenience, 4 banners).", "Pre-negotiate counter-promo terms with top 3 convenience banner partners.", "Accelerate Volt creator program to defend brand vs. Amperion influencer push."],
  },
  {
    icon: Flame,
    pillar: "Where to bet",
    title: "Premium HORECA juice for Verde",
    body: "Northwave's premium positioning is winning HORECA accounts we have a structural right to compete for. scn-002 shows a credible +29% lift on the affected line over 9 months. Sequence by distributor capacity.",
    actions: ["Greenlight scn-002 West-first, Northeast Q4.", "Launch Verde Cold-Pressed line extension in 4 lighthouse HORECA accounts.", "Bundle Verde Mango Sunrise + Solace Peach Iced Tea in HORECA combos."],
  },
  {
    icon: Shield,
    pillar: "Where to defend",
    title: "Aurora Cola Zero shelf in hypermarkets",
    body: "Cascade's zero-cal launch lands May 22 and directly targets Aurora Cola Zero in our top 8–12 hypermarket banners. The next six weeks set baselines for the next 18 months — protect contracts before resets.",
    actions: ["Lock multi-period contracts with 4 strategic hypermarket banners.", "Co-merchandise Aurora Cola Zero with Glacio Sparkling Lime in West.", "Brief marketing on a Pasture-anchored 'real ingredients' response narrative."],
  },
  {
    icon: Crown,
    pillar: "Where to prune",
    title: "Sunset Solace Lemon Honey",
    body: "scn-003 shows a net P&L improvement from discontinuation and shelf reallocation to Peach Iced Tea. Sentimental ties to a 17-year-old SKU are not a strategy. Phase out over two quarters and retain in Mountain pending consumer survey.",
    actions: ["Approve scn-003 with Mountain-region carve-out.", "Brief field team on conversion narrative to Peach Iced Tea.", "Reinvest freed SG&A into Verde Cold-Pressed development."],
  },
];

export default function AdvisoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="label">Intelligence</div>
        <h1 className="text-2xl font-semibold">C-level advisory</h1>
        <p className="text-sm text-muted mt-1">Four moves the AI recommends based on this quarter's signals — synthesized from sales, competitive intel, and the scenario library.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {RECOMMENDATIONS.map((r) => {
          const Icon = r.icon;
          return (
            <Card key={r.title}>
              <CardHeader
                title={r.title}
                kicker={r.pillar}
                action={<div className="w-8 h-8 rounded-md bg-brand/15 text-brand grid place-items-center"><Icon className="w-4 h-4" /></div>}
              />
              <CardBody className="space-y-3">
                <p className="text-sm leading-relaxed">{r.body}</p>
                <div className="pt-3 border-t border-border">
                  <div className="label mb-1">Suggested next steps</div>
                  <ul className="text-sm list-disc list-inside space-y-1 text-text/90">
                    {r.actions.map((a) => <li key={a}>{a}</li>)}
                  </ul>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader title="How this is generated" />
        <CardBody className="text-sm text-muted leading-relaxed">
          The advisory layer combines structured signals (this week's sales deltas, scenario model outputs, threat scores) with the AI analyst's contextual judgment.
          In production it would re-rank every 24 hours and surface only the top 4–6 moves. Recommendations are advisory — not auto-executed.
        </CardBody>
      </Card>
    </div>
  );
}
