"use client";

import Link from "next/link";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { SUBJECTS, ROMAN } from "@/lib/curriculum";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Guard } from "@/components/Guard";
import { QuestPanel } from "@/components/QuestPanel";
import { SunSprint } from "@/components/SunSprint";
import { SubjectArt } from "@/components/SubjectArt";

export default function LearnPage() {
  return (
    <Guard>
      <Learn />
    </Guard>
  );
}

function Learn() {
  const { lang, passed } = usePrefs();
  const d = t(lang);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div>
            <p className="eyebrow-accent mb-3">{d.curriculum.eyebrow}</p>
            <h1 className="font-serif text-5xl">{d.curriculum.title}</h1>
            <p className="mt-4 max-w-xl text-paper/70">{d.curriculum.body}</p>
          </div>
          <QuestPanel />
        </div>

        <div className="mt-8">
          <SunSprint />
        </div>

        {(["education", "life"] as const).map((track) => (
          <section key={track} className="mt-14">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="font-serif text-3xl italic text-gold">{d.tracks[track]}</h2>
              <p className="eyebrow">{track === "education" ? d.tracks.educationMeta : d.tracks.lifeMeta}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {SUBJECTS.filter((s) => s.track === track).map((s, i) => {
                const doneCount = (passed[s.slug] ?? []).length;
                const pct = doneCount * 10;
                return (
                  <Link key={s.slug} href={`/learn/${s.slug}`} className="card card-hover group overflow-hidden">
                    <SubjectArt subject={s} className="border-0 border-b border-hairline" />
                    <div className="p-6 pt-5">
                    <div className="flex items-baseline justify-between">
                      <p className="font-mono text-xs text-ochre">
                        {ROMAN[track === "education" ? i : i + 5]} · {s.slug.toUpperCase()}
                      </p>
                      <p className="eyebrow">
                        {doneCount}/10 {d.curriculum.completed}
                      </p>
                    </div>
                    <p className="mt-4 font-serif text-2xl group-hover:text-marigold">{s.name[lang]}</p>
                    <p className="mt-2 text-sm leading-relaxed text-mute-light">{s.tagline[lang]}</p>
                    {/* Progress hairline — quiet, no glow. */}
                    <div className="mt-6 h-px w-full bg-paper/10">
                      <div className="h-px bg-marigold transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-3 text-sm text-gold">
                      {doneCount > 0 ? d.curriculum.continue : d.curriculum.start} <span aria-hidden>→</span>
                    </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
