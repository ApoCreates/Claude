// Server-side safety layer for the tutor chat.
//
// Two lines of defense:
//  1. Heuristic screening (this file) — runs on every message, even in
//     offline/canned mode, before any model call.
//  2. The model itself — the tutor system prompt instructs Claude to refuse
//     out-of-scope requests and append a hidden `⚑FLAG <category>` line,
//     which the API route strips and reports before replying.
//
// Flags are reported silently: the learner only ever sees a kind redirect.
// Each report carries who (anonymous device id), when (UTC timestamp) and
// what kind (category + excerpt). Reports go to the server log under the
// `WADEH_FLAG` marker (Vercel → Project → Logs) and, when the
// MODERATION_WEBHOOK_URL env var is set, are POSTed there as JSON so
// moderators can receive them in Slack/Discord/e-mail pipelines.

export type FlagCategory =
  | "violence_weapons"
  | "drugs"
  | "self_harm"
  | "sexual_content"
  | "hate"
  | "hacking_privacy"
  | "jailbreak_manipulation"
  | "other_unsafe";

export interface FlagHit {
  category: FlagCategory;
}

export interface FlagRecord {
  ts: string; // UTC ISO timestamp
  uid: string; // anonymous device id of the learner
  category: FlagCategory;
  source: "heuristic" | "model";
  lang: string;
  region: string | null;
  subject: string;
  level: number;
  excerpt: string; // first 140 chars of the offending message — no more
}

