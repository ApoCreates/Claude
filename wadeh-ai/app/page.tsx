"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import type { Lang, Region } from "@/lib/curriculum";
import { SunMark } from "@/components/SunMark";
import { Wordmark } from "@/components/Wordmark";
import clsx from "clsx";

// The gate. Language and region are chosen here — before anything else.
export default function GatePage() {
  const { lang, setLang, region, setRegion } = usePrefs();
  const [picked, setPicked] = useState<Region | null>(region);
  const [touched, setTouched] = useState(false);
  const router = useRouter();
  const d = t(lang);

  const enter = () => {
    setTouched(true);
    if (!picked) return;
    setRegion(picked);
    router.push("/home");
  };

  const langBtn = (l: Lang, label: string) => (
    <button
      onClick={() => setLang(l)}
      className={clsx(
        "border px-6 py-3 font-sans text-sm transition-colors",
        lang === l
          ? "border-marigold bg-marigold text-ink"
          : "border-hairline-strong text-paper hover:border-marigold/70"
      )}
    >
      {label}
    </button>
  );

  const regionCard = (r: Region, title: string, meta: string) => (
    <button
      onClick={() => setPicked(r)}
      className={clsx(
        "card card-hover flex-1 p-8 text-start",
        picked === r && "border-marigold bg-ink-lift"
      )}
    >
      <p className="eyebrow-accent mb-3">{r === "gcc" ? "٠١ · GCC" : "٠٢ · LEVANT"}</p>
      <p className="font-serif text-3xl">{title}</p>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-label text-mute-light">{meta}</p>
    </button>
  );

  return (
    <main className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 py-16">
        <div className="mb-10 flex items-center justify-between">
          <Wordmark />
          <p className="eyebrow hidden sm:block">{d.gate.eyebrow}</p>
        </div>

        <div className="flex items-start gap-8">
          <div className="flex-1">
            <h1 className="font-serif text-5xl leading-tight sm:text-6xl">
              <em className="italic text-marigold">{d.gate.title1}</em> {d.gate.title2}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper/80">{d.gate.body}</p>
          </div>
          <div className="hidden shrink-0 md:block">
            <SunMark size={140} />
          </div>
        </div>

        <div className="mt-12 space-y-8">
          <div>
            <p className="eyebrow mb-3">{d.gate.langLabel}</p>
            <div className="flex gap-3">
              {langBtn("en", "English")}
              {langBtn("ar", "العربية")}
            </div>
          </div>

          <div>
            <p className="eyebrow mb-3">{d.gate.regionLabel}</p>
            <div className="flex flex-col gap-4 sm:flex-row">
              {regionCard("gcc", d.gate.gcc, d.gate.gccMeta)}
              {regionCard("levant", d.gate.levant, d.gate.levantMeta)}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button onClick={enter} className="btn-primary">
              {d.gate.enter} <span aria-hidden>→</span>
            </button>
            {touched && !picked && <p className="text-sm text-ochre">{d.gate.pickBoth}</p>}
          </div>
        </div>
      </div>

      <div className="cutline mx-auto w-full max-w-4xl" />
      <p className="mx-auto max-w-4xl px-6 py-6 font-mono text-[10px] uppercase tracking-label text-mute">
        WADEHAI · MMXXVI · AI FOR THE BETTER
      </p>
    </main>
  );
}
