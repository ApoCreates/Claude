"use client";
import { useState } from "react";

export default function TickButton() {
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<string | null>(null);
  async function go(dryRun: boolean) {
    setBusy(true); setOut(null);
    try {
      const res = await fetch(`/api/studio/tick${dryRun ? "?dryRun=1" : ""}`, { method: "POST" });
      setOut(JSON.stringify(await res.json(), null, 2));
    } catch (e) { setOut(String(e)); } finally { setBusy(false); }
  }
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="s-btn" onClick={() => go(true)} disabled={busy}>Tick (dry run)</button>
        <button className="s-btn accent" onClick={() => go(false)} disabled={busy}>Run scheduler</button>
      </div>
      {out && <pre className="s-pre">{out}</pre>}
    </div>
  );
}
