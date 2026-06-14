import Link from "next/link";
import { FestivalLockup } from "./brandmarks";
import { BRAND, FESTIVAL } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-24 border-t border-on/12">
      <div className="mx-auto max-w-shell px-6 py-14 sm:px-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <FestivalLockup size={34} />
            <p className="mt-6 max-w-xs font-serif text-lg italic text-accent" style={{ fontVariationSettings: '"opsz" 96, "SOFT" 50' }}>
              {BRAND.tagline}
            </p>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-label text-on/45">The festival</div>
            <ul className="mt-4 space-y-3 font-serif text-on/80">
              <li><Link href="/films" className="hover:text-accent">The Official Selection</Link></li>
              <li><Link href="/submit" className="hover:text-accent">Submit a film</Link></li>
              <li><Link href="/resources" className="hover:text-accent">Resources</Link></li>
              <li><Link href="/#prize" className="hover:text-accent">The Slashed Sun</Link></li>
              <li><Link href="/admin" className="hover:text-accent">Jury &amp; admin</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-label text-on/45">Reach us</div>
            <ul className="mt-4 space-y-3 font-serif text-on/80">
              <li><a href={`mailto:${BRAND.contactEmail}`} className="hover:text-accent">{BRAND.contactEmail}</a></li>
              <li><a href={`https://${BRAND.domain}`} className="hover:text-accent">{BRAND.domain}</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-on/12 pt-6 font-mono text-[10px] uppercase tracking-label text-on/40 sm:flex-row sm:items-center sm:justify-between">
          <span>{FESTIVAL.name} · {FESTIVAL.edition}</span>
          <span>Made for the years ahead.</span>
        </div>
      </div>
    </footer>
  );
}
