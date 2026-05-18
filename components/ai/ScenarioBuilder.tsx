"use client";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

const TEMPLATES = [
  "If we cut Volt Berry Rush price by 8% in convenience for Q3, what's the expected category revenue impact?",
  "What's the revenue lift from adding Verde Mango Sunrise to 600 HORECA accounts in West & Northeast?",
  "If we discontinue Solace Lemon Honey at year-end, what's the net P&L impact after reallocating shelf to Peach Iced Tea?",
  "If Cascade matches our Volt Original pricing in convenience, what's the worst-case 6-month share loss?",
];

export default function ScenarioBuilder() {
  const [q, setQ] = useState("");
  const [text, setText] = useState("");
  const [live, setLive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(question?: string) {
    const body = (question ?? q).trim();
    if (!body) return;
    setQ(body);
    setLoading(true);
    setText("");
    try {
      const r = await fetch("/api/ai/scenario", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: body }),
      });
      const j = await r.json();
      setText(j.text || "");
      setLive(Boolean(j.live));
    } catch (e: any) {
      setText("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="label mb-1">Scenario question</div>
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Describe a pricing, distribution, portfolio, or marketing move…"
          rows={3}
          className="input"
        />
      </div>

      <div>
        <div className="label mb-1">Try a template</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {TEMPLATES.map((t) => (
            <button key={t} onClick={() => run(t)} className="text-left p-3 rounded-lg border border-border bg-panel2 hover:bg-border text-sm">{t}</button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => run()} disabled={loading || !q.trim()} className="btn btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Model scenario
        </button>
        {live !== null && <span className={`chip ${live ? "chip-good" : "chip-warn"}`}>{live ? "Live AI" : "Canned"}</span>}
      </div>

      {text && (
        <div className="card">
          <div className="card-hd"><div className="text-sm font-medium">Result</div></div>
          <div className="card-bd text-sm leading-relaxed whitespace-pre-wrap">{text}</div>
        </div>
      )}
    </div>
  );
}
