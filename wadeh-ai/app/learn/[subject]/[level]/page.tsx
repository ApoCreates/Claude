"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { getSubject, ROMAN, FREE_LEVELS } from "@/lib/curriculum";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Guard } from "@/components/Guard";
import { TutorChat } from "@/components/TutorChat";
import { useEffect } from "react";

export default function LevelPage({ params }: { params: { subject: string; level: string } }) {
  const subject = getSubject(params.subject);
  const n = Number(params.level);
  if (!subject || !Number.isInteger(n) || n < 1 || n > 10) notFound();
  return (
    <Guard>
      <LevelView slug={params.subject} n={n} />
    </Guard>
  );
}

function LevelView({ slug, n }: { slug: string; n: number }) {
  const { lang, region, plan, completed, toggleComplete } = usePrefs();
  const router = useRouter();
  const d = t(lang);
  const subject = getSubject(slug)!;
  const level = subject.levels[n - 1];
  const r = region ?? "gcc";
  const isDone = (completed[slug] ?? []).includes(n);
  const locked = plan === "free" && n > FREE_LEVELS;

  // Paywall enforcement — free plan stops after level II.
  useEffect(() => {
    if (locked) router.replace("/pricing");
  }, [locked, router]);
  if (locked) return null;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <Link href={`/learn/${slug}`} className="eyebrow hover:text-marigold">
          ← {subject.name[lang]}
        </Link>

        <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <span className="font-serif text-6xl text-ochre">{ROMAN[n - 1]}</span>
          <h1 className="font-serif text-4xl sm:text-5xl">{level.title[lang]}</h1>
        </div>
        <p className="eyebrow mt-3">
          {subject.name[lang]} · {d.subject.level} {n} / 10
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Lesson outline */}
          <div className="space-y-6">
            <div className="card p-8">
              <p className="eyebrow-accent mb-4">{d.lesson.objectives}</p>
              <ul className="space-y-3">
                {d.lesson.objectiveItems.map((o, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-ochre">+</span>
                    <span className="leading-relaxed text-paper/85">{o}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-8">
              <p className="eyebrow-accent mb-3">{d.lesson.example}</p>
              <p className="font-serif text-xl leading-relaxed">{subject.regionExample[r][lang]}</p>
            </div>

            <div className="card p-8">
              <p className="eyebrow-accent mb-3">{d.lesson.practice}</p>
              <p className="leading-relaxed text-paper/75">{d.lesson.practiceBody}</p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => toggleComplete(slug, n)}
                  className={isDone ? "btn-ghost" : "btn-primary"}
                >
                  {isDone ? `✓ ${d.lesson.done}` : d.lesson.markDone}
                </button>
                {isDone && n < 10 && (
                  <Link href={`/learn/${slug}/${n + 1}`} className="btn-paper">
                    {d.lesson.next} <span aria-hidden>→</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* AI tutor */}
          <TutorChat subject={subject} level={level} />
        </div>
      </main>
      <Footer />
    </>
  );
}
