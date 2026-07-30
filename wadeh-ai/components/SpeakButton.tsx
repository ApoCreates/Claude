"use client";

import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { speak, canSpeak } from "@/lib/speech";

// A small read-aloud button. Rendered next to any important text.
export function SpeakButton({ text, className = "" }: { text: string; className?: string }) {
  const { lang, access } = usePrefs();
  const d = t(lang);
  if (!access.sound) return null;
  return (
    <button
      onClick={() => canSpeak() && speak(text, lang)}
      aria-label={d.access.listen}
      title={d.access.listen}
      className={`shrink-0 border border-hairline px-2 py-1 font-mono text-[10px] uppercase tracking-label text-mute-light hover:border-marigold/60 hover:text-marigold ${className}`}
    >
      🔊 {d.access.listen}
    </button>
  );
}
