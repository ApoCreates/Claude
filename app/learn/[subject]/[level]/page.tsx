"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { getSubject, ROMAN, FREE_LEVELS, ageRange } from "@/lib/curriculum";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Guard } from "@/components/Guard";
import { TutorChat } from "@/components/TutorChat";
import { QuizArena } from "@/components/QuizArena";
import { SpeakButton } from "@/components/SpeakButton";
import { MathLab } from "@/components/MathLab";
import { PhysicsLab } from "@/components/PhysicsLab";
import { AILab } from "@/components/AILab";
import { GeoLab } from "@/components/GeoLab";
import { BizLab } from "@/components/BizLab";
import { WordMatch } from "@/components/WordMatch";

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
  const { lang, region, plan, passed } = usePrefs();
  const router = useRouter();
  const d = t(lang);
  const subject = getSubject(slug)!;
  const level = subject.levels[n - 1];
  const r = region ?? "gcc";
  const mastered = (passed[slug] ?? []).includes(n);
  const locked = plan === "free" && n > FREE_LEVELS;

  // Paywall enforcement — free plan stops after Year II.
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
          {subject.name[lang]} · {d.subject.level} {n} / 10 · {d.subject.ages} {ageRange(n)}
          {mastered && <span className="text-marigold"> · ✓ {d.subject.done}</span>}
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Left column: the year's syllabus, local lens, lab, quiz */}
          <div className="space-y-6">
            <div className="card p-8">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="eyebrow-accent">{d.lesson.thisYear}</p>
                <SpeakButton text={`${level.title[lang]}. ${level.focus[lang]}`} />
              </div>
              <p className="font-serif text-xl leading-relaxed">{level.focus[lang]}</p>
              <div className="mt-6 border-t border-hairline pt-5">
                <p className="eyebrow mb-4">{d.lesson.units}</p>
                <ol className="space-y-3">
                  {level.units.map((u, i) => (
                    <li key={i} className="flex items-baseline gap-4">
                      <span className="font-mono text-xs text-ochre">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-paper/85">{u[lang]}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="card p-8">
              <p className="eyebrow-accent mb-3">{d.lesson.example}</p>
              <p className="font-serif text-xl leading-relaxed">{subject.regionExample[r][lang]}</p>
            </div>

            {slug === "math" && <MathLab level={n} />}
            {slug === "physics" && <PhysicsLab level={n} />}
            {slug === "ai" && <AILab />}
            {slug === "geography" && <GeoLab />}
            {slug === "entrepreneurship" && <BizLab />}
            {slug === "languages" && <WordMatch level={n} />}

            <QuizArena subject={slug} level={n} />

            {mastered && n < 10 && (
              <Link href={`/learn/${slug}/${n + 1}`} className="btn-paper">
                {d.lesson.next} <span aria-hidden>→</span>
              </Link>
            )}
          </div>

          {/* Right column: the AI tutor */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <TutorChat subject={subject} level={level} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
