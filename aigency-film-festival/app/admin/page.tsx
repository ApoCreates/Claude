import Link from "next/link";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidToken, usingDefaultPassword } from "@/lib/auth";
import { listSubmissions, listRatings, storeMode, summarize } from "@/lib/store";
import { emailConfigured } from "@/lib/email";
import { FESTIVAL } from "@/lib/brand";
import { Mark, Lockup } from "@/components/brandmarks";
import { AdminControls } from "@/components/admin/AdminControls";
import { RatingForm } from "@/components/admin/RatingForm";
import { formatDuration, formatDate, average } from "@/lib/utils";
import { posterFor } from "@/lib/poster";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jury & Admin" };

export default async function AdminPage({ searchParams }: { searchParams?: { error?: string } }) {
  const authed = isValidToken(cookies().get(ADMIN_COOKIE)?.value);
  if (!authed) return <LoginView error={!!searchParams?.error} />;

  const subs = await listSubmissions();
  const allRatings = await listRatings();
  const summaryFor = (id: string) => summarize(allRatings.filter((r) => r.submission_id === id));

  const leaderboard = [...subs].sort((a, b) => {
    const d = summaryFor(b.id).overall - summaryFor(a.id).overall;
    return d !== 0 ? d : b.votes - a.votes;
  });

  const avgDur = subs.length ? formatDuration(average(subs.map((s) => s.duration_seconds))) : "—";

  return (
    <div className="mx-auto max-w-shell px-6 py-8 sm:px-10">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-on/12 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Lockup size={28} />
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-label text-on/45">/ Jury &amp; Admin</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip ok={storeMode() === "supabase"} on="Database · live" off="Database · demo" />
          <StatusChip ok={emailConfigured()} on="Email · on" off="Email · off" />
          {usingDefaultPassword() && (
            <span className="rounded-full border border-dusk px-3 py-1.5 font-mono text-[9px] uppercase tracking-label text-accent2">
              Set ADMIN_PASSWORD
            </span>
          )}
          <Link href="/" className="rounded-full border border-on/20 px-3 py-1.5 font-mono text-[9px] uppercase tracking-label text-on/55 hover:text-on">
            View site ↗
          </Link>
          <a href="/api/admin/export" className="rounded-full border border-on/20 px-3 py-1.5 font-mono text-[9px] uppercase tracking-label text-on/55 hover:text-on">
            Export CSV
          </a>
          <form action="/api/admin/logout" method="post">
            <button className="rounded-full border border-on/20 px-3 py-1.5 font-mono text-[9px] uppercase tracking-label text-on/55 hover:text-on">
              Log out
            </button>
          </form>
        </div>
      </div>

      <h1 className="mt-8 font-serif text-on" style={{ fontSize: "clamp(34px, 5vw, 56px)", letterSpacing: "-0.02em", fontWeight: 400 }}>
        The jury room.
      </h1>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-label text-on/45">{FESTIVAL.edition}</p>

      {/* stats */}
      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-on/12 bg-on/12 sm:grid-cols-5">
        <KPI label="Films" value={subs.length} />
        <KPI label="In selection" value={subs.filter((s) => s.featured).length} />
        <KPI label="Awarded" value={subs.filter((s) => s.award).length} />
        <KPI label="Jury scores" value={allRatings.length} />
        <KPI label="Avg length" value={avgDur} />
      </div>

      {/* leaderboard */}
      {subs.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-mono text-[10px] uppercase tracking-label text-on/45">Leaderboard</h2>
          <div className="overflow-x-auto border border-on/12">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-on/12 font-mono text-[9px] uppercase tracking-label text-on/40">
                  <th className="p-3">#</th>
                  <th className="p-3">Film</th>
                  <th className="p-3">Team</th>
                  <th className="p-3 text-right">Jury</th>
                  <th className="p-3 text-right">♥</th>
                  <th className="p-3">Award</th>
                </tr>
              </thead>
              <tbody className="font-serif">
                {leaderboard.map((s, i) => {
                  const sum = summaryFor(s.id);
                  return (
                    <tr key={s.id} className="border-b border-on/8 last:border-0">
                      <td className="p-3 font-mono text-xs text-on/40">{i + 1}</td>
                      <td className="p-3">
                        <Link href={`/film/${s.slug}`} className="text-on hover:text-accent">{s.title}</Link>
                      </td>
                      <td className="p-3 text-on/55">{s.team_name}</td>
                      <td className="p-3 text-right text-gold">{sum.count ? sum.overall.toFixed(1) : "—"}</td>
                      <td className="p-3 text-right text-on/55">{s.votes}</td>
                      <td className="p-3 font-mono text-[9px] uppercase tracking-label text-accent2">{s.award || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* submissions + rating */}
      <section className="mt-12">
        <h2 className="mb-4 font-mono text-[10px] uppercase tracking-label text-on/45">All submissions</h2>
        {subs.length === 0 ? (
          <div className="border border-dashed border-on/15 p-12 text-center font-serif text-on/55">
            No submissions yet.
          </div>
        ) : (
          <div className="space-y-5">
            {subs.map((s) => {
              const sum = summaryFor(s.id);
              const poster = posterFor(s, "hq");
              return (
                <div key={s.id} className="grid gap-6 border border-on/12 bg-card p-5 lg:grid-cols-[1.6fr_1fr]">
                  <div className="flex gap-4">
                    <div className="hidden h-24 w-40 shrink-0 overflow-hidden bg-surface2 sm:block">
                      {poster && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={poster} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <Link href={`/film/${s.slug}`} className="font-serif text-xl text-on hover:text-accent">{s.title}</Link>
                        {s.award && <span className="font-mono text-[9px] uppercase tracking-label text-gold">✦ {s.award}</span>}
                      </div>
                      <p className="mt-1 line-clamp-2 font-serif text-sm text-on/55">{s.logline}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-label text-on/40">
                        <span>{s.team_name}</span>
                        <span>{formatDuration(s.duration_seconds)}</span>
                        <span>{s.cohort}</span>
                        <span>{formatDate(s.created_at)}</span>
                        <span className="text-gold">jury {sum.count ? `${sum.overall} · ${sum.count}` : "—"}</span>
                        <span>♥ {s.votes}</span>
                        <span className="text-accent2">{s.submitter_email}</span>
                      </div>
                      <div className="mt-4">
                        <AdminControls id={s.id} featured={s.featured} award={s.award} />
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-on/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <RatingForm submissionId={s.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="h-10" />
    </div>
  );
}

function KPI({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-surface p-5">
      <div className="font-serif text-3xl text-on" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}>
        {value}
      </div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-label text-on/45">{label}</div>
    </div>
  );
}

function StatusChip({ ok, on, off }: { ok: boolean; on: string; off: string }) {
  return (
    <span
      className={
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[9px] uppercase tracking-label " +
        (ok ? "border-on/20 text-on/60" : "border-on/15 text-on/40")
      }
    >
      <span className={"h-1.5 w-1.5 rounded-full " + (ok ? "bg-accent2" : "bg-on/30")} />
      {ok ? on : off}
    </span>
  );
}

function LoginView({ error }: { error: boolean }) {
  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Mark size={72} glow />
        </div>
        <h1 className="mt-8 text-center font-serif text-3xl text-on" style={{ letterSpacing: "-0.02em" }}>
          Jury &amp; Admin
        </h1>
        <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-label text-on/45">
          {FESTIVAL.name}
        </p>

        {error && (
          <div className="mt-6 border border-dusk bg-dusk/15 px-4 py-3 text-center font-sans text-sm text-on">
            Wrong password.
          </div>
        )}

        <form action="/api/admin/login" method="post" className="mt-6 space-y-3">
          <input type="hidden" name="next" value="/admin" />
          <input
            className="field"
            type="password"
            name="password"
            placeholder="Password"
            autoFocus
            required
          />
          <button className="w-full bg-gold py-3 font-sans text-sm font-semibold text-surface transition-colors hover:bg-accent">
            Enter
          </button>
        </form>

        {usingDefaultPassword() && (
          <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-label text-on/35">
            Demo password: <span className="text-on/60">aigency</span> — set ADMIN_PASSWORD to change
          </p>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="font-mono text-[10px] uppercase tracking-label text-on/40 hover:text-on">
            ← Back to the festival
          </Link>
        </div>
      </div>
    </div>
  );
}
