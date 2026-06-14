import { RESOURCES } from "@/lib/resources";
import { FESTIVAL } from "@/lib/brand";
import { Eyebrow } from "@/components/ui";

export const metadata = { title: "Resources" };

export default function ResourcesPage() {
  return (
    <>
      {/* banner header */}
      <section className="relative overflow-hidden border-b border-on/12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/banner.png" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface/95 via-surface/75 to-surface/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
        <div className="relative mx-auto max-w-shell px-6 py-20 sm:px-10 sm:py-24">
          <Eyebrow>{FESTIVAL.name} · Capacity Building</Eyebrow>
          <h1 className="display mt-6 text-on" style={{ fontSize: "clamp(44px, 8vw, 96px)", fontWeight: 300 }}>
            Resources<span className="italic">.</span>
          </h1>
          <p className="mt-5 max-w-xl font-serif text-lg leading-relaxed text-on/85">
            The takeaways and field guides from the workshop — yours to keep. Pin them above your edit bay.
          </p>
        </div>
      </section>

      {/* downloads */}
      <section className="mx-auto max-w-shell px-6 py-14 sm:px-10">
        <div className="grid gap-5 sm:grid-cols-2">
          {RESOURCES.map((r) => (
            <a
              key={r.file}
              href={r.file}
              download={r.download}
              className="group flex items-start justify-between gap-4 border border-on/12 bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-on/25"
            >
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-label text-ochre">{r.tag}</div>
                <h2 className="mt-3 font-serif text-2xl text-on" style={{ fontVariationSettings: '"opsz" 96, "SOFT" 50' }}>
                  {r.title}
                </h2>
                <p className="mt-2 font-serif text-sm leading-relaxed text-on/55">{r.subtitle}</p>
                <span className="mt-4 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-label text-on/70 group-hover:text-accent">
                  Download PDF ↓
                </span>
              </div>
              <span
                className="grid h-12 w-12 shrink-0 place-items-center border border-on/15 font-mono text-lg text-on/60 transition-colors group-hover:border-accent group-hover:text-accent"
                aria-hidden
              >
                ↓
              </span>
            </a>
          ))}
        </div>

        <p className="mt-8 max-w-2xl font-serif text-sm italic text-on/45">
          More guides arrive with each training. Tag what you build — {FESTIVAL.name.toLowerCase()} is built to grow.
        </p>
      </section>
    </>
  );
}
