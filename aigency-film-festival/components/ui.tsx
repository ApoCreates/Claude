import Link from "next/link";
import { cx } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
  tick = true,
}: {
  children: React.ReactNode;
  className?: string;
  tick?: boolean;
}) {
  return (
    <span className={cx("inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-label text-on/55", className)}>
      {tick && <span className="h-px w-7 bg-on/25" />}
      {children}
    </span>
  );
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx("mb-8 flex items-center gap-4 text-on/55", className)}>
      <span className="font-mono text-[10px] uppercase tracking-label">{children}</span>
      <span className="h-px flex-1 bg-on/12" />
    </div>
  );
}

export function Rule({ className }: { className?: string }) {
  return <hr className={cx("border-0 border-t border-on/12", className)} />;
}

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
  prefetch?: boolean;
};

export function ButtonLink({ href, children, variant = "primary", className, prefetch }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 px-6 py-3 font-sans text-sm font-semibold tracking-tight transition-colors";
  const styles =
    variant === "primary"
      ? "bg-gold text-surface hover:bg-accent"
      : "border border-on/25 text-on hover:border-accent hover:text-accent";
  const external = href.startsWith("http") || href.startsWith("mailto:");
  if (external) {
    return (
      <a href={href} className={cx(base, styles, className)} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} prefetch={prefetch} className={cx(base, styles, className)}>
      {children}
    </Link>
  );
}

export function Chip({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "gold" | "dusk" }) {
  const tones = {
    default: "border-on/20 text-on/70",
    gold: "border-gold/50 text-gold",
    dusk: "border-dusk/60 text-accent2",
  } as const;
  return (
    <span className={cx("inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-label", tones[tone])}>
      {children}
    </span>
  );
}

export function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <div className="font-serif text-4xl leading-none text-on" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}>
        {value}
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-label text-on/45">{label}</div>
    </div>
  );
}
