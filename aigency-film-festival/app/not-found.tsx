import Link from "next/link";
import { Mark } from "@/components/brandmarks";

export default function NotFound() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Mark size={88} glow />
      <h1 className="mt-8 font-serif text-on" style={{ fontSize: "clamp(40px, 8vw, 80px)", letterSpacing: "-0.03em" }}>
        Nothing here yet.
      </h1>
      <p className="mt-3 font-serif text-lg italic text-on/55">The light hasn't reached this page.</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 border border-on/25 px-6 py-3 font-sans text-sm font-semibold text-on transition-colors hover:border-accent hover:text-accent"
      >
        ← Back to the festival
      </Link>
    </div>
  );
}
