import { connectorList } from "@/lib/studio/connectors";
import { driver, persistenceNote } from "@/lib/studio/store";

export const dynamic = "force-dynamic";

export default function Connectors() {
  const rows = connectorList.map(c => ({ c, s: c.status() }));
  const env = rows.flatMap(({ c, s }) => s.missing.map(m => ({ platform: c.name, name: m })));

  return (
    <>
      <p className="s-eyebrow">Connectors</p>
      <h1 className="s-h1">Five platforms,<br />one contract.</h1>
      <p className="s-lede">
        Each connector is a real client for its platform&rsquo;s documented publishing API.
        None of them simulate a post: with credentials present they make the actual calls,
        and without credentials they refuse and name what is missing. Set the variables
        below and the connector goes live with no code change.
      </p>

      {rows.map(({ c, s }) => (
        <section className="s-section" key={c.id}>
          <div className="s-section-hd">
            <h2 className="s-h2">{c.name}</h2>
            <span style={{ display: "flex", gap: 8 }}>
              {s.configured
                ? <span className="s-tag ok">connected</span>
                : <span className="s-tag warn">needs {s.missing.length} variable{s.missing.length > 1 ? "s" : ""}</span>}
              <span className={c.verified === "primary-docs" ? "s-tag ok" : "s-tag mute"}>
                {c.verified === "primary-docs" ? "verified against docs" : "unverified"}
              </span>
            </span>
          </div>

          <div className="s-card">
            {c.requiredEnv.map(e => (
              <div className="s-env" key={e.name}>
                <span className={s.present.includes(e.name) ? "s-tag ok" : "s-tag bad"}>
                  {s.present.includes(e.name) ? "set" : "missing"}
                </span>
                <code>{e.name}</code>
                <span className="d">{e.description}</span>
              </div>
            ))}
            <div className="s-caps">
              {(Object.keys(c.capabilities) as (keyof typeof c.capabilities)[])
                .filter(k => c.capabilities[k])
                .map(k => <span className="s-tag mute" key={k}>{k}</span>)}
              <span className="s-tag mute">caption ≤ {c.limits.captionMax}</span>
              <span className="s-tag mute">{c.limits.rateLimit}</span>
            </div>
            <p className="s-note">
              {c.verifiedNote}{" "}
              <a href={c.docsUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
                Platform docs
              </a>
            </p>
          </div>
        </section>
      ))}

      <section className="s-section">
        <div className="s-section-hd"><h2 className="s-h2">Setup</h2></div>
        <p className="s-lede">
          Put these in <code>.env.local</code> for local work, or in the deployment&rsquo;s
          environment variables. Restart after adding them.
        </p>
        <pre className="s-pre">{env.length === 0
          ? "# Every connector is configured."
          : env.map(e => `# ${e.platform}\n${e.name}=`).join("\n")}</pre>
        <p className="s-note"><b>Storage: {driver()}.</b> {persistenceNote()}</p>
      </section>
    </>
  );
}
