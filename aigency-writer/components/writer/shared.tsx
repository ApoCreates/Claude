"use client";

import { useState } from "react";
import { Check, Copy, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { t, type UILang } from "@/lib/i18n";
import type { LessonSource } from "@/lib/brain/types";

export function CopyButton({ text, lang }: { text: string; lang: UILang }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-ink-600 px-2.5 py-1 text-xs text-ink-300 transition hover:border-qalam hover:text-qalam"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? t("copied", lang) : t("copy", lang)}
    </button>
  );
}

/** Natively-authored Arabic star labels — no machine translation. */
const STAR_LABELS: Record<UILang, string[]> = {
  ar: ["ضعيف جدًا", "دون المستوى", "مقبول", "جيد", "ممتاز"],
  en: ["Very poor", "Below par", "Acceptable", "Good", "Excellent"],
};

/**
 * The Diwan feedback control: one-tap 1–5 stars + optional free text.
 * A tap records the rating immediately (Supabase feedback table via
 * /api/feedback); a comment additionally becomes a distilled lesson.
 * 1–2★ ratings are auto-flagged into the human review queue server-side.
 */
export function FeedbackBox({
  mode,
  excerpt,
  source,
  lang,
  runId,
  clientId,
  compact,
}: {
  mode: string;
  excerpt: string;
  source: LessonSource;
  lang: UILang;
  runId?: string;
  clientId?: string;
  compact?: boolean;
}) {
  const [stars, setStars] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  async function send(rating: number, withComment: boolean) {
    if (withComment) setStatus("sending");
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        rating: rating >= 4 ? "up" : "down",
        stars: rating,
        runId,
        clientId,
        comment: withComment ? comment : undefined,
        excerpt,
        source,
      }),
    });
    if (withComment) setStatus("done");
  }

  return (
    <div className={cn("mt-3 rounded-lg border border-ink-700 bg-ink-900/60 p-3", compact && "p-2.5")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink-400">{t("feedbackPrompt", lang)}</span>
        <div className="ms-auto flex items-center gap-1" dir="ltr">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => {
                setStars(n);
                send(n, false);
              }}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(null)}
              className="p-0.5 transition"
              aria-label={STAR_LABELS[lang][n - 1]}
              title={STAR_LABELS[lang][n - 1]}
            >
              <Star
                size={18}
                className={cn(
                  "transition",
                  (hover ?? stars ?? 0) >= n
                    ? "fill-qalam text-qalam"
                    : "text-ink-500"
                )}
              />
            </button>
          ))}
        </div>
        {stars && (
          <span className="text-xs text-qalam-soft">{STAR_LABELS[lang][stars - 1]}</span>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("feedbackPlaceholder", lang)}
          className="min-w-0 flex-1 rounded-md border border-ink-600 bg-ink-950 px-3 py-1.5 text-sm outline-none placeholder:text-ink-500 focus:border-qalam"
          dir="auto"
        />
        <button
          onClick={() => send(stars ?? 2, true)}
          disabled={status === "sending" || !comment.trim()}
          className="shrink-0 rounded-md bg-qalam px-3 py-1.5 text-sm font-medium text-ink-950 transition hover:bg-qalam-soft disabled:opacity-40"
        >
          {t("sendFeedback", lang)}
        </button>
      </div>
      {status === "done" && (
        <p className="mt-2 text-xs text-teal-glow">{t("feedbackSaved", lang)}</p>
      )}
    </div>
  );
}
