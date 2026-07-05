"use client";

import { useRef, useState } from "react";
import {
  BookOpenText,
  Clapperboard,
  Film,
  Laugh,
  Megaphone,
  Newspaper,
  PenLine,
  Sparkles,
  Square,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { MODES, type ModeId } from "@/lib/ai/modes";
import { DIALECTS, type BrandProfile, type Dialect, type OutputLang } from "@/lib/profiles";
import { t, type UILang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CopyButton, FeedbackBox } from "./shared";

const ICONS: Record<string, LucideIcon> = {
  PenLine,
  Megaphone,
  Sparkles,
  BookOpenText,
  Clapperboard,
  Film,
  Wand2,
  Laugh,
  Newspaper,
};

interface Turn {
  role: "user" | "assistant";
  content: string;
  mode: ModeId;
}

export default function WriterStudio({
  uiLang,
  profile,
}: {
  uiLang: UILang;
  profile: BrandProfile;
}) {
  const [mode, setMode] = useState<ModeId>("copywriting");
  const [outputLang, setOutputLang] = useState<OutputLang>("both");
  const [dialect, setDialect] = useState<Dialect>(profile.dialect);
  const [brief, setBrief] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const activeMode = MODES.find((m) => m.id === mode)!;

  async function run() {
    if (!brief.trim() || busy) return;
    const userTurn: Turn = { role: "user", content: brief.trim(), mode };
    const history = turns.map(({ role, content }) => ({ role, content }));
    setTurns((prev) => [...prev, userTurn, { role: "assistant", content: "", mode }]);
    setBrief("");
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, brief: userTurn.content, outputLang, dialect, profile, history }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const err = await res.text().catch(() => "");
        setTurns((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: `⚠️ ${err || res.statusText}`, mode };
          return next;
        });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const chunk = acc;
        setTurns((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: chunk, mode };
          return next;
        });
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setTurns((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: `⚠️ ${(e as Error).message}`,
            mode,
          };
          return next;
        });
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Mode rail */}
      <aside className="space-y-1.5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-400">
          {t("modeLabel", uiLang)}
        </p>
        {MODES.map((m) => {
          const Icon = ICONS[m.icon] || PenLine;
          const active = m.id === mode;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-start transition",
                active
                  ? "border-qalam/60 bg-qalam/10 shadow-glow"
                  : "border-ink-700 bg-ink-900/40 hover:border-ink-500"
              )}
            >
              <Icon size={16} className={cn("mt-0.5 shrink-0", active ? "text-qalam" : "text-ink-400")} />
              <span>
                <span className={cn("block text-sm font-medium", active ? "text-qalam-soft" : "text-ink-200")}>
                  {m.label[uiLang]}
                </span>
                <span className="block text-[11px] leading-snug text-ink-400">{m.tagline[uiLang]}</span>
              </span>
            </button>
          );
        })}
      </aside>

      {/* Workbench */}
      <section className="min-w-0">
        {/* Language + dialect controls */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-ink-700 bg-ink-900/60 p-0.5">
            {(
              [
                ["ar", t("arabicOnly", uiLang)],
                ["en", t("englishOnly", uiLang)],
                ["both", t("bothLangs", uiLang)],
              ] as [OutputLang, string][]
            ).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setOutputLang(v)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition",
                  outputLang === v ? "bg-qalam text-ink-950 font-medium" : "text-ink-300 hover:text-ink-100"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {outputLang !== "en" && (
            <label className="flex items-center gap-2 text-sm text-ink-300">
              {t("dialect", uiLang)}
              <select
                value={dialect}
                onChange={(e) => setDialect(e.target.value as Dialect)}
                className="rounded-md border border-ink-600 bg-ink-900 px-2 py-1.5 text-sm outline-none focus:border-qalam"
              >
                {DIALECTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {uiLang === "ar" ? d.ar : d.en}
                  </option>
                ))}
              </select>
            </label>
          )}
          <span className="ms-auto rounded-full border border-ink-700 px-3 py-1 text-xs text-ink-400">
            {profile.name}
          </span>
        </div>

        {/* Conversation */}
        <div className="space-y-4">
          {turns.map((turn, i) =>
            turn.role === "user" ? (
              <div key={i} className="rounded-xl border border-ink-700 bg-ink-800/70 p-4">
                <p className="prose-output text-ink-200" dir="auto">
                  {turn.content}
                </p>
              </div>
            ) : (
              <div key={i} className="rounded-xl border border-qalam/25 bg-ink-900/70 p-4">
                <div className="prose-output" dir="auto">
                  {turn.content || (
                    <span className="animate-pulse text-ink-400">{t("writing", uiLang)}</span>
                  )}
                </div>
                {turn.content && !(busy && i === turns.length - 1) && (
                  <>
                    <div className="mt-3 flex gap-2">
                      <CopyButton text={turn.content} lang={uiLang} />
                    </div>
                    <FeedbackBox
                      mode={turn.mode}
                      excerpt={turn.content.slice(0, 1500)}
                      source="feedback"
                      lang={uiLang}
                    />
                  </>
                )}
              </div>
            )
          )}
        </div>

        {/* Composer */}
        <div className="mt-5 rounded-xl border border-ink-600 bg-ink-900/80 p-3 focus-within:border-qalam/60">
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run();
            }}
            placeholder={activeMode.placeholder[uiLang]}
            rows={3}
            dir="auto"
            className="w-full resize-y bg-transparent text-[15px] outline-none placeholder:text-ink-500"
          />
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-ink-500">⌘/Ctrl + Enter</span>
            {busy ? (
              <button
                onClick={() => abortRef.current?.abort()}
                className="inline-flex items-center gap-2 rounded-lg border border-ink-500 px-4 py-2 text-sm text-ink-200 hover:border-red-400 hover:text-red-400"
              >
                <Square size={14} /> {t("stop", uiLang)}
              </button>
            ) : (
              <button
                onClick={run}
                disabled={!brief.trim()}
                className="rounded-lg bg-qalam px-5 py-2 text-sm font-semibold text-ink-950 transition hover:bg-qalam-soft disabled:opacity-40"
              >
                {t("write", uiLang)}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
