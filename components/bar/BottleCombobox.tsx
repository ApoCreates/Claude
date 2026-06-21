"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { type Bottle, bottleLabel, searchBottles } from "@/lib/bar/bottles";
import { cn } from "@/lib/utils";

type Props = {
  value: Bottle | null;
  onChange: (b: Bottle) => void;
  placeholder?: string;
};

export default function BottleCombobox({ value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchBottles(query, 8), [query]);

  // Close on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => setActive(0), [query]);

  function select(b: Bottle) {
    onChange(b);
    setQuery("");
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) select(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-panel2 px-3 py-2",
          open && "ring-1 ring-accent/40 border-accent/40"
        )}
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <Search size={15} className="text-muted shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={value ? bottleLabel(value) : placeholder || "Type a brand…"}
          className="w-full bg-transparent text-sm text-text placeholder:text-muted/70 outline-none"
          aria-expanded={open}
          aria-autocomplete="list"
          role="combobox"
        />
        <ChevronDown
          size={16}
          className={cn("text-muted shrink-0 transition-transform", open && "rotate-180")}
        />
      </div>

      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-panel shadow-soft"
        >
          {results.length === 0 && (
            <li className="px-3 py-3 text-sm text-muted">No matches — try another spelling.</li>
          )}
          {results.map((b, i) => {
            const selected = value?.id === b.id;
            return (
              <li
                key={b.id}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(b);
                }}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm",
                  i === active ? "bg-panel2" : "bg-transparent"
                )}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full border border-white/10"
                    style={{ background: b.color }}
                  />
                  <span className="truncate">
                    <span className="font-medium text-text">{b.brand}</span>{" "}
                    <span className="text-muted">{b.name}</span>
                  </span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="chip">{b.category}</span>
                  {selected && <Check size={14} className="text-accent" />}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
