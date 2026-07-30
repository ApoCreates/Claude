"use client";

import { useMemo, useState } from "react";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { XP_LAB } from "@/lib/games";
import clsx from "clsx";

interface Pair {
  en: string;
  ar: string;
}

const POOL: Pair[][] = [
  [
    { en: "sun", ar: "شمس" },
    { en: "book", ar: "كتاب" },
    { en: "water", ar: "ماء" },
    { en: "friend", ar: "صديق" },
    { en: "house", ar: "بيت" },
  ],
  [
    { en: "morning", ar: "صباح" },
    { en: "sea", ar: "بحر" },
    { en: "teacher", ar: "معلّم" },
    { en: "food", ar: "طعام" },
    { en: "street", ar: "شارع" },
  ],
  [
    { en: "knowledge", ar: "معرفة" },
    { en: "journey", ar: "رحلة" },
    { en: "patience", ar: "صبر" },
    { en: "clarity", ar: "وضوح" },
    { en: "future", ar: "مستقبل" },
  ],
];

// The languages lab: match word pairs across languages — the Duolingo
// matching game, played between English and Arabic.
export function WordMatch({ level }: { level: number }) {
  const { lang, addXp } = usePrefs();
  const d = t(lang);
  const [round, setRound] = useState(0);
  const pairs = useMemo(() => POOL[(level + round) % POOL.length], [level, round]);

  // Stable shuffles per round (index arithmetic, not Math.random, for hydration safety).
  const left = useMemo(() => pairs.map((p, i) => ({ ...p, i })).sort((a, b) => ((a.i * 7 + round) % 5) - ((b.i * 7 + round) % 5)), [pairs, round]);
  const right = useMemo(() => pairs.map((p, i) => ({ ...p, i })).sort((a, b) => ((a.i * 3 + round + 2) % 5) - ((b.i * 3 + round + 2) % 5)), [pairs, round]);

  const [selLeft, setSelLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [shake, setShake] = useState<number | null>(null);
  const [rewarded, setRewarded] = useState(false);

  const done = matched.length === pairs.length;

  const clickRight = (i: number) => {
    if (selLeft === null || matched.includes(i)) return;
    if (i === selLeft) {
      const next = [...matched, i];
      setMatched(next);
      setSelLeft(null);
      if (next.length === pairs.length && !rewarded) {
        setRewarded(true);
        addXp(XP_LAB);
      }
    } else {
      setShake(i);
      setTimeout(() => setShake(null), 400);
    }
  };

  const again = () => {
    setRound((r) => r + 1);
    setMatched([]);
    setSelLeft(null);
    setRewarded(false);
  };

  return (
    <div className="card p-8">
      <p className="eyebrow-accent mb-2">{d.lesson.lab}</p>
      <p className="mb-6 text-sm text-mute-light">
        {lang === "ar" ? "طابق كل كلمة مع معناها. أكمل الخمسة واكسب أشعة." : "Match each word with its meaning. Complete all five to earn rays."}
      </p>
      <div className="grid grid-cols-2 gap-3" dir="ltr">
        <div className="space-y-2">
          {left.map((p) => (
            <button
              key={p.i}
              disabled={matched.includes(p.i)}
              onClick={() => setSelLeft(p.i)}
              className={clsx(
                "w-full border px-4 py-3 font-sans text-sm transition-colors",
                matched.includes(p.i) && "border-marigold/60 bg-marigold/10 text-marigold",
                !matched.includes(p.i) && selLeft === p.i && "border-marigold bg-ink-lift",
                !matched.includes(p.i) && selLeft !== p.i && "border-hairline hover:border-marigold/60"
              )}
            >
              {p.en}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {right.map((p) => (
            <button
              key={p.i}
              disabled={matched.includes(p.i)}
              onClick={() => clickRight(p.i)}
              className={clsx(
                "w-full border px-4 py-3 font-sans text-sm transition-colors",
                matched.includes(p.i) && "border-marigold/60 bg-marigold/10 text-marigold",
                shake === p.i && "border-dusk bg-dusk/10",
                !matched.includes(p.i) && shake !== p.i && "border-hairline hover:border-marigold/60"
              )}
            >
              {p.ar}
            </button>
          ))}
        </div>
      </div>
      {done && (
        <div className="mt-5 flex items-center gap-4">
          <p className="font-serif text-xl text-marigold">
            {lang === "ar" ? `أحسنت! +${XP_LAB} أشعة` : `Well matched! +${XP_LAB} rays`}
          </p>
          <button onClick={again} className="btn-ghost">
            {lang === "ar" ? "جولة جديدة" : "New round"}
          </button>
        </div>
      )}
    </div>
  );
}
