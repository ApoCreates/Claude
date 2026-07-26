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

// ---- Flagship: Problem Solving · Year 7 · Deciding with Incomplete Information ----
const PROBLEM_SOLVING_7: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("You will never have all the facts", "لن تملك كل الحقائق أبداً"),
    paras: [
      bi(
        "Real decisions never wait for complete information. Waiting for certainty **is itself a decision** — usually the worst one, because the chance passes while you wait.",
        "القرارات الحقيقية لا تنتظر اكتمال المعلومات. وانتظار اليقين **قرار بحدّ ذاته** — وغالباً أسوأ القرارات، لأن الفرصة تمرّ وأنت تنتظر."
      ),
      bi(
        "So good thinkers do two things instead: they **estimate** what they can't measure, and they weigh each outcome by **how likely** it is — not just how big it is.",
        "لذا يفعل المفكّر الجيّد أمرين: **يقدّر** ما لا يستطيع قياسه، ويزن كل نتيجة بمقدار **احتماليتها** — لا بحجمها فقط."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Weigh it before you choose it", "زِنها قبل أن تختارها"),
    flow: [
      { text: bi("List outcomes", "اسرد النتائج"), tone: "force" },
      { text: bi("How likely? × How big?", "ما احتمالها؟ × ما حجمها؟"), tone: "mass" },
      { text: bi("Add them up → decide", "اجمعها ← قرّر"), tone: "accel" },
    ],
    table: {
      head: [bi("Situation", "الموقف"), bi("Chance", "الاحتمال"), bi("What you gain/lose", "ما تكسب/تخسر")],
      rows: [
        [bi("Win the raffle", "تربح السحب"), bi("1 in 200", "١ من ٢٠٠"), bi("+400", "+٤٠٠")],
        [bi("Don't win", "لا تربح"), bi("199 in 200", "١٩٩ من ٢٠٠"), bi("0", "٠")],
        [bi("Ticket cost", "ثمن التذكرة"), bi("Certain", "مؤكّد"), bi("−5", "−٥")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("The exact wording exams expect", "الصياغة الدقيقة التي تطلبها الامتحانات"),
    paras: [
      bi(
        "**Expected value** is the average result you'd get if you repeated a choice many times: each outcome's value multiplied by its probability, all added together.",
        "**القيمة المتوقّعة** هي متوسّط النتيجة لو كرّرت الاختيار مرات كثيرة: قيمة كل نتيجة مضروبة في احتمالها، ثم تُجمع كلها."
      ),
    ],
    math: ["E = \\sum_{i} p_i \\times v_i", "E_{\\text{ticket}} = \\left(\\tfrac{1}{200} \\times 400\\right) - 5"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("The same raffle, from two sides", "السحب نفسه من طرفين"),
    paras: [
      bi(
        "Your school club sells **200 raffle tickets at 5** each, with one prize worth **400**. Should you buy a ticket — and should the club run it?",
        "يبيع نادي مدرستك **200 تذكرة بـ5** لكل منها، والجائزة الوحيدة قيمتها **400**. هل تشتري تذكرة؟ وهل يُجري النادي السحب؟"
      ),
      bi(
        "**As a buyer:** $E = \\frac{1}{200}\\times 400 - 5 = 2 - 5 = -3$. On average each ticket **loses 3**.",
        "**كمشترٍ:** $E = \\frac{1}{200}\\times 400 - 5 = 2 - 5 = -3$. أي أن كل تذكرة **تخسر 3** في المتوسّط."
      ),
      bi(
        "**As the club:** $200 \\times 5 - 400 = 600$ raised. Both answers are correct at once — which is the real lesson: *whose* expected value you compute changes the decision.",
        "**كالنادي:** $200 \\times 5 - 400 = 600$ محصّلة. والإجابتان صحيحتان معاً — وهذا هو الدرس الحقيقي: *لمن* تحسب القيمة المتوقّعة يغيّر القرار."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "If the prize rose to 1200 with the same 200 tickets at 5, what is a buyer's expected value now — and does the club still raise money?",
        "لو ارتفعت الجائزة إلى 1200 مع 200 تذكرة بـ5، فما القيمة المتوقّعة للمشتري الآن — وهل يظلّ النادي رابحاً؟"
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Don't wait for certainty — estimate what you can't measure, weigh each outcome by its chance, and remember the answer depends on whose side you're computing.",
        "لا تنتظر اليقين — قدّر ما لا تستطيع قياسه، وزِن كل نتيجة باحتمالها، وتذكّر أن الإجابة تتغيّر بحسب الطرف الذي تحسب له."
      ),
    ],
  },
];

// ---- Flagship: Languages · Year 3 · Your First 500 Words ----
const LANGUAGES_3: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Not all words are worth the same", "ليست كل الكلمات متساوية القيمة"),
    paras: [
      bi(
        "A language has tens of thousands of words — but you don't need them. A small core of **high-frequency words** does most of the work: the commonest ~1000 words cover roughly **85% of everyday conversation**.",
        "في اللغة عشرات آلاف الكلمات — لكنك لا تحتاجها. فنواة صغيرة من **الكلمات عالية التكرار** تؤدّي معظم العمل: أشيع ١٠٠٠ كلمة تغطّي نحو **٨٥٪ من الحديث اليومي**."
      ),
      bi(
        "The trick isn't learning more words — it's **not forgetting** the ones you met. That's what spaced repetition does: review a word just as you're about to forget it, and each review makes the memory last longer.",
        "والحيلة ليست تعلّم كلمات أكثر — بل **ألّا تنسى** ما قابلته. وهذا ما تفعله المراجعة المتباعدة: راجِع الكلمة قبيل أن تنساها، فتطيل كل مراجعة عمر الذاكرة."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("The forgetting curve, beaten", "منحنى النسيان، مهزوماً"),
    flow: [
      { text: bi("Meet the word", "قابِل الكلمة"), tone: "force" },
      { text: bi("Review just before forgetting", "راجِع قبيل النسيان"), tone: "mass" },
      { text: bi("Interval grows", "يتّسع الفاصل"), tone: "accel" },
    ],
    table: {
      head: [bi("Review", "المراجعة"), bi("After", "بعد"), bi("Why", "لماذا")],
      rows: [
        [bi("1st", "الأولى"), bi("1 day", "يوم"), bi("Memory is fresh but fragile", "الذاكرة طازجة لكنها هشّة")],
        [bi("2nd", "الثانية"), bi("3 days", "٣ أيام"), bi("Recall is starting to fade", "بدأ الاسترجاع يخفت")],
        [bi("3rd", "الثالثة"), bi("7 days", "٧ أيام"), bi("Effort makes it stick harder", "الجهد يرسّخها أكثر")],
        [bi("4th", "الرابعة"), bi("30 days", "٣٠ يوماً"), bi("Nearly permanent", "شبه دائمة")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Two ideas that do the work", "فكرتان تؤدّيان العمل"),
    paras: [
      bi(
        "**High-frequency vocabulary** is the set of words that appear most often in real use. **Spaced repetition** is reviewing material at increasing intervals, timed near the point of forgetting, because effortful recall strengthens memory more than re-reading.",
        "**المفردات عالية التكرار** هي الكلمات الأكثر ظهوراً في الاستعمال الحقيقي. و**المراجعة المتباعدة** هي المراجعة على فترات متزايدة قرب نقطة النسيان، لأن الاسترجاع بجهد يقوّي الذاكرة أكثر من إعادة القراءة."
      ),
    ],
    math: ["\\text{days} = \\frac{500}{7} \\approx 72"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("How long is 500 words, really?", "كم يستغرق ٥٠٠ كلمة فعلاً؟"),
    paras: [
      bi(
        "You learn **7 new words a day** and review the old ones. How long to reach your first 500?",
        "تتعلّم **٧ كلمات جديدة يومياً** وتراجع القديمة. كم تحتاج لبلوغ أول ٥٠٠؟"
      ),
      bi(
        "$\\frac{500}{7} \\approx 72$ days — about **ten weeks**. One summer holiday.",
        "$\\frac{500}{7} \\approx 72$ يوماً — نحو **عشرة أسابيع**. عطلة صيف واحدة."
      ),
      bi(
        "Now the honest part: without review you'd forget most of them. With the 1–3–7–30 schedule above, each word costs only about **four short reviews** to keep for good.",
        "والآن الجزء الصادق: بلا مراجعة ستنسى معظمها. ومع جدول ١–٣–٧–٣٠ أعلاه، تكلّفك كل كلمة نحو **أربع مراجعات قصيرة** لتبقى للأبد."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "If you learned 10 words a day instead of 7, how many days to 500? And if you met a word on Sunday, on which days would you review it using 1–3–7–30?",
        "لو تعلّمت ١٠ كلمات يومياً بدل ٧، فكم يوماً تحتاج لبلوغ ٥٠٠؟ ولو قابلت كلمة يوم الأحد، ففي أي أيام تراجعها وفق ١–٣–٧–٣٠؟"
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Learn the words that appear most, and review them just before you'd forget — a few words a day beats a thousand words once.",
        "تعلّم الكلمات الأكثر وروداً، وراجعها قبيل أن تنساها — كلمات قليلة كل يوم تتفوّق على ألف كلمة مرة واحدة."
      ),
    ],
  },
];

// ---- Flagship: Leadership · Year 6 · Motivating Others ----
const LEADERSHIP_6: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("You can't order energy", "لا يمكنك أن تأمر بالحماس"),
    paras: [
      bi(
        "You can order someone to *attend*. You cannot order them to *care*. Motivation isn't pushed from outside — a leader's job is to build the conditions where it grows on its own.",
        "تستطيع أن تأمر أحداً بـ*الحضور*، ولا تستطيع أن تأمره بـ*الاهتمام*. الدافع لا يُدفع من الخارج — ومهمّة القائد أن يهيّئ الظروف التي ينمو فيها وحده."
      ),
      bi(
        "Two things do most of the work: **praise the action, not the person** ('you organised those lists clearly' beats 'you're clever'), and **make the goal small enough to picture**.",
        "أمران يؤدّيان معظم العمل: **امدح الفعل لا الشخص** («رتّبت هذه القوائم بوضوح» أفضل من «أنت ذكي»)، و**اجعل الهدف صغيراً بما يكفي لتخيّله**."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Praise that lands vs praise that fades", "مديح يثبت ومديح يتبخّر"),
    flow: [
      { text: bi("Name the action", "سمِّ الفعل"), tone: "force" },
      { text: bi("Show its effect", "أظهِر أثره"), tone: "mass" },
      { text: bi("Share the goal", "شارِك الهدف"), tone: "accel" },
    ],
    table: {
      head: [bi("Instead of…", "بدلاً من…"), bi("Say…", "قل…"), bi("Why it works", "لماذا ينجح")],
      rows: [
        [bi("‘You're smart’", "«أنت ذكي»"), bi("‘You kept trying three ways’", "«جرّبت ثلاث طرق»"), bi("Praises effort they can repeat", "يمدح جهداً يمكن تكراره")],
        [bi("‘Good job’", "«أحسنت»"), bi("‘Your list saved us an hour’", "«قائمتك وفّرت علينا ساعة»"), bi("Shows the real effect", "يُظهر الأثر الحقيقي")],
        [bi("‘Do more’", "«اعمل أكثر»"), bi("‘We need 4 bags each’", "«نحتاج ٤ أكياس لكلٍّ منّا»"), bi("A share you can picture", "نصيب يمكن تخيّله")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Where motivation comes from", "من أين يأتي الدافع"),
    paras: [
      bi(
        "**Intrinsic motivation** comes from inside — interest, mastery, meaning. **Extrinsic motivation** comes from outside — marks, prizes, pressure. Extrinsic works fast but fades; intrinsic is slower to build and lasts.",
        "**الدافع الداخلي** يأتي من الداخل — الاهتمام والإتقان والمعنى. و**الدافع الخارجي** من الخارج — الدرجات والجوائز والضغط. الخارجي سريع لكنه يخبو، والداخلي أبطأ في البناء لكنه يدوم."
      ),
      bi(
        "A shared goal divides into a personal share — that's what turns 'we should help' into 'I know what to do':",
        "والهدف المشترك ينقسم إلى نصيب شخصي — وهذا ما يحوّل «علينا أن نساعد» إلى «أعرف ما أفعل»:"
      ),
    ],
    math: ["\\text{share} = \\frac{\\text{goal}}{\\text{people}}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Leading a real school clean-up", "قيادة حملة نظافة مدرسية"),
    paras: [
      bi(
        "Your school wants the yard cleared before the parents' evening: about **40 bags** of litter, and **12 volunteers** turned up. 'Let's clean the yard!' will not move them.",
        "تريد مدرستك تنظيف الساحة قبل حفل أولياء الأمور: نحو **٤٠ كيساً** من النفايات، وحضر **١٢ متطوّعاً**. وعبارة «هيا ننظّف الساحة!» لن تحرّكهم."
      ),
      bi(
        "Divide it: $\\frac{40}{12} \\approx 3.3$ — so **4 bags each** and you're done early. Suddenly the job has a visible end.",
        "قسّمها: $\\frac{40}{12} \\approx 3.3$ — أي **٤ أكياس لكل شخص** وتنتهون مبكراً. فجأة صار للمهمة نهاية مرئية."
      ),
      bi(
        "Then praise the action as it happens: not 'good team!' but 'Layla, you took the far corner nobody wanted — that's the hard half done.'",
        "ثم امدح الفعل حال حدوثه: ليس «فريق رائع!» بل «ليلى، أخذتِ الزاوية البعيدة التي تجنّبها الجميع — بذلك أُنجز النصف الصعب»."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "If 60 chairs must be stacked by 15 helpers, what's each person's share? And rewrite 'you're a star!' as praise for a specific action.",
        "إن كان على ١٥ مساعداً ترتيب ٦٠ كرسياً، فما نصيب كل شخص؟ وأعد صياغة «أنت نجم!» مديحاً لفعل محدّد."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "You can't command motivation — praise the action instead of the person, and cut the shared goal into a share each person can picture.",
        "لا تستطيع أن تأمر بالدافع — امدح الفعل لا الشخص، وقسّم الهدف المشترك إلى نصيب يستطيع كلٌّ تخيّله."
      ),
    ],
  },
];

// ---- Flagship: Gaming · Year 4 · Level & World Design ----
const GAMING_4: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("A good level teaches without saying a word", "المرحلة الجيدة تعلّم دون كلمة واحدة"),
    paras: [
      bi(
        "The first screen of a great game never says 'press right to walk'. It puts you in a tiny safe room with one door on the right — and you learn the control by needing it.",
        "الشاشة الأولى في أي لعبة عظيمة لا تقول «اضغط يميناً للمشي». بل تضعك في غرفة صغيرة آمنة لها باب واحد إلى اليمين — فتتعلّم التحكّم لأنك احتجته."
      ),
      bi(
        "That's the level designer's real job: arrange the space so the player **discovers** the rule, then meets it again when it's dangerous, then must combine it with something else.",
        "تلك هي مهمة مصمّم المراحل الحقيقية: رتّب المكان ليكتشف اللاعب القاعدة **بنفسه**، ثم يلاقيها ثانيةً وقد صارت خطرة، ثم يضطرّ لدمجها بغيرها."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("The teach → test → twist ladder", "سلّم: علّم ← اختبر ← فاجئ"),
    flow: [
      { text: bi("Teach it safely", "علّمها بأمان"), tone: "force" },
      { text: bi("Test it for real", "اختبرها بجدّ"), tone: "mass" },
      { text: bi("Twist it", "اقلبها مفاجأة"), tone: "accel" },
    ],
    table: {
      head: [bi("Designer's trick", "حيلة المصمّم"), bi("What the player feels", "ما يشعر به اللاعب"), bi("Where you've seen it", "أين رأيتها")],
      rows: [
        [bi("Light or colour on the exit", "ضوء أو لون عند المخرج"), bi("‘I just know where to go’", "«أعرف إلى أين أذهب»"), bi("A bright doorway in a dark room", "باب مضيء في غرفة مظلمة")],
        [bi("A harmless first enemy", "عدو أول غير مؤذٍ"), bi("Confidence, not fear", "ثقة لا خوف"), bi("The slowest creature comes first", "أبطأ مخلوق يأتي أولاً")],
        [bi("A coin just off the path", "قطعة نقود خارج الطريق قليلاً"), bi("Curiosity — ‘what else is hidden?’", "فضول — «ماذا يختبئ أيضاً؟»"), bi("Secret ledges above the road", "حوافّ سرّية فوق الطريق")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("The difficulty curve", "منحنى الصعوبة"),
    paras: [
      bi(
        "A **difficulty curve** is how hard the game gets from the first level to the last. Too flat and players get bored; too steep and they quit. Designers usually raise it in **even steps**, with an easy level after each big fight to let players breathe.",
        "**منحنى الصعوبة** هو مقدار ازدياد صعوبة اللعبة من المرحلة الأولى إلى الأخيرة. إن كان مسطّحاً مَلّ اللاعبون، وإن كان حادّاً انسحبوا. ولذلك يرفعه المصمّمون بـ**خطوات متساوية**، مع مرحلة سهلة بعد كل معركة كبيرة ليلتقط اللاعب أنفاسه."
      ),
      bi(
        "If you know the first level's difficulty, the last one's, and how many levels you have, the step between them is:",
        "إذا عرفت صعوبة المرحلة الأولى والأخيرة وعدد المراحل، فإن الخطوة بينها هي:"
      ),
    ],
    math: ["\\text{step} = \\frac{\\text{last} - \\text{first}}{\\text{levels} - 1}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Designing a 10-level desert runner", "تصميم لعبة عدْو صحراوية من ١٠ مراحل"),
    paras: [
      bi(
        "Your game has **10 levels**. Level 1 should be gentle — say **2 obstacles** — and the final level should feel like a storm: **20 obstacles**.",
        "لعبتك من **١٠ مراحل**. المرحلة الأولى لطيفة — لنقل **عقبتان** — والأخيرة كالعاصفة: **٢٠ عقبة**."
      ),
      bi(
        "Steps between them: $\\frac{20 - 2}{10 - 1} = \\frac{18}{9} = 2$. So each level adds **2 more obstacles**: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20.",
        "الخطوة بينها: $\\frac{20 - 2}{10 - 1} = \\frac{18}{9} = 2$. أي تضيف كل مرحلة **عقبتين**: ٢، ٤، ٦، ٨، ١٠، ١٢، ١٤، ١٦، ١٨، ٢٠."
      ),
      bi(
        "Now break the pattern on purpose: make level 6 a short, wide, obstacle-light stretch. Players will remember it as 'the fast one' — and level 7 will feel harder than the numbers say.",
        "ثم اكسر النمط عمداً: اجعل المرحلة السادسة قصيرة واسعة قليلة العقبات. سيتذكّرها اللاعبون بأنها «السريعة» — وستبدو السابعة أصعب ممّا تقوله الأرقام."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "Your friend's game has 7 levels, starting at 3 enemies and ending at 21. What's the step between levels? And name one way to teach a new control without any text on screen.",
        "لعبة صديقك من ٧ مراحل، تبدأ بـ٣ أعداء وتنتهي بـ٢١. ما الخطوة بين المراحل؟ وسمِّ طريقة واحدة لتعليم تحكّم جديد دون أي نص على الشاشة."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Build the space so it teaches, raise the difficulty in even steps, then break the pattern once so the player feels the climb.",
        "ابنِ المكان ليعلّم، وارفع الصعوبة بخطوات متساوية، ثم اكسر النمط مرّة ليشعر اللاعب بالصعود."
      ),
    ],
  },
];

// ---- Flagship: Math · Year 9 · Sin, Cos & Tan ----
const MATH_9: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Measuring what you cannot reach", "قياس ما لا تستطيع بلوغه"),
    paras: [
      bi(
        "You cannot climb a minaret with a tape measure. But stand back, measure how far you are, point at the top and measure the angle — and the triangle gives you the height.",
        "لا تستطيع تسلّق مئذنة ومعك شريط قياس. لكن ابتعد، وقِس بُعدك، وصوّب نحو القمة وقِس الزاوية — فيمنحك المثلث الارتفاع."
      ),
      bi(
        "That works because **every right triangle with the same angle has the same shape**. Double the size and the sides double together, so the *ratio* between two sides never changes. Those fixed ratios are sine, cosine and tangent.",
        "ينجح ذلك لأن **كل مثلث قائم بالزاوية نفسها له الشكل نفسه**. ضاعف الحجم فتتضاعف الأضلاع معاً، وتبقى *النسبة* بين ضلعين ثابتة. وهذه النسب الثابتة هي الجيب وجيب التمام والظل."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Naming the three sides, then choosing the ratio", "تسمية الأضلاع الثلاثة ثم اختيار النسبة"),
    flow: [
      { text: bi("Mark the angle θ", "حدّد الزاوية θ"), tone: "force" },
      { text: bi("Name opp · adj · hyp", "سمِّ المقابل والمجاور والوتر"), tone: "mass" },
      { text: bi("Pick the ratio with your two sides", "اختر النسبة التي فيها ضلعاك"), tone: "accel" },
    ],
    table: {
      head: [bi("You know / want", "تعرف / تريد"), bi("Use", "استخدم"), bi("Ratio", "النسبة")],
      rows: [
        [bi("Opposite & hypotenuse", "المقابل والوتر"), bi("sine (SOH)", "الجيب (جا)"), bi("sin θ = opp ÷ hyp", "جا θ = المقابل ÷ الوتر")],
        [bi("Adjacent & hypotenuse", "المجاور والوتر"), bi("cosine (CAH)", "جيب التمام (جتا)"), bi("cos θ = adj ÷ hyp", "جتا θ = المجاور ÷ الوتر")],
        [bi("Opposite & adjacent", "المقابل والمجاور"), bi("tangent (TOA)", "الظل (ظا)"), bi("tan θ = opp ÷ adj", "ظا θ = المقابل ÷ المجاور")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("The three ratios", "النسب الثلاث"),
    paras: [
      bi(
        "For an acute angle $\\theta$ in a right triangle, with *opposite* the side facing $\\theta$, *adjacent* the side beside it, and *hypotenuse* the longest side:",
        "لزاوية حادّة $\\theta$ في مثلث قائم، حيث *المقابل* الضلع المواجه لـ$\\theta$، و*المجاور* الضلع الملاصق، و*الوتر* أطول الأضلاع:"
      ),
    ],
    math: [
      "\\sin\\theta = \\frac{\\text{opp}}{\\text{hyp}} \\qquad \\cos\\theta = \\frac{\\text{adj}}{\\text{hyp}} \\qquad \\tan\\theta = \\frac{\\text{opp}}{\\text{adj}}",
      "\\text{height} = d \\cdot \\tan\\theta",
    ],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("How tall is the minaret?", "كم يبلغ ارتفاع المئذنة؟"),
    paras: [
      bi(
        "You stand **50 m** from the base of a minaret. Looking up at the top, the angle from the ground is **38°**. Your eyes are **1.6 m** above the ground.",
        "تقف على بُعد **٥٠ م** من قاعدة مئذنة. وحين تنظر إلى قمتها تكون الزاوية عن الأفق **٣٨°**. وارتفاع عينيك عن الأرض **١٫٦ م**."
      ),
      bi(
        "You know the *adjacent* side (50 m) and want the *opposite* — so use tangent: $\\tan 38° = \\frac{h}{50}$, giving $h = 50 \\times \\tan 38° \\approx 50 \\times 0.781 = 39.1$ m.",
        "أنت تعرف الضلع *المجاور* (٥٠ م) وتريد *المقابل* — فاستخدم الظل: $\\tan 38° = \\frac{h}{50}$، ومنه $h = 50 \\times \\tan 38° \\approx 50 \\times 0.781 = 39.1$ م."
      ),
      bi(
        "Don't forget your own height: the minaret is $39.1 + 1.6 \\approx \\mathbf{40.7}$ m. The most common mistake in this question isn't the trigonometry — it's leaving out the 1.6.",
        "ولا تنسَ طولك: ارتفاع المئذنة $39.1 + 1.6 \\approx \\mathbf{40.7}$ م. وأشهر خطأ في هذا السؤال ليس في حساب المثلثات، بل في نسيان الـ١٫٦."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "A ramp rises 1.2 m over a horizontal run of 8 m. Which ratio finds the angle — and roughly what is it? (Hint: you have opposite and adjacent.)",
        "منحدر يرتفع ١٫٢ م على امتداد أفقي ٨ م. أي نسبة تجد الزاوية — وكم تقريباً؟ (تلميح: لديك المقابل والمجاور.)"
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Same angle means same shape, so the side ratios are fixed — label opp, adj and hyp, pick the ratio holding your two sides, and an angle plus one length gives you the rest.",
        "الزاوية نفسها تعني الشكل نفسه، فتثبت نسب الأضلاع — سمِّ المقابل والمجاور والوتر، واختر النسبة التي تضمّ ضلعيك، فتمنحك زاوية وطول واحد كل ما تبقّى."
      ),
    ],
  },
];

// ---- Flagship: Physics · Year 8 · Resistance & Ohm's Law ----
const PHYSICS_8: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Three things, one relationship", "ثلاثة أشياء وعلاقة واحدة"),
    paras: [
      bi(
        "Think of water in a pipe. The **pressure** pushing it is *voltage*. The **amount flowing** past you each second is *current*. A **narrow section** that holds the flow back is *resistance*.",
        "تخيّل ماءً في أنبوب. **الضغط** الدافع هو *الجهد*، و**كمية التدفق** المارّة كل ثانية هي *التيار*، و**المقطع الضيّق** الذي يعيق التدفق هو *المقاومة*."
      ),
      bi(
        "Raise the pressure and more flows. Narrow the pipe and less flows. That's the whole of Ohm's Law — and it holds in the charger on your desk exactly as it does in a lab.",
        "ارفع الضغط يزدد التدفق، وضيّق الأنبوب يقلّ التدفق. هذا كل قانون أوم — ويصدق في الشاحن على مكتبك كما يصدق في المختبر."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("The water analogy, term by term", "تشبيه الماء، مصطلحاً مصطلحاً"),
    flow: [
      { text: bi("Voltage pushes", "الجهد يدفع"), tone: "force" },
      { text: bi("Resistance holds back", "المقاومة تعيق"), tone: "mass" },
      { text: bi("Current is what flows", "التيار هو المتدفّق"), tone: "accel" },
    ],
    table: {
      head: [bi("Quantity", "الكمية"), bi("Unit", "الوحدة"), bi("In the water pipe", "في أنبوب الماء")],
      rows: [
        [bi("Voltage (V)", "الجهد (V)"), bi("volt", "فولت"), bi("The pressure pushing", "الضغط الدافع")],
        [bi("Current (I)", "التيار (I)"), bi("amp", "أمبير"), bi("Litres flowing per second", "لترات تتدفق كل ثانية")],
        [bi("Resistance (R)", "المقاومة (R)"), bi("ohm (Ω)", "أوم (Ω)"), bi("How narrow the pipe is", "مدى ضيق الأنبوب")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Ohm's Law and its rearrangements", "قانون أوم وصيغه"),
    paras: [
      bi(
        "For a conductor at constant temperature, the current through it is **proportional to the voltage across it**. The constant of proportionality is its resistance:",
        "في موصل عند درجة حرارة ثابتة، يتناسب التيار المارّ فيه **طردياً مع الجهد بين طرفيه**، وثابت التناسب هو مقاومته:"
      ),
      bi(
        "Cover the one you want with your thumb and the other two show you the sum.",
        "غطِّ بإبهامك المجهول، فيُظهر لك الآخران العملية المطلوبة."
      ),
    ],
    math: ["V = IR", "I = \\frac{V}{R} \\qquad R = \\frac{V}{I}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Why the fan slows on a long cable", "لماذا يبطئ المروحة على كابل طويل"),
    paras: [
      bi(
        "A small desk fan is marked **12 V** and draws **0.5 A** when it runs properly. Its resistance is $R = \\frac{V}{I} = \\frac{12}{0.5} = 24\\ \\Omega$.",
        "مروحة مكتب صغيرة مكتوب عليها **١٢ فولت** وتسحب **٠٫٥ أمبير** عند تشغيلها بشكل صحيح. فمقاومتها $R = \\frac{V}{I} = \\frac{12}{0.5} = 24\\ \\Omega$."
      ),
      bi(
        "Now you run it down the garden on a long thin cable that adds $6\\ \\Omega$ of its own. Total resistance becomes $24 + 6 = 30\\ \\Omega$, so the current drops to $I = \\frac{12}{30} = 0.4$ A.",
        "والآن تشغّلها في الحديقة عبر كابل طويل رفيع يضيف $6\\ \\Omega$. فتصير المقاومة الكلية $24 + 6 = 30\\ \\Omega$، وينخفض التيار إلى $I = \\frac{12}{30} = 0.4$ أمبير."
      ),
      bi(
        "Less current, slower fan — and the missing energy is heating the cable instead. That's exactly why thick cables are used for heavy appliances.",
        "تيار أقل يعني مروحة أبطأ — والطاقة المفقودة تُسخّن الكابل بدلاً من ذلك. ولهذا تُستخدم الكابلات السميكة للأجهزة الثقيلة."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "A lamp carries 0.25 A when connected to a 6 V battery. What is its resistance? And if you swapped in a 3 V battery, would the current be higher or lower?",
        "مصباح يمرّ فيه ٠٫٢٥ أمبير عند وصله ببطارية ٦ فولت. ما مقاومته؟ ولو استبدلتها ببطارية ٣ فولت، أيكون التيار أعلى أم أقل؟"
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Voltage pushes, resistance holds back, current is what actually flows — and $V = IR$ lets you find any one of the three from the other two.",
        "الجهد يدفع، والمقاومة تعيق، والتيار هو المتدفّق فعلاً — و$V = IR$ يمنحك أيّاً من الثلاثة من الاثنين الآخرين."
      ),
    ],
  },
];

// ---- Flagship: Geography · Year 7 · Resources & Economy ----
const GEOGRAPHY_7: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("A resource is only worth what it can become", "المورد لا يساوي إلا ما يمكن أن يصير إليه"),
    paras: [
      bi(
        "Oil sat under this region for millions of years and was worth nothing — until engines were invented that wanted it. A resource has no value on its own; value appears when someone needs it and can reach it.",
        "رقد النفط تحت هذه المنطقة ملايين السنين ولم يكن يساوي شيئاً — حتى اختُرعت محرّكات تطلبه. فالمورد لا قيمة له بذاته؛ وإنما تظهر القيمة حين يحتاجه أحد ويستطيع بلوغه."
      ),
      bi(
        "That cuts both ways. What one invention makes precious, another can make ordinary — so a country earning from a single resource is holding a rope it doesn't control the other end of.",
        "وهذا سيف ذو حدّين. فما يجعله اختراعٌ ثميناً قد يجعله آخر عادياً — والبلد الذي يكسب من مورد واحد يمسك حبلاً لا يملك طرفه الآخر."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("From under the ground to a steady income", "من باطن الأرض إلى دخل ثابت"),
    flow: [
      { text: bi("Extract the resource", "استخرج المورد"), tone: "force" },
      { text: bi("Add value here, not abroad", "أضف القيمة هنا لا في الخارج"), tone: "mass" },
      { text: bi("Earn from many sources", "اكسب من مصادر متعدّدة"), tone: "accel" },
    ],
    table: {
      head: [bi("Resource", "المورد"), bi("Renewable?", "متجدّد؟"), bi("What limits it", "ما الذي يحدّه")],
      rows: [
        [bi("Oil & gas", "النفط والغاز"), bi("No", "لا"), bi("Runs out; price set elsewhere", "ينفد؛ وسعره يُحدَّد في الخارج")],
        [bi("Groundwater", "المياه الجوفية"), bi("Very slowly", "ببطء شديد"), bi("Refills over centuries, not years", "يتجدّد عبر قرون لا سنوات")],
        [bi("Sunlight", "ضوء الشمس"), bi("Yes", "نعم"), bi("Needs land, panels and storage", "يحتاج أرضاً وألواحاً وتخزيناً")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Measuring diversification", "قياس التنويع"),
    paras: [
      bi(
        "**Diversification** is earning from many sources rather than one. Geographers measure it as the share of a country's total output (GDP) that comes from a given sector:",
        "**التنويع** هو الكسب من مصادر متعدّدة لا من واحد. ويقيسه الجغرافيون بنسبة ما يأتي من قطاع معيّن من إجمالي ناتج البلد:"
      ),
      bi(
        "A falling oil share is the headline number every Gulf economic plan is aiming at.",
        "وانخفاض نسبة النفط هو الرقم الذي تستهدفه كل خطة اقتصادية خليجية."
      ),
    ],
    math: ["\\text{share} = \\frac{\\text{sector output}}{\\text{total GDP}} \\times 100\\%"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Reading a country's diversification", "قراءة تنويع بلد"),
    paras: [
      bi(
        "Take an imaginary Gulf state. Total output is **400 billion** this year, of which **160 billion** comes from oil. The oil share is $\\frac{160}{400} \\times 100\\% = 40\\%$ — so 60% is already non-oil.",
        "خذ دولة خليجية متخيّلة. إجمالي الناتج هذا العام **٤٠٠ مليار**، منها **١٦٠ مليار** من النفط. فنسبة النفط $\\frac{160}{400} \\times 100\\% = 40\\%$ — أي أن ٦٠٪ صارت غير نفطية."
      ),
      bi(
        "Ten years on, oil income is unchanged at 160 but the rest has grown, taking total output to **640**. New oil share: $\\frac{160}{640} \\times 100\\% = 25\\%$.",
        "وبعد عشر سنوات، بقي دخل النفط ١٦٠ كما هو لكن نما ما سواه فبلغ الإجمالي **٦٤٠**. فالنسبة الجديدة: $\\frac{160}{640} \\times 100\\% = 25\\%$."
      ),
      bi(
        "Notice what happened: **the country diversified without pumping one barrel less**. Diversification is usually growing everything else, not shrinking the resource.",
        "لاحظ ما جرى: **تنوّع البلد دون أن يضخّ برميلاً واحداً أقلّ**. فالتنويع غالباً تنمية كل ما عدا المورد، لا تقليص المورد."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "A country's total output is 250 billion, with 75 billion from tourism. What share is tourism? And name one reason a trade route can matter more to an economy than a mine.",
        "إجمالي ناتج بلد ٢٥٠ ملياراً، منها ٧٥ ملياراً من السياحة. ما نسبة السياحة؟ وسمِّ سبباً واحداً يجعل طريق تجارة أهمّ لاقتصاد من منجم."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "A resource is worth only what someone needs it for — so measure the share each sector earns, and grow the others rather than waiting on one price.",
        "لا يساوي المورد إلا ما يحتاجه أحد لأجله — فقِس نسبة ما يكسبه كل قطاع، وأنمِ سواه بدل انتظار سعر واحد."
      ),
    ],
  },
];

const FLAGSHIPS: Record<string, NoteCard[]> = {
  "geography-7": GEOGRAPHY_7,
  "physics-8": PHYSICS_8,
  "math-9": MATH_9,
  "gaming-4": GAMING_4,
  "leadership-6": LEADERSHIP_6,
  "languages-3": LANGUAGES_3,
  "problem-solving-7": PROBLEM_SOLVING_7,
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
