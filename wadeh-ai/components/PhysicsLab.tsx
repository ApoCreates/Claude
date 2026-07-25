"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";

// The physics lab adapts to the school year:
//   Years 1–5  → a float-or-sink tank driven by density
//   Years 6–10 → an animated projectile launcher
export function PhysicsLab({ level }: { level: number }) {
  const { lang } = usePrefs();
  const d = t(lang);
  return (
    <div className="card p-8">
      <p className="eyebrow-accent mb-2">{d.lesson.lab}</p>
      <p className="mb-6 text-sm text-mute-light">{d.lesson.labHintPhysics}</p>
      {level <= 5 ? <FloatTank lang={lang} /> : <Projectile lang={lang} />}
    </div>
  );
}

function FloatTank({ lang }: { lang: "en" | "ar" }) {
  const [density, setDensity] = useState(0.6);
  const floats = density < 1;
  // Ball vertical position: floats sit at the surface, sinkers rest on the bottom.
  const y = floats ? 78 - (1 - density) * 26 : 132;

  return (
    <div>
      <label className="block" dir="ltr">
        <span className="eyebrow">
          {lang === "ar" ? "الكثافة (غ/سم³)" : "Density (g/cm³)"}: {density.toFixed(1)}
        </span>
        <input
          type="range"
          min={0.2}
          max={3}
          step={0.1}
          value={density}
          onChange={(e) => setDensity(Number(e.target.value))}
          className="mt-2 w-full accent-[#FFCB58]"
        />
      </label>
      <div dir="ltr" className="mt-4">
        <svg viewBox="0 0 320 160" className="w-full border border-hairline bg-ink">
          {/* water — density 1.0 */}
          <rect x={20} y={70} width={280} height={80} fill="rgba(110,104,93,0.35)" />
          <line x1={20} y1={70} x2={300} y2={70} stroke="rgba(244,239,229,0.5)" strokeWidth="1.5" />
          <text x={26} y={64} fontSize="9" fill="#A39B8B" fontFamily="monospace">
            WATER · 1.0 g/cm³
          </text>
          {/* tank walls */}
          <path d="M 20 40 L 20 150 L 300 150 L 300 40" fill="none" stroke="rgba(244,239,229,0.35)" strokeWidth="2" />
          {/* the ball */}
          <circle cx={160} cy={y} r={16} fill={floats ? "#FFCB58" : "#8B2E1F"} style={{ transition: "cy 0.5s, fill 0.3s" }} />
        </svg>
      </div>
      <p className="mt-4 font-serif text-2xl" style={{ color: floats ? "#FFCB58" : "#8B2E1F" }}>
        {lang === "ar"
          ? floats
            ? `يطفو — كثافته ${density.toFixed(1)} أقل من كثافة الماء ١٫٠`
            : `يغرق — كثافته ${density.toFixed(1)} أكبر من كثافة الماء ١٫٠`
          : floats
            ? `It floats — ${density.toFixed(1)} is less dense than water (1.0)`
            : `It sinks — ${density.toFixed(1)} is denser than water (1.0)`}
      </p>
      <p className="mt-2 text-sm text-paper/70">
        {lang === "ar"
          ? "جرّب ٠٫٢ (فلّين)، ٠٫٩ (جليد)، ١٫٢ (جسمك في البحر الميت يطفو لأن كثافة مائه ~١٫٢٤!) و٣٫٠ (حجر)."
          : "Try 0.2 (cork), 0.9 (ice), 1.2 (you float in the Dead Sea because its water is ~1.24!) and 3.0 (stone)."}
      </p>
    </div>
  );
}

