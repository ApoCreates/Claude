import { FESTIVAL } from "@/lib/brand";
import { Eyebrow } from "@/components/ui";
import { SubmitForm } from "@/components/SubmitForm";

export const metadata = { title: "Submit your film" };

const CHECKLIST = [
  "Final film, 60–90s, with sound, uploaded to YouTube (unlisted is fine)",
  "Title & a one-sentence logline",
  "A poster still — or we'll use the film's frame",
  "Crew: names and roles",
  "AI toolchain & a one-line disclosure",
];

export default function SubmitPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-12 sm:px-10 sm:py-16">
      <Eyebrow>{FESTIVAL.name} · {FESTIVAL.edition}</Eyebrow>
      <h1 className="display mt-6 text-on" style={{ fontSize: "clamp(44px, 8vw, 96px)", fontWeight: 300 }}>
        Submit your <span className="italic">film.</span>
      </h1>
      <p className="mt-6 max-w-xl font-serif text-lg leading-relaxed text-on/70">
        Structured input, instant publishing. Fill this once and the portal turns your entry into its own
        page — and emails you the moment it lands.
      </p>

      <div className="mt-8 border border-on/12 bg-card p-6">
        <div className="font-mono text-[10px] uppercase tracking-label text-on/45">Before you begin</div>
        <ul className="mt-4 space-y-2">
          {CHECKLIST.map((c) => (
            <li key={c} className="flex items-baseline gap-3 font-serif text-[15px] text-on/80">
              <span className="text-gold">✦</span>
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-12">
        <SubmitForm defaultCohort={FESTIVAL.edition} />
      </div>
    </section>
  );
}
