"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, ArrowRight } from "lucide-react";

export default function AskBox({
  defaultValue = "",
  placeholder = "Ask Pulse anything…",
  variant = "hero",
}: {
  defaultValue?: string;
  placeholder?: string;
  variant?: "hero" | "bar";
}) {
  const [q, setQ] = useState(defaultValue);
  const router = useRouter();

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const v = q.trim();
    if (!v) return;
    router.push(`/analyst?q=${encodeURIComponent(v)}`);
  }

  if (variant === "bar") {
    return (
      <form onSubmit={submit} className="relative w-full">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="input pl-9"
        />
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="card flex items-center gap-2 p-2">
      <Sparkles className="w-5 h-5 text-accent ml-2 shrink-0" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-1 py-2 text-sm focus:outline-none placeholder:text-muted"
      />
      <button type="submit" className="btn btn-primary shrink-0">
        Ask <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
