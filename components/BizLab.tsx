"use client";

import { useState } from "react";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { MiniPlot } from "./MiniPlot";

// The entrepreneurship lab: price a lemonade stand. Demand falls as price
// rises; profit is a curve with a sweet spot. Finding it *is* the lesson.
export function BizLab() {
  const { lang } = usePrefs();
  const d = t(lang);
  const [price, setPrice] = useState(5);
  const [cost, setCost] = useState(2);

  const demand = (p: number) => Math.max(0, 100 - 8 * p);
  const profit = (p: number) => (p - cost) * demand(p);

  const cups = demand(price);
  const prof = profit(price);
  // The analytic optimum of (p - c)(100 - 8p): p* = (100/8 + c) / 2
  const best = Math.round(((100 / 8 + cost) / 2) * 10) / 10;

  return (
    <div className="card p-8">
      <p className="eyebrow-accent mb-2">{d.lesson.lab}</p>
      <p className="mb-6 text-sm text-mute-light">
        {lang === "ar"
          ? "بسطة ليمونادة: كلما رفعت السعر قلّ المشترون. اعثر على السعر الذي يصنع أكبر ربح."
          : "A lemonade stand: raise the price and fewer people buy. Find the price that makes the most profit."}
      </p>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <label className="block" dir="ltr">
          <span className="eyebrow">{lang === "ar" ? "سعر الكوب" : "Price per cup"}: {price}</span>
          <input type="range" min={1} max={12} step={0.5} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="mt-2 w-full accent-[#C4612A]" />
        </label>
        <label className="block" dir="ltr">
          <span className="eyebrow">{lang === "ar" ? "تكلفة الكوب" : "Cost per cup"}: {cost}</span>
          <input type="range" min={0.5} max={5} step={0.5} value={cost} onChange={(e) => setCost(Number(e.target.value))} className="mt-2 w-full accent-[#C4612A]" />
        </label>
      </div>

      <MiniPlot fn={profit} xMin={0} xMax={13} yMin={-40} yMax={230} height={190} label={lang === "ar" ? "الربح مقابل السعر" : "profit vs. price"} />

      <div className="mt-4 flex flex-wrap gap-8">
        <div>
          <p className="font-serif text-3xl text-paper">{cups}</p>
          <p className="eyebrow mt-1">{lang === "ar" ? "أكواب تُباع" : "CUPS SOLD"}</p>
        </div>
        <div>
          <p className="font-serif text-3xl" style={{ color: prof > 0 ? "#C4612A" : "#8B2E1F" }}>{Math.round(prof)}</p>
          <p className="eyebrow mt-1">{lang === "ar" ? "الربح" : "PROFIT"}</p>
        </div>
        <div>
          <p className="font-serif text-3xl text-gold">{best}</p>
          <p className="eyebrow mt-1">{lang === "ar" ? "السعر الأمثل" : "BEST PRICE"}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-paper/70">
        {lang === "ar"
          ? "لاحظ: السعر الأعلى ليس الربح الأعلى. حين ترتفع التكلفة يرتفع السعر الأمثل معها — هذا هو التسعير."
          : "Notice: the highest price is not the highest profit. When cost rises, the best price rises with it — that's pricing."}
      </p>
    </div>
  );
}
