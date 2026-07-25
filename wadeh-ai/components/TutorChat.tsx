"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import type { Level, Subject } from "@/lib/curriculum";
import { MiniPlot, parsePlotDirective } from "./MiniPlot";
import { SpeakButton } from "./SpeakButton";
import clsx from "clsx";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

/** Split a tutor reply into text and any PLOT directives it drew. */
function splitReply(content: string): { text: string; plots: { fn: (x: number) => number; label: string }[] } {
  const plots: { fn: (x: number) => number; label: string }[] = [];
  const lines = content.split("\n").filter((line) => {
    const p = parsePlotDirective(line);
    if (p) {
      plots.push(p);
      return false;
    }
    return true;
  });
  return { text: lines.join("\n").trim(), plots };
}

export function TutorChat({ subject, level }: { subject: Subject; level: Level }) {
  const { lang, region, uid, recordTutorAsk } = usePrefs();
  const d = t(lang);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    recordTutorAsk();
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          subject: subject.slug,
          subjectName: subject.name[lang],
          levelTitle: level.title[lang],
          level: level.n,
          lang,
          region,
          uid,
        }),
      });
      const data = await res.json();
      setLive(Boolean(data.live));
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            lang === "ar"
              ? "تعذّر الاتصال بالمعلّم الآن. حاول مرة أخرى."
              : "Couldn't reach the tutor just now. Try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card flex min-h-[540px] flex-col">
      <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
        <div>
          <p className="font-serif text-xl">{d.lesson.tutorTitle}</p>
          <p className="mt-1 text-xs text-mute-light">{d.lesson.tutorHint}</p>
        </div>
        {live !== null && (
          <span
            className={clsx(
              "font-mono text-[10px] uppercase tracking-label",
              live ? "text-marigold" : "text-mute-light"
            )}
          >
            {live ? d.lesson.live : d.lesson.canned}
          </span>
        )}
      </div>

      <div ref={scrollRef} className="tutor-scroll flex-1 space-y-4 overflow-y-auto px-6 py-6">
        {messages.length === 0 && (
          <p className="font-serif text-lg italic text-mute-light">
            {lang === "ar"
              ? `اسألني أي شيء عن «${level.title.ar}» — سنصل إلى الوضوح معاً.`
              : `Ask me anything about “${level.title.en}” — we'll get to clarity together.`}
          </p>
        )}
        {messages.map((m, i) => {
          if (m.role === "user") {
            return (
              <div key={i} className="ms-auto max-w-[90%] whitespace-pre-wrap bg-paper px-4 py-3 text-sm leading-relaxed text-ink">
                {m.content}
              </div>
            );
          }
          const { text, plots } = splitReply(m.content);
          return (
            <div key={i} className="me-auto max-w-[90%] space-y-3 border border-hairline bg-ink px-4 py-3 text-sm leading-relaxed text-paper/90">
              <p className="whitespace-pre-wrap">{text}</p>
              {plots.map((p, j) => (
                <MiniPlot key={j} fn={p.fn} label={p.label} height={170} />
              ))}
              <SpeakButton text={text} />
            </div>
          );
        })}
        {busy && <p className="eyebrow animate-pulse">{d.lesson.thinking}</p>}
      </div>

      <div className="flex gap-3 border-t border-hairline p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={d.lesson.placeholder}
          className="flex-1 border border-hairline bg-ink px-4 py-3 text-sm text-paper placeholder:text-mute outline-none focus:border-marigold/70"
        />
        <button onClick={send} disabled={busy} className="btn-primary disabled:opacity-50">
          {d.lesson.send}
        </button>
      </div>
    </div>
  );
}
