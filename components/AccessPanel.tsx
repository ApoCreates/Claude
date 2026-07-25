"use client";

import { useState } from "react";
import { usePrefs, type AccessPrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { toggleFocusMusic, isMusicPlaying, playSfx } from "@/lib/sound";
import { stopSpeaking } from "@/lib/speech";
import clsx from "clsx";

// The accessibility panel — tickable options for blind, deaf, low-vision and
// autistic learners, persisted with the rest of the profile.
export function AccessPanel() {
  const { lang, access, setAccess } = usePrefs();
  const d = t(lang);
  const [open, setOpen] = useState(false);
  const [music, setMusic] = useState(isMusicPlaying());

  const row = (
    key: keyof AccessPrefs,
    label: string,
    hint: string,
    extra?: () => void
  ) => {
    const on = access[key];
    return (
      <button
        role="switch"
        aria-checked={on}
        onClick={() => {
          setAccess({ [key]: !on });
          if (key === "sound" && on) {
            stopSpeaking();
            toggleFocusMusic(false);
            setMusic(false);
          }
          if (!on) playSfx("click", key === "sound" ? true : access.sound);
          extra?.();
        }}
        className="flex w-full items-start justify-between gap-4 border-t border-hairline px-1 py-3 text-start hover:bg-ink-lift"
      >
        <span>
          <span className="block text-sm font-medium text-paper">{label}</span>
          <span className="mt-0.5 block text-xs text-mute-light">{hint}</span>
        </span>
        <span
          className={clsx(
            "mt-0.5 shrink-0 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-label",
            on ? "border-marigold bg-marigold text-ink" : "border-hairline-strong text-mute-light"
          )}
        >
          {on ? d.access.on : d.access.off}
        </span>
      </button>
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={d.access.title}
        className="px-2 py-1 font-mono text-[11px] uppercase tracking-label text-mute-light hover:text-marigold"
      >
        ♿ {d.access.button}
      </button>

      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 w-80 border border-hairline-strong bg-ink p-4 shadow-none">
          <div className="mb-2 flex items-baseline justify-between">
            <p className="font-serif text-xl">{d.access.title}</p>
            <button onClick={() => setOpen(false)} aria-label="Close" className="font-mono text-xs text-mute-light hover:text-marigold">
              ✕
            </button>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-mute-light">{d.access.note}</p>

          {row("sound", d.access.sound, d.access.soundHint)}
          {row("readAloud", d.access.readAloud, d.access.readAloudHint)}
          {row("largeText", d.access.largeText, d.access.largeTextHint)}
          {row("highContrast", d.access.contrast, d.access.contrastHint)}
          {row("calm", d.access.calm, d.access.calmHint)}

          {/* Focus music — session-scoped, gated by the sound setting. */}
          <button
            role="switch"
            aria-checked={music}
            disabled={!access.sound}
            onClick={() => {
              const next = !music;
              setMusic(next);
              toggleFocusMusic(next && access.sound);
            }}
            className="flex w-full items-start justify-between gap-4 border-t border-hairline px-1 py-3 text-start hover:bg-ink-lift disabled:opacity-40"
          >
            <span>
              <span className="block text-sm font-medium text-paper">🎵 {d.access.music}</span>
              <span className="mt-0.5 block text-xs text-mute-light">{d.access.musicHint}</span>
            </span>
            <span
              className={clsx(
                "mt-0.5 shrink-0 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-label",
                music ? "border-marigold bg-marigold text-ink" : "border-hairline-strong text-mute-light"
              )}
            >
              {music ? d.access.on : d.access.off}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
