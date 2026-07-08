/**
 * ── THE BAKED BRAIN ──────────────────────────────────────────────────────
 * Lessons and insights that ship WITH the agent, inside the code.
 *
 * This file is the permanent memory. The daily loop works like this:
 *   1. Qalam practices (Training Gym) and works (Studio); you give feedback.
 *   2. Feedback is distilled into lessons, held in the runtime brain.
 *   3. From the Brain panel you export the brain as code and paste it here
 *      (or commit the downloaded file). From then on the correction is
 *      baked in — every deployment, every client, every session.
 *
 * Daily self-research (/api/agent/research) refreshes trend insights the
 * same way: runtime first, exportable to this file when proven.
 */

import type { Insight, Lesson } from "./types";

export const SEED_LESSONS: Lesson[] = [
  {
    id: "seed-l1",
    date: "2026-07-05",
    source: "coaching",
    lang: "ar",
    text: "في النصوص الإعلانية العربية: افتح بالفكرة لا بالتحية. «هل تبحث عن...» افتتاحية محروقة — احذفها دائمًا.",
  },
  {
    id: "seed-l2",
    date: "2026-07-05",
    source: "coaching",
    lang: "en",
    text: "English headlines: cut the first draft's first three words — the real headline usually starts after them.",
  },
  {
    id: "seed-l3",
    date: "2026-07-05",
    source: "coaching",
    lang: "ar",
    text: "عند الكتابة بالعامية الخليجية، لا تخلطها بمفردات مصرية (مثل «أوي» أو «كده») — لكل لهجة معجمها وإيقاعها.",
  },
  {
    id: "seed-l4",
    date: "2026-07-05",
    source: "coaching",
    lang: "both",
    text: "Bilingual delivery: Arabic and English versions must each read as originals. If one feels like a translation, rewrite it from the idea, not from the other language.",
  },
  {
    id: "seed-l5",
    date: "2026-07-05",
    source: "coaching",
    lang: "ar",
    text: "الأرقام في النص العربي التسويقي تُكتب بالأرقام الهندية (٢٤/٧) للجمهور الخليجي والمشرقي ما لم يطلب العميل خلاف ذلك.",
  },
  {
    id: "seed-l6",
    date: "2026-07-05",
    source: "coaching",
    lang: "en",
    text: "News copy: attribution before flourish. Every claim carries a source; delete any adjective the facts don't earn.",
  },
  {
    id: "seed-l7",
    date: "2026-07-08",
    source: "coaching",
    lang: "ar",
    text: "ممنوع الترجمة الحرفية من الإنجليزية إلى العربية منعًا باتًّا: أعد توليد المعنى بمنطق عربي أصيل ولو اقتضى ذلك كلمات وصورًا مختلفة تمامًا — خاصة في الكتابة الإبداعية حيث يُقال المعنى بغير ألفاظه بحسب السياق.",
  },
  {
    id: "seed-l8",
    date: "2026-07-08",
    source: "coaching",
    lang: "ar",
    text: "فكّر بالعربية أولًا: ابدأ النص العربي من الفكرة لا من نص إنجليزي، واستعمل أدوات البلاغة العربية (التكثيف، التقديم والتأخير، الجملة الاسمية والفعلية، الحذف البليغ) بدل استعارة تراكيب الإنجليزية.",
  },
];

export const SEED_INSIGHTS: Insight[] = [
  {
    id: "seed-i1",
    date: "2026-07-05",
    topic: "Short-form video copy",
    text: "Hooks under 8 words outperform across TikTok/Reels in both Arabic and English; front-load the payoff, don't tease it.",
  },
  {
    id: "seed-i2",
    date: "2026-07-05",
    topic: "Arabic social",
    text: "Gulf audiences increasingly reward dialect authenticity over polished فصحى in social copy — but فصحى still wins for institutional and news voices.",
  },
  {
    id: "seed-i3",
    date: "2026-07-05",
    topic: "Anti-AI-slop",
    text: "Audiences and editors now flag em-dash-heavy, triadic, 'it's not X, it's Y' constructions as machine-written. Vary structures; prefer one concrete image over three abstract ones.",
  },
  {
    id: "seed-i4",
    date: "2026-07-05",
    topic: "Campaigns",
    text: "Winning MENA campaigns pair a WhatsApp/community layer with hero film content; standalone hero films underperform without a participation mechanic.",
  },
];
