"use client";
import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Why did Mountain region underperform last week?",
  "Which SKU has the strongest cross-sell potential with Volt Berry Rush?",
  "What's our biggest exposure to Cascade's zero-cal launch?",
  "If we cut Verde Apple Crisp by 5% in supermarkets, what's the likely volume lift?",
];

export default function Chat({ initialQuestion = "" }: { initialQuestion?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoSent = useRef(false);

  useEffect(() => {
    if (initialQuestion.trim() && !autoSent.current) {
      autoSent.current = true;
      send(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const r = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const j = await r.json();
      setMessages([...next, { role: "assistant", content: j.text || "(no response)" }]);
    } catch (e: any) {
      setMessages([...next, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="text-sm text-muted">Ask anything about the business. Try one of these:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="text-left p-3 rounded-lg border border-border bg-panel2 hover:bg-border text-sm">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "" : ""}`}>
            <div className={`w-7 h-7 rounded-full grid place-items-center shrink-0 ${m.role === "user" ? "bg-brand/20 text-brand" : "bg-accent/15 text-accent"}`}>
              {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap flex-1">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full grid place-items-center bg-accent/15 text-accent"><Bot className="w-4 h-4" /></div>
            <div className="text-sm text-muted flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Thinking…</div>
          </div>
        )}
      </div>
      <div className="mt-4 flex gap-2 border-t border-border pt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask the analyst…"
          className="input"
        />
        <button onClick={() => send()} disabled={loading} className="btn btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send
        </button>
      </div>
    </div>
  );
}
