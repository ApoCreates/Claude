"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReviewButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<string | null>(null);
  async function run() {
    setBusy(true); setOut(null);
    try {
      const res = await fetch("/api/studio/review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const json = await res.json();
      setOut(json.findings?.length ? JSON.stringify(json, null, 2) : `${json.verdict} — nothing found.`);
      router.refresh();
    } catch (e) { setOut(String(e)); } finally { setBusy(false); }
  }
  return (
    <>
      <button className="s-btn" onClick={run} disabled={busy}>{busy ? "checking…" : "Run review"}</button>
      {out && <pre className="s-pre">{out}</pre>}
    </>
  );
}
