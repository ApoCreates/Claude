// The Study Notebook — a swipeable deck of teaching cards per lesson, in the
// spirit of the clarifyai reference: Simple Explanation → Visual → Formal
// Definition (real math) → Worked Example → Quick Check → One-Line Summary.
//
// Flagship lessons are hand-authored with rendered LaTeX, a flowchart and a
// data table. Every other lesson gets a clean auto-generated deck from its
// syllabus so the format is consistent everywhere.

import type { Bi, Subject, Level } from "./curriculum";

export interface FlowNode {
  text: Bi;
  tone: "force" | "mass" | "accel";
}

export interface NoteCard {
  icon: string;
  label: Bi;
  sub?: Bi;
  paras?: Bi[]; // paragraphs; may contain inline math wrapped in $...$
  math?: string[]; // display-mode LaTeX (language-neutral)
  flow?: FlowNode[]; // a small left-to-right flowchart
  table?: { head: Bi[]; rows: Bi[][] };
}

const bi = (en: string, ar: string): Bi => ({ en, ar });

// ---- Flagship: Physics · Year 10 · Momentum & Newton's Second Law ----
const PHYSICS_10: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("The plain, step-by-step idea", "الفكرة ببساطة، خطوة بخطوة"),
    paras: [
      bi(
        "“Momentum” $(p)$ is mass times velocity — how much “motion” a body carries. A loaded truck has far more momentum than a bicycle at the same speed.",
        "«الزخم» $(p)$ هو الكتلة مضروبة في السرعة — مقدار «الحركة» التي يحملها الجسم. شاحنة محمّلة تملك زخماً أكبر بكثير من دراجة بالسرعة نفسها."
      ),
      bi(
        "A force is what changes momentum. Push harder, or push for longer, and the momentum changes more. When the mass stays the same, this becomes the famous $F = ma$.",
        "القوة هي ما يغيّر الزخم. ادفع بقوة أكبر أو لمدة أطول، فيتغيّر الزخم أكثر. وعندما تبقى الكتلة ثابتة، تصبح المعادلة الشهيرة $F = ma$."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("How the pieces fit together", "كيف تترابط الأجزاء"),
    flow: [
      { text: bi("Net Force  F", "القوة المحصّلة  F"), tone: "force" },
      { text: bi("Mass  m", "الكتلة  m"), tone: "mass" },
      { text: bi("Acceleration  a = F ⁄ m", "التسارع  a = F ⁄ m"), tone: "accel" },
    ],
    table: {
      head: [bi("Quantity", "الكمية"), bi("Symbol", "الرمز"), bi("Unit", "الوحدة"), bi("Meaning", "المعنى")],
      rows: [
        [bi("Force", "القوة"), bi("F", "F"), bi("N (newton)", "نيوتن"), bi("Push or pull", "دفع أو سحب")],
        [bi("Mass", "الكتلة"), bi("m", "m"), bi("kg", "كغم"), bi("Inertia of a body", "قصور الجسم")],
        [bi("Acceleration", "التسارع"), bi("a", "a"), bi("m/s²", "م/ث²"), bi("Rate of change of velocity", "معدّل تغيّر السرعة")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("The exact wording exams expect", "الصياغة الدقيقة التي تطلبها الامتحانات"),
    paras: [bi("Newton's Second Law, in full and in its constant-mass form:", "قانون نيوتن الثاني، بصورته الكاملة وبصورة الكتلة الثابتة:")],
    math: ["\\vec{F}_{net} = \\frac{d\\vec{p}}{dt} = \\frac{d(m\\vec{v})}{dt}", "\\vec{F}_{net} = m\\frac{d\\vec{v}}{dt} = m\\vec{a}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("One problem, solved step by step", "مسألة واحدة، محلولة خطوة بخطوة"),
    paras: [
      bi("A 1500 kg car experiences a net forward force of 3000 N. Find its acceleration.", "سيارة كتلتها 1500 كغم تتعرّض لقوة أمامية محصّلة مقدارها 3000 نيوتن. أوجد تسارعها."),
      bi("Using $\\vec F = m\\vec a$, solve for $a = \\frac{F}{m} = \\frac{3000}{1500} = 2\\ \\text{m/s}^2$.", "باستخدام $\\vec F = m\\vec a$، نحسب $a = \\frac{F}{m} = \\frac{3000}{1500} = 2\\ \\text{م/ث}^2$."),
      bi("Check: $F = ma = 1500 \\times 2 = 3000\\ \\text{N}$ ✓ — and the units agree $(\\text{kg·m/s}^2 = \\text{N})$.", "تحقّق: $F = ma = 1500 \\times 2 = 3000\\ \\text{نيوتن}$ ✓ — والوحدات متوافقة $(\\text{كغم·م/ث}^2 = \\text{نيوتن})$."),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "A football of mass 0.45 kg is kicked. Its velocity changes from 0 to 25 m/s in 0.05 s. What average force did the foot apply? (Hint: find the acceleration first.)",
        "كرة قدم كتلتها 0.45 كغم تُركل. تتغيّر سرعتها من 0 إلى 25 م/ث خلال 0.05 ث. ما متوسّط القوة التي بذلتها القدم؟ (تلميح: أوجد التسارع أولاً.)"
      ),
      bi("Try it, then ask the tutor to check your steps.", "جرّبها، ثم اطلب من المعلّم أن يتحقّق من خطواتك."),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر واحد"),
    paras: [bi("Force is the rate of change of momentum; when mass is constant, force equals mass times acceleration.", "القوة هي معدّل تغيّر الزخم؛ وعندما تكون الكتلة ثابتة، فإن القوة تساوي الكتلة في التسارع.")],
  },
];

// ---- Flagship: Math · Year 7 · Solving Linear Equations ----
const MATH_7: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("The plain, step-by-step idea", "الفكرة ببساطة، خطوة بخطوة"),
    paras: [
      bi("An equation is a balance scale: the left side weighs exactly the same as the right. The letter $x$ is just a number in disguise.", "المعادلة ميزان: الطرف الأيسر يزن تماماً كالطرف الأيمن. والحرف $x$ ما هو إلا عدد متخفٍّ."),
      bi("To find $x$, do the same thing to both sides so the scale stays balanced — until $x$ is alone.", "لإيجاد $x$، أجرِ العملية نفسها على الطرفين ليبقى الميزان متزناً — حتى ينفرد $x$ وحده."),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("The method in three moves", "الطريقة في ثلاث خطوات"),
    flow: [
      { text: bi("Same to both sides", "العملية نفسها للطرفين"), tone: "force" },
      { text: bi("Keep it balanced", "أبقِه متزناً"), tone: "mass" },
      { text: bi("Isolate  x", "اعزل  x"), tone: "accel" },
    ],
    table: {
      head: [bi("To undo…", "لإلغاء…"), bi("Do this", "افعل هذا")],
      rows: [
        [bi("+ 5", "+ ٥"), bi("− 5 on both sides", "− ٥ من الطرفين")],
        [bi("× 3", "× ٣"), bi("÷ 3 on both sides", "÷ ٣ للطرفين")],
        [bi("− 4", "− ٤"), bi("+ 4 on both sides", "+ ٤ للطرفين")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("The general rule", "القاعدة العامة"),
    paras: [bi("A linear equation and its solution:", "المعادلة الخطية وحلّها:")],
    math: ["ax + b = c", "x = \\frac{c - b}{a}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("A real-life problem, solved", "مسألة من الحياة، محلولة"),
    paras: [
      bi("A taxi charges 5 dirhams to start, then 2 dirhams per km. Your ride cost 17 dirhams. How far did you go?", "سيارة أجرة تتقاضى 5 دراهم عند الانطلاق، ثم درهمين لكل كيلومتر. كلّفتك الرحلة 17 درهماً. كم قطعت من المسافة؟"),
      bi("Set it up: $5 + 2x = 17$. Subtract 5: $2x = 12$. Divide by 2: $x = 6$ km.", "نضع المعادلة: $5 + 2x = 17$. نطرح 5: $2x = 12$. نقسم على 2: $x = 6$ كم."),
      bi("Check: $5 + 2(6) = 17$ ✓", "تحقّق: $5 + 2(6) = 17$ ✓"),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi("A phone plan is 20 dirhams a month plus 0.5 dirham per GB. The bill was 35 dirhams. Solve $20 + 0.5x = 35$ for the GB used.", "باقة هاتف بـ20 درهماً شهرياً زائد 0.5 درهم لكل غيغابايت. بلغت الفاتورة 35 درهماً. حُلّ $20 + 0.5x = 35$ لإيجاد كمية الغيغابايت."),
      bi("Try it, then ask the tutor to check your steps.", "جرّبها، ثم اطلب من المعلّم أن يتحقّق من خطواتك."),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر واحد"),
    paras: [bi("To solve a linear equation, undo each operation on both sides until the unknown stands alone.", "لحلّ معادلة خطية، ألغِ كل عملية على الطرفين حتى ينفرد المجهول وحده.")],
  },
];

const FLAGSHIPS: Record<string, NoteCard[]> = {
  "physics-10": PHYSICS_10,
  "math-7": MATH_7,
};

// Auto-generated deck for every other lesson — built from the year's focus and
// its four units, so the swipeable card format is consistent site-wide.
function autoDeck(subject: Subject, level: Level): NoteCard[] {
  const cards: NoteCard[] = [
    {
      icon: "📖",
      label: bi("Simple Explanation", "شرح مبسّط"),
      sub: bi("What this year is about", "عمّا تدور هذه السنة"),
      paras: [level.focus],
    },
  ];
  const icons = ["🧭", "🔎", "🧠", "🛠️"];
  level.units.forEach((u, i) => {
    cards.push({
      icon: icons[i % icons.length],
      label: u,
      sub: bi(`Unit ${i + 1} of ${level.units.length}`, `الوحدة ${i + 1} من ${level.units.length}`),
      paras: [
        bi(
          `In this unit we explore “${u.en}”. Ask the tutor for a worked example set in ${subject.name.en.toLowerCase()}, and try the lab and quiz below to lock it in.`,
          `في هذه الوحدة نستكشف «${u.ar}». اطلب من المعلّم مثالاً محلولاً في ${subject.name.ar}، وجرّب المختبر والاختبار أدناه لترسيخها.`
        ),
      ],
    });
  });
  cards.push({
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole year in one line", "السنة كلها في سطر"),
    paras: [
      bi(
        `${level.title.en}: ${level.units.map((u) => u.en).join(" · ")}.`,
        `${level.title.ar}: ${level.units.map((u) => u.ar).join(" · ")}.`
      ),
    ],
  });
  return cards;
}

export function buildDeck(subject: Subject, level: Level): NoteCard[] {
  return FLAGSHIPS[`${subject.slug}-${level.n}`] ?? autoDeck(subject, level);
}

// Which lessons are fully hand-authored (used to badge them in the UI).
export function isFlagship(subjectSlug: string, level: number): boolean {
  return Boolean(FLAGSHIPS[`${subjectSlug}-${level}`]);
}
