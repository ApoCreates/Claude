"use client";

import { useEffect, useState } from "react";
import {
  Brain,
  ClipboardList,
  Gauge,
  Dumbbell,
  Feather,
  Languages,
  PenTool,
  Users,
  type LucideIcon,
} from "lucide-react";
import OpsPanel from "./OpsPanel";
import TaskBoard from "./TaskBoard";
import WriterStudio from "./WriterStudio";
import TrainingPanel from "./TrainingPanel";
import BrainPanel from "./BrainPanel";
import ProfilePanel from "./ProfilePanel";
import { DEFAULT_PROFILE, type BrandProfile } from "@/lib/profiles";
import { t, type UILang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Tab = "tasks" | "studio" | "training" | "brain" | "ops" | "profiles";

const STORAGE_KEY = "qalam.profiles.v1";

export default function QalamApp() {
  const [uiLang, setUiLang] = useState<UILang>("en");
  const [tab, setTab] = useState<Tab>("tasks");
  const [profiles, setProfiles] = useState<BrandProfile[]>([DEFAULT_PROFILE]);
  const [activeId, setActiveId] = useState<string>(DEFAULT_PROFILE.id);
  const [live, setLive] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { profiles: BrandProfile[]; activeId: string };
        if (parsed.profiles?.length) {
          setProfiles(parsed.profiles);
          setActiveId(parsed.activeId || parsed.profiles[0].id);
        }
      }
      const savedLang = localStorage.getItem("qalam.uiLang");
      if (savedLang === "ar" || savedLang === "en") setUiLang(savedLang);
    } catch {
      // corrupted storage — fall back to defaults
    }
    fetch("/api/agent/brain")
      .then((r) => r.json())
      .then((d) => setLive(Boolean(d.live)))
      .catch(() => setLive(false));
  }, []);

  function saveProfiles(next: BrandProfile[], nextActive: string) {
    setProfiles(next);
    setActiveId(nextActive);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ profiles: next, activeId: nextActive }));
  }

  function toggleLang() {
    const next = uiLang === "en" ? "ar" : "en";
    setUiLang(next);
    localStorage.setItem("qalam.uiLang", next);
  }

  const activeProfile = profiles.find((p) => p.id === activeId) || profiles[0];
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME;
  const brandTagline = process.env.NEXT_PUBLIC_BRAND_TAGLINE;

  const tabs: { id: Tab; icon: LucideIcon; label: string }[] = [
    { id: "tasks", icon: ClipboardList, label: t("tabTasks", uiLang) },
    { id: "studio", icon: PenTool, label: t("tabStudio", uiLang) },
    { id: "training", icon: Dumbbell, label: t("tabTraining", uiLang) },
    { id: "brain", icon: Brain, label: t("tabBrain", uiLang) },
    { id: "ops", icon: Gauge, label: t("tabOps", uiLang) },
    { id: "profiles", icon: Users, label: t("tabProfile", uiLang) },
  ];

  return (
    <div dir={uiLang === "ar" ? "rtl" : "ltr"} className="min-h-screen">
      <header className="border-b border-ink-800/80 bg-ink-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-qalam/15 text-qalam shadow-glow">
              <Feather size={20} />
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                {brandName || (
                  <>
                    Qalam <span className="font-arabic text-qalam-soft">قَلَم</span>
                  </>
                )}
              </h1>
              <p className="text-xs text-ink-400">{brandTagline || t("appTagline", uiLang)}</p>
            </div>
          </div>
          <div className="ms-auto flex items-center gap-2.5">
            {live !== null && (
              <span
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  live
                    ? "border-teal-glow/50 text-teal-glow"
                    : "border-ink-600 text-ink-400"
                )}
              >
                {live ? t("liveAI", uiLang) : t("demoAI", uiLang)}
              </span>
            )}
            <button
              onClick={toggleLang}
              className="inline-flex items-center gap-2 rounded-lg border border-ink-600 px-3 py-1.5 text-sm text-ink-200 transition hover:border-qalam hover:text-qalam"
            >
              <Languages size={15} />
              {uiLang === "en" ? "العربية" : "English"}
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-5">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition",
                tab === id
                  ? "border-qalam font-medium text-qalam-soft"
                  : "border-transparent text-ink-400 hover:text-ink-200"
              )}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-7">
        {tab === "tasks" && <TaskBoard uiLang={uiLang} profile={activeProfile} />}
        {tab === "studio" && <WriterStudio uiLang={uiLang} profile={activeProfile} />}
        {tab === "training" && <TrainingPanel uiLang={uiLang} profile={activeProfile} />}
        {tab === "brain" && <BrainPanel uiLang={uiLang} />}
        {tab === "ops" && <OpsPanel uiLang={uiLang} />}
        {tab === "profiles" && (
          <ProfilePanel
            uiLang={uiLang}
            profiles={profiles}
            activeId={activeId}
            onChange={saveProfiles}
          />
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-5 pb-8 text-center text-xs text-ink-600">
        Aigency · Qalam — bilingual writer agent · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
