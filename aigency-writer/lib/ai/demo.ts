/**
 * Demo-mode outputs so the whole product can be walked through with a
 * client before an ANTHROPIC_API_KEY is configured. Clearly labeled.
 */

import type { ModeId } from "./modes";
import type { OutputLang } from "../profiles";

const DEMO_NOTE_EN =
  "\n\n---\n*Demo mode — set `ANTHROPIC_API_KEY` to get live, brief-specific writing.*";
const DEMO_NOTE_AR =
  "\n\n---\n*وضع العرض التجريبي — أضف `ANTHROPIC_API_KEY` للحصول على كتابة حيّة مخصّصة لطلبك.*";

const AR_SAMPLE = `— العربية —

**الخيار الأول (زاوية عاطفية):**
«البداية لا تحتاج ضجيجًا… تحتاج قرارًا.»

**الخيار الثاني (زاوية حسّية):**
«رشفة واحدة، ويعرف صباحك طريقه.»

**الخيار الثالث (زاوية جريئة):**
«قهوتك القديمة لن تقرأ هذا الإعلان.»

**النص:**
لسنا هنا لنبيعك بُنًّا. نحن هنا لنعيد لصباحك هيبته: حبوب مختارة من مزارع صغيرة، تُحمَّص في جدة كل أسبوع، وتصلك قبل أن تفقد روحها. اشترك مرة، وانسَ سؤال «من وين أطلب؟» إلى الأبد.

**الدعوة للفعل:** جرّب أول صندوق — وإذا ما عجبك، القهوة علينا.

**لماذا ينجح هذا:** الافتتاحية تباغت القارئ بدل أن تستأذنه؛ والنص يبيع الطقس اليومي لا المنتج؛ والدعوة للفعل تنزع المخاطرة.`;

const EN_SAMPLE = `— English —

**Option 1 (emotional):**
"Mornings don't need noise. They need a decision."

**Option 2 (sensory):**
"One sip, and your morning knows where it's going."

**Option 3 (bold):**
"Your old coffee won't read this ad."

**Body:**
We're not here to sell you beans. We're here to give your morning its dignity back: small-farm lots, roasted in Jeddah every week, delivered before they lose their soul. Subscribe once and retire the question "where do I order from?" for good.

**CTA:** Try your first box — if it's not love, the coffee's on us.

**Why this works:** the opener surprises instead of asking permission; the body sells the daily ritual, not the product; the CTA removes the risk.`;

export function demoWriteResponse(mode: ModeId, lang: OutputLang): string {
  const header =
    lang === "ar"
      ? `**وضع تجريبي · ${mode}**\n\n`
      : `**Demo output · mode: ${mode}**\n\n`;
  if (lang === "ar") return header + AR_SAMPLE + DEMO_NOTE_AR;
  if (lang === "en") return header + EN_SAMPLE + DEMO_NOTE_EN;
  return header + AR_SAMPLE + "\n\n" + EN_SAMPLE + DEMO_NOTE_EN;
}

export function demoDrillResponse(lang: "ar" | "en"): string {
  return lang === "ar"
    ? `**تنفيذ التمرين (تجريبي):**\n\n«البداية لا تحتاج ضجيجًا… تحتاج قرارًا.»\n\nنفّذتُ التمرين بزاوية عاطفية تخاطب لحظة القرار لا المنتج نفسه، وتركتُ الجملة قصيرة ليعمل الإيقاع لصالح المعنى.${DEMO_NOTE_AR}`
    : `**Drill execution (demo):**\n\n"Mornings don't need noise. They need a decision."\n\nI took the emotional angle — selling the moment of decision rather than the product — and kept the line short so the rhythm does the persuading.${DEMO_NOTE_EN}`;
}
