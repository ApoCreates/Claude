// The Study Notebook — a swipeable deck of teaching cards per lesson, in the
// spirit of the clarifyai reference: Simple Explanation → Visual → Formal
// Definition (real math) → Worked Example → Quick Check → One-Line Summary.
//
// Flagship lessons are hand-authored with rendered LaTeX, a flowchart and a
// data table. Every other lesson gets a clean auto-generated deck from its
// syllabus so the format is consistent everywhere.

import type { Bi, Subject, Level } from "./curriculum";
import { METHODS, type Method } from "./methods";

export interface FlowNode {
  text: Bi;
  tone: "force" | "mass" | "accel";
}

export interface Technique {
  emoji: string;
  name: Bi;
  blurb: Bi;
}

export interface NoteCard {
  icon: string;
  label: Bi;
  sub?: Bi;
  paras?: Bi[]; // paragraphs; may contain inline math wrapped in $...$
  math?: string[]; // display-mode LaTeX (language-neutral)
  flow?: FlowNode[]; // a small left-to-right flowchart
  table?: { head: Bi[]; rows: Bi[][] };
  techniques?: Technique[]; // multi-modal "learn it your way" prompts
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

// ---- Flagship: Math · Year 4 · Fractions & Decimals ----
const MATH_4: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Two ways to write a part", "طريقتان لكتابة الجزء"),
    paras: [
      bi("A fraction and a decimal are two ways to write the **same part of a whole**. Half a pizza is $\\frac{1}{2}$ — or $0.5$.", "الكسر والعدد العشري طريقتان لكتابة **الجزء نفسه من الكلّ**. نصف بيتزا هو $\\frac{1}{2}$ — أو $0.5$."),
      bi("To turn a fraction into a decimal, just **divide the top by the bottom**: $\\frac{3}{4} = 3 \\div 4 = 0.75$.", "لتحويل الكسر إلى عدد عشري، **اقسم الأعلى على الأسفل**: $\\frac{3}{4} = 3 \\div 4 = 0.75$."),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("The same amount, three ways", "المقدار نفسه بثلاث صور"),
    flow: [
      { text: bi("Whole", "الكلّ"), tone: "force" },
      { text: bi("Equal parts", "أجزاء متساوية"), tone: "mass" },
      { text: bi("Part = fraction = decimal", "الجزء = كسر = عشري"), tone: "accel" },
    ],
    table: {
      head: [bi("Fraction", "الكسر"), bi("Decimal", "العشري"), bi("Percent", "المئوية")],
      rows: [
        [bi("1/2", "١/٢"), bi("0.5", "٠٫٥"), bi("50%", "٥٠٪")],
        [bi("1/4", "١/٤"), bi("0.25", "٠٫٢٥"), bi("25%", "٢٥٪")],
        [bi("3/4", "٣/٤"), bi("0.75", "٠٫٧٥"), bi("75%", "٧٥٪")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Fraction → decimal", "الكسر ← العشري"),
    paras: [bi("Any fraction becomes a decimal by division:", "يصبح أي كسر عدداً عشرياً بالقسمة:")],
    math: ["\\frac{a}{b} = a \\div b", "\\frac{3}{4} = 0.75"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("A real-life share", "قسمة من الحياة"),
    paras: [
      bi("A carton holds 200 ml of juice. You drink $\\frac{3}{4}$ of it. How much did you drink?", "علبة فيها 200 مل عصير. شربت $\\frac{3}{4}$ منها. كم شربت؟"),
      bi("$\\frac{3}{4}$ of 200 $= 0.75 \\times 200 = 150$ ml.", "$\\frac{3}{4}$ من 200 $= 0.75 \\times 200 = 150$ مل."),
      bi("Check: the quarter left is $0.25 \\times 200 = 50$ ml, and $150 + 50 = 200$ ✓.", "تحقّق: الربع المتبقّي $0.25 \\times 200 = 50$ مل، و$150 + 50 = 200$ ✓."),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("Try it yourself", "جرّب بنفسك"),
    paras: [bi("Write $\\frac{1}{5}$ as a decimal, then as a percent. (Hint: $1 \\div 5$.)", "اكتب $\\frac{1}{5}$ عدداً عشرياً ثم نسبة مئوية. (تلميح: $1 \\div 5$.)")],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [bi("Fractions, decimals and percents are three costumes for the same part of a whole — divide top by bottom to switch.", "الكسور والأعداد العشرية والنسب المئوية ثلاثة أزياء للجزء نفسه — اقسم الأعلى على الأسفل للتبديل.")],
  },
];

// ---- Flagship: Physics · Year 7 · Forces, Pressure & Density ----
const PHYSICS_7: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Push, spread, pack", "دفع، توزيع، كثافة"),
    paras: [
      bi("A **force** is a push or pull. **Pressure** is how much that force is squeezed onto an area — a sharp pin has tiny area, so huge pressure.", "**القوة** دفع أو سحب. و**الضغط** مقدار تركّز تلك القوة على مساحة — الدبّوس الحادّ مساحته صغيرة، فضغطه هائل."),
      bi("**Density** is how tightly matter is packed: mass in each unit of volume. The Dead Sea's water is so dense it pushes you up.", "**الكثافة** مدى تراصّ المادة: الكتلة في كل وحدة حجم. ماء البحر الميت كثيف جداً فيدفعك للأعلى."),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("How they connect", "كيف تترابط"),
    flow: [
      { text: bi("Force  F", "القوة  F"), tone: "force" },
      { text: bi("Area  A", "المساحة  A"), tone: "mass" },
      { text: bi("Pressure  P = F ⁄ A", "الضغط  P = F ⁄ A"), tone: "accel" },
    ],
    table: {
      head: [bi("Quantity", "الكمية"), bi("Symbol", "الرمز"), bi("Unit", "الوحدة")],
      rows: [
        [bi("Pressure", "الضغط"), bi("P", "P"), bi("Pa (pascal)", "باسكال")],
        [bi("Force", "القوة"), bi("F", "F"), bi("N", "نيوتن")],
        [bi("Density", "الكثافة"), bi("ρ", "ρ"), bi("kg/m³", "كغم/م³")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("The two key laws", "القانونان الأساسيان"),
    paras: [bi("Pressure is force per area; density is mass per volume:", "الضغط قوة لكل مساحة، والكثافة كتلة لكل حجم:")],
    math: ["P = \\frac{F}{A}", "\\rho = \\frac{m}{V}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("One problem, solved", "مسألة محلولة"),
    paras: [
      bi("A box pushes down with 200 N over an area of 0.5 m². What pressure does it put on the floor?", "صندوق يضغط بقوة 200 نيوتن على مساحة 0.5 م². ما الضغط على الأرض؟"),
      bi("$P = \\frac{F}{A} = \\frac{200}{0.5} = 400$ Pa.", "$P = \\frac{F}{A} = \\frac{200}{0.5} = 400$ باسكال."),
      bi("Halving the area would double the pressure — that's why heels sink into sand.", "تنصيف المساحة يضاعف الضغط — لذا يغوص الكعب في الرمل."),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("Try it yourself", "جرّب بنفسك"),
    paras: [bi("A bag pushes with 60 N on 0.2 m². Find the pressure. (Hint: $P = F/A$.)", "حقيبة تضغط بـ60 نيوتن على 0.2 م². أوجد الضغط. (تلميح: $P = F/A$.)")],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [bi("Pressure concentrates a force onto an area ($P=F/A$); density packs mass into a volume ($\\rho=m/V$).", "الضغط يركّز القوة على مساحة ($P=F/A$)، والكثافة تحشر الكتلة في حجم ($\\rho=m/V$).")],
  },
];

// ---- Flagship: Math · Year 3 · Multiplication & Division ----
const MATH_3: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Fast adding, fair sharing", "جمع سريع، قسمة عادلة"),
    paras: [
      bi("Multiplication is **fast adding of equal groups**. $5 \\times 6$ means six groups of five — instead of $5+5+5+5+5+5$.", "الضرب هو **جمع سريع لمجموعات متساوية**. $5 \\times 6$ تعني ست مجموعات من خمسة — بدل $5+5+5+5+5+5$."),
      bi("Division is the opposite — **sharing fairly**. $30 \\div 6$ asks: split 30 into 6 equal groups; each gets 5.", "القسمة عكسه — **مشاركة عادلة**. $30 \\div 6$ تسأل: وزّع 30 على 6 مجموعات متساوية؛ لكلٍّ 5."),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Groups make it clear", "المجموعات توضّح"),
    flow: [
      { text: bi("Equal groups", "مجموعات متساوية"), tone: "force" },
      { text: bi("Repeated add", "جمع متكرّر"), tone: "mass" },
      { text: bi("Product  a × b", "الناتج  a × b"), tone: "accel" },
    ],
    table: {
      head: [bi("Idea", "الفكرة"), bi("Means", "تعني"), bi("Example", "مثال")],
      rows: [
        [bi("×", "×"), bi("groups of", "مجموعات من"), bi("5×6 = 30", "٥×٦ = ٣٠")],
        [bi("÷", "÷"), bi("shared into", "مقسوم على"), bi("30÷6 = 5", "٣٠÷٦ = ٥")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("A handy rule", "قاعدة مفيدة"),
    paras: [bi("Order doesn't change a product, and division undoes multiplication:", "الترتيب لا يغيّر الناتج، والقسمة تُلغي الضرب:")],
    math: ["a \\times b = b \\times a", "a \\times b = c \\;\\Rightarrow\\; c \\div b = a"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Count the groups", "عُدّ المجموعات"),
    paras: [
      bi("A box holds 6 rows of 5 dates. How many dates? $6 \\times 5 = 30$.", "صندوق فيه 6 صفوف من 5 تمرات. كم تمرة؟ $6 \\times 5 = 30$."),
      bi("Share 30 dates among 6 friends: $30 \\div 6 = 5$ each. Multiplication and division are two sides of one coin.", "وزّع 30 تمرة على 6 أصدقاء: $30 \\div 6 = 5$ لكلٍّ. الضرب والقسمة وجهان لعملة واحدة."),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("Try it yourself", "جرّب بنفسك"),
    paras: [bi("What is $7 \\times 8$? And then $56 \\div 8$? (They're linked!)", "كم $7 \\times 8$؟ ثم $56 \\div 8$؟ (مترابطتان!)")],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [bi("Multiplication is fast adding of equal groups; division shares them back — each undoes the other.", "الضرب جمع سريع لمجموعات متساوية، والقسمة تعيد توزيعها — كلٌّ يُلغي الآخر.")],
  },
];

// ---- Flagship: Physics · Year 5 · Energy Everywhere ----
const PHYSICS_5: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Energy in many costumes", "الطاقة بأزياء متعددة"),
    paras: [
      bi("**Energy** is the ability to make something happen — to move, heat, light or sound. It comes in many forms.", "**الطاقة** هي القدرة على إحداث شيء — حركة أو حرارة أو ضوء أو صوت. وتأتي بأشكال متعددة."),
      bi("The big idea: energy is **never lost, only changed** from one form to another.", "الفكرة الكبرى: الطاقة **لا تُفقد، بل تتحوّل** من شكل إلى آخر."),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("One form becomes another", "شكل يتحوّل إلى آخر"),
    flow: [
      { text: bi("Stored", "مخزّنة"), tone: "force" },
      { text: bi("Moving", "حركة"), tone: "mass" },
      { text: bi("Heat / Light / Sound", "حرارة/ضوء/صوت"), tone: "accel" },
    ],
    table: {
      head: [bi("Form", "الشكل"), bi("Example", "مثال")],
      rows: [
        [bi("Movement", "حركة"), bi("A rolling ball", "كرة تتدحرج")],
        [bi("Stored", "مخزّنة"), bi("A stretched spring", "زنبرك مشدود")],
        [bi("Electrical", "كهربائية"), bi("A battery", "بطارية")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("The law of energy", "قانون الطاقة"),
    paras: [
      bi("**Conservation of energy:** in any change, the total energy before equals the total energy after — it only shifts form.", "**حفظ الطاقة:** في أي تغيّر، مجموع الطاقة قبل = مجموعها بعد — تتغيّر صورتها فقط."),
    ],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Follow the energy", "تتبّع الطاقة"),
    paras: [
      bi("A battery lights a bulb. Trace it: **chemical** energy (battery) → **electrical** (wires) → **light + heat** (bulb).", "بطارية تُضيء مصباحاً. تتبّعها: طاقة **كيميائية** (البطارية) ← **كهربائية** (الأسلاك) ← **ضوء + حرارة** (المصباح)."),
      bi("None vanished — it just wore three costumes on the way.", "لم يفنَ شيء — بل ارتدت الطاقة ثلاثة أزياء في الطريق."),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("Try it yourself", "جرّب بنفسك"),
    paras: [bi("When you rub your hands together, movement energy turns into what? (Feel your palms!)", "عندما تفرك يديك، إلى ماذا تتحوّل طاقة الحركة؟ (تحسّس راحتيك!)")],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [bi("Energy is the power to make things happen; it is never lost, only changed from one form to another.", "الطاقة قدرة على إحداث الأشياء؛ لا تُفقد أبداً، بل تتحوّل من شكل إلى آخر.")],
  },
];

// ---- Flagship: Geography · Year 4 · Water & Weather ----
const GEOGRAPHY_4: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Water goes in a circle", "الماء يدور في حلقة"),
    paras: [
      bi(
        "The water you drank today is older than the dinosaurs. Earth never makes new water — it just keeps **moving the same water around** in a loop called the **water cycle**.",
        "الماء الذي شربته اليوم أقدم من الديناصورات. الأرض لا تصنع ماءً جديداً — بل **تُحرّك الماء نفسه** في حلقة تُسمّى **دورة الماء**."
      ),
      bi(
        "The Sun heats the sea and lifts water into the air (**evaporation**). High up it cools into clouds (**condensation**), falls as rain or snow (**precipitation**), and flows back to the sea (**collection**).",
        "تُسخّن الشمس البحر فترفع الماء إلى الهواء (**تبخّر**). وفي الأعلى يبرد ليصير غيوماً (**تكاثف**)، ثم يهطل مطراً أو ثلجاً (**هطول**)، ويجري عائداً إلى البحر (**تجمّع**)."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("One loop, four stages", "حلقة واحدة، أربع مراحل"),
    flow: [
      { text: bi("Evaporation ☀", "تبخّر ☀"), tone: "force" },
      { text: bi("Condensation ☁", "تكاثف ☁"), tone: "mass" },
      { text: bi("Precipitation 🌧 → Collection", "هطول 🌧 ← تجمّع"), tone: "accel" },
    ],
    table: {
      head: [bi("Stage", "المرحلة"), bi("What happens", "ماذا يحدث"), bi("Where you see it", "أين تراها")],
      rows: [
        [bi("Evaporation", "التبخّر"), bi("Liquid → vapour", "سائل ← بخار"), bi("A puddle drying up", "بركة ماء تجفّ")],
        [bi("Condensation", "التكاثف"), bi("Vapour → droplets", "بخار ← قطرات"), bi("Mist on a cold glass", "ضباب على كوب بارد")],
        [bi("Precipitation", "الهطول"), bi("Droplets fall", "القطرات تسقط"), bi("Rain, snow, hail", "مطر، ثلج، بَرَد")],
        [bi("Collection", "التجمّع"), bi("Water gathers", "الماء يتجمّع"), bi("Rivers, wadis, aquifers", "أنهار وأودية ومياه جوفية")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("The exact wording exams expect", "الصياغة الدقيقة التي تطلبها الامتحانات"),
    paras: [
      bi(
        "**The water cycle** is the continuous movement of water between the oceans, atmosphere and land, driven by energy from the Sun and by gravity.",
        "**دورة الماء** هي الحركة المستمرّة للماء بين المحيطات والغلاف الجوي واليابسة، تدفعها طاقة الشمس وقوة الجاذبية."
      ),
      bi("Over a long period the water balance of a place is:", "وعلى مدى فترة طويلة، يكون ميزان الماء لمكانٍ ما:"),
    ],
    math: ["P = E + R + \\Delta S"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Water where you live", "الماء حيث تعيش"),
    paras: [
      bi(
        "A rooftop in Amman measures 8 m by 5 m. In one storm, 20 mm of rain falls. How much water could the family harvest?",
        "سطح منزل في عمّان مساحته 8 م × 5 م. في عاصفة واحدة هطل 20 مم من المطر. كم لتراً يمكن أن تجمع العائلة؟"
      ),
      bi(
        "Area $= 8 \\times 5 = 40\\ \\text{m}^2$. Depth $= 20\\ \\text{mm} = 0.02\\ \\text{m}$. Volume $= 40 \\times 0.02 = 0.8\\ \\text{m}^3$.",
        "المساحة $= 8 \\times 5 = 40\\ \\text{م}^2$. العمق $= 20\\ \\text{مم} = 0.02\\ \\text{م}$. الحجم $= 40 \\times 0.02 = 0.8\\ \\text{م}^3$."
      ),
      bi(
        "Since $1\\ \\text{m}^3 = 1000$ litres, that is **800 litres** from one storm — in a region where every litre counts.",
        "وبما أن $1\\ \\text{م}^3 = 1000$ لتر، فذلك **800 لتر** من عاصفة واحدة — في منطقة يُحسب فيها كل لتر."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "A courtyard is 10 m by 4 m and 15 mm of rain falls. How many litres land on it? (Hint: area × depth, then ×1000.)",
        "فناء أبعاده 10 م × 4 م وهطل عليه 15 مم من المطر. كم لتراً سقط عليه؟ (تلميح: المساحة × العمق، ثم ×1000.)"
      ),
      bi("Try it, then ask the tutor to check your steps.", "جرّبها، ثم اطلب من المعلّم أن يتحقّق من خطواتك."),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "The Sun lifts water, the sky cools it, gravity drops it, and the land returns it — the same water, forever in a loop.",
        "الشمس ترفع الماء، والسماء تبرّده، والجاذبية تُسقطه، واليابسة تعيده — الماء نفسه، في حلقة لا تنتهي."
      ),
    ],
  },
];

// ---- Flagship: AI · Year 5 · How Machines Learn ----
const AI_5: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Learning from examples, not rules", "التعلّم من الأمثلة لا من القواعد"),
    paras: [
      bi(
        "Nobody can write down every rule for what a cat looks like. So instead of **telling** the computer, we **show** it — thousands of pictures labelled 'cat' and 'not cat' — and it works out the pattern itself.",
        "لا أحد يستطيع كتابة كل قاعدة تصف شكل القطة. لذا بدل أن **نُخبر** الحاسوب، **نُريه** — آلاف الصور موسومة بـ«قطة» و«ليست قطة» — فيستنتج النمط بنفسه."
      ),
      bi(
        "That's machine learning: the computer finds the rule from the examples, instead of a human writing the rule.",
        "هذا هو تعلّم الآلة: الحاسوب يكتشف القاعدة من الأمثلة، بدل أن يكتبها الإنسان."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Three ways a machine can learn", "ثلاث طرق تتعلّم بها الآلة"),
    flow: [
      { text: bi("Examples in", "أمثلة تدخل"), tone: "force" },
      { text: bi("Find the pattern", "اكتشاف النمط"), tone: "mass" },
      { text: bi("Predict the new one", "تنبّؤ بالجديد"), tone: "accel" },
    ],
    table: {
      head: [bi("Type", "النوع"), bi("What it gets", "ما يحصل عليه"), bi("Everyday example", "مثال يومي")],
      rows: [
        [
          bi("Supervised", "موجّه"),
          bi("Examples WITH labels", "أمثلة مع عناوين"),
          bi("Sorting photos of dates vs olives", "فرز صور التمر والزيتون"),
        ],
        [
          bi("Unsupervised", "غير موجّه"),
          bi("Examples with NO labels", "أمثلة بلا عناوين"),
          bi("Grouping shoppers by habits", "تجميع المتسوّقين حسب عاداتهم"),
        ],
        [
          bi("Reinforcement", "بالتعزيز"),
          bi("Rewards for good moves", "مكافآت على الحركات الجيدة"),
          bi("Learning to win a game", "تعلّم الفوز في لعبة"),
        ],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("The exact wording exams expect", "الصياغة الدقيقة التي تطلبها الامتحانات"),
    paras: [
      bi(
        "**Machine learning** is the study of algorithms that improve their performance at a task through experience, rather than through explicitly programmed rules.",
        "**تعلّم الآلة** هو دراسة الخوارزميات التي تُحسّن أداءها في مهمة ما عبر الخبرة، بدل القواعد المبرمجة صراحةً."
      ),
      bi("The model learns a function that maps inputs to outputs:", "يتعلّم النموذج دالّة تربط المدخلات بالمخرجات:"),
    ],
    math: ["f(x) \\approx y", "\\text{accuracy} = \\frac{\\text{correct predictions}}{\\text{total predictions}}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Measure how well it learned", "قِس مدى جودة تعلّمه"),
    paras: [
      bi(
        "You train a model to tell **dates from olives** using 200 photos from a Gulf market. On 50 new photos it gets 46 right.",
        "درّبت نموذجاً ليميّز **التمر عن الزيتون** بـ200 صورة من سوق خليجي. وعلى 50 صورة جديدة أصاب 46."
      ),
      bi("Accuracy $= \\frac{46}{50} = 0.92 = 92\\%$.", "الدقة $= \\frac{46}{50} = 0.92 = 92\\%$."),
      bi(
        "The 4 mistakes matter most: if they're all dark olives mistaken for dates, the model learned **colour** instead of **shape** — so we add more varied examples.",
        "الأخطاء الأربعة هي الأهم: إن كانت كلها زيتوناً داكناً حُسب تمراً، فالنموذج تعلّم **اللون** بدل **الشكل** — لذا نضيف أمثلة أكثر تنوّعاً."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "A model gets 18 of 20 predictions right. What is its accuracy as a percentage? And is grouping songs you've never labelled supervised or unsupervised?",
        "نموذج أصاب 18 من 20 تنبّؤاً. ما دقّته كنسبة مئوية؟ وهل تجميع أغانٍ لم تُوسَم من قبل تعلّم موجّه أم غير موجّه؟"
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Machine learning finds the rule from examples — labelled (supervised), unlabelled (unsupervised), or learned by reward (reinforcement).",
        "تعلّم الآلة يكتشف القاعدة من الأمثلة — موسومة (موجّه)، أو بلا وسم (غير موجّه)، أو بالمكافأة (بالتعزيز)."
      ),
    ],
  },
];

// ---- Flagship: Entrepreneurship · Year 5 · Customers & Value ----
const ENTREPRENEURSHIP_5: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("People buy a better day", "الناس تشتري يوماً أفضل"),
    paras: [
      bi(
        "Nobody wants a drill — they want a **hole in the wall**. Nobody wants karak tea — they want **five warm minutes before work**. Customers don't buy your product, they hire it to do a **job** for them.",
        "لا أحد يريد مثقاباً — بل يريد **ثقباً في الجدار**. ولا أحد يريد شاي كرك — بل يريد **خمس دقائق دافئة قبل العمل**. العميل لا يشتري منتجك، بل «يوظّفه» ليؤدّي له **مهمة**."
      ),
      bi(
        "So the first question isn't 'what shall I sell?' — it's **'whose day am I making better, and how much is that worth to them?'**",
        "لذا فالسؤال الأول ليس «ماذا أبيع؟» بل **«يوم مَن سأجعله أفضل، وكم يساوي ذلك عنده؟»**"
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("From person to promise", "من الشخص إلى الوعد"),
    flow: [
      { text: bi("Who? (segment)", "مَن؟ (الشريحة)"), tone: "force" },
      { text: bi("What job?", "أي مهمة؟"), tone: "mass" },
      { text: bi("Value promise", "وعد القيمة"), tone: "accel" },
    ],
    table: {
      head: [bi("Segment", "الشريحة"), bi("The job they hire you for", "المهمة التي يوظّفونك لها"), bi("What they'll pay for", "ما يدفعون مقابله")],
      rows: [
        [bi("Students", "الطلاب"), bi("Cheap, fast, between classes", "رخيص وسريع بين المحاضرات"), bi("Low price", "السعر المنخفض")],
        [bi("Office workers", "الموظفون"), bi("Reliable morning ritual", "طقس صباحي موثوق"), bi("Speed & consistency", "السرعة والثبات")],
        [bi("Families", "العائلات"), bi("A treat everyone agrees on", "متعة يتفق عليها الجميع"), bi("Size & comfort", "الحجم والراحة")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("The exact wording exams expect", "الصياغة الدقيقة التي تطلبها الامتحانات"),
    paras: [
      bi(
        "A **value proposition** is the specific benefit a customer segment gains, minus what it costs them in money and effort. A **segment** is a group who hire your product for the same job.",
        "**وعد القيمة** هو المنفعة المحدّدة التي تحصل عليها شريحة من العملاء، مطروحاً منها ما يكلّفهم من مال وجهد. و**الشريحة** مجموعة يوظّفون منتجك للمهمة نفسها."
      ),
    ],
    math: ["\\text{Value} = \\text{Benefit} - (\\text{Price} + \\text{Effort})", "\\text{Profit} = n \\times (\\text{Price} - \\text{Cost})"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("More customers isn't always more money", "العملاء الأكثر ليسوا دائماً مالاً أكثر"),
    paras: [
      bi(
        "You sell karak tea near a university. Each cup costs you **1.5** to make. Students: **40 cups/day at 3**. Office workers: **15 cups/day at 6**.",
        "تبيع شاي الكرك قرب جامعة. تكلفة الكوب **1.5**. الطلاب: **40 كوباً يومياً بـ3**. الموظفون: **15 كوباً يومياً بـ6**."
      ),
      bi(
        "Students: $40 \\times (3 - 1.5) = 60$. Office workers: $15 \\times (6 - 1.5) = 67.5$.",
        "الطلاب: $40 \\times (3 - 1.5) = 60$. الموظفون: $15 \\times (6 - 1.5) = 67.5$."
      ),
      bi(
        "The smaller segment earns **more** — because the job they're hiring you for (a reliable morning ritual) is worth more to them. Value beats volume.",
        "الشريحة الأصغر تربح **أكثر** — لأن المهمة التي يوظّفونك لها (طقس صباحي موثوق) تساوي عندهم أكثر. القيمة تتفوّق على الكمّ."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "A third segment: 8 taxi drivers a day who would pay 8 per cup. Same 1.5 cost — what's the daily profit, and does it beat the office workers?",
        "شريحة ثالثة: 8 سائقي أجرة يومياً يدفعون 8 للكوب. التكلفة نفسها 1.5 — ما الربح اليومي؟ وهل يتفوّق على الموظفين؟"
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Customers hire your product to do a job; find the segment whose job is worth the most, and promise them exactly that.",
        "العميل يوظّف منتجك لأداء مهمة؛ فابحث عن الشريحة التي تساوي مهمتها الأكثر، وعِدها بذلك تحديداً."
      ),
    ],
  },
];

// ---- Flagship: Emotional Intelligence · Year 3 · Understanding Others ----
// Note: no KaTeX here on purpose — forcing an equation into empathy would be
// bad teaching. The "formal definition" card carries precise vocabulary instead.
const EQ_3: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Two steps, always in order", "خطوتان، بهذا الترتيب دائماً"),
    paras: [
      bi(
        "Empathy has two steps, and most people skip the first. **Step 1: notice** — the face, the voice, the shoulders, the words. **Step 2: imagine** — what would make *me* look like that?",
        "للتعاطف خطوتان، ويتخطّى معظم الناس الأولى. **الخطوة ١: لاحِظ** — الوجه والنبرة والكتفين والكلمات. **الخطوة ٢: تخيّل** — ما الذي قد يجعلني *أنا* أبدو هكذا؟"
      ),
      bi(
        "Empathy is **not** agreeing, and it is **not** fixing. You can understand someone completely and still disagree — understanding first is what makes the disagreement kind.",
        "التعاطف **ليس** موافقةً، و**ليس** إصلاحاً. يمكنك أن تفهم شخصاً تماماً وتظلّ مختلفاً معه — والفهم أولاً هو ما يجعل الاختلاف لطيفاً."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Where the clues hide", "أين تختبئ الإشارات"),
    flow: [
      { text: bi("Notice the clues", "لاحِظ الإشارات"), tone: "force" },
      { text: bi("Imagine their world", "تخيّل عالمهم"), tone: "mass" },
      { text: bi("Respond, don't fix", "استجب ولا تُصلح"), tone: "accel" },
    ],
    table: {
      head: [bi("Clue", "الإشارة"), bi("What to look for", "ما تبحث عنه"), bi("Might mean", "قد تعني")],
      rows: [
        [bi("Face", "الوجه"), bi("Eyes down, tight mouth", "عينان للأسفل، فم مشدود"), bi("Sad or ashamed", "حزن أو خجل")],
        [bi("Voice", "النبرة"), bi("Quieter or sharper than usual", "أهدأ أو أحدّ من المعتاد"), bi("Tired or angry", "تعب أو غضب")],
        [bi("Body", "الجسد"), bi("Turned away, arms closed", "مُدار بعيداً، ذراعان مغلقتان"), bi("Wants space", "يريد مساحة")],
        [bi("Words", "الكلمات"), bi("‘I'm fine’ said fast", "«أنا بخير» بسرعة"), bi("Often the opposite", "غالباً العكس")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Three words people mix up", "ثلاث كلمات يخلط بينها الناس"),
    paras: [
      bi(
        "**Cognitive empathy** — understanding what someone thinks. **Emotional empathy** — feeling something of what they feel. **Compassion** — empathy plus the wish to help.",
        "**التعاطف المعرفي** — أن تفهم ما يفكّر فيه الآخر. **التعاطف الوجداني** — أن تشعر بشيء ممّا يشعر به. **الرحمة** — تعاطف تصحبه رغبة في المساعدة."
      ),
      bi(
        "You need all three: understanding without feeling is cold, feeling without action is just sadness.",
        "تحتاج الثلاثة معاً: الفهم بلا شعور بارد، والشعور بلا فعل مجرّد حزن."
      ),
    ],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("One real moment, step by step", "لحظة حقيقية، خطوة بخطوة"),
    paras: [
      bi(
        "At a family gathering, your cousin who always jokes sits alone at the edge of the majlis, phone down, not eating.",
        "في لمّة عائلية، ابن عمّك الذي يمزح دائماً يجلس وحده على طرف المجلس، هاتفه مقلوب، ولا يأكل."
      ),
      bi(
        "**Notice:** three clues — alone (unusual for him), phone down, not eating. **Imagine:** what makes *me* go quiet in a crowd? Bad news, or being told off before arriving.",
        "**لاحِظ:** ثلاث إشارات — وحده (غير معتاد منه)، الهاتف مقلوب، لا يأكل. **تخيّل:** ما الذي يجعلني *أنا* أصمت وسط الناس؟ خبر سيّئ، أو عتاب قبل الحضور."
      ),
      bi(
        "**Respond, don't fix:** don't say 'cheer up!' Sit beside him and say, *'You're quiet today — want company, or want me to leave you a bit?'* You gave him back the choice.",
        "**استجب ولا تُصلح:** لا تقل «ابتهج!». اجلس بجانبه وقل: *«أنت هادئ اليوم — تريد رفقة أم أتركك قليلاً؟»* لقد أعدت إليه حقّ الاختيار."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "Your friend says 'I'm fine' but says it fast and won't look at you. Which two clues did you notice — and what's one sentence that gives them the choice?",
        "يقول صديقك «أنا بخير» لكن بسرعة ودون أن ينظر إليك. ما الإشارتان اللتان لاحظتهما — وما الجملة التي تمنحه حقّ الاختيار؟"
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Empathy is noticing the clues, then imagining the world behind them — understand first, and never rush to fix.",
        "التعاطف أن تلاحظ الإشارات ثم تتخيّل العالم خلفها — افهم أولاً، ولا تتعجّل الإصلاح."
      ),
    ],
  },
];

const FLAGSHIPS: Record<string, NoteCard[]> = {
  "emotional-intelligence-3": EQ_3,
  "entrepreneurship-5": ENTREPRENEURSHIP_5,
  "ai-5": AI_5,
  "physics-10": PHYSICS_10,
  "physics-7": PHYSICS_7,
  "physics-5": PHYSICS_5,
  "math-7": MATH_7,
  "math-4": MATH_4,
  "math-3": MATH_3,
  "geography-4": GEOGRAPHY_4,
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

// The six modes we spotlight on every lesson — drawing, singing, movement,
// story, real-life relevance and a keepsake trophy. Pulled from the 150 so the
// library and the lessons stay one system.
const SPOTLIGHT_EMOJI: Record<string, string> = {
  "dual-coding": "✏️",
  "melody-mnemonic": "🎵",
  "act-it-out": "🤸",
  "become-concept": "📖",
  "indirect-analogy": "🌍",
  "take-home-trophy": "🏆",
};

function methodsCard(): NoteCard {
  const byId = (id: string) => METHODS.find((m) => m.id === id) as Method;
  const picks = ["dual-coding", "melody-mnemonic", "act-it-out", "become-concept", "indirect-analogy", "take-home-trophy"].map(byId);
  return {
    icon: "🌈",
    label: { en: "Learn It Your Way", ar: "تعلّمها بطريقتك" },
    sub: { en: "Six senses on one idea", ar: "ستّ حواسّ على فكرة واحدة" },
    techniques: picks.map((p) => ({ emoji: SPOTLIGHT_EMOJI[p.id], name: p.name, blurb: p.blurb })),
  };
}

export function buildDeck(subject: Subject, level: Level): NoteCard[] {
  const base = FLAGSHIPS[`${subject.slug}-${level.n}`] ?? autoDeck(subject, level);
  // Weave the multi-modal card in before the closing summary card.
  const deck = [...base];
  const insertAt = Math.max(0, deck.length - 1);
  deck.splice(insertAt, 0, methodsCard());
  return deck;
}

// Which lessons are fully hand-authored (used to badge them in the UI).
export function isFlagship(subjectSlug: string, level: number): boolean {
  return Boolean(FLAGSHIPS[`${subjectSlug}-${level}`]);
}
