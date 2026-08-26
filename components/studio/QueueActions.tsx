"use client";
import { useState } from "react";
import type { Platform } from "@/lib/studio/types";

interface Props { postId: string; platform: Platform; disabled?: boolean; disabledReason?: string }

export default function QueueActions({ postId, platform, disabled, disabledReason }: Props) {
  const [busy, setBusy] = useState<null | "dry" | "live">(null);
  const [out, setOut] = useState<string | null>(null);

  async function run(dryRun: boolean) {
    setBusy(dryRun ? "dry" : "live");
    setOut(null);
    try {
      const res = await fetch("/api/studio/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, platform, dryRun }),
      });
      const json = await res.json();
      setOut(JSON.stringify(json, null, 2));
    } catch (e) {
      setOut(String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button className="s-btn" onClick={() => run(true)} disabled={busy !== null}>
          {busy === "dry" ? "checking…" : "Dry run"}
        </button>
        <button
          className="s-btn accent"
          onClick={() => run(false)}
          disabled={busy !== null || disabled}
          title={disabled ? disabledReason : undefined}
        >
          {busy === "live" ? "publishing…" : "Publish"}
        </button>
        {disabled && <span className="s-mono">{disabledReason}</span>}
      </div>
      {out && <pre className="s-pre">{out}</pre>}
    </div>
  );
}
