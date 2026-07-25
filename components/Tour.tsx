"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { speak, stopSpeaking } from "@/lib/speech";
import { SunMark } from "./SunMark";
import clsx from "clsx";

// The first-entry tour — five short cards shown the first moment anyone
// arrives, before they've chosen anything. Skippable, bilingual, read-aloud
// aware, and replayable from the nav or the founder console.
export function Tour() {
  const { lang, access, tourDone, setTourDone, ready } = usePrefs();
  const d = t(lang);
  const [step, setStep] = useState(0);

  const steps = d.tour.steps;
  const current = steps[step];

  useEffect(() => {
    if (ready && !tourDone && access.readAloud && access.sound && current) {
      speak(`${current.t}. ${current.b}`, lang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, ready, tourDone]);

  if (!ready || tourDone) return null;

  const finish = () => {
    stopSpeaking();
    setTourDone(true);
    setStep(0);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={d.tour.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-paper/60 p-4"
    >
      <div className="card w-full max-w-lg border-hairline-strong bg-ink p-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SunMark size={34} />
            <p className="eyebrow-accent">{d.tour.title}</p>
          </div>
          <button onClick={finish} className="font-mono text-[11px] uppercase tracking-label text-mute-light hover:text-marigold">
            {d.tour.skip} ✕
          </button>
        </div>

        <p className="font-serif text-3xl leading-snug">{current.t}</p>
        <p className="mt-3 min-h-20 leading-relaxed text-paper/80">{current.b}</p>

        {/* progress suns */}
        <div className="mt-6 flex items-center gap-2" aria-label={`${step + 1} / ${steps.length}`}>
          {steps.map((_, i) => (
            <span
              key={i}
              className={clsx(
                "h-2.5 w-2.5 rounded-full transition-colors",
                i <= step ? "bg-ochre" : "border border-hairline-strong"
              )}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-ghost disabled:opacity-30"
          >
            {d.tour.back}
          </button>
          {step < steps.length - 1 ? (
            <button onClick={() => setStep((s) => s + 1)} className="btn-primary">
              {d.tour.next} <span aria-hidden>→</span>
            </button>
          ) : (
            <button onClick={finish} className="btn-primary">
              {d.tour.done} ☀
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
