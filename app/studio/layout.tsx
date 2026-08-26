import type { Metadata } from "next";
import Link from "next/link";
import "./studio.css";

export const metadata: Metadata = {
  title: "The Aigency · Studio",
  description: "The studio floor: runs, queue and social connectors.",
};

const nav = [
  { href: "/studio", label: "Dashboard" },
  { href: "/studio/queue", label: "Queue" },
  { href: "/studio/connectors", label: "Connectors" },
  { href: "/studio/runs", label: "Floor runs" },
];

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="studio">
      <header className="s-head">
        <Link href="/studio" className="s-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sun-320.png" alt="" width={34} height={34} />
          <span className="s-wordline">The Aigency</span>
        </Link>
        <nav className="s-nav">
          {nav.map(n => (
            <Link key={n.href} href={n.href}>{n.label}</Link>
          ))}
        </nav>
        <span className="s-place">Abu Dhabi</span>
      </header>
      <main className="s-main">{children}</main>
      <footer className="s-foot">
        <span>The Aigency · AI for the better</span>
        <span>ai-gency.ai</span>
      </footer>
    </div>
  );
}
