"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RATING_CRITERIA } from "@/lib/brand";

type Vals = { story: number; craft: number; ai: number; emotion: number };

export function RatingForm({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [juror, setJuror] = useState("");
  const [vals, setVals] = useState<Vals>({ story: 7, craft: 7, ai: 7, emotion: 7 });
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const overall = ((vals.story + vals.craft + vals.ai + vals.emotion) / 4).toFixed(1);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId, juror, ...vals, notes }),
      });
      if (res.ok) {
        setDone(true);
        setNotes("");
        setVals({ story: 7, craft: 7, ai: 7, emotion: 7 });
        router.refresh();
        setTimeout(() => setDone(false), 1600);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-label text-on/45">Add a jury score</span>
        <span className="font-serif text-2xl text-gold">{overall}</span>
      </div>

      <input
        className="field"
        placeholder="Juror name (optional)"
        value={juror}
        onChange={(e) => setJuror(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-x-5 gap-y-3">
        {RATING_CRITERIA.map((c) => (
          <label key={c.key} className="block">
            <span className="flex items-center justify-between font-mono text-[9px] uppercase tracking-label text-on/55">
              <span title={c.hint}>{c.label}</span>
              <span className="text-gold">{vals[c.key as keyof Vals]}</span>
            </span>
            <input
              type="range"
              min={1}
              max={10}
              value={vals[c.key as keyof Vals]}
              onChange={(e) => setVals((v) => ({ ...v, [c.key]: Number(e.target.value) }))}
              className="mt-1 w-full"
              style={{ accentColor: "#D9A24A" }}
            />
          </label>
        ))}
      </div>

      <textarea
        className="field"
        rows={2}
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-gold py-2.5 font-sans text-sm font-semibold text-surface transition-colors hover:bg-accent disabled:opacity-60"
      >
        {done ? "Saved ✓" : busy ? "Saving…" : "Submit score"}
      </button>
    </form>
  );
}
