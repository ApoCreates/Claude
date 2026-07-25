/**
 * The Training Gym — daily real-life practice.
 *
 * Every day Qalam gets a ~30-minute practice plan: 6 drills × ~5 minutes,
 * strictly balanced — 3 in Arabic, 3 in English — and never the same task
 * type twice in one session. The plan is deterministic per date (seeded by
 * the day), so the whole team sees the same session and progress is
 * comparable day to day.
 *
 * The coach (you) reviews each drill and writes corrections. Corrections
 * are distilled into lessons and enter the brain immediately; export the
 * brain to bake them into the code permanently.
 */

import { MODES, type ModeId } from "../ai/modes";

export interface Drill {
  id: string;
  mode: ModeId;
  lang: "ar" | "en";
  /** Minutes budgeted for this drill */
  minutes: number;
  title: { en: string; ar: string };
  /** The task given to the agent, written in the drill's language */
  task: string;
}

interface DrillTemplate {
  mode: ModeId;
  minutes: number;
  ar: { title: string; task: string };
  en: { title: string; task: string };
}

/**
 * Drill bank. Each template has a genuine Arabic task and a genuine English
 * task — different assignments, not translations of each other — so the two
 * languages get equal but distinct workouts.
 */
const DRILL_BANK: DrillTemplate[] = [
  {
    mode: "copywriting",
    minutes: 5,
    ar: {
      title: "إعلان في سطر",
      task: "اكتب ٣ عناوين إعلانية لعلامة عطور سعودية تُطلق عطرًا شتويًا فخمًا، بثلاث زوايا مختلفة: عاطفية، وحسّية، وجريئة. ثم اختر الأقوى وبرّر اختيارك في سطرين.",
    },
    en: {
      title: "One-line ad",
      task: "Write 3 headlines for a London-based sleep-tech startup launching a smart pillow — one emotional, one witty, one benefit-led. Pick the strongest and defend it in two lines.",
    },
  },
  {
    mode: "campaign",
    minutes: 6,
    ar: {
      title: "فكرة كبرى في ٦ دقائق",
      task: "علامة عصائر طبيعية إماراتية تريد حملة صيفية ضد مشروبات الطاقة. اكتب: البصيرة الإنسانية، الفكرة الكبرى مع اسم للحملة، ورسالة رئيسية واحدة، وثلاث أفكار محتوى لتيك توك.",
    },
    en: {
      title: "Big idea sprint",
      task: "A US meal-kit brand wants to win back customers who churned after 3 months. Draft: the human insight, a named big idea, one key message, and three retention-email subject lines.",
    },
  },
  {
    mode: "creative",
    minutes: 5,
    ar: {
      title: "نثر بإيقاع",
      task: "اكتب فقرة افتتاحية (٦٠–٨٠ كلمة) لمقال عن رائحة المطر الأولى على الأرض العطشى — بالفصحى، بصورة حسّية واحدة مهيمنة، دون أي كليشيه.",
    },
    en: {
      title: "Prose with pulse",
      task: "Write the opening paragraph (60–80 words) of an essay about the last phone booth in a small town. One controlling image, varied sentence lengths, zero clichés.",
    },
  },
  {
    mode: "fiction",
    minutes: 6,
    ar: {
      title: "مشهد يتنفس",
      task: "اكتب مشهدًا قصيرًا (١٢٠ كلمة كحد أقصى): جدّة تكتشف أن حفيدها باع ساعة جدّه القديمة عبر الإنترنت. السرد بالفصحى والحوار بالعامية المصرية. أظهر المشاعر ولا تصرّح بها.",
    },
    en: {
      title: "A scene that breathes",
      task: "Write a short scene (max 120 words): a lighthouse keeper receives a letter addressed to someone who died forty years ago. Desire, obstacle, change — show, don't tell.",
    },
  },
  {
    mode: "documentary",
    minutes: 5,
    ar: {
      title: "تعليق صوتي",
      task: "اكتب ٣٠ ثانية من التعليق الصوتي (حوالي ٧٥ كلمة) لوثائقي عن آخر صانع قوارب شراعية تقليدية في الخليج — فصحى دافئة قابلة للإلقاء، مع إشارتي [VISUAL] على الأقل.",
    },
    en: {
      title: "Voice-over discipline",
      task: "Write 30 seconds of narration (~75 words) for a documentary about seed banks racing climate change. Warm, speakable, factual — mark at least two [VISUAL] cues and flag any claim with [VERIFY].",
    },
  },
  {
    mode: "screenplay",
    minutes: 6,
    ar: {
      title: "مشهد سيناريو",
      task: "اكتب مشهد سيناريو قصيرًا (داخلي – مطبخ البيت – ليل): أب يحاول إخفاء خبر فقدان وظيفته أثناء عشاء عائلي. الحوار بالعامية الشامية، وصف الحركة بالفصحى، والمعنى كله تحت السطور.",
    },
    en: {
      title: "Scene work",
      task: "Write a short screenplay scene (INT. AIRPORT GATE – NIGHT): two strangers realize they're flying to the same funeral. Proper format, present-tense action lines, subtext-heavy dialogue.",
    },
  },
  {
    mode: "prompt",
    minutes: 4,
    ar: {
      title: "هندسة برومبت",
      task: "اكتب برومبت صورة احترافيًا (بالعربية، مع مصطلحات الموديل بالإنجليزية عند الضرورة) لبوستر سينمائي عن حكواتي في سوق دمشق القديمة ليلاً — حدد الإضاءة والعدسة والأسلوب، وتجنّب الصور الاستشراقية المبتذلة، وأضف نسخة أجرأ.",
    },
    en: {
      title: "Prompt engineering",
      task: "Engineer a system prompt for an AI sous-chef assistant that adapts recipes to dietary restrictions. Separate role, context, constraints, output format; include failure behavior and two few-shot examples.",
    },
  },
  {
    mode: "comedy",
    minutes: 4,
    ar: {
      title: "قفشة تحت الضغط",
      task: "اكتب اسكتشًا قصيرًا (٨ جمل حوار كحد أقصى) بالعامية المصرية: موظف يشرح لمديره ليه اتأخر، وكل عذر أسوأ من اللي قبله. قاعدة الثلاثة، والقلبة في آخر سطر.",
    },
    en: {
      title: "Punchline drill",
      task: "Write a 30-second stand-up bit about smart-home devices that are too smart. Setup, escalation (rule of three), reversal at the end. Mark the beats.",
    },
  },
  {
    mode: "newsroom",
    minutes: 5,
    ar: {
      title: "خبر وكالة",
      task: "من هذه المعطيات الخام اكتب خبرًا بأسلوب الوكالات (١٥٠ كلمة) مع ٣ عناوين: «افتتاح أكبر محطة طاقة شمسية في شمال إفريقيا / قدرة ٨٠٠ ميغاواط / استثمار ١.٢ مليار دولار / تصريح لوزير الطاقة / أرقام التوظيف غير مؤكدة». اضبط العزو وعلّم غير المؤكد.",
    },
    en: {
      title: "Wire story",
      task: "From these raw facts write a 150-word wire story + 3 headlines: 'City council votes 7–2 to pedestrianize downtown core / starts March / 40 businesses petitioned against / mayor quote available / projected traffic data unverified.' Inverted pyramid, strict attribution, mark the unverified figure.",
    },
  },
];

