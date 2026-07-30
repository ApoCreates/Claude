"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { generateQuiz, XP_CORRECT, XP_LEVEL_MASTERED, type QuizQ } from "@/lib/games";
import { QUIZ_LENGTH, PASS_SCORE } from "@/lib/curriculum";
import { SunMark } from "./SunMark";
import { SpeakButton } from "./SpeakButton";
import { playSfx } from "@/lib/sound";
import { speak } from "@/lib/speech";
import clsx from "clsx";

interface ArenaQ extends QuizQ {
  fromReview?: boolean;
}

// Reads each new question aloud when the read-aloud setting is on.
function AutoRead({ text, idx, enabled, lang }: { text: string; idx: number; enabled: boolean; lang: "en" | "ar" }) {
  useEffect(() => {
    if (enabled) speak(text, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, enabled]);
  return null;
}

// The mastery quiz: fresh questions every run, immediate feedback with an
// explanation, XP per correct answer, and missed questions entering the
// spaced-review queue. Passing (4/5) is what unlocks the next school year.
export function QuizArena({ subject, level }: { subject: string; level: number }) {
  const { lang, access, recordCorrect, recordMastered, addXp, addReview, shiftReview, review, passed } = usePrefs();
  const d = t(lang);

  const [questions, setQuestions] = useState<ArenaQ[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [earned, setEarned] = useState(0);
  const [finished, setFinished] = useState(false);

  const alreadyMastered = (passed[subject] ?? []).includes(level);

  const begin = () => {
    const fresh: ArenaQ[] = generateQuiz(subject, level, QUIZ_LENGTH);
    // One question from the review queue joins the quiz — spaced repetition.
    const due = review[0];
    if (due && due.subject === subject) {
      fresh[0] = { ...due.q, fromReview: true };
    }
    setQuestions(fresh);
    setIdx(0);
    setSelected(null);
    setChecked(false);
    setScore(0);
    setEarned(0);
    setFinished(false);
  };

  const check = () => {
    if (selected === null || !questions) return;
    const q = questions[idx];
    const right = selected === q.correct;
    setChecked(true);
    playSfx(right ? "correct" : "wrong", access.sound);
    if (right) {
      setScore((s) => s + 1);
      setEarned((e) => e + XP_CORRECT);
      addXp(XP_CORRECT);
      recordCorrect();
      if (q.fromReview) shiftReview();
    } else if (!q.fromReview) {
      // Missed questions enter the review queue; a missed review item simply
      // stays at the front of the queue for next time.
      addReview({ subject, level, q });
    }
  };

  const next = () => {
    if (!questions) return;
    if (idx + 1 >= questions.length) {
      const passedNow = score >= PASS_SCORE;
      if (passedNow) {
        recordMastered(subject, level);
        addXp(XP_LEVEL_MASTERED);
        setEarned((e) => e + XP_LEVEL_MASTERED);
        playSfx("fanfare", access.sound);
      }
      setFinished(true);
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
      setChecked(false);
    }
  };

  if (!questions) {
    return (
      <div className="card p-8">
        <p className="eyebrow-accent mb-3">{d.lesson.quiz}</p>
        <p className="leading-relaxed text-paper/80">{d.quiz.intro}</p>
        {alreadyMastered && <p className="mt-2 font-mono text-[11px] uppercase tracking-label text-marigold">✓ {d.subject.done}</p>}
        <button onClick={begin} className="btn-primary mt-6">
          {d.quiz.start} <span aria-hidden>→</span>
        </button>
      </div>
    );
  }

  if (finished) {
    const win = score >= PASS_SCORE;
    return (
      <div className={clsx("card p-8", win && "border-marigold/70")}>
        <p className="eyebrow-accent mb-3">{d.lesson.quiz}</p>
        {win && (
          <div className="sun-rise mb-4">
            <SunMark size={72} />
          </div>
        )}
        <p className="font-serif text-3xl">{win ? d.quiz.finishPass : d.quiz.finishFail}</p>
        <div className="mt-6 flex gap-10">
          <div>
            <p className="font-serif text-4xl text-marigold">{score}/{questions.length}</p>
            <p className="eyebrow mt-1">{d.quiz.score}</p>
          </div>
          <div>
            <p className="font-serif text-4xl text-gold">+{earned}</p>
            <p className="eyebrow mt-1">{d.quiz.xpEarned}</p>
          </div>
        </div>
        <button onClick={begin} className="btn-ghost mt-8">
          {d.quiz.retry}
        </button>
      </div>
    );
  }

  const q = questions[idx];
  return (
    <div className="card p-8">
      <div className="mb-4 flex items-center justify-between">
        <p className="eyebrow-accent">{d.lesson.quiz}</p>
        <p className="eyebrow">
          {d.quiz.question} {idx + 1} / {questions.length}
        </p>
      </div>
      {q.fromReview && <p className="mb-3 font-mono text-[10px] uppercase tracking-label text-dusk">↻ {d.quiz.reviewTag}</p>}
      <div className="flex items-start justify-between gap-3">
        <p className="font-serif text-2xl leading-snug">{q.q[lang]}</p>
        <SpeakButton text={q.q[lang]} />
      </div>
      <AutoRead text={q.q[lang]} idx={idx} enabled={access.readAloud && access.sound} lang={lang} />

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
                "border px-5 py-4 text-start font-sans text-base transition-colors",
                isRight && "border-marigold bg-marigold/10 text-marigold",
                isWrongSel && "border-dusk bg-dusk/10 text-paper",
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

      {checked && (
        <div className={clsx("mt-5 border p-4", selected === q.correct ? "border-marigold/50" : "border-dusk/60")}>
          <p className={clsx("font-mono text-[11px] uppercase tracking-label", selected === q.correct ? "text-marigold" : "text-dusk")}>
            {selected === q.correct ? `✓ ${d.quiz.correct} +${XP_CORRECT}` : `✕ ${d.quiz.wrong}`}
          </p>
          <p className="mt-2 leading-relaxed text-paper/85">{q.explain[lang]}</p>
        </div>
      )}

      <div className="mt-6">
        {!checked ? (
          <button onClick={check} disabled={selected === null} className="btn-primary disabled:opacity-40">
            {d.quiz.check}
          </button>
        ) : (
          <button onClick={next} className="btn-paper">
            {d.quiz.nextQ} <span aria-hidden>→</span>
          </button>
        )}
      </div>
    </div>
  );
}
