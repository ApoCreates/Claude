import Link from "next/link";
import { clearSession } from "@/lib/auth";
import type { DemoUser } from "@/lib/data/users";
import { redirect } from "next/navigation";
import { Search, LogOut } from "lucide-react";
import { hasLiveAI } from "@/lib/ai/client";

export default function Topbar({ user }: { user: DemoUser }) {
  async function logout() {
    "use server";
    clearSession();
    redirect("/login");
  }
  const live = hasLiveAI();
  return (
    <header className="h-14 border-b border-border bg-panel/60 backdrop-blur sticky top-0 z-10 flex items-center px-4 gap-4">
      <div className="relative flex-1 max-w-xl">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          placeholder="Ask Pulse anything — try “Why is Mountain region down this week?”"
          className="input pl-9"
        />
      </div>
      <div className="flex items-center gap-3">
        <span className={`chip ${live ? "chip-good" : "chip-warn"}`}>
          {live ? "Live AI" : "Canned AI"}
        </span>
        <Link href="/morning-brief" className="text-sm text-muted hover:text-text hidden md:inline">Today’s brief</Link>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full grid place-items-center text-xs font-semibold"
            style={{ background: `hsl(${user.avatarHue}, 50%, 22%)`, color: `hsl(${user.avatarHue}, 90%, 75%)` }}
          >
            {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-sm">{user.name}</div>
            <div className="text-[11px] text-muted">{user.role}</div>
          </div>
        </div>
        <form action={logout}>
          <button className="btn" title="Sign out"><LogOut className="w-4 h-4" /></button>
        </form>
      </div>
    </header>
  );
}
