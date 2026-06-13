"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AWARDS } from "@/lib/brand";

export function AdminControls({
  id,
  featured,
  award,
}: {
  id: string;
  featured: boolean;
  award: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [isFeatured, setIsFeatured] = useState(featured);
  const [aw, setAw] = useState(award || "");

  async function toggleFeatured() {
    setBusy(true);
    const next = !isFeatured;
    setIsFeatured(next);
    try {
      await fetch("/api/admin/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, featured: next }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveAward(value: string) {
    setAw(value);
    setBusy(true);
    try {
      await fetch("/api/admin/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, award: value || null }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={toggleFeatured}
        disabled={busy}
        className={
          "rounded-full border px-3 py-1.5 font-mono text-[9px] uppercase tracking-label transition-colors disabled:opacity-50 " +
          (isFeatured ? "border-accent2 text-accent2" : "border-on/25 text-on/55 hover:text-on")
        }
      >
        {isFeatured ? "★ In selection" : "☆ Add to selection"}
      </button>

      <select
        className="border border-on/20 bg-card px-3 py-1.5 font-mono text-[9px] uppercase tracking-label text-on"
        value={aw}
        onChange={(e) => saveAward(e.target.value)}
        disabled={busy}
        aria-label="Award"
      >
        <option value="">— No award —</option>
        {AWARDS.map((a) => (
          <option key={a.name} value={a.name}>
            ✦ {a.name}
          </option>
        ))}
      </select>
    </div>
  );
}
