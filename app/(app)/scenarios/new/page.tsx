import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import ScenarioBuilder from "@/components/ai/ScenarioBuilder";
import { ChevronLeft } from "lucide-react";

export default function NewScenarioPage() {
  return (
    <div className="space-y-6">
      <Link href="/scenarios" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text"><ChevronLeft className="w-4 h-4" /> Back to scenarios</Link>
      <div>
        <div className="label">Predictive scenarios</div>
        <h1 className="text-2xl font-semibold">New scenario</h1>
        <p className="text-sm text-muted mt-1">Describe a pricing, distribution, or portfolio move. The model returns expected revenue impact, drivers, risks, and a recommendation.</p>
      </div>
      <Card>
        <CardHeader title="Build a scenario" />
        <CardBody><ScenarioBuilder /></CardBody>
      </Card>
    </div>
  );
}
