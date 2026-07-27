// Civility guard — detects rude / abusive / profane messages so the chat can
// (1) mask them to stars the instant they're sent, (2) show a smart, gentle
// nudge, and (3) let the tutor steer attention back to learning.
//
// Pure and side-effect free (no process.env, no fetch) so it is safe to import
// in BOTH the client component and the server route — one source of truth.

// Word/stem patterns for English + Arabic. Kept intent-focused: profanity,
// slurs, and directed insults a young learner shouldn't be typing at a tutor.
// --- Arabic ---
//
// Arabic has no \b in JavaScript regex, so a bare alternation matches INSIDE
// unrelated words. That is not theoretical: «تبا» sits inside «اختبار» (test),
// so every learner asking about an exam was being flagged as abusive. Arabic
// words also take proclitics (ال، و، ف، ب، ل), so we cannot simply demand a
// space either — «والكلب» must still match.
//
// So: match only when the term starts a word (optionally after those
// proclitics) and ends one (optionally before a common suffix). Boundaries are
// expressed with a leading capture group rather than a lookbehind, because
// lookbehind is unsupported in older Safari and this module is imported by the
// client bundle too.
const AR_LETTER = "\\u0621-\\u064A";
const AR_PROCLITIC = "(?:وال|بال|فال|لل|ال|و|ف|ب|ل|ك)?";
const AR_SUFFIX = "(?:ها|هم|هن|كم|كن|ين|ون|ات|ة|ه|ك|ي)?";

// Unambiguous: these are insults or profanity in essentially any context.
const AR_PROFANITY = [
  "غبي", "غبية", "أغبى", "احمق", "أحمق", "حقير", "خرا", "خراء", "تبا", "تبًا",
  "يلعن", "لعنة", "منيك", "شرموط", "قحبة", "زبالة", "اخرس", "اسكت", "عرص", "كسم",
];

// Ambiguous: ordinary words (dog, donkey, cow) that are only insults when aimed
// at someone. «الحمار الوحشي» is a zebra, and a learner must be able to ask
// about it — so these require an insulting frame such as «يا» or «أنت».
const AR_ANIMAL = ["كلب", "كلبة", "حمار", "حمارة", "بقرة", "خنزير"];
const AR_INSULT_FRAME = "(?:يا|أنت|انت|انتي|أنتِ|إنك|انك)\\s+(?:ال)?";

const arProfanity = new RegExp(
  `(^|[^${AR_LETTER}])(${AR_PROCLITIC}(?:${AR_PROFANITY.join("|")})${AR_SUFFIX})(?![${AR_LETTER}])`
);
const arDirectedAnimal = new RegExp(
  `(${AR_INSULT_FRAME})((?:${AR_ANIMAL.join("|")})${AR_SUFFIX})(?![${AR_LETTER}])`
);

const ABUSE_PATTERNS: RegExp[] = [
  /\bf+u+c+k+\w*/i,
  /\bs+h+i+t+\w*/i,
  /\b(bitch|bastard|asshole|ass|dick|piss|cunt|slut|whore|damn)\b/i,
  /\b(retard|moron|idiot|stupid|dumb|ugly|loser|jerk|shut ?up)\b/i,
  /\bn+i+g+g+\w*/i,
  /\bf+a+g+\w*/i,
  arProfanity,
  arDirectedAnimal,
];

// The Arabic patterns carry a leading boundary/frame group that must survive
// masking — only the second group is the offending word itself.
const KEEP_PREFIX_GROUP = new Set<RegExp>([arProfanity, arDirectedAnimal]);

export function detectAbuse(text: string): boolean {
  return ABUSE_PATTERNS.some((re) => re.test(text));
}

// Replace each offending word with a run of stars, leaving any other words
// intact. "Why are you stupid bitch" -> "Why are you ★★★★★★ ★★★★★".
export function maskAbuse(text: string): string {
  let out = text;
  for (const re of ABUSE_PATTERNS) {
    const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    if (KEEP_PREFIX_GROUP.has(re)) {
      // Star only the word itself; the boundary character or «يا» frame that
      // the pattern had to consume is written back unchanged.
      out = out.replace(g, (_m, prefix: string, word: string) => prefix + "★".repeat(Math.max(3, word.length)));
    } else {
      out = out.replace(g, (m) => "★".repeat(Math.max(3, m.length)));
    }
  }
  return out;
}

// The smart, age-appropriate nudge shown under a masked message.
export function civilityNudge(lang: "en" | "ar"): string {
  return lang === "ar"
    ? "أخفيتُ هذه الرسالة. الكلمات اللطيفة تجعل التعلّم أمتع — لنجرّب من جديد 🌟"
    : "I hid that message. Kind words make learning better — let's try again 🌟";
}

// The tutor's reply: acknowledge briefly, stay warm, and shift attention to a
// small, fun learning moment (never lecture).
export function civilityReply(lang: "en" | "ar", levelTitle: string): string {
  return lang === "ar"
    ? `لا بأس أن نشعر بالإحباط أحيانًا، لكن لنبقِ كلماتنا لطيفة — أنا في صفّك دائمًا. 🌸\n\nلننسَ ذلك ولنعد إلى «${levelTitle}»: أخبرني بأصعب فكرة صادفتك فيها، ولنحلّها معًا خطوة بخطوة.`
    : `It's okay to feel frustrated sometimes, but let's keep our words kind — I'm always on your side. 🌸\n\nLet's shake it off and get back to “${levelTitle}”: tell me the trickiest idea you've hit so far, and we'll crack it together, one step at a time.`;
}
