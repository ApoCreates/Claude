"use client";

import { useState } from "react";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";

interface Zone {
  min: number;
  name: { en: string; ar: string };
  desc: { en: string; ar: string };
  color: string;
}

// Climate belts from equator to pole (absolute latitude).
const ZONES: Zone[] = [
  { min: 66, name: { en: "Polar", ar: "قطبي" }, desc: { en: "Months of darkness, ice year-round.", ar: "أشهر من الظلام وجليد على مدار السنة." }, color: "#A39B8B" },
  { min: 45, name: { en: "Cool temperate", ar: "معتدل بارد" }, desc: { en: "Four sharp seasons, forests and snowfall.", ar: "أربعة فصول واضحة وغابات وثلوج." }, color: "#6E685D" },
  { min: 32, name: { en: "Warm temperate", ar: "معتدل دافئ" }, desc: { en: "Mild winters, warm summers — Mediterranean coasts.", ar: "شتاء لطيف وصيف دافئ — سواحل المتوسط." }, color: "#D9A24A" },
  { min: 20, name: { en: "Desert belt", ar: "حزام الصحارى" }, desc: { en: "Dry sinking air — most of the world's hot deserts sit here.", ar: "هواء جاف هابط — هنا تقع معظم صحارى العالم الحارة." }, color: "#C4612A" },
  { min: 0, name: { en: "Tropical", ar: "مداري" }, desc: { en: "Hot and rainy — the belt of rainforests.", ar: "حار وماطر — حزام الغابات المطيرة." }, color: "#8B2E1F" },
];

const MARKERS: { lat: number; label: { en: string; ar: string } }[] = [
  { lat: 25, label: { en: "Dubai · Riyadh ~25°N", ar: "دبي · الرياض ~٢٥° شمالاً" } },
  { lat: 33, label: { en: "Amman · Damascus · Beirut ~33°N", ar: "عمّان · دمشق · بيروت ~٣٣° شمالاً" } },
  { lat: 0, label: { en: "Equator", ar: "خط الاستواء" } },
  { lat: 51, label: { en: "London ~51°N", ar: "لندن ~٥١° شمالاً" } },
];

// The geography lab: slide a latitude marker up the globe and watch the
// climate zone, daylight and neighbours change.
export function GeoLab() {
  const { lang } = usePrefs();
  const d = t(lang);
  const [lat, setLat] = useState(25);

  const zone = ZONES.find((z) => Math.abs(lat) >= z.min)!;
  const W = 320, H = 220, R = 96, CX = W / 2, CY = H / 2;
  const y = CY - (lat / 90) * R;
  const half = Math.sqrt(Math.max(0, R * R - ((lat / 90) * R) ** 2));

  return (
    <div className="card p-8">
      <p className="eyebrow-accent mb-2">{d.lesson.lab}</p>
      <p className="mb-6 text-sm text-mute-light">
        {lang === "ar"
          ? "حرّك خط العرض من خط الاستواء نحو القطب — وشاهد المناخ يتغيّر."
          : "Slide the latitude from the equator toward the pole — and watch the climate change."}
      </p>
      <label className="block" dir="ltr">
        <span className="eyebrow">{lang === "ar" ? "خط العرض" : "Latitude"}: {lat}°{lat >= 0 ? "N" : "S"}</span>
        <input type="range" min={0} max={90} value={lat} onChange={(e) => setLat(Number(e.target.value))} className="mt-2 w-full accent-[#FFCB58]" />
      </label>
      <div dir="ltr" className="mt-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full border border-hairline bg-ink">
          {/* the globe with climate bands */}
          <defs>
            <clipPath id="globe-clip">
              <circle cx={CX} cy={CY} r={R} />
            </clipPath>
          </defs>
          <g clipPath="url(#globe-clip)">
            {ZONES.map((z, i) => {
              const top = CY - ((i === 0 ? 90 : ZONES[i - 1].min) / 90) * R;
              const bot = CY - (z.min / 90) * R;
              return (
                <g key={z.name.en}>
                  <rect x={CX - R} y={top} width={2 * R} height={bot - top} fill={z.color} opacity={0.35} />
                  <rect x={CX - R} y={2 * CY - bot} width={2 * R} height={bot - top} fill={z.color} opacity={0.35} />
                </g>
              );
            })}
            {/* equator */}
            <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} stroke="rgba(244,239,229,0.4)" strokeDasharray="3 3" />
          </g>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(244,239,229,0.5)" strokeWidth={1.5} />
          {/* latitude marker */}
          <line x1={CX - half} y1={y} x2={CX + half} y2={y} stroke="#FFCB58" strokeWidth={2.5} />
          <circle cx={CX + half} cy={y} r={4} fill="#FFCB58" />
        </svg>
      </div>
      <p className="mt-4 font-serif text-2xl" style={{ color: zone.color === "#6E685D" ? "#A39B8B" : zone.color }}>
        {zone.name[lang]}
      </p>
      <p className="mt-1 text-sm text-paper/70">{zone.desc[lang]}</p>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-label text-mute-light">
        {MARKERS.reduce((best, m) => (Math.abs(m.lat - lat) < Math.abs(best.lat - lat) ? m : best)).label[lang]}
      </p>
    </div>
  );
}
