"use client";

import { useEffect, useState } from "react";

export function AudienceVote({ id, initial }: { id: string; initial: number }) {
  const [count, setCount] = useState(initial);
  const [voted, setVoted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(`aff_vote_${id}`)) setVoted(true);
    } catch {}
  }, [id]);

  async function vote() {
    if (voted || busy) return;
    setBusy(true);
    setCount((c) => c + 1); // optimistic
    setVoted(true);
    try {
      localStorage.setItem(`aff_vote_${id}`, "1");
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => null);
      if (data && typeof data.votes === "number") setCount(data.votes);
    } catch {
      // keep optimistic value
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={vote}
      disabled={voted}
      className={
        "group flex w-full items-center justify-between border px-5 py-4 transition-colors " +
        (voted ? "border-gold/50 text-gold" : "border-on/20 text-on hover:border-accent2")
      }
      aria-pressed={voted}
    >
      <span className="font-mono text-[10px] uppercase tracking-label">
        {voted ? "Counted — thank you" : "Audience favourite"}
      </span>
      <span className="flex items-center gap-2 font-serif text-xl">
        <span className={voted ? "" : "transition-transform group-hover:scale-110"}>♥</span>
        {count}
      </span>
    </button>
  );
}