function Projectile({ lang }: { lang: "en" | "ar" }) {
  const [angle, setAngle] = useState(45);
  const [speed, setSpeed] = useState(16);
  const [flying, setFlying] = useState(false);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const raf = useRef<number>(0);

  const g = 9.8;
  const rad = (angle * Math.PI) / 180;
  const range = (speed * speed * Math.sin(2 * rad)) / g;
  const hMax = (speed * speed * Math.sin(rad) ** 2) / (2 * g);
  const tFlight = (2 * speed * Math.sin(rad)) / g;

  const W = 320, H = 170;
  const sx = (x: number) => 14 + (x / 70) * (W - 28);
  const sy = (y: number) => H - 20 - (y / 20) * (H - 40);

  const launch = () => {
    cancelAnimationFrame(raf.current);
    setFlying(true);
    setTrail([]);
    const start = performance.now();
    const step = (now: number) => {
      const t = ((now - start) / 1000) * 1.4; // gentle slow-motion
      const x = speed * Math.cos(rad) * t;
      const y = speed * Math.sin(rad) * t - 0.5 * g * t * t;
      if (y >= 0 && x <= 75) {
        setTrail((tr) => [...tr.slice(-90), { x, y }]);
        raf.current = requestAnimationFrame(step);
      } else {
        setFlying(false);
      }
    };
    raf.current = requestAnimationFrame(step);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const last = trail[trail.length - 1];

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <label className="block" dir="ltr">
          <span className="eyebrow">{lang === "ar" ? "الزاوية" : "Angle"}: {angle}°</span>
          <input type="range" min={15} max={75} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="mt-2 w-full accent-[#FFCB58]" />
        </label>
        <label className="block" dir="ltr">
          <span className="eyebrow">{lang === "ar" ? "السرعة (م/ث)" : "Speed (m/s)"}: {speed}</span>
          <input type="range" min={8} max={25} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="mt-2 w-full accent-[#FFCB58]" />
        </label>
      </div>

      <div dir="ltr">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full border border-hairline bg-ink">
          <line x1={10} y1={H - 20} x2={W - 10} y2={H - 20} stroke="rgba(244,239,229,0.4)" strokeWidth="1.5" />
          {/* predicted path, faint */}
          <path
            d={Array.from({ length: 40 }, (_, i) => {
              const t = (tFlight * i) / 39;
              const x = speed * Math.cos(rad) * t;
              const y = speed * Math.sin(rad) * t - 0.5 * g * t * t;
              return `${i === 0 ? "M" : "L"} ${sx(x).toFixed(1)} ${sy(Math.max(0, y)).toFixed(1)}`;
            }).join(" ")}
            fill="none"
            stroke="rgba(196,97,42,0.5)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          {/* flown trail */}
          {trail.length > 1 && (
            <path
              d={trail.map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(" ")}
              fill="none"
              stroke="#FFCB58"
              strokeWidth="2.5"
            />
          )}
          {/* the ball */}
          {last && <circle cx={sx(last.x)} cy={sy(last.y)} r={6} fill="#FFCB58" />}
          {/* launcher */}
          <line
            x1={sx(0)}
            y1={sy(0)}
            x2={sx(0) + 24 * Math.cos(rad)}
            y2={sy(0) - 24 * Math.sin(rad)}
            stroke="#F4EFE5"
            strokeWidth="3"
          />
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-6">
        <button onClick={launch} disabled={flying} className="btn-primary disabled:opacity-50">
          {lang === "ar" ? "أطلق 🚀" : "Launch 🚀"}
        </button>
        <p className="font-mono text-[11px] uppercase tracking-label text-mute-light" dir="ltr">
          {lang === "ar" ? "المدى" : "RANGE"} {range.toFixed(1)}m · {lang === "ar" ? "أقصى ارتفاع" : "MAX H"} {hMax.toFixed(1)}m ·{" "}
          {lang === "ar" ? "الزمن" : "TIME"} {tFlight.toFixed(1)}s
        </p>
      </div>
      <p className="mt-3 text-sm text-paper/70">
        {lang === "ar"
          ? "جرّب ٣٠° ثم ٦٠° بالسرعة نفسها — لماذا يتساوى المدى؟ وأي زاوية تعطي أبعد مدى؟"
          : "Try 30° then 60° at the same speed — why is the range the same? And which angle throws farthest?"}
      </p>
    </div>
  );
}
