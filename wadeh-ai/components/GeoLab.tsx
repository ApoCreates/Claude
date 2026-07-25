"use client";

import { useState } from "react";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { XP_LAB } from "@/lib/games";
import clsx from "clsx";

interface Zone {
  min: number;
  name: { en: string; ar: string };
  desc: { en: string; ar: string };
  color: string;
}

// Climate belts from equator to pole (absolute latitude).
const ZONES: Zone[] = [
  { min: 66, name: { en: "Polar", ar: "قطبي" }, desc: { en: "Months of darkness, ice year-round.", ar: "أشهر من الظلام وجليد على مدار السنة." }, color: "#8A8272" },
  { min: 45, name: { en: "Cool temperate", ar: "معتدل بارد" }, desc: { en: "Four sharp seasons, forests and snowfall.", ar: "أربعة فصول واضحة وغابات وثلوج." }, color: "#6E685D" },
  { min: 32, name: { en: "Warm temperate", ar: "معتدل دافئ" }, desc: { en: "Mild winters, warm summers — Mediterranean coasts.", ar: "شتاء لطيف وصيف دافئ — سواحل المتوسط." }, color: "#A87D2A" },
  { min: 20, name: { en: "Desert belt", ar: "حزام الصحارى" }, desc: { en: "Dry sinking air — most of the world's hot deserts sit here.", ar: "هواء جاف هابط — هنا تقع معظم صحارى العالم الحارة." }, color: "#C4612A" },
  { min: 0, name: { en: "Tropical", ar: "مداري" }, desc: { en: "Hot and rainy — the belt of rainforests.", ar: "حار وماطر — حزام الغابات المطيرة." }, color: "#8B2E1F" },
];

// The city-placement game: put each city at its true latitude.
const CITIES: { name: { en: string; ar: string }; lat: number }[] = [
  { name: { en: "Dubai", ar: "دبي" }, lat: 25 },
  { name: { en: "Amman", ar: "عمّان" }, lat: 32 },
  { name: { en: "Riyadh", ar: "الرياض" }, lat: 25 },
  { name: { en: "Beirut", ar: "بيروت" }, lat: 34 },
  { name: { en: "Muscat", ar: "مسقط" }, lat: 23 },
  { name: { en: "Damascus", ar: "دمشق" }, lat: 33 },
  { name: { en: "Kuwait City", ar: "مدينة الكويت" }, lat: 29 },
  { name: { en: "Jerusalem", ar: "القدس" }, lat: 32 },
  { name: { en: "Cairo", ar: "القاهرة" }, lat: 30 },
  { name: { en: "Istanbul", ar: "إسطنبول" }, lat: 41 },
  { name: { en: "London", ar: "لندن" }, lat: 51 },
  { name: { en: "Singapore", ar: "سنغافورة" }, lat: 1 },
];

const TOLERANCE = 5;

