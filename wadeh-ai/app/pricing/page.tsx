"use client";

import { usePrefs, type Plan } from "@/lib/prefs";
import { t, PRICING } from "@/lib/i18n";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Guard } from "@/components/Guard";
import clsx from "clsx";
import Link from "next/link";

export default function PricingPage() {
  return (
    <Guard>
      <Pricing />
    </Guard>
  );
}

function Pricing() {
  const { lang, region, plan, setPlan } = usePrefs();
  const d = t(lang);
  const r = region ?? "gcc";
  const p = PRICING[r];

  const plans: { id: Plan; name: string; price: string; blurb: string; features: string[]; featured?: boolean }[] = [
    {
      id: "free",
      name: d.pricing.free.name,
      price: d.pricing.free.price,
      blurb: d.pricing.free.blurb,
      features: d.pricing.free.features,
    },
    {
      id: "scholar",
      name: d.pricing.scholar.name,
      price: `${p.currency[lang]} ${p.scholar}`,
      blurb: d.pricing.scholar.blurb,
      features: d.pricing.scholar.features,
      featured: true,
    },
    {
      id: "family",
      name: d.pricing.family.name,
      price: `${p.currency[lang]} ${p.family}`,
      blurb: d.pricing.family.blurb,
      features: d.pricing.family.features,
    },
  ];

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="eyebrow-accent mb-3">{d.pricing.eyebrow}</p>
        <h1 className="font-serif text-5xl">{d.pricing.title}</h1>
        <p className="mt-4 max-w-xl text-paper/70">{d.pricing.body}</p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {plans.map((pl, i) => {
            const isCurrent = plan === pl.id;
            return (
              <div
                key={pl.id}
                className={clsx(
                  "card flex flex-col p-8",
                  pl.featured && "border-marigold/70 bg-ink-lift"
                )}
              >
                <p className="font-mono text-xs text-ochre">{["01", "02", "03"][i]} · {pl.id.toUpperCase()}</p>
                <p className="mt-4 font-serif text-3xl">{pl.name}</p>
                <p className="mt-1 text-sm text-mute-light">{pl.blurb}</p>
                <p className="mt-6 font-serif text-4xl text-marigold">
                  {pl.price}
                  {pl.id !== "free" && <span className="text-base text-mute-light"> {d.pricing.perMonth}</span>}
                </p>
                <ul className="mt-8 flex-1 space-y-3">
                  {pl.features.map((f) => (
                    <li key={f} className="flex gap-3 text-sm leading-relaxed text-paper/85">
                      <span className="text-ochre">+</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setPlan(pl.id)}
                  disabled={isCurrent}
                  className={clsx("mt-8", isCurrent ? "btn-ghost opacity-60" : pl.featured ? "btn-primary" : "btn-paper")}
                >
                  {isCurrent ? `✓ ${d.pricing.current}` : d.pricing.choose}
                </button>
              </div>
            );
          })}
        </div>

        <p className="eyebrow mt-8">{d.pricing.note}</p>

        {plan !== "free" && (
          <div className="mt-10 flex items-center justify-between gap-4 border border-marigold/40 bg-ink-panel p-6">
            <p className="font-serif text-lg">{d.pricing.chosen}</p>
            <Link href="/learn" className="btn-primary shrink-0">
              {d.hero.ctaPrimary} <span aria-hidden>→</span>
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
