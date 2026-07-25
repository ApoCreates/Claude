"use client";

import Link from "next/link";
import { usePrefs } from "@/lib/prefs";
import { t, PRICING } from "@/lib/i18n";
import { SUBJECTS, ROMAN } from "@/lib/curriculum";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Guard } from "@/components/Guard";
import { SunMark } from "@/components/SunMark";

export default function HomePage() {
  return (
    <Guard>
      <Home />
    </Guard>
  );
}

function Home() {
  const { lang, region } = usePrefs();
  const d = t(lang);
  const r = region ?? "gcc";
  const price = PRICING[r];

  const stats = [
    ["10", d.hero.statSubjects],
    ["10", d.hero.statLevels],
    ["2", d.hero.statLangs],
    ["2", d.hero.statRegions],
  ];

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="flex flex-col items-start gap-10 py-20 md:flex-row md:items-center md:py-28">
          <div className="flex-1">
            <p className="eyebrow-accent mb-6">{d.hero.eyebrow}</p>
            <h1 className="font-serif text-5xl leading-[1.08] sm:text-6xl md:text-7xl">
              {d.hero.title1} <em className="italic text-marigold">{d.hero.titleAccent}</em> {d.hero.title2}
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-paper/80">{d.hero.body}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/learn" className="btn-primary">
                {d.hero.ctaPrimary} <span aria-hidden>→</span>
              </Link>
              <Link href="/learn" className="btn-ghost">
                {d.hero.ctaSecondary}
              </Link>
            </div>
          </div>
          <div className="hidden shrink-0 lg:block">
            <SunMark size={280} />
          </div>
        </section>

        {/* Stats strip */}
        <section className="grid grid-cols-2 border border-hairline sm:grid-cols-4">
          {stats.map(([n, label], i) => (
            <div key={label} className={`p-6 ${i > 0 ? "border-s border-hairline" : ""}`}>
              <p className="font-serif text-4xl text-marigold">{n}</p>
              <p className="eyebrow mt-2">{label}</p>
            </div>
          ))}
        </section>

        {/* Subjects preview */}
        <section className="py-24">
          <p className="eyebrow-accent mb-3">{d.curriculum.eyebrow}</p>
          <h2 className="font-serif text-4xl sm:text-5xl">{d.curriculum.title}</h2>
          <p className="mt-4 max-w-xl text-paper/70">{d.curriculum.body}</p>

          {(["education", "life"] as const).map((track) => (
            <div key={track} className="mt-12">
              <div className="mb-4 flex items-baseline justify-between">
                <h3 className="font-serif text-2xl italic text-gold">{d.tracks[track]}</h3>
                <p className="eyebrow">{track === "education" ? d.tracks.educationMeta : d.tracks.lifeMeta}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {SUBJECTS.filter((s) => s.track === track).map((s, i) => (
                  <Link key={s.slug} href={`/learn/${s.slug}`} className="card card-hover group p-5">
                    <p className="font-mono text-xs text-ochre">
                      {ROMAN[track === "education" ? i : i + 5]}
                    </p>
                    <p className="mt-3 font-serif text-xl leading-snug group-hover:text-marigold">
                      {s.name[lang]}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-mute-light">{s.tagline[lang]}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section className="border-t border-hairline py-24">
          <p className="eyebrow-accent mb-3">{d.how.eyebrow}</p>
          <h2 className="font-serif text-4xl sm:text-5xl">{d.how.title}</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {d.how.steps.map((s, i) => (
              <div key={s.t} className="card p-8">
                <p className="font-serif text-5xl text-ochre">{["01", "02", "03"][i]}</p>
                <p className="mt-6 font-serif text-2xl">{s.t}</p>
                <p className="mt-3 leading-relaxed text-paper/70">{s.b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The hundred suns */}
        <section className="border-t border-hairline py-24">
          <div className="flex flex-col gap-12 md:flex-row md:items-center md:justify-between">
            <div className="max-w-md">
              <p className="eyebrow-accent mb-3">{d.grid.eyebrow}</p>
              <h2 className="font-serif text-4xl sm:text-5xl">{d.grid.title}</h2>
              <p className="mt-4 text-paper/70">{d.grid.body}</p>
            </div>
            <div className="grid w-full max-w-sm shrink-0 grid-cols-10 gap-2" dir="ltr" aria-hidden>
              {Array.from({ length: 100 }, (_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-full"
                  style={{
                    background: "radial-gradient(circle at 68% 26%, #FFCB58, #F2862A 45%, #B8341C 78%, #1A0408)",
                    opacity: 0.35 + ((i % 10) + Math.floor(i / 10)) * 0.018,
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* The method — learning science */}
        <section className="border-t border-hairline py-24">
          <p className="eyebrow-accent mb-3">{d.method.eyebrow}</p>
          <h2 className="font-serif text-4xl sm:text-5xl">{d.method.title}</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {d.method.items.map((m, i) => (
              <div key={m.t} className="card p-6">
                <p className="font-mono text-xs text-ochre">{["01", "02", "03", "04"][i]}</p>
                <p className="mt-4 font-serif text-xl">{m.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-paper/70">{m.b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The loop — gamification */}
        <section className="border-t border-hairline py-24">
          <p className="eyebrow-accent mb-3">{d.loop.eyebrow}</p>
          <h2 className="font-serif text-4xl sm:text-5xl">{d.loop.title}</h2>
          <div className="mt-12 grid grid-cols-1 border border-hairline sm:grid-cols-2 lg:grid-cols-4">
            {d.loop.items.map((m, i) => (
              <div key={m.t} className={`p-6 ${i > 0 ? "border-t border-hairline sm:border-t-0 sm:border-s" : ""}`}>
                <p className="font-serif text-2xl text-marigold">{m.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-paper/70">{m.b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="border-t border-hairline py-24">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="eyebrow-accent mb-3">{d.pricing.eyebrow}</p>
              <h2 className="font-serif text-4xl sm:text-5xl">{d.pricing.title}</h2>
              <p className="mt-4 max-w-lg text-paper/70">{d.pricing.body}</p>
            </div>
            <Link href="/pricing" className="btn-paper shrink-0">
              {price.currency[lang]} {price.scholar} {d.pricing.perMonth} <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