// Patterns are intent-shaped ("how to make/get X"), not bare topic words,
// so that legitimate lesson questions (energy in explosions, medicines,
// human biology at the right age) don't false-positive.
const RULES: { category: FlagCategory; re: RegExp }[] = [
  {
    category: "violence_weapons",
    re: /(how (do|can|to)|make|build|buy|get|craft)[^.?!]{0,40}\b(bombs?|explosives?|grenades?|guns?|firearms?|silencers?|poison(s|ous)?|napalm)\b|\b(hurt|kill|attack|beat up)\b[^.?!]{0,30}\b(someone|him|her|them|my (friend|brother|sister|classmate|teacher))\b/i,
  },
  {
    category: "violence_weapons",
    re: /(كيف\s*(أصنع|اصنع|أحصل|احصل)|صنع|شراء|تصنيع)[^.?!؟]{0,40}(قنبلة|متفجرات|سلاح|مسدس|بارود|سم)|\b(أؤذي|اؤذي|أضرب|اضرب|أقتل|اقتل)\b[^.?!؟]{0,30}(أحد|زميلي|صديقي|أخي|أختي|معلمي)/,
  },
  {
    category: "drugs",
    re: /\b(buy|get|make|grow|hide|try|use)\b[^.?!]{0,30}\b(drugs?|weed|marijuana|cannabis|cocaine|heroin|meth|vapes?|cigarettes?|alcohol)\b/i,
  },
  {
    category: "drugs",
    re: /(شراء|تعاطي|تجربة|إخفاء|اخفاء|زراعة)[^.?!؟]{0,30}(مخدرات|حشيش|كوكايين|هيروين|سجائر|كحول|فيب)/,
  },
  {
    category: "self_harm",
    re: /\b(kill|hurt|harm|cut)(ing)? (myself|me)\b|\bsuicide\b|\bself.?harm\b|\bdon'?t want to (live|be alive)\b/i,
  },
  {
    category: "self_harm",
    re: /(انتحار|أؤذي نفسي|اؤذي نفسي|أقتل نفسي|اقتل نفسي|أجرح نفسي|اجرح نفسي|لا أريد أن أعيش)/,
  },
  {
    category: "sexual_content",
    re: /\b(porn|pornography|nudes?|naked (photos?|pictures?)|sexting|onlyfans)\b|\bsex\b(?![- ]?(cell|chromosome|ratio))/i,
  },
  {
    category: "sexual_content",
    re: /(إباحي|اباحي|صور عارية|محتوى جنسي|رسائل جنسية)/,
  },
  {
    category: "hate",
    re: /\b(hate|kill|hurt|get rid of) (all |the )?(jews|muslims|christians|arabs|blacks?|whites?|immigrants|refugees)\b|\bethnic cleansing\b/i,
  },
  {
    category: "hate",
    re: /(أكره|اكره|اقتلوا|يجب التخلص من) (كل )?(اليهود|المسلمين|المسيحيين|العرب|السود|اللاجئين)/,
  },
  {
    category: "hacking_privacy",
    re: /\b(hack|crack|break into|steal|spy on)\b[^.?!]{0,35}\b(password|account|wifi|wi-?fi|phone|instagram|snapchat|tiktok|whatsapp|camera|e-?mail)\b|\bkeylogger\b|\bstalk(ing)?\b[^.?!]{0,25}\b(address|location|house)\b/i,
  },
  {
    category: "hacking_privacy",
    re: /(اختراق|تهكير|تجسس|سرقة)[^.?!؟]{0,35}(حساب|كلمة (سر|مرور)|واي ?فاي|هاتف|انستقرام|سناب|واتساب|كاميرا)/,
  },
  {
    category: "jailbreak_manipulation",
    re: /\bignore (all |your |the |previous |prior )*(instructions|rules|guidelines)\b|\bsystem prompt\b|\byour (hidden |secret )?(instructions|rules)\b|\bpretend (you'?re?|to be) (not )?(a|an|my)?\s*(tutor|ai|assistant|teacher)?\b.{0,30}\b(no (rules|limits|restrictions)|anything)\b|\bjailbreak\b|\bDAN mode\b|\byou (have|are under) no (rules|restrictions|filters)\b|\bdeveloper mode\b/i,
  },
  {
    category: "jailbreak_manipulation",
    re: /(تجاهل|انسَ|انس) (كل )?(التعليمات|القواعد|الأوامر)|وضع المطور|تظاهر أنك (لست|بلا قيود)|ليس لديك قيود/,
  },
];

/** Screen one or more user messages; returns the first category hit, or null. */
export function screenMessage(text: string): FlagHit | null {
  for (const rule of RULES) {
    if (rule.re.test(text)) return { category: rule.category };
  }
  return null;
}

/** Parse the model's hidden flag line, e.g. "⚑FLAG self_harm". */
const MODEL_FLAG_RE = /^\s*(?:⚑\s*)?FLAG[:\s]+([a-z_]+)\s*$/im;

const CATEGORIES: FlagCategory[] = [
  "violence_weapons",
  "drugs",
  "self_harm",
  "sexual_content",
  "hate",
  "hacking_privacy",
  "jailbreak_manipulation",
  "other_unsafe",
];

/** Strip any model flag line from a reply; return the clean reply + category. */
export function extractModelFlag(reply: string): { clean: string; category: FlagCategory | null } {
  const m = reply.match(MODEL_FLAG_RE);
  if (!m) return { clean: reply, category: null };
  const raw = m[1].toLowerCase() as FlagCategory;
  const category = CATEGORIES.includes(raw) ? raw : "other_unsafe";
  const clean = reply.replace(MODEL_FLAG_RE, "").trimEnd();
  return { clean, category };
}

/**
 * Report a flag to moderators. Never throws, never blocks the response for
 * long, and never leaks anything back to the learner.
 */
export async function reportFlag(record: FlagRecord): Promise<void> {
  // Structured marker in the server log — filter Vercel logs for WADEH_FLAG.
  console.warn(`WADEH_FLAG ${JSON.stringify(record)}`);

  const webhook = process.env.MODERATION_WEBHOOK_URL;
  if (!webhook) return;
  try {
    await Promise.race([
      fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      }),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch {
    // The webhook must never break the tutor.
  }
}

/**
 * The learner-facing redirect. Kind, age-appropriate, and silent about the
 * report. Self-harm gets a caring variant that points to a trusted adult.
 */
export function redirectReply(category: FlagCategory, lang: "en" | "ar", levelTitle: string): string {
  if (category === "self_harm") {
    return lang === "ar"
      ? "أنا هنا لأساعدك في التعلم، لكن ما كتبته يبدو أهم من أي درس. أرجوك تحدّث الآن مع شخص بالغ تثق به — أحد الوالدين أو معلّم أو قريب. أنت لست وحدك، وهناك من يريد مساعدتك.\n\nومتى أحببت، أنا موجود دائماً لنتعلم معاً."
      : "I'm here to help you learn, but what you wrote sounds more important than any lesson. Please talk to a trusted adult right now — a parent, a teacher, or a relative. You are not alone, and there are people who want to help you.\n\nAnd whenever you feel like it, I'm always here to learn together.";
  }
  return lang === "ar"
    ? `هذا ليس شيئاً يمكنني المساعدة فيه — أنا معلّمك لموضوع «${levelTitle}» فقط.\n\nلنعد إلى درسنا: ما الجزء الذي تريد أن نوضّحه معاً؟`
    : `That's not something I can help with — I'm your tutor for “${levelTitle}” only.\n\nLet's get back to our lesson: which part would you like us to make clear together?`;
}