const DRILLS_PER_SESSION = 6;
export const SESSION_MINUTES = 30;

/** Deterministic PRNG so the whole team gets the same daily session. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dateSeed(isoDate: string): number {
  let h = 2166136261;
  for (const c of isoDate) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface TrainingPlan {
  date: string;
  totalMinutes: number;
  drills: Drill[];
}

/**
 * Build the day's session: 6 different task types, exactly 3 Arabic and
 * 3 English, ~30 minutes total. Which template lands in which language
 * rotates daily, so over a week both languages cover every discipline.
 */
export function buildDailyPlan(isoDate: string): TrainingPlan {
  const rand = mulberry32(dateSeed(isoDate));
  const shuffled = [...DRILL_BANK]
    .map((t) => ({ t, k: rand() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.t)
    .slice(0, DRILLS_PER_SESSION);

  // Alternate languages so the split is exactly 3/3; rotate the starting
  // language by date so Arabic and English swap task types across days.
  const startAr = dateSeed(isoDate) % 2 === 0;
  const drills: Drill[] = shuffled.map((t, i) => {
    const lang: "ar" | "en" = (i % 2 === 0) === startAr ? "ar" : "en";
    const v = t[lang];
    const mode = MODES.find((m) => m.id === t.mode)!;
    return {
      id: `${isoDate}-${t.mode}-${lang}`,
      mode: t.mode,
      lang,
      minutes: t.minutes,
      title: {
        en: lang === "en" ? v.title : `${mode.label.en} · Arabic drill`,
        ar: lang === "ar" ? v.title : `تمرين إنجليزي · ${mode.label.ar}`,
      },
      task: v.task,
    };
  });

  return {
    date: isoDate,
    totalMinutes: drills.reduce((s, d) => s + d.minutes, 0),
    drills,
  };
}
