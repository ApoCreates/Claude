"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { Wordmark } from "./Wordmark";
import clsx from "clsx";

export function Nav() {
  const { lang, region, setLang, xp, streakDays } = usePrefs();
  const d = t(lang);
  const path = usePathname();

  const links = [
    { href: "/home", label: d.nav.home },
    { href: "/learn", label: d.nav.curriculum },
    { href: "/sprint", label: d.sprint.title },
    { href: "/pricing", label: d.nav.pricing },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-ink/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/home" aria-label="wadehAI home">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "px-3 py-2 text-sm transition-colors",
                path.startsWith(l.href) ? "text-marigold" : "text-paper/80 hover:text-paper"
              )}
            >
              {l.label}
            </Link>
          ))}
          <span className="mx-2 hidden h-4 w-px bg-paper/20 sm:block" />
          <span className="hidden px-2 font-mono text-[11px] uppercase tracking-label md:block" dir="ltr">
            <span className="text-marigold">☀ {xp}</span>
            <span className="mx-1 text-mute">·</span>
            <span className="text-ochre">🔥 {streakDays}</span>
          </span>
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="px-2 py-1 font-mono text-[11px] uppercase tracking-label text-mute-light hover:text-marigold"
            aria-label="Switch language"
          >
            {lang === "en" ? "عربي" : "EN"}
          </button>
          <Link
            href="/"
            className="hidden px-2 py-1 font-mono text-[11px] uppercase tracking-label text-mute-light hover:text-marigold sm:block"
          >
            {region === "gcc" ? d.gate.gcc : region === "levant" ? d.gate.levant : ""} · {d.nav.switchRegion}
          </Link>
        </nav>
      </div>
    </header>
  );
}
