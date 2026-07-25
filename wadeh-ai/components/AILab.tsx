"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { XP_LAB } from "@/lib/games";

// The AI lab: a hands-on classifier. Two clusters of points (suns vs. moons);
// the learner rotates and shifts a decision line and watches accuracy respond.
// The core intuition of machine learning — a model is a boundary — made physical.
export function AILab() {
  const { lang, addXp } = usePrefs();
  const d = t(lang);
  const [angle, setAngle] = useState(30);
  const [offset, setOffset] = useState(0);
  const [rewarded, setRewarded] = useState(false);

  // Two fixed clusters, generated once (deterministic pattern, no Math.random
  // in render to keep hydration stable).
  const points = useMemo(() => {
    const pts: { x: number; y: number; cls: 0 | 1 }[] = [];
    for (let i = 0; i < 14; i++) {
      pts.push({ x: -4.5 + ((i * 37) % 40) / 10, y: 1 + ((i * 53) % 35) / 10, cls: 0 });
      pts.push({ x: 0.5 + ((i * 41) % 40) / 10, y: -4.5 + ((i * 29) % 35) / 10, cls: 1 });
    }
    return pts;
  }, []);

  const rad = (angle * Math.PI) / 180;
  // Decision rule: which side of the line (through offset, at `angle`) a point falls on.
  const side = (x: number, y: number) => Math.sin(rad) * x - Math.cos(rad) * (y - offset) > 0;
  const correct = points.filter((p) => (p.cls === 1) === side(p.x, p.y)).length;
  const acc = Math.round((correct / points.length) * 100);

  // A perfectly trained model pays out — once.
  useEffect(() => {
    if (acc === 100 && !rewarded) {
      setRewarded(true);
      addXp(XP_LAB);
    }
  }, [acc, rewarded, addXp]);

  const W = 320, H = 220;
  const sx = (x: number) => ((x + 5) / 10) * W;
  const sy = (y: number) => H - ((y + 5) / 10) * H;

  const x1 = -6, x2 = 6;
  const ly = (x: number) => Math.tan(rad) * x + offset;

  return (
    <div className="card p-8">
      <p className="eyebrow-accent mb-2">{d.lesson.lab}</p>
      <p className="mb-6 text-sm text-mute-light">
        {lang === "ar"
          ? "أنت النموذج: حرّك خط الفصل حتى تفصل الشموس عن الأقمار — وراقب الدقة."
          : "You are the model: move the decision line to separate suns from moons — and watch accuracy respond."}
      </p>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <label className="block" dir="ltr">
          <span className="eyebrow">{lang === "ar" ? "زاوية الخط" : "Line angle"}: {angle}°</span>
          <input type="range" min={-80} max={80} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="mt-2 w-full accent-[#C4612A]" />
        </label>
        <label className="block" dir="ltr">
          <span className="eyebrow">{lang === "ar" ? "الإزاحة" : "Shift"}: {offset}</span>
          <input type="range" min={-4} max={4} step={0.5} value={offset} onChange={(e) => setOffset(Number(e.target.value))} className="mt-2 w-full accent-[#C4612A]" />
        </label>
      </div>
      <div dir="ltr">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full border border-hairline bg-ink">
          {points.map((p, i) =>
            p.cls === 0 ? (
              <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={5} fill="#FFCB58" opacity={0.9} />
            ) : (
              <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={5} fill="none" stroke="#8A8272" strokeWidth={1.5} />
            )
          )}
          <line x1={sx(x1)} y1={sy(ly(x1))} x2={sx(x2)} y2={sy(ly(x2))} stroke="#C4612A" strokeWidth={2.5} />
        </svg>
      </div>
      <p className="mt-4 font-serif text-2xl" style={{ color: acc >= 95 ? "#C4612A" : "#A87D2A" }}>
        {lang === "ar" ? "الدقة" : "Accuracy"}: {acc}%
        {acc === 100
          ? lang === "ar"
            ? ` — نموذج مثالي! +${XP_LAB} أشعة`
            : ` — perfect model! +${XP_LAB} rays`
          : acc >= 95
            ? lang === "ar"
              ? " — نموذج مدرّب!"
              : " — model trained!"
            : ""}
      </p>
      <p className="mt-2 text-sm text-paper/70">
        {lang === "ar"
          ? "هذا بالضبط ما يفعله التدريب: يحرّك الحاسوب الخط آلاف المرات حتى تبلغ الدقة أقصاها."
          : "This is exactly what training does: the computer nudges the line thousands of times until accuracy peaks."}
      </p>
    </div>
  );
}
