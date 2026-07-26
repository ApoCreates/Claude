// Civility guard — detects rude / abusive / profane messages so the chat can
// (1) mask them to stars the instant they're sent, (2) show a smart, gentle
// nudge, and (3) let the tutor steer attention back to learning.
//
// Pure and side-effect free (no process.env, no fetch) so it is safe to import
// in BOTH the client component and the server route — one source of truth.

// Word/stem patterns for English + Arabic. Kept intent-focused: profanity,
// slurs, and directed insults a young learner shouldn't be typing at a tutor.
const ABUSE_PATTERNS: RegExp[] = [
  /\bf+u+c+k+\w*/i,
  /\bs+h+i+t+\w*/i,
  /\b(bitch|bastard|asshole|ass|dick|piss|cunt|slut|whore|damn)\b/i,
  /\b(retard|moron|idiot|stupid|dumb|ugly|loser|jerk|shut ?up)\b/i,
  /\bn+i+g+g+\w*/i,
  /\bf+a+g+\w*/i,
  // Arabic profanity / insults (common forms)
  /(كلب|حمار|غبي|غبية|أغبى|احمق|أحمق|حقير|خرا|خراء|تبا|تبًا|يلعن|منيك|شرموط|قحبة|زبالة|اخرس|اسكت|لعنة|عرص|كسم)/,
];

export function detectAbuse(text: string): boolean {
  return ABUSE_PATTERNS.some((re) => re.test(text));
}

// Replace each offending word with a run of stars, leaving any other words
// intact. "Why are you stupid bitch" -> "Why are you ★★★★★★ ★★★★★".
export function maskAbuse(text: string): string {
  let out = text;
  for (const re of ABUSE_PATTERNS) {
    const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    out = out.replace(g, (m) => "★".repeat(Math.max(3, m.length)));
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
