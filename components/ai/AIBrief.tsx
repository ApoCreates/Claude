"use client";
import { useState } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";

export default function AIBrief({
  endpoint, payload, title = "AI brief", autoRun = true,
}: {
  endpoint: string;
  payload: Record<string, any>;
  title?: string;
  autoRun?: boolean;
}) {
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState<boolean | null>(null);

  async function run() {
    setLoading(true);
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      setText(j.text || "");
      setLive(Boolean(j.live));
    } catch (e: any) {
      setText("Couldn't generate brief: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  // useEffect-equivalent kicker
  if (autoRun && text === "" && !loading) {
    // schedule on next tick to avoid render-time fetch
    Promise.resolve().then(run);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium"><Sparkles className="w-4 h-4 text-accent" /> {title}</div>
        <div className="flex items-center gap-2">
          {live !== null && (
            <span className={`chip ${live ? "chip-good" : "chip-warn"}`}>{live ? "Live AI" : "Canned"}</span>
          )}
          <button onClick={run} className="btn" disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Regenerate
          </button>
        </div>
      </div>
      <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
        {loading && text === "" ? (
          <div className="text-muted flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating…</div>
        ) : text || <span className="text-muted">Click Regenerate to produce a brief.</span>}
      </div>
    </div>
  );
}
