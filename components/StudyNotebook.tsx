"use client";

import { useRef, useState } from "react";
import { usePrefs } from "@/lib/prefs";
import type { Subject, Level } from "@/lib/curriculum";
import { buildDeck, isFlagship, type NoteCard } from "@/lib/notebook";
import { MathBlock, MathText } from "./Math";
import { SpeakButton } from "./SpeakButton";
import { playSfx } from "@/lib/sound";
import clsx from "clsx";

const TONE: Record<string, string> = {
  force: "bg-marigold/15 border-marigold/50 text-ochre",
  mass: "bg-gold/15 border-gold/50 text-gold",
  accel: "bg-dusk/12 border-dusk/45 text-dusk",
};

// Plain-text version of a card, for the Listen (text-to-speech) button.
function cardText(card: NoteCard, lang: "en" | "ar"): string {
  const bits: string[] = [card.label[lang]];
  card.paras?.forEach((p) => bits.push(p[lang].replace(/\$[^$]+\$/g, "")));
  card.flow?.forEach((f) => bits.push(f.text[lang]));
  card.techniques?.forEach((tq) => bits.push(`${tq.name[lang]}: ${tq.blurb[lang]}`));
  return bits.join(". ");
}

export function StudyNotebook({ subject, level }: { subject: Subject; level: Level }) {
  const { lang, access } = usePrefs();
  const ar = lang === "ar";
  const deck = buildDeck(subject, level);
  const [i, setI] = useState(0);
  const startX = useRef<number | null>(null);
  const flagship = isFlagship(subject.slug, level.n);

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(deck.length - 1, next));
    if (clamped !== i) {
      setI(clamped);
      playSfx("click", access.sound);
    }
  };

  return (
    <div className="card overflow-hidden p-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-6 py-4">
        <div>
          <p className="eyebrow-accent">{ar ? "دفتر الدراسة" : "Study Notebook"}</p>
          <p className="mt-1 text-xs text-mute-light">
            {ar ? `بطاقة ${i + 1} من ${deck.length}` : `Card ${i + 1} of ${deck.length}`}
            {flagship && <span className="ms-2 text-marigold">· {ar ? "درس مميّز" : "flagship lesson"}</span>}
          </p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-label text-mute-light">
          {ar ? "مرّر" : "swipe"} ⇄
        </span>
      </div>

      {/* Sliding track */}
      <div
        className="relative overflow-hidden"
        onPointerDown={(e) => (startX.current = e.clientX)}
        onPointerUp={(e) => {
          if (startX.current === null) return;
          const dx = e.clientX - startX.current;
          if (Math.abs(dx) > 45) go(i + (dx < 0 ? 1 : -1));
          startX.current = null;
        }}
      >
        <div
          dir="ltr"
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${i * 100}%)` }}
        >
          {deck.map((card, idx) => (
            <article
              key={idx}
              dir={ar ? "rtl" : "ltr"}
              className="w-full shrink-0 px-6 py-7"
              style={{ textAlign: ar ? "right" : "left" }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden>
                  {card.icon}
                </span>
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-label text-paper/80">{card.label[lang]}</p>
                  {card.sub && <p className="text-xs text-mute-light">{card.sub[lang]}</p>}
                </div>
              </div>

              <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-paper/90">
                {card.paras?.map((p, k) => <MathText key={k} text={p[lang]} />)}

                {card.math?.map((m, k) => (
                  <MathBlock key={k} tex={m} />
                ))}

                {card.flow && (
                  <div dir="ltr" className="flex flex-wrap items-center gap-2 py-1">
                    {card.flow.map((node, k) => (
                      <div key={k} className="flex items-center gap-2">
                        <span className={clsx("border px-3 py-2 text-xs font-medium", TONE[node.tone])}>{node.text[lang]}</span>
                        {k < card.flow!.length - 1 && <span className="text-mute" aria-hidden>→</span>}
                      </div>
                    ))}
                  </div>
                )}

                {card.techniques && (
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {card.techniques.map((tq, k) => (
                      <div key={k} className="flex gap-2.5 border border-hairline bg-ink-panel/60 p-3">
                        <span className="text-lg leading-none" aria-hidden>{tq.emoji}</span>
                        <div>
                          <p className="text-sm font-semibold text-paper/90">{tq.name[lang]}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-mute-light">{tq.blurb[lang]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {card.table && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          {card.table.head.map((h, k) => (
                            <th key={k} className="border-b border-hairline-strong px-3 py-2 text-start font-mono text-[11px] uppercase tracking-label text-mute-light">
                              {h[lang]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {card.table.rows.map((row, rk) => (
                          <tr key={rk}>
                            {row.map((cell, ck) => (
                              <td key={ck} className="border-b border-hairline px-3 py-2 text-paper/85">
                                {cell[lang]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <SpeakButton text={cardText(card, lang)} />
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 border-t border-hairline px-6 py-4">
        <button
          onClick={() => go(i - 1)}
          disabled={i === 0}
          className="btn-ghost text-sm disabled:opacity-30"
          aria-label={ar ? "السابق" : "Previous card"}
        >
          ← {ar ? "السابق" : "Prev"}
        </button>
        <div className="flex items-center gap-1.5">
          {deck.map((_, k) => (
            <button
              key={k}
              onClick={() => go(k)}
              aria-label={`${ar ? "بطاقة" : "Card"} ${k + 1}`}
              className={clsx("h-1.5 rounded-full transition-all", k === i ? "w-6 bg-marigold" : "w-1.5 bg-mute/40 hover:bg-mute")}
            />
          ))}
        </div>
        <button
          onClick={() => go(i + 1)}
          disabled={i === deck.length - 1}
          className="btn-ghost text-sm disabled:opacity-30"
          aria-label={ar ? "التالي" : "Next card"}
        >
          {ar ? "التالي" : "Next"} →
        </button>
      </div>
    </div>
  );
}
