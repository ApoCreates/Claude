"use client";

import { useState } from "react";
import { Check, Copy, ThumbsDown, ThumbsUp } from "lucide-react";
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

/**
 * The teaching control — attached to every piece of work the agent
 * produces (Studio outputs and Gym drills alike). A comment becomes a
 * distilled lesson in the agent's brain.
 */
export function FeedbackBox({
  mode,
  excerpt,
  source,
  lang,
  compact,
}: {
  mode: string;
  excerpt: string;
  source: LessonSource;
  lang: UILang;
  compact?: boolean;
}) {
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  async function submit(r: "up" | "down") {
    setRating(r);
    if (!comment.trim()) {
      // rating-only: record silently
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, rating: r, excerpt, source }),
      });
      return;
    }
    setStatus("sending");
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, rating: r, comment, excerpt, source }),
    });
    setStatus("done");
  }

  return (
    <div className={cn("mt-3 rounded-lg border border-ink-700 bg-ink-900/60 p-3", compact && "p-2.5")}>
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-400">{t("feedbackPrompt", lang)}</span>
        <div className="ms-auto flex gap-1.5">
          <button
            onClick={() => submit("up")}
            className={cn(
              "rounded-md border border-ink-600 p-1.5 transition hover:border-teal-glow hover:text-teal-glow",
              rating === "up" && "border-teal-glow text-teal-glow"
            )}
            aria-label="Good"
          >
            <ThumbsUp size={14} />
          </button>
          <button
            onClick={() => submit("down")}
            className={cn(
              "rounded-md border border-ink-600 p-1.5 transition hover:border-red-400 hover:text-red-400",
              rating === "down" && "border-red-400 text-red-400"
            )}
            aria-label="Needs work"
          >
            <ThumbsDown size={14} />
          </button>
        </div>
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
          onClick={() => submit(rating || "down")}
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
