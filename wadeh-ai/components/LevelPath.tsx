"use client";

import Link from "next/link";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { ROMAN, FREE_LEVELS, ageRange, type Subject } from "@/lib/curriculum";
import { isAuthored } from "@/lib/notebook";
import { SunMark } from "./SunMark";
import clsx from "clsx";

// The learning path — a winding ladder of ten suns, one per school year.
// Mastered years burn bright; the current year glows at the rim; locked
// years wait as thin outlines. (The Duolingo path, set in daylight.)
export function LevelPath({ subject }: { subject: Subject }) {
  const { lang, plan, passed } = usePrefs();
  const d = t(lang);
  const done = passed[subject.slug] ?? [];
  const paidLocked = (n: number) => plan === "free" && n > FREE_LEVELS;
  // Sequential gate: a year opens once the previous year is mastered.
  const seqLocked = (n: number) => n > 1 && !done.includes(n - 1);

  return (
    <div className="mt-10">
      <p className="eyebrow mb-6">{d.subject.pathHint}</p>
      <div className="flex flex-col gap-2">
        {subject.levels.map((level, i) => {
          const n = level.n;
          const mastered = done.includes(n);
          const locked = paidLocked(n) || seqLocked(n);
          const current = !mastered && !locked;
          const offset = ["ms-0", "ms-8", "ms-16", "ms-24", "ms-16", "ms-8", "ms-0", "ms-8", "ms-16", "ms-24"][i];

          const node = (
            <div
              className={clsx(
                "card flex items-center gap-5 px-5 py-4 sm:w-[30rem]",
                current && "border-marigold/70 bg-ink-lift",
                mastered && "card-hover",
                locked && "opacity-45"
              )}
            >
              <div className="relative shrink-0">
                {mastered || current ? (
                  <SunMark size={44} className={current ? "opacity-90" : ""} />
                ) : (
                  <div className="h-[44px] w-[44px] rounded-full border border-hairline-strong" />
                )}
                {mastered && (
                  <span className="absolute -bottom-1 -end-1 bg-ink px-0.5 font-mono text-[11px] text-marigold">✓</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className={clsx("font-serif text-lg leading-snug", current && "text-marigold")}>
                    {ROMAN[n - 1]} · {level.title[lang]}
                  </p>
                </div>
                <p className="eyebrow mt-1">
                  {d.subject.level} {n} · {d.subject.ages} {ageRange(n)}
                  {!isAuthored(subject.slug, n) && (
                    <span className="ms-2 text-dusk">
                      · {lang === "ar" ? "قيد التأليف" : "in authoring"}
                    </span>
                  )}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-label">
                {paidLocked(n) ? (
                  <span className="text-dusk">{d.subject.locked}</span>
                ) : seqLocked(n) ? (
                  <span className="text-mute">🔒</span>
                ) : mastered ? (
                  <span className="text-gold">{d.subject.review} →</span>
                ) : (
                  <span className="text-marigold">{d.subject.begin} →</span>
                )}
              </span>
            </div>
          );

          return (
            <div key={n} className={clsx("flex", offset)}>
              {locked ? node : (
                <Link href={`/learn/${subject.slug}/${n}`} className="block">
                  {node}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
