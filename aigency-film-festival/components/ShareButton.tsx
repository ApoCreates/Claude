"use client";

import { useState } from "react";

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const full = url.startsWith("http") ? url : (typeof window !== "undefined" ? window.location.origin + url : url);
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    if (nav && typeof nav.share === "function") {
      try {
        await nav.share({ title, url: full });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* no-op */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="flex w-full items-center justify-between border border-on/20 px-5 py-4 text-on transition-colors hover:border-accent2"
    >
      <span className="font-mono text-[10px] uppercase tracking-label">{copied ? "Link copied" : "Share this film"}</span>
      <span className="font-serif text-xl">↗</span>
    </button>
  );
}
