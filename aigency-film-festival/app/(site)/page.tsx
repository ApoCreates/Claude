import Link from "next/link";
import { listSubmissions, summariesFor } from "@/lib/store";
import { ARC, AWARDS, BRAND, FESTIVAL, GRAND_PRIZE } from "@/lib/brand";
import { Mark, FestivalLockup, PrizeSun } from "@/components/brandmarks";
import { Eyebrow, SectionLabel, ButtonLink, Stat } from "@/components/ui";
import { FilmCard } from "@/components/FilmCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const all = await listSubmissions();
  const featured = all.filter((s) => s.featured);
  const showcase = (featured.length ? featured : all).slice(0, 6);
  const summaries = await summariesFor(showcase.map((s) => s.id));
  const cohorts = new Set(all.map((s) => s.cohort)).size;

  return (
    <>
      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="mx-auto grid max-w-shell items-center gap-10 px-6 pb-12 pt-12 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
        <div>
          <Eyebrow>{FESTIVAL.service}</Eyebrow>
          <div className="mt-8">
            <FestivalLockup size={44} />
          </div>
          <h1 className="display mt-8 text-on" style={{ fontSize: "clamp(56px, 9vw, 132px)", fontWeight: 300 }}>
            Film
            <br />
            <span style={{ fontStyle: "italic" }}>Festival.</span>
          </h1>
          <div className="mt-8 flex flex-wrap items-baseline gap-x-7 gap-y-2">
            <span className="font-serif text-2xl italic text-accent" style={{ fontVariationSettings: '"opsz" 96, "SOFT" 50' }}>
              {FESTIVAL.tagline}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-label text-on/45">{FESTIVAL.edition}</span>
          </div>
          <p className="mt-8 max-w-md font-serif text-lg leading-relaxed text-on/70">
            A festival of short films made with AI. You bring the reason to care; the tools bring the light.
            Submit your film and the portal turns it, at once, into a page of its own.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <ButtonLink href="/submit">Submit your film →</ButtonLink>
            <ButtonLink href="/films" variant="ghost">
              See the selection
            </ButtonLink>
          </div>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <div className="w-full max-w-[480px] animate-floaty">
            <Mark size={480} glow />
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-shell px-6 sm:px-10">
        <div className="grid grid-cols-2 gap-6 border-y border-on/12 py-8 sm:grid-cols-4">
          <Stat value={all.length} label="Films submitted" />
          <Stat value={all.filter((s) => s.featured).length} label="In the selection" />
          <Stat value={cohorts} label="Cohorts" />
          <Stat value={<span className="text-gold">✦</span>} label={GRAND_PRIZE.name} />
        </div>
      </section>

      {/* ── MANIFESTO ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-shell px-6 py-16 sm:px-10 sm:py-20">
        <div className="grid gap-8 md:grid-cols-[190px_1fr]">
          <span className="font-mono text-[10px] uppercase tracking-label text-accent">Manifesto · I</span>
          <p className="font-serif text-on" style={{ fontSize: "clamp(30px, 4.4vw, 60px)", lineHeight: 1.02, letterSpacing: "-0.025em", maxWidth: "16ch", fontWeight: 400 }}>
            AI is not the sun.{" "}
            <span style={{ fontStyle: "italic", fontWeight: 300 }} className="text-accent">
              It is what the sun makes possible.
            </span>
          </p>
        </div>
      </section>

      {/* ── THE ARC (four moments) ─────────────────────────────────────── */}
      <section className="mx-auto max-w-shell px-6 sm:px-10">
        <SectionLabel>How the festival works</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ARC.map((m) => (
            <div key={m.num} className="group relative flex min-h-[230px] flex-col border border-on/12 bg-card p-6 transition-colors hover:border-on/25">
              <div className="font-serif text-4xl text-ochre" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30', fontWeight: 300 }}>
                {m.num}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-label text-on/40">{m.kicker}</div>
              <h3 className="mt-6 font-serif text-2xl text-on" style={{ fontVariationSettings: '"opsz" 96, "SOFT" 50' }}>
                {m.title}
              </h3>
              <p className="mt-auto pt-4 font-serif text-[15px] leading-relaxed text-on/55">{m.body}</p>
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-accent2 to-accent transition-all duration-300 group-hover:w-full" />
            </div>
          ))}
        </div>
      </section>

      {/* ── THE PRIZE ──────────────────────────────────────────────────── */}
      <section id="prize" className="mx-auto max-w-shell scroll-mt-20 px-6 py-20 sm:px-10">
        <SectionLabel>The prize</SectionLabel>
        <div className="grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="flex justify-center">
            <PrizeSun size={260} />
          </div>
          <div>
            <Eyebrow tick={false}>Inspired by the mark · the cut is the horizon</Eyebrow>
            <h2 className="mt-4 font-serif text-on" style={{ fontSize: "clamp(40px, 6vw, 76px)", lineHeight: 0.95, letterSpacing: "-0.03em", fontWeight: 400 }}>
              {GRAND_PRIZE.name}
            </h2>
            <p className="mt-5 max-w-lg font-serif text-lg leading-relaxed text-on/70">{GRAND_PRIZE.line}</p>
            <ul className="mt-8 divide-y divide-on/10 border-t border-on/10">
              {AWARDS.map((a) => (
                <li key={a.name} className="flex items-baseline gap-5 py-4">
                  <span className="mt-0.5 text-gold">✦</span>
                  <div>
                    <div className="font-serif text-xl text-on">{a.name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-label text-on/45">{a.note}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── OFFICIAL SELECTION ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-shell px-6 sm:px-10">
        <SectionLabel>The Official Selection</SectionLabel>
        {showcase.length ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {showcase.map((s) => (
                <FilmCard key={s.id} sub={s} score={summaries[s.id]?.overall} />
              ))}
            </div>
            <div className="mt-10">
              <ButtonLink href="/films" variant="ghost">
                View the full selection →
              </ButtonLink>
            </div>
          </>
        ) : (
          <div className="border border-dashed border-on/15 p-12 text-center">
            <p className="font-serif text-xl text-on/70">The selection opens with the first film.</p>
            <p className="mt-2 font-serif text-on/45">Be the one to begin it.</p>
            <div className="mt-6 flex justify-center">
              <ButtonLink href="/submit">Submit the first film →</ButtonLink>
            </div>
          </div>
        )}
      </section>

      {/* ── CTA BAND ───────────────────────────────────────────────────── */}
      <section className="mx-auto mt-20 max-w-shell px-6 sm:px-10">
        <div className="relative overflow-hidden border border-on/12 bg-card px-8 py-16 text-center sm:px-16">
          <div className="pointer-events-none absolute inset-0 -z-0 opacity-60" style={{ background: "radial-gradient(60% 80% at 80% 10%, rgba(242,134,42,0.18), transparent 60%)" }} />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-serif text-on" style={{ fontSize: "clamp(32px, 5vw, 60px)", lineHeight: 1.0, letterSpacing: "-0.02em", fontWeight: 400 }}>
              You finished the film.{" "}
              <span className="italic text-accent" style={{ fontWeight: 300 }}>
                Now publish it.
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-md font-serif text-lg text-on/65">
              Sixty to ninety seconds, a poster, your crew. We'll do the rest.
            </p>
            <div className="mt-8 flex justify-center">
              <ButtonLink href="/submit">Submit your film →</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <div className="h-6" />
    </>
  );
}
