"use client";

import { usePrefs, DAILY_QUESTS } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import clsx from "clsx";

// Daily quests + streak + review queue — the Duolingo loop, set in daylight.
export function QuestPanel() {
  const { lang, quest, streakDays, xp, review } = usePrefs();
  const d = t(lang);

  const rows = [
    { def: DAILY_QUESTS[0], label: d.gam.questCorrect, value: quest.correct },
    { def: DAILY_QUESTS[1], label: d.gam.questMaster, value: quest.mastered },
    { def: DAILY_QUESTS[2], label: d.gam.questTutor, value: quest.tutor },
  ];

  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between">
        <p className="font-serif text-2xl">{d.gam.quests}</p>
        <p className="font-mono text-[11px] uppercase tracking-label">
          <span className="text-marigold">☀ {xp} {d.gam.xp}</span>
          <span className="mx-2 text-mute">·</span>
          <span className="text-ochre">🔥 {streakDays} {d.gam.streak}</span>
        </p>
      </div>
      <div className="mt-5 space-y-4">
        {rows.map(({ def, label, value }) => {
          const complete = quest.claimed.includes(def.id);
          const pct = Math.min(100, Math.round((value / def.target) * 100));
          return (
            <div key={def.id}>
              <div className="flex items-baseline justify-between gap-3">
                <p className={clsx("text-sm", complete ? "text-marigold" : "text-paper/85")}>{label}</p>
                <p className="font-mono text-[10px] uppercase tracking-label text-mute-light">
                  {complete ? <span className="text-marigold">✓ {d.gam.questDone}</span> : `${Math.min(value, def.target)}/${def.target}`}
                </p>
              </div>
              <div className="mt-1.5 h-px w-full bg-paper/10">
                <div className="h-px bg-marigold transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 border-t border-hairline pt-4">
        <p className="eyebrow">{d.gam.reviewQueue} · {review.length}</p>
        <p className="mt-1 text-sm text-mute-light">{review.length > 0 ? d.gam.reviewHint : d.gam.empty}</p>
      </div>
    </div>
  );
}
