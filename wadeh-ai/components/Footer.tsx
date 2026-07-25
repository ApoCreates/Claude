"use client";

import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { SunMark } from "./SunMark";

export function Footer() {
  const { lang } = usePrefs();
  const d = t(lang);
  return (
    <footer className="mt-24">
      <div className="cutline cutline-scissor mx-auto max-w-6xl" />
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <SunMark size={36} />
          <div>
            <p className="font-serif text-lg">{d.footer.line1}</p>
            <p className="text-sm text-mute-light">{d.footer.line2}</p>
          </div>
        </div>
        <p className="eyebrow">{d.footer.madeIn}</p>
      </div>
    </footer>
  );
}
