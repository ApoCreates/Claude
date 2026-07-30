"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { Wordmark } from "./Wordmark";
import { AccessPanel } from "./AccessPanel";
import clsx from "clsx";

// The nav previously rendered five links plus four utility controls in one
// unconditional flex row. On a 390px viewport that row is ~1.6x the width of
// the screen, which forced horizontal overflow on the whole document — the
// cause of the clipped Arabic toggle, the wrapped "Sun Sprint", and the dead
// space to the side of every page. Links now collapse into a drawer below lg.
//
// Two things deliberately stay reachable at every width: the accessibility
// panel (never hide an a11y control behind a menu) and the rays/streak count
// (it is game state — the learner should always see it).

export function NavV2() {
  const { lang, region, setLang, xp, streakDays, setTourDone } = usePrefs();
  const d = t(lang);
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/home", label: d.nav.home },
    { href: "/learn", label: d.nav.curriculum },
    { href: "/methods", label: lang === "ar" ? "الطريقة" : "Method" },
    { href: "/sprint", label: d.sprint.title },
    { href: "/pricing", label: d.nav.pricing },
  ];

  // Close on route change, and lock the page behind the open drawer.
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const replayTour = () => {
    setOpen(false);
    setTourDone(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-ink/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
        <Link href="/home" aria-label="wadehAI home" className="shrink-0">
          <Wordmark />
        </Link>

        {/* Desktop row — only from lg, where it genuinely fits. */}
        <nav className="hidden items-center gap-1 lg:flex">
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
          <span className="mx-2 h-4 w-px bg-paper/20" />
          <RaysPill xp={xp} streakDays={streakDays} />
          <button
            onClick={replayTour}
            className="px-2 py-1 font-mono text-[11px] uppercase tracking-label text-mute-light transition-colors hover:text-marigold"
          >
            {d.tour.replay}
          </button>
          <AccessPanel />
          <LangToggle lang={lang} setLang={setLang} />
          <Link
            href="/"
            className="px-2 py-1 font-mono text-[11px] uppercase tracking-label text-mute-light transition-colors hover:text-marigold"
          >
            {region === "gcc" ? d.gate.gcc : region === "levant" ? d.gate.levant : ""} · {d.nav.switchRegion}
          </Link>
        </nav>

        {/* Mobile row — state, a11y, language, menu. Nothing else. */}
        <div className="flex items-center gap-1 lg:hidden">
          <RaysPill xp={xp} streakDays={streakDays} compact />
          <AccessPanel />
          <LangToggle lang={lang} setLang={setLang} />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? (lang === "ar" ? "إغلاق القائمة" : "Close menu") : lang === "ar" ? "القائمة" : "Menu"}
            className="flex h-8 w-8 shrink-0 items-center justify-center border border-hairline-strong text-paper transition-colors hover:border-marigold/70 sm:h-9 sm:w-9"
          >
            <span aria-hidden className="relative block h-3 w-4">
              <span
                className={clsx(
                  "absolute inset-x-0 h-px bg-current transition-all duration-200",
                  open ? "top-1.5 rotate-45" : "top-0"
                )}
              />
              <span
                className={clsx(
                  "absolute inset-x-0 top-1.5 h-px bg-current transition-opacity duration-200",
                  open && "opacity-0"
                )}
              />
              <span
                className={clsx(
                  "absolute inset-x-0 h-px bg-current transition-all duration-200",
                  open ? "top-1.5 -rotate-45" : "top-3"
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Drawer */}
      {open && (
        <div id="mobile-nav" className="border-t border-hairline bg-ink lg:hidden">
          <nav className="mx-auto max-w-6xl px-5 py-2 sm:px-6">
            {links.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "flex items-baseline gap-3 py-3.5 text-lg transition-colors",
                  i > 0 && "border-t border-hairline",
                  path.startsWith(l.href) ? "text-marigold" : "text-paper hover:text-marigold"
                )}
              >
                <span className="font-mono text-[11px] tracking-label text-mute-light">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-serif">{l.label}</span>
              </Link>
            ))}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline py-4">
              <button
                onClick={replayTour}
                className="font-mono text-[11px] uppercase tracking-label text-mute-light hover:text-marigold"
              >
                {d.tour.replay}
              </button>
              <Link
                href="/"
                className="font-mono text-[11px] uppercase tracking-label text-mute-light hover:text-marigold"
              >
                {region === "gcc" ? d.gate.gcc : region === "levant" ? d.gate.levant : ""} · {d.nav.switchRegion}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

/** Rays and streak. Always visible — it is the learner's own progress. */
function RaysPill({
  xp,
  streakDays,
  compact = false,
}: {
  xp: number;
  streakDays: number;
  compact?: boolean;
}) {
  // On the narrowest phones the streak is dropped rather than the rays: at
  // 390px the full pill pushed the header past the viewport, which is what
  // forced horizontal scroll on every page. The streak returns from sm up.
  return (
    <span
      className="flex items-center gap-1 whitespace-nowrap border border-hairline px-2 py-1 font-mono text-[11px] tracking-label"
      dir="ltr"
    >
      <span className="text-marigold">☀ {xp}</span>
      <span className={compact ? "hidden text-mute sm:inline" : "text-mute"}>·</span>
      <span className={compact ? "hidden text-ochre sm:inline" : "text-ochre"}>🔥 {streakDays}</span>
    </span>
  );
}

function LangToggle({ lang, setLang }: { lang: "en" | "ar"; setLang: (l: "en" | "ar") => void }) {
  return (
    <button
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      aria-label={lang === "en" ? "التبديل إلى العربية" : "Switch to English"}
      className="flex h-8 shrink-0 items-center justify-center border border-hairline px-1.5 font-mono text-[11px] uppercase tracking-label text-mute-light transition-colors hover:border-marigold/70 hover:text-marigold sm:h-9 sm:px-2"
    >
      {lang === "en" ? "عربي" : "EN"}
    </button>
  );
}
