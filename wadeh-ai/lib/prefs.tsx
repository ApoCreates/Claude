"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Lang, Region } from "./curriculum";
import type { QuizQ } from "./games";
import { XP_QUEST } from "./games";

export type Plan = "free" | "scholar" | "family";

export interface QuestDef {
  id: "correct10" | "master1" | "tutor3";
  target: number;
}

// The three daily quests: retrieval practice, mastery, and asking for help.
export const DAILY_QUESTS: QuestDef[] = [
  { id: "correct10", target: 10 },
  { id: "master1", target: 1 },
  { id: "tutor3", target: 3 },
];

interface QuestState {
  date: string;
  correct: number;
  mastered: number;
  tutor: number;
  claimed: string[];
}

export interface ReviewItem {
  subject: string;
  level: number;
  q: QuizQ;
}

interface Prefs {
  lang: Lang;
  region: Region | null;
  plan: Plan;
  // levels whose mastery quiz has been passed, per subject slug
  passed: Record<string, number[]>;
  xp: number;
  streakDays: number;
  streakLast: string; // YYYY-MM-DD of last active day
  quest: QuestState;
  review: ReviewItem[]; // missed questions waiting for spaced review
  bestSprint: number; // personal best in the Sun Sprint
}

interface PrefsCtx extends Prefs {
  ready: boolean;
  setLang: (l: Lang) => void;
  setRegion: (r: Region) => void;
  setPlan: (p: Plan) => void;
  addXp: (n: number) => void;
  recordCorrect: () => void;
  recordMastered: (subject: string, level: number) => void;
  applyPlacement: (subject: string, startYear: number) => void;
  recordTutorAsk: () => void;
  addReview: (item: ReviewItem) => void;
  shiftReview: () => void;
  recordSprint: (score: number) => void;
  reset: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

const freshQuest = (): QuestState => ({ date: today(), correct: 0, mastered: 0, tutor: 0, claimed: [] });

const DEFAULTS: Prefs = {
  lang: "en",
  region: null,
  plan: "free",
  passed: {},
  xp: 0,
  streakDays: 0,
  streakLast: "",
  quest: freshQuest(),
  review: [],
  bestSprint: 0,
};

const KEY = "wadehai:prefs:v2";

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

  const value = useMemo<PrefsCtx>(() => {
    // Roll the quest board and streak forward when a new day starts.
    const withDay = (p: Prefs): Prefs => {
      const t = today();
      let next = p;
      if (p.quest.date !== t) next = { ...next, quest: freshQuest() };
      if (p.streakLast && p.streakLast !== t) {
        const gap = (new Date(t).getTime() - new Date(p.streakLast).getTime()) / 86400000;
        if (gap > 1.5) next = { ...next, streakDays: 0 };
      }
      return next;
    };

    const touchStreak = (p: Prefs): Prefs => {
      const t = today();
      if (p.streakLast === t) return p;
      const gap = p.streakLast ? (new Date(t).getTime() - new Date(p.streakLast).getTime()) / 86400000 : Infinity;
      return { ...p, streakDays: gap <= 1.5 ? p.streakDays + 1 : 1, streakLast: t };
    };

    // Award quest bonuses exactly once, when a counter crosses its target.
    const claimQuests = (p: Prefs): Prefs => {
      let { quest, xp } = p;
      const counters: Record<QuestDef["id"], number> = {
        correct10: quest.correct,
        master1: quest.mastered,
        tutor3: quest.tutor,
      };
      for (const qd of DAILY_QUESTS) {
        if (counters[qd.id] >= qd.target && !quest.claimed.includes(qd.id)) {
          quest = { ...quest, claimed: [...quest.claimed, qd.id] };
          xp += XP_QUEST;
        }
      }
      return { ...p, quest, xp };
    };

    return {
      ...withDay(prefs),
      ready,
      setLang: (lang) => setPrefs((p) => ({ ...p, lang })),
      setRegion: (region) => setPrefs((p) => ({ ...p, region })),
      setPlan: (plan) => setPrefs((p) => ({ ...p, plan })),
      addXp: (n) => setPrefs((p) => touchStreak({ ...withDay(p), xp: p.xp + n })),
      recordCorrect: () =>
        setPrefs((p) => {
          const d = touchStreak(withDay(p));
          return claimQuests({ ...d, quest: { ...d.quest, correct: d.quest.correct + 1 } });
        }),
      recordMastered: (subject, level) =>
        setPrefs((p) => {
          const d = touchStreak(withDay(p));
          const cur = d.passed[subject] ?? [];
          const passed = cur.includes(level) ? d.passed : { ...d.passed, [subject]: [...cur, level] };
          return claimQuests({ ...d, passed, quest: { ...d.quest, mastered: d.quest.mastered + 1 } });
        }),
      // Placement marks all years before the recommended start as passed,
      // without inflating the daily quest counters.
      applyPlacement: (subject, startYear) =>
        setPrefs((p) => {
          const prior = Array.from({ length: Math.max(0, startYear - 1) }, (_, i) => i + 1);
          const merged = Array.from(new Set([...(p.passed[subject] ?? []), ...prior]));
          return { ...p, passed: { ...p.passed, [subject]: merged } };
        }),
      recordTutorAsk: () =>
        setPrefs((p) => {
          const d = touchStreak(withDay(p));
          return claimQuests({ ...d, quest: { ...d.quest, tutor: d.quest.tutor + 1 } });
        }),
      addReview: (item) =>
        setPrefs((p) => ({ ...p, review: [...p.review, item].slice(-30) })),
      shiftReview: () => setPrefs((p) => ({ ...p, review: p.review.slice(1) })),
      recordSprint: (score) =>
        setPrefs((p) => touchStreak({ ...withDay(p), bestSprint: Math.max(p.bestSprint, score) })),
      reset: () => setPrefs(DEFAULTS),
    };
  }, [prefs, ready]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs(): PrefsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  return ctx;
}
