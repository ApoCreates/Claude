"use client";

import { useState } from "react";
import { Plus, Trash2, UserRound } from "lucide-react";
import {
  DEFAULT_PROFILE,
  DIALECTS,
  type BrandProfile,
  type Dialect,
  type GlossaryEntry,
} from "@/lib/profiles";
import { t, type UILang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Per-client customization. Profiles live in localStorage (QalamApp owns
 * them); the active one is injected into every prompt the agent gets.
 */
export default function ProfilePanel({
  uiLang,
  profiles,
  activeId,
  onChange,
}: {
  uiLang: UILang;
  profiles: BrandProfile[];
  activeId: string;
  onChange: (profiles: BrandProfile[], activeId: string) => void;
}) {
  const active = profiles.find((p) => p.id === activeId) || profiles[0];
  const [draft, setDraft] = useState<BrandProfile>(active);
  const [savedFlash, setSavedFlash] = useState(false);

  function selectProfile(id: string) {
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    setDraft(p);
    onChange(profiles, id);
  }

  function addProfile() {
    const p: BrandProfile = {
      ...DEFAULT_PROFILE,
      id: `p-${Math.random().toString(36).slice(2, 9)}`,
      name: uiLang === "ar" ? "عميل جديد" : "New client",
      glossary: [],
      dos: [],
      donts: [],
      sampleVoice: "",
    };
    const next = [...profiles, p];
    setDraft(p);
    onChange(next, p.id);
  }

  function removeProfile(id: string) {
    if (profiles.length <= 1) return;
    const next = profiles.filter((p) => p.id !== id);
    const nextActive = next[0].id;
    setDraft(next[0]);
    onChange(next, nextActive);
  }

  function save() {
    const next = profiles.map((p) => (p.id === draft.id ? draft : p));
    onChange(next, draft.id);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function patchGlossary(i: number, patch: Partial<GlossaryEntry>) {
    setDraft((d) => ({
      ...d,
      glossary: d.glossary.map((g, gi) => (gi === i ? { ...g, ...patch } : g)),
    }));
  }

  const field =
    "w-full rounded-md border border-ink-600 bg-ink-950 px-3 py-2 text-sm outline-none placeholder:text-ink-500 focus:border-qalam";

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Profile list */}
      <aside className="space-y-1.5">
        {profiles.map((p) => (
          <div key={p.id} className="flex items-center gap-1.5">
            <button
              onClick={() => selectProfile(p.id)}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border px-3 py-2.5 text-start transition",
                p.id === draft.id
                  ? "border-qalam/60 bg-qalam/10"
                  : "border-ink-700 bg-ink-900/40 hover:border-ink-500"
              )}
            >
              <UserRound size={15} className={p.id === draft.id ? "text-qalam" : "text-ink-400"} />
              <span className="truncate text-sm">{p.name}</span>
              {p.id === activeId && <span className="ms-auto h-2 w-2 shrink-0 rounded-full bg-teal-glow" />}
            </button>
            {profiles.length > 1 && (
              <button
                onClick={() => removeProfile(p.id)}
                className="rounded-md border border-ink-700 p-2 text-ink-500 transition hover:border-red-400 hover:text-red-600"
                aria-label="Delete profile"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addProfile}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-ink-600 px-3 py-2.5 text-sm text-ink-400 transition hover:border-qalam hover:text-qalam"
        >
          <Plus size={14} /> {uiLang === "ar" ? "ملف عميل جديد" : "New client profile"}
        </button>
      </aside>

      {/* Editor */}
      <section className="rounded-xl border border-ink-700 bg-ink-900/50 p-5">
        <h2 className="text-lg font-semibold">{t("profileTitle", uiLang)}</h2>
        <p className="mt-1 text-sm text-ink-400">{t("profileIntro", uiLang)}</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-ink-300">{uiLang === "ar" ? "اسم العميل" : "Client name"}</span>
            <input className={field} value={draft.name} dir="auto"
              onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink-300">{uiLang === "ar" ? "المجال" : "Industry"}</span>
            <input className={field} value={draft.industry} dir="auto"
              onChange={(e) => setDraft({ ...draft, industry: e.target.value })} />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-ink-300">{uiLang === "ar" ? "الجمهور" : "Audience"}</span>
            <input className={field} value={draft.audience} dir="auto"
              onChange={(e) => setDraft({ ...draft, audience: e.target.value })} />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-ink-300">{uiLang === "ar" ? "الشخصية والنبرة" : "Personality & tone"}</span>
            <input className={field} value={draft.personality} dir="auto"
              onChange={(e) => setDraft({ ...draft, personality: e.target.value })} />
          </label>

          <div className="text-sm">
            <div className="mb-1 flex justify-between text-ink-300">
              <span>{t("playful", uiLang)}</span>
              <span>{t("formal", uiLang)}</span>
            </div>
            <input type="range" min={0} max={100} value={draft.formality}
              onChange={(e) => setDraft({ ...draft, formality: Number(e.target.value) })} />
          </div>
          <div className="text-sm">
            <div className="mb-1 flex justify-between text-ink-300">
              <span>{t("poetic", uiLang)}</span>
              <span>{t("direct", uiLang)}</span>
            </div>
            <input type="range" min={0} max={100} value={draft.directness}
              onChange={(e) => setDraft({ ...draft, directness: Number(e.target.value) })} />
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-ink-300">{t("dialect", uiLang)}</span>
            <select
              className={field}
              value={draft.dialect}
              onChange={(e) => setDraft({ ...draft, dialect: e.target.value as Dialect })}
            >
              {DIALECTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {uiLang === "ar" ? d.ar : d.en}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink-300">
              {uiLang === "ar" ? "عيّنة من الصوت المطلوب" : "Voice sample to emulate"}
            </span>
            <input className={field} value={draft.sampleVoice} dir="auto"
              onChange={(e) => setDraft({ ...draft, sampleVoice: e.target.value })} />
          </label>
        </div>

        {/* Glossary */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-200">
              {uiLang === "ar" ? "المعجم المعتمد (EN ⇄ AR)" : "Locked glossary (EN ⇄ AR)"}
            </h3>
            <button
              onClick={() => setDraft({ ...draft, glossary: [...draft.glossary, { en: "", ar: "" }] })}
              className="inline-flex items-center gap-1 rounded-md border border-ink-600 px-2 py-1 text-xs text-ink-300 hover:border-qalam hover:text-qalam"
            >
              <Plus size={12} /> {uiLang === "ar" ? "إضافة" : "Add"}
            </button>
          </div>
          <div className="space-y-2">
            {draft.glossary.map((g, i) => (
              <div key={i} className="flex gap-2">
                <input className={cn(field, "flex-1")} placeholder="English" value={g.en}
                  onChange={(e) => patchGlossary(i, { en: e.target.value })} />
                <input className={cn(field, "flex-1")} placeholder="العربية" dir="rtl" value={g.ar}
                  onChange={(e) => patchGlossary(i, { ar: e.target.value })} />
                <button
                  onClick={() => setDraft({ ...draft, glossary: draft.glossary.filter((_, gi) => gi !== i) })}
                  className="rounded-md border border-ink-700 px-2 text-ink-500 hover:border-red-400 hover:text-red-600"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Dos / Don'ts */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-teal-glow">{uiLang === "ar" ? "دائمًا (سطر لكل قاعدة)" : "Always (one per line)"}</span>
            <textarea className={cn(field, "min-h-[90px]")} dir="auto" value={draft.dos.join("\n")}
              onChange={(e) => setDraft({ ...draft, dos: e.target.value.split("\n").filter((x) => x.trim()) })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-red-700">{uiLang === "ar" ? "أبدًا (سطر لكل قاعدة)" : "Never (one per line)"}</span>
            <textarea className={cn(field, "min-h-[90px]")} dir="auto" value={draft.donts.join("\n")}
              onChange={(e) => setDraft({ ...draft, donts: e.target.value.split("\n").filter((x) => x.trim()) })} />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          {savedFlash && <span className="text-sm text-teal-glow">{t("saved", uiLang)}</span>}
          <button
            onClick={save}
            className="rounded-lg bg-qalam px-5 py-2 text-sm font-semibold text-ink-950 transition hover:bg-qalam-soft"
          >
            {t("save", uiLang)}
          </button>
        </div>
      </section>
    </div>
  );
}
