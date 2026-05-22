import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Chat from "@/components/ai/Chat";
import { hasLiveAI } from "@/lib/ai/client";

export default function AnalystPage({ searchParams }: { searchParams: { q?: string } }) {
  const live = hasLiveAI();
  const initial = typeof searchParams?.q === "string" ? searchParams.q : "";
  return (
    <div className="space-y-4">
      <div>
        <div className="label">Intelligence</div>
        <h1 className="text-2xl font-semibold">AI data analyst</h1>
        <p className="text-sm text-muted mt-1">
          Chat with an analyst that has access to the company's sales, products, channel, and competitor context.
          {!live && <> · <span className="text-warn">No ANTHROPIC_API_KEY set — responses are canned.</span></>}
        </p>
      </div>
      <Card>
        <CardHeader title="Chat" action={<span className={`chip ${live ? "chip-good" : "chip-warn"}`}>{live ? "Live" : "Canned"}</span>} />
        <CardBody><Chat initialQuestion={initial} /></CardBody>
      </Card>
    </div>
  );
}
