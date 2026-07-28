"use client";

import Link from "next/link";
import Image from "next/image";
import { usePrefs } from "@/lib/prefs";
import { t, PRICING } from "@/lib/i18n";
import { SUBJECTS, ROMAN } from "@/lib/curriculum";
import { FAMILIES } from "@/lib/methods";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Guard } from "@/components/Guard";
import { SubjectArt } from "@/components/SubjectArt";
import { HeroLab } from "@/components/HeroLab";

export default function HomePage() {
  return (
    <Guard>
      <Home />
    </Guard>
  );
}

function Home() {
  const { lang, region, passed } = usePrefs();
  const d = t(lang);
  const r = region ?? "gcc";
  const price = PRICING[r];
  const ar = lang === "ar";

  return (
    <>
      <Nav />
      {/* overflow-x-clip is a floor, not a fix: it stops one long word or a wide
          child from making the whole document scroll sideways again. */}
      <main className="mx-auto max-w-6xl overflow-x-clip px-5 sm:px-6">
        {/* ── Hero: the lab does the talking ───────────────────────────── */}
        <section className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div>
            <p className="eyebrow-accent mb-5">{d.hero.eyebrow}</p>
            <h1 className="font-serif text-[2.6rem] leading-[1.06] sm:text-6xl lg:text-[4.1rem]">
              {d.hero.title1} <em className="italic text-marigold">{d.hero.titleAccent}</em> {d.hero.title2}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper/80">{d.hero.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/learn" className="btn-primary">
                {d.hero.ctaPrimary} <span aria-hidden>→</span>
              </Link>
              <Link href="/learn" className="btn-ghost">
                {d.hero.ctaSecondary}
              </Link>
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-mute-light">
              {ar
                ? "الدرس نفسه يعمل بالعربية والإنجليزية، ويتكيّف مع منطقتك."
                : "Every lesson runs in Arabic and English, and adapts to your region."}
            </p>
          </div>

          {/* The signature: a real interactive, above the fold, no sign-up. */}
          <HeroLab />
        </section>

        {/* ── Curriculum: the artwork earns its keep ───────────────────── */}
        <section className="border-t border-hairline py-16 sm:py-24">
          <p className="eyebrow-accent mb-3">{d.curriculum.eyebrow}</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl">{d.curriculum.title}</h2>
          <p className="mt-4 max-w-xl text-paper/70">{d.curriculum.body}</p>

          {(["education", "life"] as const).map((track) => (
            <div key={track} className="mt-10 sm:mt-12">
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-serif text-2xl italic text-gold">{d.tracks[track]}</h3>
                <p className="eyebrow">{track === "education" ? d.tracks.educationMeta : d.tracks.lifeMeta}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {SUBJECTS.filter((s) => s.track === track).map((s, i) => (
                  <Link
                    key={s.slug}
                    href={`/learn/${s.slug}`}
                    className="card card-hover group flex flex-col overflow-hidden"
                  >
                    {/* Ten illustrations already exist in /public/art and were
                        previously unused on this page. */}
                    <div className="relative aspect-[3/2] overflow-hidden">
                      <SubjectArt subject={s} className="h-full" />
                      <span className="absolute bottom-0 start-0 bg-ink/90 px-2.5 py-1 font-mono text-[11px] tracking-label text-ochre">
                        {ROMAN[track === "education" ? i : i + 5]}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="font-serif text-xl leading-snug transition-colors group-hover:text-marigold">
                        {s.name[lang]}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-mute-light">{s.tagline[lang]}</p>
                      <p className="mt-4 font-mono text-[11px] uppercase tracking-label text-mute">
                        {ar ? "١٠ سنوات دراسية" : "10 school years"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <section className="border-t border-hairline py-16 sm:py-24">
          <p className="eyebrow-accent mb-3">{d.how.eyebrow}</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl">{d.how.title}</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {d.how.steps.map((s, i) => (
              <div key={s.t} className="card p-7">
                <p className="font-serif text-4xl text-ochre">{["01", "02", "03"][i]}</p>
                <p className="mt-5 font-serif text-2xl">{s.t}</p>
                <p className="mt-3 leading-relaxed text-paper/70">{s.b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── The hundred suns, now carrying information ───────────────────
            Previously 100 identical circles — a shape with nothing to say.
            Ten rows are the ten subjects; ten columns are the ten school
            years; a lit sun is a year this learner has actually mastered. */}
        <section className="border-t border-hairline py-16 sm:py-24">
          <div className="max-w-lg">
            <p className="eyebrow-accent mb-3">{d.grid.eyebrow}</p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl">{d.grid.title}</h2>
            <p className="mt-4 text-paper/70">{d.grid.body}</p>
          </div>

          <div className="mt-10">
            <table className="w-full border-separate border-spacing-y-1.5" dir="ltr">
              <caption className="sr-only">
                {ar
                  ? "لوحة التقدّم: صفٌّ لكل مادة، وعمودٌ لكل سنة دراسية"
                  : "Progress board: one row per subject, one column per school year"}
              </caption>
              <thead>
                <tr>
                  <th className="w-[7.5rem] pe-2 text-start font-mono text-[10px] uppercase tracking-label font-medium text-mute sm:w-40 sm:pe-3">
                    {ar ? "المادة" : "Subject"}
                  </th>
                  {ROMAN.map((n) => (
                    <th
                      key={n}
                      className="hidden pb-1 font-mono text-[10px] font-medium tracking-label text-mute sm:table-cell"
                      scope="col"
                    >
                      {n}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SUBJECTS.map((s) => {
                  const done = passed[s.slug] ?? [];
                  return (
                  <tr key={s.slug}>
                    <th scope="row" className="pe-2 text-start font-serif text-[13px] font-normal leading-tight sm:pe-3 sm:text-sm">
                      <Link href={`/learn/${s.slug}`} className="hover:text-marigold">
                        {s.name[lang]}
                      </Link>
                    </th>
                    {ROMAN.map((_, y) => {
                      const lit = done.includes(y + 1);
                      return (
                        <td key={y} className="text-center">
                          <span
                            title={`${s.name[lang]} · ${ROMAN[y]}`}
                            className="inline-block h-3 w-3 rounded-full align-middle sm:h-5 sm:w-5"
                            style={{
                              background: lit
                                ? "radial-gradient(circle at 68% 26%, #FFCB58, #F2862A 45%, #B8341C 78%, #1A0408)"
                                : "transparent",
                              border: lit ? "none" : "1px solid rgba(21,20,15,0.22)",
                            }}
                          />
                          <span className="sr-only">
                            {lit ? (ar ? "مُتقَن" : "mastered") : ar ? "غير مُتقَن" : "not yet"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-label text-mute">
            {ar ? "شمسٌ مضاءة = سنةٌ أتقنتها" : "A lit sun = a year you mastered"}
          </p>
        </section>

        {/* ── The method: cite the science instead of asserting it ─────── */}
        <section className="border-t border-hairline py-16 sm:py-24">
          <p className="eyebrow-accent mb-3">{d.method.eyebrow}</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl">{d.method.title}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {d.method.items.map((m, i) => (
              <div key={m.t} className="card p-6">
                <p className="font-mono text-xs text-ochre">{["01", "02", "03", "04"][i]}</p>
                <p className="mt-4 font-serif text-xl">{m.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-paper/70">{m.b}</p>
                <p className="mt-4 border-t border-hairline pt-3 font-mono text-[10px] uppercase tracking-label text-mute">
                  {
                    [
                      "Roediger & Karpicke 2006",
                      "Cepeda et al. 2006",
                      "Bjork · desirable difficulty",
                      "Chi · protégé effect",
                    ][i]
                  }
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-mute-light">
            {ar
              ? "كل أسلوب في هذه الصفحة مبنيّ على دراسات منشورة في علم التعلّم — لا على رأي."
              : "Every method on this page rests on published learning-science research, not opinion."}
          </p>
        </section>

        {/* ── Ways to learn ────────────────────────────────────────────── */}
        <section className="border-t border-hairline py-16 sm:py-24">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow-accent mb-3">{ar ? "طرق التعلّم" : "Ways to learn"}</p>
              <h2 className="max-w-2xl font-serif text-3xl sm:text-4xl lg:text-5xl">
                {ar ? "لكل عقلٍ بابه" : "Every mind has its own door in"}
              </h2>
            </div>
            <Link href="/methods" className="btn-paper shrink-0">
              {ar ? "استكشف الطريقة" : "Explore the method"} <span aria-hidden>→</span>
            </Link>
          </div>
          <p className="mt-4 max-w-2xl text-paper/70">
            {ar
              ? "رسم وغناء وحركة وقصة ولعب وحواس — ننسج في كل حصّة عدة طرق للتعلّم، فيجد كل عقل بابه."
              : "Drawing, singing, movement, story, play, the senses — every class weaves several ways to learn, so every mind finds its door."}
          </p>
          <div className="mt-8 overflow-hidden border border-hairline">
            <Image
              src="/art/methods/hero.webp"
              alt={ar ? "عقل يتفتّح كالشروق" : "A mind opening like a sunrise"}
              width={1400}
              height={787}
              className="h-auto w-full"
            />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {FAMILIES.map((f, i) => (
              <Link key={f.key} href={`/methods#${f.key}`} className="card card-hover group p-5">
                <p className="font-mono text-xs text-ochre">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-3 font-serif text-lg leading-snug group-hover:text-marigold">{f.title[lang]}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-mute-light">{f.idea[lang]}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── The loop ─────────────────────────────────────────────────── */}
        <section className="border-t border-hairline py-16 sm:py-24">
          <p className="eyebrow-accent mb-3">{d.loop.eyebrow}</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl">{d.loop.title}</h2>
          <div className="mt-10 grid grid-cols-1 border border-hairline sm:grid-cols-2 lg:grid-cols-4">
            {d.loop.items.map((m, i) => (
              <div
                key={m.t}
                className={`p-6 ${i > 0 ? "border-t border-hairline sm:border-t-0 sm:border-s" : ""}`}
              >
                <p className="font-serif text-2xl text-marigold">{m.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-paper/70">{m.b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing teaser ──────────────────────────────────────────── */}
        <section className="border-t border-hairline py-16 sm:py-24">
          <div className="flex flex-col items-start justify-between gap-7 md:flex-row md:items-end">
            <div>
              <p className="eyebrow-accent mb-3">{d.pricing.eyebrow}</p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl">{d.pricing.title}</h2>
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
