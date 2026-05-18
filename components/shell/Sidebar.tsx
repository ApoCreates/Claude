"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, LineChart, Boxes, Store, Swords, Bot, Sparkles, Crown,
  Sun, Cable, Settings, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV: { section: string; items: { href: string; label: string; icon: any }[] }[] = [
  {
    section: "Overview",
    items: [
      { href: "/dashboard",     label: "Executive dashboard", icon: LayoutDashboard },
      { href: "/morning-brief", label: "Morning brief",       icon: Sun },
    ],
  },
  {
    section: "Commercial",
    items: [
      { href: "/sales",     label: "Sales & revenue", icon: LineChart },
      { href: "/products",  label: "Products",        icon: Boxes },
      { href: "/outlets",   label: "Outlets",         icon: Store },
    ],
  },
  {
    section: "Intelligence",
    items: [
      { href: "/competition", label: "Competition",         icon: Swords },
      { href: "/analyst",     label: "AI data analyst",     icon: Bot },
      { href: "/scenarios",   label: "Predictive scenarios", icon: Sparkles },
      { href: "/advisory",    label: "C-level advisory",     icon: Crown },
    ],
  },
  {
    section: "Platform",
    items: [
      { href: "/integrations",   label: "Integrations", icon: Cable },
      { href: "/settings",       label: "Settings",     icon: Settings },
      { href: "/settings/users", label: "Users",        icon: Users },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 shrink-0 border-r border-border bg-panel/60 min-h-screen sticky top-0">
      <div className="px-4 py-4 flex items-center gap-2 border-b border-border">
        <div className="w-7 h-7 rounded-md bg-brand text-brand-fg grid place-items-center text-sm font-bold">P</div>
        <div>
          <div className="font-semibold leading-tight">Pulse</div>
          <div className="text-[10px] text-muted leading-tight">F&amp;B CI · Demo</div>
        </div>
      </div>
      <nav className="px-2 py-3 space-y-4">
        {NAV.map((sec) => (
          <div key={sec.section}>
            <div className="px-3 pb-1 label">{sec.section}</div>
            <ul className="space-y-0.5">
              {sec.items.map((it) => {
                const active = pathname === it.href || pathname.startsWith(it.href + "/");
                const Icon = it.icon;
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm",
                        active ? "bg-brand/15 text-text border border-brand/30" : "text-muted hover:text-text hover:bg-panel2"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{it.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
