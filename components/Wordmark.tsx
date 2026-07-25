import { SunMark } from "./SunMark";

/**
 * Wordmark stays English — italic "wadeh", roman "AI" — per the design system.
 * The Arabic name واضح rides alongside as a mono label, never fused in.
 */
export function Wordmark({ withSun = true, size = "text-2xl" }: { withSun?: boolean; size?: string }) {
  return (
    <span className="inline-flex items-center gap-3" dir="ltr">
      {withSun && <SunMark size={28} />}
      <span className={`font-serif ${size} leading-none text-paper`} style={{ fontFamily: "var(--font-fraunces), serif" }}>
        <em className="italic font-light">wadeh</em>
        <span className="font-medium">AI</span>
      </span>
      <span className="eyebrow mt-1 hidden sm:inline">واضح</span>
    </span>
  );
}
