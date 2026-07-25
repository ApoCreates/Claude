"use client";

import { useState } from "react";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { MiniPlot } from "./MiniPlot";

// The math lab adapts to the school year:
//   Years 1–3  → a number line that animates addition
//   Years 4–5  → fraction bars with live equivalence
//   Years 6–10 → an interactive straight-line grapher
export function MathLab({ level }: { level: number }) {
  const { lang } = usePrefs();
  const d = t(lang);

  return (
    <div className="card p-8">
      <p className="eyebrow-accent mb-2">{d.lesson.lab}</p>
      <p className="mb-6 text-sm text-mute-light">{d.lesson.labHintMath}</p>
      {level <= 3 ? <NumberLine lang={lang} /> : level <= 5 ? <FractionBars lang={lang} /> : <Grapher lang={lang} />}
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <label className="block" dir="ltr">
      <span className="eyebrow">{label}: {value}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[#FFCB58]"
      />
    </label>
  );
}

function NumberLine({ lang }: { lang: "en" | "ar" }) {
  const [a, setA] = useState(4);
  const [b, setB] = useState(3);
  const W = 320, H = 90, max = 20;
  const sx = (v: number) => (v / max) * (W - 20) + 10;

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Slider label={lang === "ar" ? "العدد الأول" : "First number"} value={a} min={0} max={10} onChange={setA} />
        <Slider label={lang === "ar" ? "العدد الثاني" : "Second number"} value={b} min={0} max={10} onChange={setB} />
      </div>
      <div dir="ltr">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full border border-hairline bg-ink">
          <line x1={10} y1={60} x2={W - 10} y2={60} stroke="rgba(244,239,229,0.4)" strokeWidth="1.5" />
          {Array.from({ length: max + 1 }, (_, i) => (
            <g key={i}>
              <line x1={sx(i)} y1={55} x2={sx(i)} y2={65} stroke="rgba(244,239,229,0.4)" strokeWidth="1" />
              {i % 5 === 0 && (
                <text x={sx(i)} y={80} textAnchor="middle" fontSize="9" fill="#A39B8B" fontFamily="monospace">
                  {i}
                </text>
              )}
            </g>
          ))}
          {/* first jump */}
          <path d={`M ${sx(0)} 58 Q ${sx(a / 2)} 18 ${sx(a)} 58`} fill="none" stroke="#C4612A" strokeWidth="2" />
          {/* second jump */}
          <path d={`M ${sx(a)} 58 Q ${sx(a + b / 2)} 18 ${sx(Math.min(a + b, max))} 58`} fill="none" stroke="#FFCB58" strokeWidth="2" />
          <circle cx={sx(Math.min(a + b, max))} cy={60} r={5} fill="#FFCB58" />
        </svg>
      </div>
      <p className="mt-4 font-serif text-2xl text-marigold" dir="ltr" style={{ textAlign: lang === "ar" ? "right" : "left" }}>
        {a} + {b} = {a + b}
      </p>
    </div>
  );
}

function FractionBars({ lang }: { lang: "en" | "ar" }) {
  const [numr, setNum] = useState(1);
  const [den, setDen] = useState(4);
  const n = Math.min(numr, den);
  const pct = Math.round((n / den) * 100);

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Slider label={lang === "ar" ? "البسط" : "Numerator"} value={n} min={1} max={12} onChange={setNum} />
        <Slider label={lang === "ar" ? "المقام" : "Denominator"} value={den} min={2} max={12} onChange={setDen} />
      </div>
      <div className="flex h-12 w-full overflow-hidden border border-hairline" dir="ltr">
        {Array.from({ length: den }, (_, i) => (
          <div
            key={i}
            className="h-full flex-1 border-e border-hairline transition-colors"
            style={{ background: i < n ? "#FFCB58" : "transparent" }}
          />
        ))}
      </div>
      <p className="mt-4 font-serif text-2xl text-marigold" dir="ltr" style={{ textAlign: lang === "ar" ? "right" : "left" }}>
        {n}/{den} = {pct}%
      </p>
    </div>
  );
}

function Grapher({ lang }: { lang: "en" | "ar" }) {
  const [m, setM] = useState(2);
  const [b, setB] = useState(1);

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Slider label={lang === "ar" ? "الميل (م)" : "Slope (m)"} value={m} min={-5} max={5} onChange={setM} />
        <Slider label={lang === "ar" ? "التقاطع (ب)" : "Intercept (b)"} value={b} min={-8} max={8} onChange={setB} />
      </div>
      <MiniPlot fn={(x) => m * x + b} label={`y = ${m}x ${b >= 0 ? "+" : "−"} ${Math.abs(b)}`} />
      <p className="mt-3 text-sm leading-relaxed text-paper/70">
        {lang === "ar"
          ? m === 0
            ? "حين يكون الميل صفراً يصبح المستقيم أفقياً — لا صعود ولا هبوط."
            : m > 0
              ? "ميل موجب: المستقيم يصعد من اليسار إلى اليمين. كلما كبر الميل زاد الانحدار."
              : "ميل سالب: المستقيم يهبط من اليسار إلى اليمين."
          : m === 0
            ? "With zero slope the line is flat — no rise at all."
            : m > 0
              ? "Positive slope: the line climbs left to right. Bigger slope, steeper climb."
              : "Negative slope: the line falls from left to right."}
      </p>
    </div>
  );
}