// The geography lab: explore the climate belts, then play — place real
// cities at their true latitude to earn rays.
export function GeoLab() {
  const { lang, addXp } = usePrefs();
  const d = t(lang);
  const [lat, setLat] = useState(25);
  const [playing, setPlaying] = useState(false);
  const [cityIdx, setCityIdx] = useState(0);
  const [locked, setLocked] = useState<null | { off: number; hit: boolean }>(null);
  const [score, setScore] = useState(0);

  const zone = ZONES.find((z) => Math.abs(lat) >= z.min)!;
  const city = CITIES[cityIdx % CITIES.length];

  const W = 320, H = 220, R = 96, CX = W / 2, CY = H / 2;
  const y = CY - (lat / 90) * R;
  const half = Math.sqrt(Math.max(0, R * R - ((lat / 90) * R) ** 2));
  const cityY = CY - (city.lat / 90) * R;
  const cityHalf = Math.sqrt(Math.max(0, R * R - ((city.lat / 90) * R) ** 2));

  const startGame = () => {
    setPlaying(true);
    setLocked(null);
    setScore(0);
    setCityIdx(Math.floor(Math.random() * CITIES.length));
    setLat(45);
  };

  const lockIn = () => {
    if (locked) return;
    const off = lat - city.lat;
    const hit = Math.abs(off) <= TOLERANCE;
    setLocked({ off, hit });
    if (hit) {
      setScore((s) => s + 1);
      addXp(XP_LAB);
    }
  };

  const nextCity = () => {
    setCityIdx((i) => i + 1);
    setLocked(null);
    setLat(45);
  };

  return (
    <div className="card p-8">
      <div className="flex items-baseline justify-between gap-3">
        <p className="eyebrow-accent mb-2">{d.lesson.lab}</p>
        {playing && (
          <p className="eyebrow">
            {lang === "ar" ? "إصابات" : "HITS"} {score}
          </p>
        )}
      </div>
      <p className="mb-6 text-sm text-mute-light">
        {playing
          ? lang === "ar"
            ? `أين تقع «${city.name.ar}»؟ حرّك خط العرض إلى موقعها ثم ثبّت إجابتك (± ${TOLERANCE}°).`
            : `Where is ${city.name.en}? Slide the latitude to its position, then lock in (± ${TOLERANCE}°).`
          : lang === "ar"
            ? "حرّك خط العرض من خط الاستواء نحو القطب — وشاهد المناخ يتغيّر. ثم العب: ضع المدن في مواقعها."
            : "Slide the latitude from the equator toward the pole — and watch the climate change. Then play: place real cities."}
      </p>

      <label className="block" dir="ltr">
        <span className="eyebrow">{lang === "ar" ? "خط العرض" : "Latitude"}: {lat}°{lat >= 0 ? "N" : "S"}</span>
        <input
          type="range"
          min={0}
          max={90}
          value={lat}
          disabled={!!locked}
          onChange={(e) => setLat(Number(e.target.value))}
          className="mt-2 w-full accent-[#C4612A]"
        />
      </label>

      <div dir="ltr" className="mt-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full border border-hairline bg-ink">
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
                  <rect x={CX - R} y={top} width={2 * R} height={bot - top} fill={z.color} opacity={0.3} />
                  <rect x={CX - R} y={2 * CY - bot} width={2 * R} height={bot - top} fill={z.color} opacity={0.3} />
                </g>
              );
            })}
            <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} stroke="rgba(21,20,15,0.45)" strokeDasharray="3 3" />
          </g>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(21,20,15,0.45)" strokeWidth={1.5} />
          {/* your latitude marker */}
          <line x1={CX - half} y1={y} x2={CX + half} y2={y} stroke="#C4612A" strokeWidth={2.5} />
          <circle cx={CX + half} cy={y} r={4} fill="#C4612A" />
          {/* the answer, revealed after locking */}
          {locked && (
            <g>
              <line x1={CX - cityHalf} y1={cityY} x2={CX + cityHalf} y2={cityY} stroke="#15140F" strokeWidth={1.5} strokeDasharray="5 3" />
              <text x={CX} y={cityY - 5} textAnchor="middle" fontSize="10" fill="#15140F" fontFamily="monospace">
                {city.name[lang]} · {city.lat}°N
              </text>
            </g>
          )}
        </svg>
      </div>

      {!playing ? (
        <>
          <p className="mt-4 font-serif text-2xl" style={{ color: zone.color }}>
            {zone.name[lang]}
          </p>
          <p className="mt-1 text-sm text-paper/70">{zone.desc[lang]}</p>
          <button onClick={startGame} className="btn-primary mt-5">
            {lang === "ar" ? "العب: ضع المدينة 🎯" : "Play: place the city 🎯"}
          </button>
        </>
      ) : (
        <div className="mt-4">
          {locked ? (
            <div>
              <p className={clsx("font-serif text-2xl", locked.hit ? "text-ochre" : "text-dusk")}>
                {locked.hit
                  ? lang === "ar"
                    ? `صحيح! +${XP_LAB} أشعة`
                    : `Placed! +${XP_LAB} rays`
                  : lang === "ar"
                    ? `بعيد بـ ${Math.abs(locked.off)}° — ${city.name.ar} عند ${city.lat}° شمالاً`
                    : `Off by ${Math.abs(locked.off)}° — ${city.name.en} sits at ${city.lat}°N`}
              </p>
              <button onClick={nextCity} className="btn-paper mt-4">
                {lang === "ar" ? "مدينة أخرى" : "Next city"} <span aria-hidden>→</span>
              </button>
            </div>
          ) : (
            <button onClick={lockIn} className="btn-primary">
              {lang === "ar" ? "ثبّت الإجابة" : "Lock it in"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
