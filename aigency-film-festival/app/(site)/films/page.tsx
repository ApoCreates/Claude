import Link from "next/link";
import { listSubmissions, summariesFor } from "@/lib/store";
import { FESTIVAL } from "@/lib/brand";
import { Eyebrow } from "@/components/ui";
import { FilmCard } from "@/components/FilmCard";
import { cx } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "The Official Selection" };

export default async function FilmsPage({
  searchParams,
}: {
  searchParams?: { cohort?: string };
}) {
  const cohortFilter = searchParams?.cohort;
  const all = await listSubmissions();
  const cohorts = Array.from(new Set(all.map((s) => s.cohort))).filter(Boolean);
  const films = cohortFilter ? all.filter((s) => s.cohort === cohortFilter) : all;
  const summaries = await summariesFor(films.map((s) => s.id));

  // awarded first, then by votes
  const ordered = [...films].sort((a, b) => {
    if (!!a.award !== !!b.award) return a.award ? -1 : 1;
    return b.votes - a.votes;
  });

  return (
    <section className="mx-auto max-w-shell px-6 py-12 sm:px-10 sm:py-16">
      <Eyebrow>{FESTIVAL.edition}</Eyebrow>
      <h1 className="display mt-6 text-on" style={{ fontSize: "clamp(44px, 8vw, 104px)", fontWeight: 300 }}>
        The Official
        <br />
        <span className="italic">Selection.</span>
      </h1>
      <p className="mt-6 max-w-lg font-serif text-lg text-on/65">
        Every film submitted to the festival, each with a page of its own.
      </p>

      {cohorts.length > 1 && (
        <div className="mt-10 flex flex-wrap items-center gap-2">
          <FilterChip href="/films" active={!cohortFilter}>
            All
          </FilterChip>
          {cohorts.map((c) => (
            <FilterChip key={c} href={`/films?cohort=${encodeURIComponent(c)}`} active={cohortFilter === c}>
              {c}
            </FilterChip>
          ))}
        </div>
      )}

      <div className="mt-10">
        {ordered.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ordered.map((s) => (
              <FilmCard key={s.id} sub={s} score={summaries[s.id]?.overall} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-on/15 p-12 text-center font-serif text-xl text-on/60">
            No films yet — <Link href="/submit" className="text-accent underline-offset-4 hover:underline">submit the first</Link>.
          </div>
        )}
      </div>
    </section>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cx(
        "rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-label transition-colors",
        active ? "border-accent2 bg-white/[0.04] text-on" : "border-on/20 text-on/55 hover:text-on"
      )}
    >
      {children}
    </Link>
  );
}
