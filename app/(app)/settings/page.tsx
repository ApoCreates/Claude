import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { hasLiveAI, MODEL } from "@/lib/ai/client";

export default function SettingsPage() {
  const live = hasLiveAI();
  return (
    <div className="space-y-6">
      <div>
        <div className="label">Platform</div>
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <Card>
        <CardHeader title="AI configuration" action={<span className={`chip ${live ? "chip-good" : "chip-warn"}`}>{live ? "Live" : "Canned"}</span>} />
        <CardBody className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="label">Model</div>
              <div className="font-mono">{MODEL}</div>
            </div>
            <div>
              <div className="label">API key</div>
              <div className="font-mono">{live ? "set" : "not set (using canned responses)"}</div>
            </div>
          </div>
          <p className="text-muted">Set <code className="font-mono">ANTHROPIC_API_KEY</code> in your environment to enable live AI features. Without it, the AI analyst, competitive briefs, and scenario builder fall back to canned demo responses.</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Data" />
        <CardBody className="text-sm text-muted">All data shown in this demo is synthetic. Replace the modules in <code className="font-mono">lib/data/*</code> with live source connectors to switch to production.</CardBody>
      </Card>

      <Card>
        <CardHeader title="Demo controls" />
        <CardBody className="text-sm text-muted">In production this section would include user provisioning, retention policy, brief schedule, alerting, and audit log.</CardBody>
      </Card>
    </div>
  );
}
