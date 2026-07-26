"use client";

import Link from "next/link";
import Image from "next/image";
import { usePrefs } from "@/lib/prefs";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { FAMILIES, methodsByFamily, METHOD_COUNT } from "@/lib/methods";

const EMOJI: Record<string, string> = {
  memory: "🧠",
  visual: "👁️",
  music: "🎵",
  movement: "🤸",
  story: "📖",
  play: "🎮",
  social: "💬",
  reallife: "🌍",
  senses: "✋",
  wonder: "✨",
  meta: "🔍",
  identity: "🏆",
};

export default function MethodsPage() {
  const { lang } = usePrefs();
  const ar = lang === "ar";

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="eyebrow-accent mb-3">{ar ? "منهجية واضح" : "The wadehAI method"}</p>
        <h1 className="max-w-3xl font-serif text-5xl leading-tight sm:text-6xl">
          {ar ? `${METHOD_COUNT} طريقة لجعل الفكرة تلتصق` : `${METHOD_COUNT} ways to make an idea stick`}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-mute-light">
          {ar
            ? "لا يتعلّم عقلان بالطريقة نفسها. لذلك لا نكتفي بالقراءة والاختبار — ننسج في كل حصّة الرسم والغناء والحركة والقصة والحواس واللعب، مبنية على علم التعلّم الحديث."
            : "No two minds learn the same way. So we never just read-and-quiz — every class weaves in drawing, singing, movement, story, the senses and play, grounded in modern learning science."}
        </p>

        {/* Imagery band */}
        <div className="mt-10 overflow-hidden border border-hairline">
          <Image src="/art/methods/hero.webp" alt={ar ? "عقل يتفتّح كالشروق" : "A mind opening like a sunrise"} width={1400} height={787} className="h-auto w-full" priority />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { src: "/art/methods/music.webp", alt: ar ? "الغناء للتعلّم" : "Singing to learn" },
            { src: "/art/methods/senses.webp", alt: ar ? "الصنع باليد" : "Making by hand" },
            { src: "/art/methods/story.webp", alt: ar ? "القصة والدهشة" : "Story and wonder" },
          ].map((im) => (
            <div key={im.src} className="overflow-hidden border border-hairline">
              <Image src={im.src} alt={im.alt} width={1400} height={1050} className="h-auto w-full" />
            </div>
          ))}
        </div>

        {/* Family index */}
        <div className="mt-10 flex flex-wrap gap-2">
          {FAMILIES.map((f) => (
            <a
              key={f.key}
              href={`#${f.key}`}
              className="border border-hairline-strong px-3 py-1.5 text-sm text-paper/80 transition-colors hover:border-marigold/70 hover:text-marigold"
            >
              <span className="me-1.5" aria-hidden>{EMOJI[f.key]}</span>
              {f.title[lang]}
            </a>
          ))}
        </div>

        {/* Families */}
        <div className="mt-14 space-y-16">
          {FAMILIES.map((f) => {
            const list = methodsByFamily(f.key);
            return (
              <section key={f.key} id={f.key} className="scroll-mt-24">
                <div className="flex items-start gap-4 border-b border-hairline pb-5">
                  <span className="text-4xl" aria-hidden>{EMOJI[f.key]}</span>
                  <div>
                    <div className="flex items-baseline gap-3">
                      <h2 className="font-serif text-3xl">{f.title[lang]}</h2>
                      <span className="font-mono text-xs text-mute-light">{list.length} {ar ? "طريقة" : "ways"}</span>
                    </div>
                    <p className="mt-1 max-w-2xl text-mute-light">{f.idea[lang]}</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((mth, i) => (
                    <div key={mth.id} className="card h-full p-5">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[11px] text-ochre">{String(i + 1).padStart(2, "0")}</span>
                        <p className="font-serif text-lg leading-snug">{mth.name[lang]}</p>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-mute-light">{mth.blurb[lang]}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-16 border-t border-hairline pt-8">
          <Link href="/learn" className="btn-paper">
            {ar ? "شاهدها داخل الدروس" : "See them inside the lessons"} <span aria-hidden>→</span>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
