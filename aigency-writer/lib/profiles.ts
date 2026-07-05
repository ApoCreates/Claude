/**
 * Client brand profiles — the customization layer that makes Qalam sellable.
 * A profile captures everything the agent must respect for a given client:
 * voice, dialect, glossary, red lines. Profiles are stored client-side
 * (localStorage) and sent with every request; swap in a database later
 * without touching the prompt builder.
 */

export type OutputLang = "ar" | "en" | "both";

export type Dialect =
  | "msa"
  | "gulf"
  | "saudi"
  | "egyptian"
  | "levantine"
  | "iraqi"
  | "maghrebi";

export const DIALECTS: { id: Dialect; en: string; ar: string }[] = [
  { id: "msa", en: "Modern Standard Arabic", ar: "الفصحى الحديثة" },
  { id: "gulf", en: "Gulf (Khaleeji)", ar: "خليجية" },
  { id: "saudi", en: "Saudi", ar: "سعودية" },
  { id: "egyptian", en: "Egyptian", ar: "مصرية" },
  { id: "levantine", en: "Levantine", ar: "شامية" },
  { id: "iraqi", en: "Iraqi", ar: "عراقية" },
  { id: "maghrebi", en: "Maghrebi", ar: "مغاربية" },
];

export interface GlossaryEntry {
  en: string;
  ar: string;
  note?: string;
}

export interface BrandProfile {
  id: string;
  name: string;
  industry: string;
  audience: string;
  /** 0 = playful … 100 = formal */
  formality: number;
  /** 0 = poetic … 100 = direct */
  directness: number;
  personality: string;
  dialect: Dialect;
  glossary: GlossaryEntry[];
  dos: string[];
  donts: string[];
  sampleVoice: string;
}

export const DEFAULT_PROFILE: BrandProfile = {
  id: "default",
  name: "Aigency House Style",
  industry: "Creative agency",
  audience: "Brands and creators across MENA and global markets",
  formality: 45,
  directness: 60,
  personality: "Confident, warm, culturally fluent, allergic to clichés.",
  dialect: "msa",
  glossary: [
    { en: "Aigency", ar: "Aigency", note: "Brand name — never translate or transliterate." },
  ],
  dos: [
    "Open strong — the first line must earn the second.",
    "Transcreate between Arabic and English; never translate literally.",
  ],
  donts: [
    "No AI-sounding filler (unlock, elevate, seamless / حلول مبتكرة، آفاق جديدة).",
    "No orientalist clichés (camels, desert mystique) unless the brief truly calls for them.",
  ],
  sampleVoice:
    "We write like people who read. Short when short works, lyrical when the moment deserves it — في العربية كما في الإنجليزية.",
};

export function describeProfile(p: BrandProfile): string {
  const dialect = DIALECTS.find((d) => d.id === p.dialect);
  const lines: string[] = [
    `Client: ${p.name}${p.industry ? ` (${p.industry})` : ""}`,
    p.audience ? `Audience: ${p.audience}` : "",
    `Voice: ${p.personality}`,
    `Formality: ${p.formality}/100 (0 playful → 100 formal). Directness: ${p.directness}/100 (0 poetic → 100 direct).`,
    `Preferred Arabic register/dialect when dialect is appropriate: ${dialect ? `${dialect.en} (${dialect.ar})` : p.dialect}.`,
  ];
  if (p.glossary.length) {
    lines.push(
      "Locked glossary (always use these exact renderings):",
      ...p.glossary.map(
        (g) => `  • "${g.en}" ⇄ "${g.ar}"${g.note ? ` — ${g.note}` : ""}`
      )
    );
  }
  if (p.dos.length) lines.push("Always:", ...p.dos.map((d) => `  • ${d}`));
  if (p.donts.length) lines.push("Never:", ...p.donts.map((d) => `  • ${d}`));
  if (p.sampleVoice) lines.push(`Voice sample to emulate: «${p.sampleVoice}»`);
  return lines.filter(Boolean).join("\n");
}
