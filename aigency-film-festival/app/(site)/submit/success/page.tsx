import Link from "next/link";
import { getSubmissionBySlug } from "@/lib/store";
import { Mark } from "@/components/brandmarks";
import { ButtonLink } from "@/components/ui";
import { ShareButton } from "@/components/ShareButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "You're in" };

export default async function SuccessPage({ searchParams }: { searchParams?: { slug?: string } }) {
  const slug = searchParams?.slug;
  const sub = slug ? await getSubmissionBySlug(slug) : null;

  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center sm:px-10">
      <div className="animate-floaty">
        <Mark size={120} glow />
      </div>
      <div className="mt-10 font-mono text-[10px] uppercase tracking-label text-gold">Submission received</div>
      <h1 className="mt-4 font-serif text-on" style={{ fontSize: "clamp(40px, 7vw, 80px)", lineHeight: 0.95, letterSpacing: "-0.03em", fontWeight: 400 }}>
        You're in the
        <br />
        <span className="italic">Official Selection.</span>
      </h1>

      {sub ? (
        <>
          <p className="mt-7 max-w-md font-serif text-lg leading-relaxed text-on/70">
            <span className="italic text-accent">{sub.title}</span> now has a page of its own. We've emailed your
            confirmation — keep the link and share it freely.
          </p>
          <div className="mt-9 flex w-full max-w-sm flex-col gap-3">
            <ButtonLink href={`/film/${sub.slug}`}>View your film's page →</ButtonLink>
            <ShareButton url={`/film/${sub.slug}`} title={sub.title} />
          </div>
          <Link href="/films" className="mt-8 font-mono text-[10px] uppercase tracking-label text-on/45 hover:text-on">
            ← Back to the selection
          </Link>
        </>
      ) : (
        <>
          <p className="mt-7 max-w-md font-serif text-lg leading-relaxed text-on/70">
            Thank you — your film has been received. We've sent a confirmation to your email.
          </p>
          <div className="mt-9">
            <ButtonLink href="/films">See the selection →</ButtonLink>
          </div>
        </>
      )}
    </section>
  );
}
