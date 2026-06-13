import Link from "next/link";
import { Lockup } from "./brandmarks";
import { FESTIVAL } from "@/lib/brand";

export function SiteHeader() {
  return (
    <header className="relative z-10">
      <div className="mx-auto flex max-w-shell items-center justify-between px-6 py-6 sm:px-10">
        <Link href="/" aria-label={`${FESTIVAL.name} — home`} className="group">
          <Lockup size={30} wordClassName="text-base sm:text-lg" />
        </Link>
        <nav className="flex items-center gap-5 sm:gap-7">
          <Link
            href="/films"
            className="font-mono text-[10px] uppercase tracking-label text-on/55 transition-colors hover:text-on"
          >
            The Selection
          </Link>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 rounded-full border border-on/20 bg-white/[0.03] px-4 py-2 font-mono text-[10px] uppercase tracking-label text-on transition-colors hover:border-accent2"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent2 animate-pulse2" />
            Submit a film
          </Link>
        </nav>
      </div>
      <div className="mx-auto max-w-shell px-6 sm:px-10">
        <div className="h-px w-full bg-on/12" />
      </div>
    </header>
  );
}
