import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubmissionBySlug, listRatings, listSubmissions, summarize } from "@/lib/store";
import { RATING_CRITERIA } from "@/lib/brand";
import { formatDuration, formatDate } from "@/lib/utils";
import { parseYouTube, youtubeWatchUrl } from "@/lib/youtube";
import { posterFor } from "@/lib/poster";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { AudienceVote } from "@/components/AudienceVote";
import { ShareButton } from "@/components/ShareButton";
import { FilmCard } from "@/components/FilmCard";
import { Eyebrow } from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const sub = await getSubmissionBySlug(params.slug);
  if (!sub) return { title: "Film not found" };
  const poster = posterFor(sub, "max");
  return {
    title: sub.title,
    description: sub.logline,
    openGraph: {
      title: sub.title,
      description: sub.logline,
      images: poster ? [poster] : undefined,
      type: "video.other",
    },
  };
}

export default async function FilmPage({ params }: { params: { slug: string } }) {
  const sub = await getSubmissionBySlug(params.slug);
  if (!sub) notFound();

  const ratings = await listRatings(sub.id);
  const summary = summarize(ratings);
  const ref = parseYouTube(sub.youtube_url);

  const others = (await listSubmissions())
    .filter((s) => s.id !== sub.id)
    .sort((a, b) => (a.cohort === sub.cohort ? -1 : 1))
    .slice(0, 3);

  const crew = sub.crew.filter((m) => m.name.trim());

  return (
    <article className="mx-auto max-w-shell px-6 py-10 sm:px-10">
      <Link href="/films" className="font-mono text-[10px] uppercase tracking-label text-on/45 hover:text-on">
        ← The selection
      </Link>

      {/* header */}
      <header className="mt-8">
        <Eyebrow>
          {sub.cohort} · {sub.category || "Film"} · {formatDuration(sub.duration_seconds)}
        </Eyebrow>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <h1 className="font-serif text-on" style={{ fontSize: "clamp(40px, 7vw, 92px)", lineHeight: 0.95, letterSpacing: "-0.03em", fontWeight: 400 }}>
            {sub.title}
          </h1>
          {sub.award && (
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-1.5 font-mono text-[10px] uppercase tracking-label text-gold">
              ✦ {sub.award}
            </span>
          )}
        </div>
        <p className="mt-5 max-w-3xl font-serif text-2xl italic leading-snug text-accent" style={{ fontVariationSettings: '"opsz" 96, "SOFT" 50' }}>
          {sub.logline}
        </p>
      </header>

      {/* player */}
      <div className="mt-10">
        <YouTubeEmbed url={sub.youtube_url} title={sub.title} />
        {ref && (
          <div className="mt-3 text-center">
            <a href={youtubeWatchUrl(ref)} target="_blank" rel="noreferrer" className="font-mono text-[10px] uppercase tracking-label text-on/40 hover:text-on">
              Watch on YouTube ↗
            </a>
          </div>
        )}
      </div>

      {/* details + sidebar */}
      <div className="mt-14 grid gap-12 lg:grid-cols-[1.7fr_1fr]">
        <div>
          <SectionTitle>The film</SectionTitle>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
            <Meta term="Team" value={sub.team_name} />
            <Meta term="Duration" value={formatDuration(sub.duration_seconds)} />
            <Meta term="Category" value={sub.category || "—"} />
            <Meta term="Edition" value={sub.cohort} />
            <Meta term="Submitted" value={formatDate(sub.created_at)} />
            <Meta term="Audience" value={`♥ ${sub.votes}`} />
          </dl>

          <div className="mt-12">
            <SectionTitle>AI toolchain</SectionTitle>
            <p className="font-serif text-lg leading-relaxed text-on/80">{sub.ai_tools || "—"}</p>
            <div className="mt-6 border-l-2 border-ochre/60 pl-5">
              <div className="font-mono text-[10px] uppercase tracking-label text-on/45">AI disclosure</div>
              <p className="mt-2 font-serif text-[15px] leading-relaxed text-on/65">{sub.ai_disclosure || "—"}</p>
            </div>
          </div>
        </div>

        {/* sidebar */}
        <aside className="space-y-10">
          <div>
            <SectionTitle>Crew</SectionTitle>
            <ul className="divide-y divide-on/10 border-t border-on/10">
              {crew.length ? (
                crew.map((m, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-4 py-3">
                    <span className="font-serif text-lg text-on">{m.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-label text-on/45">{m.role}</span>
                  </li>
                ))
              ) : (
                <li className="py-3 font-serif text-on/45">—</li>
              )}
            </ul>
          </div>

          {summary.count > 0 && (
            <div>
              <SectionTitle>Jury score</SectionTitle>
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-5xl text-gold" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}>
                  {summary.overall.toFixed(1)}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-label text-on/45">/ 10 · {summary.count} {summary.count === 1 ? "juror" : "jurors"}</span>
              </div>
              <div className="mt-5 space-y-3">
                {RATING_CRITERIA.map((c) => {
                  const v = summary[c.key];
                  return (
                    <div key={c.key}>
                      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-label text-on/50">
                        <span>{c.label}</span>
                        <span>{v.toFixed(1)}</span>
                      </div>
                      <div className="mt-1 h-1 w-full bg-on/10">
                        <div className="h-full bg-gradient-to-r from-accent2 to-accent" style={{ width: `${(v / 10) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <AudienceVote id={sub.id} initial={sub.votes} />
            <ShareButton url={`/film/${sub.slug}`} title={sub.title} />
          </div>
        </aside>
      </div>

      {/* related */}
      {others.length > 0 && (
        <section className="mt-20">
          <SectionTitle>More from the selection</SectionTitle>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((s) => (
              <FilmCard key={s.id} sub={s} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-5 font-mono text-[10px] uppercase tracking-label text-on/45">{children}</h2>;
}

function Meta({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-label text-on/40">{term}</dt>
      <dd className="mt-1.5 font-serif text-lg text-on">{value}</dd>
    </div>
  );
}
