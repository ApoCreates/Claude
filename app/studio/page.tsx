import Link from "next/link";
import { connectorList } from "@/lib/studio/connectors";
import { listPosts, driver, persistenceNote } from "@/lib/studio/store";
import { blockedReason, isDue } from "@/lib/studio/queue";
import { listRuns } from "@/lib/studio/runs";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const posts = await listPosts();
  const runs = await listRuns();
  const statuses = connectorList.map(c => ({ c, s: c.status() }));
  const connected = statuses.filter(x => x.s.configured).length;

  const targets = posts.flatMap(p => p.targets);
  const scheduled = posts.filter(p => p.scheduledFor && !isDue(p)).length;
  const blocked = posts.filter(p => blockedReason(p)).length;
  const published = targets.filter(t => t.status === "published").length;

  return (
    <>
      <p className="s-eyebrow">The studio floor</p>
      <h1 className="s-h1">Everything the floor made,<br />and where it stands.</h1>
      <p className="s-lede">
        Runs come off the seven desks, land in the queue, and go out through the connectors —
        but only once the review desk has passed them. Nothing here publishes on its own
        without credentials, and nothing publishes at all on a failed review.
      </p>

      <div className="s-grid s-kpis">
        <div className="s-card s-kpi"><b>{posts.length}</b><span>posts on the floor</span></div>
        <div className="s-card s-kpi"><b>{scheduled}</b><span>scheduled</span></div>
        <div className="s-card s-kpi"><b>{blocked}</b><span>held by review</span></div>
        <div className="s-card s-kpi"><b>{connected}/{statuses.length}</b><span>connectors live</span></div>
        <div className="s-card s-kpi"><b>{published}</b><span>published</span></div>
      </div>

      <section className="s-section">
        <div className="s-section-hd">
          <h2 className="s-h2">The queue</h2>
          <Link className="s-mono" href="/studio/queue">Open the queue →</Link>
        </div>
        {posts.length === 0 && <p className="s-lede">Nothing queued yet.</p>}
        {posts.slice(0, 6).map(p => {
          const why = blockedReason(p);
          return (
            <div className="s-row" key={p.id}>
              <div className="t">
                <b>{p.title}</b>
                <span>{p.text.split("\n")[0]}</span>
              </div>
              <div className="s-caps">
                {p.targets.map(t => (
                  <span className="s-tag mute" key={t.platform}>{t.platform}</span>
                ))}
              </div>
              {why
                ? <span className="s-tag bad" title={why}>held</span>
                : <span className="s-tag ok">cleared</span>}
              <span className="s-mono" style={{ minWidth: 128, textAlign: "right" }}>
                {p.scheduledFor ? new Date(p.scheduledFor).toUTCString().slice(5, 22) : "unscheduled"}
              </span>
            </div>
          );
        })}
      </section>

      <section className="s-section">
        <div className="s-section-hd">
          <h2 className="s-h2">Connectors</h2>
          <Link className="s-mono" href="/studio/connectors">Set them up →</Link>
        </div>
        <div className="s-grid s-cards">
          {statuses.map(({ c, s }) => (
            <div className="s-card" key={c.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <b style={{ fontSize: 17 }}>{c.name}</b>
                {s.configured
                  ? <span className="s-tag ok">connected</span>
                  : <span className="s-tag warn">needs keys</span>}
                {c.verified === "unverified" && <span className="s-tag mute" title={c.verifiedNote}>unverified</span>}
              </div>
              <p className="s-mono" style={{ marginTop: 10 }}>
                {s.configured ? c.limits.rateLimit : `Missing ${s.missing.join(", ")}`}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="s-section">
        <div className="s-section-hd">
          <h2 className="s-h2">Floor runs</h2>
          <Link className="s-mono" href="/studio/runs">All runs →</Link>
        </div>
        {runs.length === 0
          ? <p className="s-lede">No runs yet. Start one with <code>/floor</code> in Claude Code — it writes into <code>.aigency/runs/</code> and they appear here.</p>
          : runs.slice(0, 5).map(r => (
            <div className="s-row" key={r.slug}>
              <div className="t"><b>{r.slug}</b><span>{r.artefacts.join(" · ")}</span></div>
              <span className="s-tag mute">{r.artefacts.length}/7 desks</span>
            </div>
          ))}
      </section>

      <p className="s-note">
        <b>Storage: {driver()}.</b> {persistenceNote()}
      </p>
    </>
  );
}
