"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { getSubject, ROMAN, FREE_LEVELS } from "@/lib/curriculum";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Guard } from "@/components/Guard";
import clsx from "clsx";

export default function SubjectPage({ params }: { params: { subject: string } }) {
  const subject = getSubject(params.subject);
  if (!subject) notFound();
  return (
    <Guard>
      <SubjectView slug={params.subject} />
    </Guard>
  );
}

function SubjectView({ slug }: { slug: string }) {
  const { lang, region, plan, completed } = usePrefs();
  const d = t(lang);
  const subject = getSubject(slug)!;
  const r = region ?? "gcc";
  const done = completed[slug] ?? [];
  const paid = plan !== "free";

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <Link href="/learn" className="eyebrow hover:text-marigold">
          ← {d.subject.back}
        </Link>

        <h1 className="mt-6 font-serif text-5xl sm:text-6xl">{subject.name[lang]}</h1>
        <p className="mt-4 max-w-xl text-lg text-paper/75">{subject.tagline[lang]}</p>

        <div className="card mt-10 p-6">
          <p className="eyebrow-accent mb-2">{d.subject.example}</p>
          <p className="font-serif text-lg leading-relaxed">{subject.regionExample[r][lang]}</p>
        </div>

        <div className="mt-12 border border-hairline">
          {subject.levels.map((level) => {
            const locked = !paid && level.n > FREE_LEVELS;
            const isDone = done.includes(level.n);
            const row = (
              <div
                className={clsx(
                  "flex items-center justify-between gap-4 px-6 py-5 transition-colors",
                  level.n > 1 && "hairline-row",
                  locked ? "opacity-50" : "hover:bg-ink-lift"
                )}
              >
                <div className="flex items-center gap-5">
                  <span className={clsx("font-serif text-2xl w-10", isDone ? "text-marigold" : "text-ochre")}>
                    {ROMAN[level.n - 1]}
                  </span>
                  <div>
                    <p className="font-serif text-xl">{level.title[lang]}</p>
                    <p className="eyebrow mt-1">
                      {d.subject.level} {level.n} / 10
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[11px] uppercase tracking-label">
                  {locked ? (
                    <span className="text-dusk">{d.subject.locked}</span>
                  ) : isDone ? (
                    <span className="text-marigold">✓ {d.subject.done} · {d.subject.review}</span>
                  ) : (
                    <span className="text-gold">{d.subject.begin} →</span>
                  )}
                </span>
              </div>
            );
            return locked ? (
              <div key={level.n}>{row}</div>
            ) : (
              <Link key={level.n} href={`/learn/${slug}/${level.n}`} className="block">
                {row}
              </Link>
            );
          })}
        </div>

        {!paid && (
          <div className="mt-8 flex items-center justify-between gap-4 border border-marigold/40 bg-ink-panel p-6">
            <p className="font-serif text-lg">{d.pricing.title}</p>
            <Link href="/pricing" className="btn-primary shrink-0">
              {d.subject.unlock} <span aria-hidden>→</span>
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
