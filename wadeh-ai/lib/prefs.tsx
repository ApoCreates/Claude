"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Lang, Region } from "./curriculum";

export type Plan = "free" | "scholar" | "family";

interface Prefs {
  lang: Lang;
  region: Region | null;
  plan: Plan;
  // completed level numbers per subject slug
  completed: Record<string, number[]>;
}

interface PrefsCtx extends Prefs {
  ready: boolean;
  setLang: (l: Lang) => void;
  setRegion: (r: Region) => void;
  setPlan: (p: Plan) => void;
  toggleComplete: (subject: string, level: number) => void;
  reset: () => void;
}

const DEFAULTS: Prefs = { lang: "en", region: null, plan: "free", completed: {} };
const KEY = "wadehai:prefs:v1";

const Ctx = createContext<PrefsCtx | null>(null);

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      // corrupted storage — fall back to defaults
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(prefs));
  }, [prefs, ready]);

  // Language drives document direction for full RTL support.
  useEffect(() => {
    document.documentElement.lang = prefs.lang;
    document.documentElement.dir = prefs.lang === "ar" ? "rtl" : "ltr";
  }, [prefs.lang]);

  const value = useMemo<PrefsCtx>(
    () => ({
      ...prefs,
      ready,
      setLang: (lang) => setPrefs((p) => ({ ...p, lang })),
      setRegion: (region) => setPrefs((p) => ({ ...p, region })),
      setPlan: (plan) => setPrefs((p) => ({ ...p, plan })),
      toggleComplete: (subject, level) =>
        setPrefs((p) => {
          const cur = p.completed[subject] ?? [];
          const next = cur.includes(level) ? cur.filter((n) => n !== level) : [...cur, level];
          return { ...p, completed: { ...p.completed, [subject]: next } };
        }),
      reset: () => setPrefs(DEFAULTS),
    }),
    [prefs, ready]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs(): PrefsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  return ctx;
}
