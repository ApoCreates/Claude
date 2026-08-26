import { listRuns } from "@/lib/studio/runs";

export const dynamic = "force-dynamic";

const DESKS = ["01-brief", "02-research", "03-copy", "04-design", "05-build", "06-arabic", "07-review"];

export default async function Runs() {
  const runs = await listRuns();
  return (
    <>
      <p className="s-eyebrow">Floor runs</p>
      <h1 className="s-h1">What the desks left behind.</h1>
      <p className="s-lede">
        Each run is a directory under <code>.aigency/runs/</code>, one numbered artefact per
        desk. Started with <code>/floor</code> in Claude Code; read-only here — the desks
        write, the dashboard looks.
      </p>

      {runs.length === 0 ? (
        <div className="s-card" style={{ marginTop: 24 }}>
          <p style={{ margin: 0 }}>No runs yet.</p>
          <pre className="s-pre">/floor a one-page capability profile for a government AI-literacy programme</pre>
        </div>
      ) : runs.map(r => (
        <section className="s-section" key={r.slug}>
          <div className="s-section-hd">
            <h2 className="s-h2">{r.slug}</h2>
            <span className="s-mono">{r.updatedAt ? new Date(r.updatedAt).toUTCString().slice(5, 22) : ""}</span>
          </div>
          <div className="s-caps">
            {DESKS.map(d => {
              const done = r.artefacts.some(a => a.startsWith(d));
              return <span className={done ? "s-tag ok" : "s-tag mute"} key={d}>{d.slice(3)}</span>;
            })}
          </div>
        </section>
      ))}
    </>
  );
}
