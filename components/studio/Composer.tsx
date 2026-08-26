"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MediaKind, Platform } from "@/lib/studio/types";

const PLATFORMS: Platform[] = ["instagram", "tiktok", "linkedin", "x", "youtube"];
const KINDS: MediaKind[] = ["text", "image", "video", "carousel"];

export default function Composer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [kind, setKind] = useState<MediaKind>("text");
  const [media, setMedia] = useState("");
  const [when, setWhen] = useState("");
  const [targets, setTargets] = useState<Platform[]>(["linkedin"]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function create() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/studio/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, text, kind,
          mediaUrls: media.split("\n").map(s => s.trim()).filter(Boolean),
          scheduledFor: when ? new Date(when).toISOString() : null,
          targets: targets.map(p => ({ platform: p, status: "draft" })),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setMsg(json.error ?? "Could not create the post."); return; }
      // Run the gate immediately — a post nobody reviewed cannot publish anyway.
      const rev = await fetch("/api/studio/review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: json.post.id }),
      }).then(r => r.json());
      setMsg(`Created. Review: ${rev.verdict}${rev.verdict === "FAIL" ? ` — ${rev.findings.filter((f: {severity:string}) => f.severity === "fail").map((f: {rule:string}) => f.rule).join(", ")}` : ""}`);
      setTitle(""); setText(""); setMedia(""); setWhen("");
      router.refresh();
    } catch (e) { setMsg(String(e)); } finally { setBusy(false); }
  }

  if (!open) {
    return <button className="s-btn accent" onClick={() => setOpen(true)}>New post</button>;
  }

  const field: React.CSSProperties = {
    width: "100%", padding: "10px 12px", border: "1px solid rgba(21,20,15,.22)",
    borderRadius: 2, background: "#F4EFE5", color: "#15140F", fontFamily: "inherit", fontSize: 15,
  };

  return (
    <div className="s-card" style={{ marginTop: 12 }}>
      <div style={{ display: "grid", gap: 12 }}>
        <input style={field} placeholder="Title — for the floor, not the post" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea style={{ ...field, minHeight: 120, lineHeight: 1.5 }} placeholder="The post itself" value={text} onChange={e => setText(e.target.value)} />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <select style={{ ...field, width: "auto" }} value={kind} onChange={e => setKind(e.target.value as MediaKind)}>
            {KINDS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <input style={{ ...field, width: "auto" }} type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} />
          <span className="s-mono">{text.length} characters</span>
        </div>
        {kind !== "text" && (
          <textarea style={{ ...field, minHeight: 70 }} placeholder="Media URLs, one per line. Relative paths resolve against this deployment." value={media} onChange={e => setMedia(e.target.value)} />
        )}
        <div className="s-caps">
          {PLATFORMS.map(p => (
            <button key={p} type="button"
              className={targets.includes(p) ? "s-tag warn" : "s-tag mute"}
              style={{ cursor: "pointer", background: "none" }}
              onClick={() => setTargets(t => t.includes(p) ? t.filter(x => x !== p) : [...t, p])}>
              {p}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="s-btn accent" onClick={create} disabled={busy || !title || !text || targets.length === 0}>
            {busy ? "creating…" : "Create and review"}
          </button>
          <button className="s-btn" onClick={() => setOpen(false)} disabled={busy}>Close</button>
          {msg && <span className="s-mono">{msg}</span>}
        </div>
      </div>
    </div>
  );
}
