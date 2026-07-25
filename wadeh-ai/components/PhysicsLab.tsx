"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { XP_LAB } from "@/lib/games";

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
          className="mt-2 w-full accent-[#C4612A]"
        />
      </label>
      <div dir="ltr" className="mt-4">
        <svg viewBox="0 0 320 160" className="w-full border border-hairline bg-ink">
          {/* water — density 1.0 */}
          <rect x={20} y={70} width={280} height={80} fill="rgba(110,104,93,0.35)" />
          <line x1={20} y1={70} x2={300} y2={70} stroke="rgba(21,20,15,0.45)" strokeWidth="1.5" />
          <text x={26} y={64} fontSize="9" fill="#8A8272" fontFamily="monospace">
            WATER · 1.0 g/cm³
          </text>
          {/* tank walls */}
          <path d="M 20 40 L 20 150 L 300 150 L 300 40" fill="none" stroke="rgba(21,20,15,0.4)" strokeWidth="2" />
          {/* the ball */}
          <circle cx={160} cy={y} r={16} fill={floats ? "#FFCB58" : "#8B2E1F"} style={{ transition: "cy 0.5s, fill 0.3s" }} />
        </svg>
      </div>
      <p className="mt-4 font-serif text-2xl" style={{ color: floats ? "#C4612A" : "#8B2E1F" }}>
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
  const { addXp } = usePrefs();
  const [angle, setAngle] = useState(45);
  const [speed, setSpeed] = useState(16);
  const [flying, setFlying] = useState(false);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  // The game: a target to hit. Fixed opening distance (hydration-safe),
  // re-rolled randomly after every hit or skip.
  const [target, setTarget] = useState(38);
  const [shots, setShots] = useState(0);
  const [hits, setHits] = useState(0);
  const [verdict, setVerdict] = useState<null | { hit: boolean; off: number }>(null);
  const raf = useRef<number>(0);

  const g = 9.8;
  const rad = (angle * Math.PI) / 180;
  const range = (speed * speed * Math.sin(2 * rad)) / g;
  const hMax = (speed * speed * Math.sin(rad) ** 2) / (2 * g);
  const tFlight = (2 * speed * Math.sin(rad)) / g;

  const W = 320, H = 170;
  const sx = (x: number) => 14 + (x / 70) * (W - 28);
  const sy = (y: number) => H - 20 - (y / 20) * (H - 40);

  const newTarget = () => {
    setTarget(18 + Math.floor(Math.random() * 45));
    setVerdict(null);
    setTrail([]);
  };

  const launch = () => {
    cancelAnimationFrame(raf.current);
    setFlying(true);
    setVerdict(null);
    setTrail([]);
    const landAt = range; // captured now — sliders may move during flight
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
        setShots((s) => s + 1);
        const off = landAt - target;
        const hit = Math.abs(off) <= 3;
        setVerdict({ hit, off });
        if (hit) {
          setHits((h) => h + 1);
          addXp(XP_LAB);
          setTimeout(newTarget, 1600);
        }
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
          <input type="range" min={15} max={75} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="mt-2 w-full accent-[#C4612A]" />
        </label>
        <label className="block" dir="ltr">
          <span className="eyebrow">{lang === "ar" ? "السرعة (م/ث)" : "Speed (m/s)"}: {speed}</span>
          <input type="range" min={8} max={25} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="mt-2 w-full accent-[#C4612A]" />
        </label>
      </div>

      <div dir="ltr">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full border border-hairline bg-ink">
          <line x1={10} y1={H - 20} x2={W - 10} y2={H - 20} stroke="rgba(21,20,15,0.45)" strokeWidth="1.5" />
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
              stroke="#C4612A"
              strokeWidth="2.5"
            />
          )}
          {/* the target */}
          <g>
            <line x1={sx(target)} y1={H - 20} x2={sx(target)} y2={H - 44} stroke="#8B2E1F" strokeWidth="2" />
            <path d={`M ${sx(target)} ${H - 44} L ${sx(target) + 12} ${H - 40} L ${sx(target)} ${H - 36} Z`} fill="#8B2E1F" />
            <line x1={sx(target - 3)} y1={H - 20} x2={sx(target + 3)} y2={H - 20} stroke="#8B2E1F" strokeWidth="4" />
          </g>
          {/* the ball */}
          {last && <circle cx={sx(last.x)} cy={sy(last.y)} r={6} fill="#FFCB58" />}
          {/* launcher */}
          <line
            x1={sx(0)}
            y1={sy(0)}
            x2={sx(0) + 24 * Math.cos(rad)}
            y2={sy(0) - 24 * Math.sin(rad)}
            stroke="#15140F"
            strokeWidth="3"
          />
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-5">
        <button onClick={launch} disabled={flying} className="btn-primary disabled:opacity-50">
          {lang === "ar" ? "أطلق 🚀" : "Launch 🚀"}
        </button>
        <button onClick={newTarget} disabled={flying} className="btn-ghost disabled:opacity-50">
          {lang === "ar" ? "هدف جديد" : "New target"}
        </button>
        <p className="font-mono text-[11px] uppercase tracking-label text-mute-light" dir="ltr">
          {lang === "ar" ? "الهدف" : "TARGET"} {target}m · {lang === "ar" ? "إصابات" : "HITS"} {hits}/{shots}
        </p>
      </div>
      {verdict && (
        <p className="mt-3 font-serif text-2xl" style={{ color: verdict.hit ? "#C4612A" : "#8B2E1F" }}>
          {verdict.hit
            ? lang === "ar"
              ? `إصابة مباشرة! +${XP_LAB} أشعة — هدف جديد قادم…`
              : `Direct hit! +${XP_LAB} rays — new target incoming…`
            : lang === "ar"
              ? `${Math.abs(verdict.off).toFixed(1)} م ${verdict.off > 0 ? "بعيداً جداً" : "قريباً جداً"} — عدّل واضرب مجدداً`
              : `${Math.abs(verdict.off).toFixed(1)}m too ${verdict.off > 0 ? "far" : "short"} — adjust and fire again`}
        </p>
      )}
      <p className="mt-3 text-sm text-paper/70" dir="ltr">
        {lang === "ar"
          ? `المدى المتوقع ${range.toFixed(1)} م · أقصى ارتفاع ${hMax.toFixed(1)} م · الزمن ${tFlight.toFixed(1)} ث — استخدم الفيزياء لتصويبك، لا الحظ.`
          : `Predicted range ${range.toFixed(1)}m · max height ${hMax.toFixed(1)}m · time ${tFlight.toFixed(1)}s — aim with the physics, not with luck.`}
      </p>
    </div>
  );
}
