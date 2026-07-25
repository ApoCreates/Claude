"use client";

import { useState } from "react";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { generateQuestion, type QuizQ } from "@/lib/games";
import { FREE_LEVELS } from "@/lib/curriculum";
import clsx from "clsx";
import Link from "next/link";

const STEPS = 5;

// Adaptive placement: five questions that climb when you're right and step
// back when you're wrong, then recommend the school year to start from.
// Available for the procedurally-generated subjects (math, physics).
export function PlacementTest({ subject }: { subject: string }) {
  const { lang, plan, applyPlacement } = usePrefs();
  const d = t(lang);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [year, setYear] = useState(4);
  const [q, setQ] = useState<QuizQ | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [applied, setApplied] = useState(false);

  const begin = () => {
    setOpen(true);
    setStep(0);
    setYear(4);
    setResult(null);
    setApplied(false);
    setQ(generateQuestion(subject, 4));
    setSelected(null);
    setChecked(false);
  };

  const check = () => {
    if (selected === null || !q) return;
    setChecked(true);
  };

  const next = () => {
    if (!q || selected === null) return;
    const right = selected === q.correct;
    const nextYear = Math.max(1, Math.min(10, year + (right ? 2 : -2)));
    if (step + 1 >= STEPS) {
      setResult(right ? Math.min(10, year + 1) : Math.max(1, year - 1));
    } else {
      setYear(nextYear);
      setQ(generateQuestion(subject, nextYear));
      setStep((s) => s + 1);
      setSelected(null);
      setChecked(false);
    }
  };

  const apply = () => {
    if (!result) return;
    applyPlacement(subject, result);
    setApplied(true);
  };

  if (!open) {
    return (
      <div className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="font-serif text-xl">{d.placement.title}</p>
          <p className="mt-1 text-sm text-mute-light">{d.placement.body}</p>
        </div>
        <button onClick={begin} className="btn-ghost shrink-0">
          {d.placement.start} <span aria-hidden>→</span>
        </button>
      </div>
    );
  }

  if (result !== null) {
    const capped = plan === "free" && result > FREE_LEVELS + 1;
    return (
      <div className="card mt-6 border-marigold/60 p-6">
        <p className="eyebrow-accent mb-2">{d.placement.title}</p>
        <p className="font-serif text-3xl">
          {d.placement.result} <span className="text-marigold">{d.subject.level} {result}</span>
        </p>
        {capped && <p className="mt-2 text-sm text-gold">{d.placement.capNote}</p>}
        <div className="mt-5 flex flex-wrap gap-4">
          {!applied ? (
            <button onClick={apply} className="btn-primary">
              {d.placement.apply} {result} <span aria-hidden>→</span>
            </button>
          ) : (
            <p className="font-mono text-[11px] uppercase tracking-label text-marigold">✓ {d.placement.applied}</p>
          )}
          {capped && (
            <Link href="/pricing" className="btn-paper">
              {d.subject.unlock}
            </Link>
          )}
          <button onClick={() => setOpen(false)} className="btn-ghost">
            {d.placement.close}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card mt-6 p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="eyebrow-accent">{d.placement.title}</p>
        <p className="eyebrow">
          {d.quiz.question} {step + 1} / {STEPS} · {d.subject.level} {year}
        </p>
      </div>
      {q && (
        <>
          <p className="font-serif text-xl leading-snug">{q.q[lang]}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {q.choices.map((c, i) => {
              const isSel = selected === i;
              const isRight = checked && i === q.correct;
              const isWrongSel = checked && isSel && i !== q.correct;
              return (
                <button
                  key={i}
                  disabled={checked}
                  onClick={() => setSelected(i)}
                  className={clsx(
                    "border px-4 py-3 text-start font-sans text-sm transition-colors",
                    isRight && "border-marigold bg-marigold/10 text-marigold",
                    isWrongSel && "border-dusk bg-dusk/10",
                    !checked && isSel && "border-marigold bg-ink-lift",
                    !checked && !isSel && "border-hairline hover:border-marigold/60",
                    checked && !isRight && !isWrongSel && "border-hairline opacity-50"
                  )}
                >
                  {c[lang]}
                </button>
              );
            })}
          </div>
          <div className="mt-5">
            {!checked ? (
              <button onClick={check} disabled={selected === null} className="btn-primary disabled:opacity-40">
                {d.quiz.check}
              </button>
            ) : (
              <button onClick={next} className="btn-paper">
                {step + 1 >= STEPS ? d.placement.finish : d.quiz.nextQ} <span aria-hidden>→</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
