"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { getSubject } from "@/lib/curriculum";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Guard } from "@/components/Guard";
import { LevelPath } from "@/components/LevelPath";
import { PlacementTest } from "@/components/PlacementTest";
import { SubjectArt } from "@/components/SubjectArt";

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
  const { lang, region, plan, passed } = usePrefs();
  const d = t(lang);
  const subject = getSubject(slug)!;
  const r = region ?? "gcc";
  const done = (passed[slug] ?? []).length;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <Link href="/learn" className="eyebrow hover:text-marigold">
          ← {d.subject.back}
        </Link>

        <div className="mt-6 flex items-baseline justify-between gap-4">
          <h1 className="font-serif text-5xl sm:text-6xl">{subject.name[lang]}</h1>
          <p className="eyebrow shrink-0">
            {done}/10 {d.curriculum.completed}
          </p>
        </div>
        <p className="mt-4 max-w-xl text-lg text-paper/75">{subject.tagline[lang]}</p>

        <div className="mt-8">
          <SubjectArt subject={subject} priority />
        </div>

        <div className="card mt-6 p-6">
          <p className="eyebrow-accent mb-2">{d.subject.example}</p>
          <p className="font-serif text-lg leading-relaxed">{subject.regionExample[r][lang]}</p>
        </div>

        {(slug === "math" || slug === "physics") && <PlacementTest subject={slug} />}

        <LevelPath subject={subject} />

        {plan === "free" && (
          <div className="mt-10 flex items-center justify-between gap-4 border border-marigold/40 bg-ink-panel p-6">
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
