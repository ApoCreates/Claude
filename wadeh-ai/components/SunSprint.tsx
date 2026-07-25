"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { generateQuestion, XP_CORRECT, type QuizQ } from "@/lib/games";
import { SUBJECTS, FREE_LEVELS } from "@/lib/curriculum";
import { SunMark } from "./SunMark";
import { playSfx } from "@/lib/sound";
import clsx from "clsx";

const DURATION = 60; // seconds
const CALM_QUESTIONS = 12; // calm mode swaps the clock for a fixed set

// The Sun Sprint — a 60-second cross-subject arcade round. Questions arrive
// from every subject the learner has access to (interleaving, the most
// under-used trick in learning science). Consecutive correct answers build a
// combo multiplier; a miss resets it. Score feeds Rays and a personal best.
export function SunSprint() {
  const { lang, plan, passed, access, recordCorrect, addXp, recordSprint, bestSprint } = usePrefs();
  const d = t(lang);
  const calm = access.calm;

  const [phase, setPhase] = useState<"idle" | "run" | "done">("idle");
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [q, setQ] = useState<{ subject: string; level: number; quiz: QuizQ } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [answered, setAnswered] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const cap = plan === "free" ? FREE_LEVELS : 10;
  const mult = 1 + Math.floor(combo / 3);

  const nextQuestion = () => {
    const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
    // Pitch at the learner's frontier: up to one year past their best mastery.
    const done = passed[subject.slug] ?? [];
    const frontier = Math.min(cap, Math.max(1, (done.length ? Math.max(...done) : 0) + 1));
    const level = Math.max(1, frontier - Math.floor(Math.random() * 2));
    setQ({ subject: subject.slug, level, quiz: generateQuestion(subject.slug, level) });
    setSelected(null);
  };

  const start = () => {
    setPhase("run");
    setScore(0);
    setCombo(0);
    setAnswered(0);
    setTimeLeft(DURATION);
    nextQuestion();
    if (timer.current) clearInterval(timer.current);
    // Calm mode replaces the countdown with a fixed, unhurried question set.
    if (!calm) {
      timer.current = setInterval(() => {
        setTimeLeft((s) => {
          if (s <= 1) {
            if (timer.current) clearInterval(timer.current);
            setPhase("done");
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
  };

  // Persist the run when it ends.
  useEffect(() => {
    if (phase === "done") {
      recordSprint(score);
      if (score > 0) addXp(Math.round(score / 2));
      if (score >= bestSprint && score > 0) playSfx("fanfare", access.sound);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const answer = (i: number) => {
    if (!q || selected !== null) return;
    setSelected(i);
    const right = i === q.quiz.correct;
    const count = answered + 1;
    setAnswered(count);
    playSfx(right ? "correct" : "wrong", access.sound);
    if (right) {
      setScore((s) => s + XP_CORRECT * mult);
      setCombo((c) => c + 1);
      recordCorrect();
    } else {
      setCombo(0);
    }
    // Brief beat to show the verdict, then continue.
    if (calm && count >= CALM_QUESTIONS) {
      setTimeout(() => setPhase("done"), 650);
    } else {
      setTimeout(nextQuestion, 550);
    }
  };

  if (phase === "idle") {
    return (
      <div className="card flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <SunMark size={56} />
          <div>
            <p className="font-serif text-2xl">{d.sprint.title}</p>
            <p className="mt-1 text-sm text-mute-light">{d.sprint.tagline}</p>
            {bestSprint > 0 && (
              <p className="eyebrow mt-2">
                {d.sprint.best}: {bestSprint}
              </p>
            )}
          </div>
        </div>
        <button onClick={start} className="btn-primary shrink-0">
          {d.sprint.start} <span aria-hidden>→</span>
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const isBest = score >= bestSprint && score > 0;
    return (
      <div className={clsx("card p-8", isBest && "border-marigold/70")}>
        {isBest && (
          <div className="sun-rise mb-3">
            <SunMark size={56} />
          </div>
        )}
        <p className="eyebrow-accent">{d.sprint.title}</p>
        <p className="mt-2 font-serif text-3xl">{isBest ? d.sprint.newBest : d.sprint.timeUp}</p>
        <div className="mt-5 flex flex-wrap gap-10">
          <div>
            <p className="font-serif text-4xl text-marigold">{score}</p>
            <p className="eyebrow mt-1">{d.sprint.score}</p>
          </div>
          <div>
            <p className="font-serif text-4xl text-paper">{answered}</p>
            <p className="eyebrow mt-1">{d.sprint.answered}</p>
          </div>
          <div>
            <p className="font-serif text-4xl text-gold">{bestSprint}</p>
            <p className="eyebrow mt-1">{d.sprint.best}</p>
          </div>
          <div>
            <p className="font-serif text-4xl text-ochre">+{Math.round(score / 2)}</p>
            <p className="eyebrow mt-1">{d.quiz.xpEarned}</p>
          </div>
        </div>
        <button onClick={start} className="btn-primary mt-7">
          {d.sprint.again} <span aria-hidden>→</span>
        </button>
      </div>
    );
  }

  const subjectName = SUBJECTS.find((s) => s.slug === q?.subject)?.name[lang] ?? "";

  return (
    <div className="card p-8">
      {/* progress hairline: countdown normally, question count in calm mode */}
      <div className="mb-1 h-1 w-full bg-paper/10">
        <div
          className="h-1 bg-ochre transition-all duration-1000 ease-linear"
          style={{ width: `${calm ? (answered / CALM_QUESTIONS) * 100 : (timeLeft / DURATION) * 100}%` }}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-label">
          <span className="text-ochre">{d.sprint.score} {score}</span>
          {!calm && combo >= 3 && <span className="ms-3 text-dusk">🔥 ×{mult}</span>}
        </p>
        <p className="font-serif text-3xl tabular-nums text-paper">
          {calm ? `${answered}/${CALM_QUESTIONS}` : `${timeLeft}s`}
        </p>
      </div>

      {q && (
        <>
          <p className="eyebrow mt-4">{subjectName} · {d.subject.level} {q.level}</p>
          <p className="mt-2 font-serif text-2xl leading-snug">{q.quiz.q[lang]}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {q.quiz.choices.map((c, i) => {
              const isSel = selected === i;
              const isRight = selected !== null && i === q.quiz.correct;
              const isWrongSel = isSel && i !== q.quiz.correct;
              return (
                <button
                  key={i}
                  disabled={selected !== null}
                  onClick={() => answer(i)}
                  className={clsx(
                    "border px-5 py-4 text-start font-sans text-base transition-colors",
                    isRight && "border-marigold bg-marigold/10 text-marigold",
                    isWrongSel && "border-dusk bg-dusk/10",
                    selected === null && "border-hairline hover:border-marigold/60",
                    selected !== null && !isRight && !isWrongSel && "border-hairline opacity-50"
                  )}
                >
                  {c[lang]}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
