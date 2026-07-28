"use client";

import { useState } from "react";
import Link from "next/link";
import { usePrefs } from "@/lib/prefs";
import { PhysicsLab } from "./PhysicsLab";
import { MathLab } from "./MathLab";
import { AILab } from "./AILab";
import clsx from "clsx";

// The homepage used to *describe* the labs — "launchers, sliders, classifiers
// and word games inside the lessons" — while the labs themselves sat unused
// three clicks deep. This puts one on the page, playable, before any sign-up.
//
// The competitor shows a screenshot of their product. We can show the product.

type LabKey = "physics" | "math" | "ai";

const TABS: { key: LabKey; en: string; ar: string; level: number }[] = [
  // Level drives which variant each lab renders. Physics 7 = the animated
  // projectile launcher (it moves, which is the point of a hero). Math 5 =
  // fraction bars. AI 5 = the drag-the-decision-line classifier.
  { key: "physics", en: "Launch something", ar: "أطلق شيئاً", level: 7 },
  { key: "math", en: "Split a whole", ar: "قسّم الكل", level: 5 },
  { key: "ai", en: "Teach a machine", ar: "علّم آلة", level: 5 },
];

export function HeroLab() {
  const { lang } = usePrefs();
  const [tab, setTab] = useState<LabKey>("physics");
  const active = TABS.find((t) => t.key === tab)!;

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="eyebrow-accent">
          {lang === "ar" ? "جرّبه الآن · بلا تسجيل" : "Try it now · no sign-up"}
        </p>
        <Link
          href="/learn"
          className="font-mono text-[11px] uppercase tracking-label text-mute-light transition-colors hover:text-marigold"
        >
          {lang === "ar" ? "كل المختبرات" : "All labs"} <span aria-hidden>→</span>
        </Link>
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-3"
        role="tablist"
        aria-label={lang === "ar" ? "اختر مختبراً" : "Choose a lab"}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "shrink-0 border px-4 py-2 font-sans text-sm transition-colors",
              tab === t.key
                ? "border-marigold bg-marigold text-ink"
                : "border-hairline-strong text-paper hover:border-marigold/70"
            )}
          >
            {t[lang]}
          </button>
        ))}
      </div>

      {/* Each lab renders its own bordered card, so no extra frame here. */}
      <div role="tabpanel" aria-label={active[lang]}>
        {tab === "physics" && <PhysicsLab level={active.level} />}
        {tab === "math" && <MathLab level={active.level} />}
        {/* AILab is level-agnostic — it takes no props. */}
        {tab === "ai" && <AILab />}
      </div>
    </div>
  );
}
