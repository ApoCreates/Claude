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

// ---- Flagship: AI · Year 8 · Building AI Projects ----
const AI_8: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Most AI projects fail before any code", "معظم مشاريع الذكاء الاصطناعي تفشل قبل أي كود"),
    paras: [
      bi(
        "‘An app that helps students’ can never be finished — there's no moment where you know you're done. ‘Tells me which of my messages still need a reply today’ can be built this week and checked tomorrow.",
        "«تطبيق يساعد الطلاب» لا يمكن إتمامه أبداً — إذ لا لحظة تعرف فيها أنك انتهيت. أما «يخبرني أي رسائلي ما تزال تحتاج رداً اليوم» فيمكن بناؤه هذا الأسبوع والتحقق منه غداً."
      ),
      bi(
        "So scope first: **one user, one decision, one measure of success**. Only then ask what data that decision needs — the order matters, because data chosen before the question always fits the wrong question.",
        "فابدأ بالنطاق: **مستخدم واحد، وقرار واحد، ومقياس نجاح واحد**. ثم اسأل بعدها أي بيانات يحتاجها ذلك القرار — والترتيب مهم، لأن بيانات تُختار قبل السؤال تناسب دائماً سؤالاً آخر."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Idea to shipped demo", "من الفكرة إلى نموذج منشور"),
    flow: [
      { text: bi("Scope one decision", "حدّد قراراً واحداً"), tone: "force" },
      { text: bi("Get honest data", "احصل على بيانات صادقة"), tone: "mass" },
      { text: bi("Ship, then measure", "أطلِق ثم قِس"), tone: "accel" },
    ],
    table: {
      head: [bi("Vague project", "مشروع غامض"), bi("Scoped project", "مشروع محدّد"), bi("What made it buildable", "ما الذي جعله قابلاً للبناء")],
      rows: [
        [bi("‘AI for my school’", "«ذكاء اصطناعي لمدرستي»"), bi("‘Sorts lost-property photos into 6 bins’", "«يصنّف صور المفقودات إلى ٦ فئات»"), bi("One decision, countable", "قرار واحد قابل للعدّ")],
        [bi("‘Understands Arabic’", "«يفهم العربية»"), bi("‘Tags 200 school notices as urgent or not’", "«يصنّف ٢٠٠ إعلان مدرسي عاجل أو لا»"), bi("A fixed set you can label", "مجموعة محدّدة يمكن وسمها")],
        [bi("‘Better than a human’", "«أفضل من إنسان»"), bi("‘Beats always-guessing-the-common-answer’", "«يتفوّق على تخمين الإجابة الأشيع»"), bi("A baseline to beat", "خط أساس تتفوّق عليه")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Accuracy, and the baseline it must beat", "الدقة وخط الأساس الذي عليها تجاوزه"),
    paras: [
      bi(
        "**Accuracy** is the share of predictions that were right. The **baseline** is what you'd score by always answering with the commonest class — a number your model must beat to have done anything at all.",
        "**الدقة** نسبة التنبؤات الصحيحة. و**خط الأساس** ما ستحرزه لو أجبت دائماً بالفئة الأشيع — وهو رقم على نموذجك تجاوزه ليكون قد صنع شيئاً أصلاً."
      ),
    ],
    math: [
      "\\text{accuracy} = \\frac{\\text{correct}}{\\text{total}}",
      "\\text{recall} = \\frac{\\text{caught}}{\\text{all that mattered}}",
    ],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("The 92% that was worse than nothing", "الـ٩٢٪ التي كانت أسوأ من لا شيء"),
    paras: [
      bi(
        "You build a spam filter and test it on **200 messages**, of which **180 are fine** and **20 are spam**. Your model scores $\\frac{184}{200} = 92\\%$ accuracy. Sounds strong.",
        "تبني مرشّح رسائل مزعجة وتختبره على **٢٠٠ رسالة**، منها **١٨٠ سليمة** و**٢٠ مزعجة**. ويحرز نموذجك دقة $\\frac{184}{200} = 92\\%$. يبدو قوياً."
      ),
      bi(
        "Now the baseline: a filter that simply says ‘never spam’ scores $\\frac{180}{200} = 90\\%$ without looking at anything. Your model bought you **2 points**.",
        "والآن خط الأساس: مرشّح يقول «ليست مزعجة أبداً» يحرز $\\frac{180}{200} = 90\\%$ دون أن ينظر إلى شيء. فنموذجك كسب **نقطتين** فقط."
      ),
      bi(
        "Ask the question that matters instead: of the 20 real spam messages, how many did it catch? If the answer is 4, recall is $\\frac{4}{20} = 20\\%$ — the filter misses four out of five. **Accuracy hid the failure; recall showed it.**",
        "فاسأل السؤال المهم بدلاً من ذلك: من الرسائل المزعجة العشرين، كم أمسك؟ إن كان الجواب ٤، فالاستدعاء $\\frac{4}{20} = 20\\%$ — أي يفوته أربعة من كل خمسة. **أخفت الدقةُ الفشل، وأظهره الاستدعاء.**"
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "In a set of 500 photos, 450 show no cat. What accuracy does ‘there is never a cat’ score? And rewrite ‘an AI that helps my family’ as one user, one decision, one measure.",
        "في مجموعة من ٥٠٠ صورة، ٤٥٠ منها بلا قطّة. ما دقّة «لا توجد قطّة أبداً»؟ وأعد صياغة «ذكاء اصطناعي يساعد عائلتي» بمستخدم واحد وقرار واحد ومقياس واحد."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Scope to one user, one decision and one measure, then judge the result against the baseline — a high accuracy that a coin-flip rule could match has told you nothing.",
        "حدّد النطاق بمستخدم واحد وقرار واحد ومقياس واحد، ثم احكم على النتيجة مقارنةً بخط الأساس — فدقّةٌ عالية تبلغها قاعدةٌ ساذجة لم تخبرك بشيء."
      ),
    ],
  },
];

// ---- Flagship: Languages · Year 6 · Reading for Meaning ----
const LANGUAGES_6: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Stop looking up every word", "كُفَّ عن البحث عن كل كلمة"),
    paras: [
      bi(
        "A dictionary lookup costs you about ten seconds and, worse, it drops the thread of the story. Do it every line and you are no longer reading — you are decoding, and decoding is exhausting enough that most learners quit the book.",
        "يكلّفك البحث في المعجم نحو عشر ثوانٍ، والأسوأ أنه يقطع خيط الحكاية. وإن فعلته كل سطر لم تعد تقرأ، بل تفكّ رموزاً — وفكّ الرموز مرهق حتى ليترك معظم المتعلّمين الكتاب."
      ),
      bi(
        "The skill of this year is **reading through** an unknown word: use the sentence around it, the shape of the word, and what the story already told you. You will be right often enough — and the book stays alive.",
        "ومهارة هذا العام أن **تقرأ متجاوزاً** الكلمة المجهولة: استعن بالجملة حولها، وبنية الكلمة، وما أخبرتك به الحكاية سلفاً. وستصيب في الغالب — ويبقى الكتاب حيّاً."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Three ways to read, chosen on purpose", "ثلاث طرق للقراءة تُختار عن قصد"),
    flow: [
      { text: bi("Skim for the shape", "اقرأ سريعاً للهيكل"), tone: "force" },
      { text: bi("Scan for one fact", "امسح بحثاً عن معلومة"), tone: "mass" },
      { text: bi("Read closely for meaning", "اقرأ متأنياً للفهم"), tone: "accel" },
    ],
    table: {
      head: [bi("You want…", "تريد…"), bi("Do this", "افعل هذا"), bi("Speed", "السرعة")],
      rows: [
        [bi("The gist of an article", "فكرة المقال العامة"), bi("Read titles, first lines, last line", "اقرأ العناوين والأسطر الأولى والأخير"), bi("Very fast", "سريع جداً")],
        [bi("One date or name", "تاريخ أو اسم واحد"), bi("Sweep for the shape of it, ignore the rest", "امسح بحثاً عن شكله وتجاهل الباقي"), bi("Fast", "سريع")],
        [bi("To follow a story", "متابعة حكاية"), bi("Read on; guess unknown words from context", "واصل القراءة وخمّن المجهول من السياق"), bi("Steady", "متزن")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Coverage — why the right book matters more than effort", "التغطية — لماذا الكتاب المناسب أهم من الجهد"),
    paras: [
      bi(
        "**Coverage** is the share of words on a page you already know. Reading researchers find that comfortable independent reading needs roughly **98%** coverage; below about 95%, comprehension falls away fast no matter how hard you try.",
        "**التغطية** نسبة الكلمات التي تعرفها سلفاً في الصفحة. ويجد باحثو القراءة أن القراءة المستقلة المريحة تحتاج نحو **٩٨٪** تغطية؛ وتحت ٩٥٪ تقريباً ينهار الفهم بسرعة مهما اجتهدت."
      ),
      bi(
        "So you can count, before you commit to a book, how often it will stop you:",
        "فتستطيع أن تحسب، قبل أن تلتزم بكتاب، كم مرّة سيوقفك:"
      ),
    ],
    math: ["\\text{unknown words per page} = \\text{words per page} \\times (1 - \\text{coverage})"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Choosing between two books", "الاختيار بين كتابين"),
    paras: [
      bi(
        "A page holds about **250 words**. In a graded reader you know 98% of them: $250 \\times 0.02 = \\mathbf{5}$ unknown words per page — one every fifty words, easy to ride past.",
        "تحمل الصفحة نحو **٢٥٠ كلمة**. وفي قراءة متدرّجة تعرف ٩٨٪ منها: $250 \\times 0.02 = \\mathbf{5}$ كلمات مجهولة في الصفحة — واحدة كل خمسين كلمة، يسهل تجاوزها."
      ),
      bi(
        "In the novel you *wish* you could read, you know 90%: $250 \\times 0.10 = \\mathbf{25}$ unknown words per page — one every ten words. That's roughly **four minutes of lookups per page**, and the story dies.",
        "وفي الرواية التي *تتمنّى* قراءتها تعرف ٩٠٪: $250 \\times 0.10 = \\mathbf{25}$ كلمة مجهولة في الصفحة — واحدة كل عشر كلمات. أي نحو **أربع دقائق بحث لكل صفحة**، فتموت الحكاية."
      ),
      bi(
        "The lesson isn't that the novel is too hard forever. Read the easy books now: each one lifts your coverage, and the novel quietly becomes a 98% book.",
        "والدرس ليس أن الرواية عصيّة إلى الأبد. اقرأ الكتب السهلة الآن: فكلٌّ منها يرفع تغطيتك، وتصير الرواية بهدوء كتاب ٩٨٪."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "A page has 300 words and you know 95% of them. How many will stop you? And which reading mode would you use to find a train departure time on a timetable?",
        "صفحة فيها ٣٠٠ كلمة وتعرف ٩٥٪ منها. كم كلمة ستوقفك؟ وأي طريقة قراءة تستخدم لتجد موعد مغادرة قطار في جدول؟"
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Guess from context instead of stopping, choose books where you already know about 98% of the words, and pick your reading mode — skim, scan or read — on purpose.",
        "خمّن من السياق بدل التوقّف، واختر كتباً تعرف نحو ٩٨٪ من كلماتها، واختر طريقة قراءتك — سريعة أو ماسحة أو متأنية — عن قصد."
      ),
    ],
  },
];

// ---- Flagship: Emotional Intelligence · Year 6 · Stress & Resilience ----
const EQ_6: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Stress isn't the enemy — never switching it off is", "التوتر ليس العدو، بل ألا ينطفئ أبداً"),
    paras: [
      bi(
        "Before an exam your heart speeds up, your hands go cold, your stomach tightens. That isn't you failing — it's your body **preparing**: pushing blood to the muscles and sharpening attention for something that matters.",
        "قبل الامتحان يتسارع قلبك، وتبرد يداك، وتنقبض معدتك. ليس هذا فشلاً منك، بل جسدك **يستعدّ**: يدفع الدم إلى العضلات ويشحذ الانتباه لأمر يهمّك."
      ),
      bi(
        "Short bursts of that are useful — they sharpen you. The damage comes when the switch never flips back: weeks of alertness with no recovery, which is when sleep, mood and memory all start to slip.",
        "ونوبات قصيرة منه نافعة تشحذك. أما الضرر فحين لا يعود المفتاح إلى وضعه: أسابيع من التأهّب دون تعافٍ، وعندها يبدأ النوم والمزاج والذاكرة بالانزلاق."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("What the signal is asking for", "ما الذي تطلبه الإشارة"),
    flow: [
      { text: bi("Notice the body signal", "لاحِظ إشارة الجسد"), tone: "force" },
      { text: bi("Name the worry out loud", "سمِّ القلق بصوت مسموع"), tone: "mass" },
      { text: bi("Do the one next thing", "افعل الخطوة التالية الواحدة"), tone: "accel" },
    ],
    table: {
      head: [bi("What you feel", "ما تشعر به"), bi("What it usually means", "ما يعنيه عادةً"), bi("What actually helps", "ما ينفع فعلاً")],
      rows: [
        [bi("Racing heart before a test", "خفقان قبل اختبار"), bi("Readiness, not danger", "استعداد لا خطر"), bi("Slow breathing out, longer than in", "زفير بطيء أطول من الشهيق")],
        [bi("Can't start the work", "لا تستطيع البدء"), bi("The task is too big to picture", "المهمة أكبر من أن تُتخيّل"), bi("Shrink it to ten minutes", "قلّصها إلى عشر دقائق")],
        [bi("Awake at 1 a.m., mind looping", "مستيقظ في الواحدة والعقل يدور"), bi("Unfinished worry with nowhere to go", "قلق معلّق بلا مخرج"), bi("Write it down; it stops circling", "اكتبه، فيكفّ عن الدوران")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Sleep debt — the cost you can't see", "دَين النوم — الكلفة التي لا تراها"),
    paras: [
      bi(
        "**Resilience** is not feeling less; it's recovering faster. Recovery runs mostly on sleep, and teenagers need roughly **8–10 hours**. Missing an hour a night doesn't stay one hour — it accumulates:",
        "**المرونة** ليست أن تشعر أقلّ، بل أن تتعافى أسرع. والتعافي يقوم أساساً على النوم، ويحتاج المراهقون نحو **٨–١٠ ساعات**. وساعة ناقصة كل ليلة لا تبقى ساعة واحدة، بل تتراكم:"
      ),
    ],
    math: ["\\text{sleep debt} = (\\text{hours needed} - \\text{hours slept}) \\times \\text{nights}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("The weekend lie-in that doesn't work", "نومة نهاية الأسبوع التي لا تكفي"),
    paras: [
      bi(
        "You need **9 hours** but get **6.5** on school nights — phone at midnight, alarm at 6:30. Over five nights: $(9 - 6.5) \\times 5 = \\mathbf{12.5}$ hours of debt by Friday.",
        "تحتاج **٩ ساعات** لكنك تنام **٦٫٥** في ليالي الدراسة — الهاتف حتى منتصف الليل والمنبّه السادسة والنصف. وعلى خمس ليالٍ: $(9 - 6.5) \\times 5 = \\mathbf{12.5}$ ساعة دَيناً بحلول الجمعة."
      ),
      bi(
        "You sleep in three extra hours each weekend day — 6 hours back. That still leaves **6.5 hours short**, and Monday starts already behind. Sleeping late also shifts your body clock, so Sunday night you can't fall asleep at all.",
        "وتنام ثلاث ساعات إضافية في كلٍّ من يومي العطلة — أي ٦ ساعات مستردّة. ويبقى **نقص ٦٫٥ ساعة**، ويبدأ الاثنين وأنت متأخّر سلفاً. والنوم المتأخّر يزيح ساعتك البيولوجية أيضاً، فلا تستطيع النوم ليلة الأحد إطلاقاً."
      ),
      bi(
        "Shifting bedtime **30 minutes earlier** on five nights returns 2.5 hours a week and costs almost nothing. Small and repeated beats heroic and occasional — that's the whole shape of resilience.",
        "وتقديم موعد النوم **نصف ساعة** في خمس ليالٍ يعيد ٢٫٥ ساعة أسبوعياً بكلفة تكاد تكون معدومة. فالصغير المتكرّر يتفوّق على البطولي العارض — وهذا شكل المرونة كلّه."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "If you need 9 hours and sleep 7 across six nights, what's the debt? And name one body signal you get before something important — and what it's actually asking for.",
        "إن كنت تحتاج ٩ ساعات وتنام ٧ على ست ليالٍ، فكم الدَّين؟ وسمِّ إشارة جسدية تأتيك قبل أمر مهم — وما الذي تطلبه فعلاً."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Stress is preparation, not failure — the harm is in never recovering, so protect sleep in small repeatable amounts and shrink what feels too big to start.",
        "التوتر استعداد لا فشل — والضرر في انعدام التعافي، فاحمِ نومك بمقادير صغيرة متكرّرة، وقلّص ما يبدو أكبر من أن تبدأه."
      ),
    ],
  },
];

// ---- Flagship: Entrepreneurship · Year 8 · Pitching & Storytelling ----
const ENTREPRENEURSHIP_8: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Nobody buys a product; they buy a changed situation", "لا أحد يشتري منتجاً، بل يشتري وضعاً تغيّر"),
    paras: [
      bi(
        "A weak pitch describes what you built. A strong one describes **someone's day before and after**: right now Salma queues twenty minutes for a bus that may not come; with this, her phone tells her to leave at 7:14.",
        "العرض الضعيف يصف ما بنيتَه. أما القوي فيصف **يوم إنسان قبل وبعد**: سلمى الآن تنتظر عشرين دقيقة حافلةً قد لا تأتي؛ ومع هذا يخبرها هاتفها أن تخرج في السابعة و١٤ دقيقة."
      ),
      bi(
        "Then comes the part beginners skip: **proof**. Not ‘people will love it', but what actually happened when real people tried it — how many, how often, what they said. A story without evidence is a wish.",
        "ثم يأتي ما يتخطّاه المبتدئون: **الدليل**. لا «سيحبّه الناس»، بل ما حدث فعلاً حين جرّبه أناس حقيقيون — كم عددهم، وكم مرّة، وماذا قالوا. فالقصة بلا دليل أمنية."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("What the hard question is really asking", "ما الذي يسأل عنه السؤال الصعب فعلاً"),
    flow: [
      { text: bi("Whose problem, exactly", "مشكلة مَن بالتحديد"), tone: "force" },
      { text: bi("What changes for them", "ما الذي يتغيّر لهم"), tone: "mass" },
      { text: bi("Proof it already worked", "دليل أنه نجح فعلاً"), tone: "accel" },
    ],
    table: {
      head: [bi("They ask", "يسألون"), bi("They mean", "يقصدون"), bi("Answer with", "أجب بـ")],
      rows: [
        [bi("‘How big is the market?'", "«كم حجم السوق؟»"), bi("Can you actually reach anyone?", "أتستطيع الوصول إلى أحد فعلاً؟"), bi("Your reachable number, not the population", "عددك القابل للوصول لا عدد السكان")],
        [bi("‘What if someone copies you?'", "«ماذا لو نسخك أحد؟»"), bi("What do you have that they don't?", "ماذا تملك ولا يملكون؟"), bi("A head start you can name", "سبقٌ تستطيع تسميته")],
        [bi("‘Why hasn't this been done?'", "«لماذا لم يُفعل هذا؟»"), bi("Do you know your own field?", "أتعرف مجالك؟"), bi("Who tried, and what changed since", "من حاول، وما الذي تغيّر منذ ذلك")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("The reachable number", "العدد القابل للوصول"),
    paras: [
      bi(
        "The fastest way to lose a room is to open with ‘there are two billion people who…'. Nobody sells to a population. What matters is how many you can **reach** and how many of those will **act**:",
        "أسرع طريقة لخسارة القاعة أن تبدأ بـ«هناك ملياران من الناس…». فلا أحد يبيع لسكّان. والمهم كم تستطيع **الوصول** إليهم وكم منهم **سيتحرّك**:"
      ),
      bi(
        "Small and defensible beats large and imaginary — a judge trusts 250 real customers over two billion theoretical ones.",
        "والصغير القابل للدفاع عنه يتفوّق على الكبير المتخيَّل — فالمحكّم يثق بـ٢٥٠ عميلاً حقيقياً أكثر من ملياري عميل نظري."
      ),
    ],
    math: ["\\text{customers} = \\text{market} \\times \\text{reach} \\times \\text{conversion}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Two ways to answer ‘how big is this?'", "طريقتان للإجابة عن «كم حجم هذا؟»"),
    paras: [
      bi(
        "Your city has **50,000 students**. Through school groups and two teachers who like the idea, you can realistically reach **10%** of them — 5,000. Of those who see it, about **5%** sign up.",
        "في مدينتك **٥٠٬٠٠٠ طالب**. وعبر مجموعات المدارس ومعلّمَين أعجبتهما الفكرة تستطيع واقعياً الوصول إلى **١٠٪** منهم — أي ٥٬٠٠٠. ومن يراها يشترك منهم نحو **٥٪**."
      ),
      bi(
        "$50{,}000 \\times 0.10 \\times 0.05 = \\mathbf{250}$ customers in year one. At 15 AED a month that's $250 \\times 15 = 3{,}750$ AED monthly — a real, checkable number.",
        "$50{,}000 \\times 0.10 \\times 0.05 = \\mathbf{250}$ عميل في السنة الأولى. وبـ١٥ درهماً شهرياً يكون $250 \\times 15 = 3{,}750$ درهماً شهرياً — رقم حقيقي قابل للتحقّق."
      ),
      bi(
        "Say that instead of ‘the education market is worth billions'. The second sentence tells the room you've never spoken to a customer; the first tells them exactly which 250 doors you'll knock on.",
        "قل هذا بدل «سوق التعليم يساوي المليارات». فالجملة الثانية تخبر القاعة أنك لم تكلّم عميلاً قط، والأولى تخبرهم أي ٢٥٠ باباً ستطرق."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "A neighbourhood has 8,000 households; you can reach 25% and 4% would buy. How many customers? And rewrite ‘my app is easy to use' as a before-and-after for one named person.",
        "حيّ فيه ٨٬٠٠٠ أسرة؛ تصل إلى ٢٥٪ ويشتري ٤٪. كم عميلاً؟ وأعد صياغة «تطبيقي سهل الاستخدام» في صورة قبل وبعد لشخص واحد باسمه."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Tell one person's before-and-after, back it with what really happened when people tried it, and quote the number you can reach — never the population.",
        "احكِ «قبل وبعد» لشخص واحد، وادعمها بما حدث فعلاً حين جرّبها الناس، واذكر العدد الذي تستطيع بلوغه — لا عدد السكان."
      ),
    ],
  },
];

// ---- Flagship: Problem Solving · Year 3 · Step by Step ----
const PROBLEM_SOLVING_3: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Big problems are small problems hiding together", "المشكلات الكبيرة مشكلات صغيرة مختبئة معاً"),
    paras: [
      bi(
        "‘Tidy the whole classroom' sounds impossible, so nobody starts. But look closer: it's really *put the books on the shelf*, then *chairs under the desks*, then *pencils in the box*. Each of those is easy.",
        "«رتّب الصف كلّه» تبدو مستحيلة فلا يبدأ أحد. لكن انظر عن قرب: هي في الحقيقة *ضع الكتب على الرفّ*، ثم *الكراسي تحت الطاولات*، ثم *الأقلام في العلبة*. وكلٌّ منها سهل."
      ),
      bi(
        "That's the trick called **breaking it down**. A big problem is scary because you can't picture the end. Small pieces aren't scary, because you can see yourself finishing each one.",
        "هذه الحيلة اسمها **التفكيك**. المشكلة الكبيرة مخيفة لأنك لا تتخيّل نهايتها. أما القطع الصغيرة فليست مخيفة، لأنك ترى نفسك تُنهي كلّاً منها."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Three steps that work on everything", "ثلاث خطوات تصلح لكل شيء"),
    flow: [
      { text: bi("Split it into pieces", "قسّمها إلى قطع"), tone: "force" },
      { text: bi("Put them in order", "رتّبها"), tone: "mass" },
      { text: bi("Tick each one off", "ضع علامة على كل واحدة"), tone: "accel" },
    ],
    table: {
      head: [bi("Sounds too big", "تبدو أكبر من اللازم"), bi("Really it's…", "وهي في الحقيقة…"), bi("First tiny step", "أول خطوة صغيرة")],
      rows: [
        [bi("‘Write a story'", "«اكتب قصة»"), bi("Who? Where? What goes wrong?", "من؟ أين؟ ما الذي يسوء؟"), bi("Name one character", "سمِّ شخصية واحدة")],
        [bi("‘Learn the times tables'", "«احفظ جداول الضرب»"), bi("Twelve small tables, not one big one", "اثنا عشر جدولاً صغيراً لا جدول كبير"), bi("Do the 2s today", "ابدأ بجدول ٢ اليوم")],
        [bi("‘Clean my room'", "«نظّف غرفتي»"), bi("Clothes, then books, then floor", "الملابس ثم الكتب ثم الأرض"), bi("Pick up the clothes", "اجمع الملابس")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Sharing a job out", "توزيع العمل"),
    paras: [
      bi(
        "**Breaking down** means turning one big job into a list of small jobs you can finish. When the job repeats — pages, boxes, questions — you can work out today's piece by dividing:",
        "**التفكيك** أن تحوّل عملاً كبيراً إلى قائمة أعمال صغيرة تستطيع إنهاءها. وحين يتكرّر العمل — صفحات أو صناديق أو أسئلة — تعرف نصيب اليوم بالقسمة:"
      ),
    ],
    math: ["\\text{each day} = \\frac{\\text{whole job}}{\\text{days you have}}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("A 60-page book before Sunday", "كتاب من ٦٠ صفحة قبل الأحد"),
    paras: [
      bi(
        "Your teacher gives you a **60-page** book to finish in **5 days**. Sixty pages feels enormous. Divide it: $\\frac{60}{5} = \\mathbf{12}$ pages a day.",
        "أعطاك معلّمك كتاباً من **٦٠ صفحة** لتنهيه في **٥ أيام**. ستّون صفحة تبدو هائلة. اقسمها: $\\frac{60}{5} = \\mathbf{12}$ صفحة في اليوم."
      ),
      bi(
        "Twelve pages is about fifteen minutes — smaller than one football match. The book didn't shrink; you just stopped carrying all of it at once.",
        "واثنتا عشرة صفحة نحو خمس عشرة دقيقة — أقصر من مباراة كرة. لم يصغر الكتاب، لكنك كففت عن حمله كلّه دفعةً واحدة."
      ),
      bi(
        "And if you miss a day? Don't panic — just divide what's left again: 48 pages in 4 days is still 12 a day.",
        "وإن فاتك يوم؟ لا تفزع — أعد قسمة ما بقي: ٤٨ صفحة في ٤ أيام تبقى ١٢ في اليوم."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "You must learn 24 new words in 6 days. How many each day? And break ‘make a poster about camels' into three small steps.",
        "عليك تعلّم ٢٤ كلمة جديدة في ٦ أيام. كم كلمة في اليوم؟ وفكِّك «اصنع ملصقاً عن الإبل» إلى ثلاث خطوات صغيرة."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Split the big job into small ones, put them in order, and finish one at a time — dividing tells you exactly how much today's piece is.",
        "قسّم العمل الكبير إلى أعمال صغيرة، ورتّبها، وأنهِ واحدة في كل مرّة — والقسمة تخبرك بالضبط كم نصيب اليوم."
      ),
    ],
  },
];

// ---- Flagship: Gaming · Year 8 · Scripting & Logic ----
const GAMING_8: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("The game doesn't know anything you didn't store", "لا تعرف اللعبة شيئاً لم تخزّنه أنت"),
    paras: [
      bi(
        "A game has no memory of its own. If the score is to survive from one frame to the next, *you* must keep it in a **variable** — a labelled box the game can change while it runs.",
        "لا ذاكرة للعبة من تلقاء نفسها. فإن أردت للنقاط أن تبقى من إطار إلى الذي يليه، فعليك *أنت* حفظها في **متغيّر** — صندوق مُعنوَن تستطيع اللعبة تغييره أثناء تشغيلها."
      ),
      bi(
        "Everything else is three moves on those boxes: **change** them (`score = score + 1`), **ask** about them (`if health <= 0`), and **repeat** something (`spawn one enemy every 2 seconds`). Every game you've played is those three, layered.",
        "وكل ما عدا ذلك ثلاث حركات على تلك الصناديق: **التغيير** (`score = score + 1`)، و**السؤال** (`if health <= 0`)، و**التكرار** (`ولّد عدواً كل ثانيتين`). وكل لعبة لعبتها هي هذه الثلاث متراكبة."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Reading a bug backwards from the symptom", "قراءة الخلل رجوعاً من العَرَض"),
    flow: [
      { text: bi("Store it in a variable", "خزّنه في متغيّر"), tone: "force" },
      { text: bi("Ask a condition", "اسأل شرطاً"), tone: "mass" },
      { text: bi("Repeat with a loop", "كرّر بحلقة"), tone: "accel" },
    ],
    table: {
      head: [bi("What you see", "ما تراه"), bi("Usual cause", "السبب المعتاد"), bi("Where to look", "أين تبحث")],
      rows: [
        [bi("Score jumps by 2, not 1", "النقاط تقفز ٢ لا ١"), bi("Two things add on the same touch", "شيئان يضيفان عند اللمسة نفسها"), bi("Both collision handlers", "معالِجا التصادم كلاهما")],
        [bi("A reward never appears", "المكافأة لا تظهر أبداً"), bi("An earlier condition catches it first", "شرط سابق يلتقطها أولاً"), bi("The order of your if-checks", "ترتيب شروطك")],
        [bi("Game freezes on start", "اللعبة تتجمّد عند البدء"), bi("A loop with no way out", "حلقة بلا مخرج"), bi("The loop's stop condition", "شرط توقّف الحلقة")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Balancing with numbers, not feelings", "الموازنة بالأرقام لا بالإحساس"),
    paras: [
      bi(
        "Once health and damage are variables, balance becomes arithmetic. The number of hits an enemy survives is its health divided by your damage, **rounded up** — because a final hit that only removes half the remaining health still kills it.",
        "متى صارت الصحة والضرر متغيّرات، صارت الموازنة حساباً. فعدد الضربات التي يصمدها العدو هو صحّته مقسومة على ضررك **مُقرَّباً للأعلى** — لأن ضربةً أخيرة تزيل نصف ما بقي تقتله أيضاً."
      ),
    ],
    math: [
      "\\text{hits} = \\left\\lceil \\frac{\\text{health}}{\\text{damage}} \\right\\rceil",
      "\\text{damage needed} = \\frac{\\text{health}}{\\text{hits you want}}",
    ],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Tuning a boss, then finding the bug", "ضبط زعيم ثم اكتشاف الخلل"),
    paras: [
      bi(
        "Your boss has **100 health**; the sword does **15**. Hits to kill: $\\lceil \\frac{100}{15} \\rceil = \\lceil 6.67 \\rceil = \\mathbf{7}$. Playtesters say the fight drags, and you want it over in **5**: $\\frac{100}{5} = \\mathbf{20}$ damage.",
        "زعيمك بـ**١٠٠ صحة**، والسيف يُحدث **١٥**. فعدد الضربات: $\\lceil \\frac{100}{15} \\rceil = \\lceil 6.67 \\rceil = \\mathbf{7}$. ويقول المختبرون إن النزال يطول، وتريده في **٥**: $\\frac{100}{5} = \\mathbf{20}$ ضرراً."
      ),
      bi(
        "You raise the damage — and now the victory screen never shows. Your code reads: `if health <= 20 → play hurt sound`, then `if health <= 0 → win`. At 20 damage the boss lands on exactly 0 and the *first* condition catches it.",
        "فترفع الضرر — ولا تظهر شاشة الفوز بعدها أبداً. إذ يقول كودك: `if health <= 20 → شغّل صوت الإصابة`، ثم `if health <= 0 → فوز`. وعند ضرر ٢٠ يهبط الزعيم إلى الصفر بالضبط فيلتقطه الشرط *الأول*."
      ),
      bi(
        "The fix isn't more code — it's **order**. Check the most specific condition first (`health <= 0`), then the general one. Nearly every ‘it just doesn't trigger' bug is a question asked in the wrong order.",
        "والعلاج ليس مزيداً من الكود بل **الترتيب**. افحص الشرط الأخصّ أولاً (`health <= 0`) ثم الأعمّ. فمعظم أخطاء «لا يعمل ببساطة» سؤالٌ طُرح بترتيب خاطئ."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "An enemy has 45 health and your arrow does 8. How many hits? And why would `if score > 100 → bronze` placed before `if score > 500 → gold` never award gold?",
        "عدوّ بصحة ٤٥ وسهمك يُحدث ٨. كم ضربة؟ ولماذا لا يمنح `if score > 100 → برونزية` الموضوع قبل `if score > 500 → ذهبية` ذهبيةً أبداً؟"
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Store what must survive in variables, ask the most specific question first, and balance with arithmetic — hits are health over damage, rounded up.",
        "خزّن ما يجب أن يبقى في متغيّرات، واسأل الشرط الأخصّ أولاً، ووازِن بالحساب — فالضربات هي الصحة على الضرر مُقرَّبةً للأعلى."
      ),
    ],
  },
];

// ---- Flagship: Leadership · Year 9 · Ethics & Service ----
const LEADERSHIP_9: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("The hard ones are right against right", "الصعبة منها حقٌّ في مواجهة حقّ"),
    paras: [
      bi(
        "Choosing between right and wrong is not a dilemma; it's just courage. The genuinely hard choices are **right against right**: staying loyal to a friend *and* telling the truth, being merciful *and* being fair, helping now *and* building for later.",
        "الاختيار بين الحق والباطل ليس معضلة، بل شجاعة فحسب. أما الخيارات الصعبة حقاً فهي **حقٌّ في مواجهة حقّ**: الوفاء لصديق *و*قول الصدق، والرحمة *و*العدل، والعون الآن *و*البناء للغد."
      ),
      bi(
        "When both sides are good, you cannot follow a rule — you weigh. Leaders are trusted not because they always pick correctly, but because they can **say out loud which good they sacrificed and why**.",
        "وحين يكون الطرفان خيراً فلا قاعدة تتبعها، بل تُوازن. ويُوثَق بالقادة لا لأنهم يصيبون دائماً، بل لأنهم **يقولون جهراً أي خيرٍ ضحّوا به ولماذا**."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Three tests before you decide", "ثلاثة اختبارات قبل أن تقرّر"),
    flow: [
      { text: bi("Name both goods", "سمِّ الخيرين"), tone: "force" },
      { text: bi("Run the three tests", "أجرِ الاختبارات الثلاثة"), tone: "mass" },
      { text: bi("Decide, and say why", "قرّر، وقل السبب"), tone: "accel" },
    ],
    table: {
      head: [bi("Test", "الاختبار"), bi("The question", "السؤال"), bi("What it catches", "ما الذي يكشفه")],
      rows: [
        [bi("Daylight", "ضوء النهار"), bi("Would I be at ease if everyone knew?", "أأرتاح لو علم الجميع؟"), bi("Choices that need hiding", "خيارات تحتاج إخفاءً")],
        [bi("Swap places", "تبادل المواقع"), bi("Would I accept this from the other side?", "أأقبلها لو كنت في الطرف الآخر؟"), bi("Rules you apply only to others", "قواعد تطبّقها على غيرك فقط")],
        [bi("Ten years", "عشر سنوات"), bi("Who still benefits after I'm gone?", "من ينتفع بها بعد رحيلي؟"), bi("Wins that borrow from the future", "مكاسب تقترض من المستقبل")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Service, measured honestly", "الخدمة مقيسةً بصدق"),
    paras: [
      bi(
        "**Servant leadership** asks not what the group owes you but what it needs from you; its test is whether the people you led became more capable. Service projects deserve the same honesty — effort is not impact, so measure both:",
        "**القيادة الخادمة** لا تسأل ماذا تدين لك المجموعة بل ماذا تحتاج منك؛ واختبارها أن يصير من قدتَهم أقدر. ومشاريع الخدمة تستحق الصدق نفسه — فالجهد ليس أثراً، فقِس الاثنين:"
      ),
    ],
    math: [
      "\\text{volunteer-hours} = \\text{people} \\times \\text{hours each}",
      "\\text{impact per hour} = \\frac{\\text{result}}{\\text{volunteer-hours}}",
    ],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Two service projects, one Saturday", "مشروعا خدمة في سبتٍ واحد"),
    paras: [
      bi(
        "**Project A**: 30 students clean a beach for 3 hours. That's $30 \\times 3 = 90$ volunteer-hours, and they collect 180 bags — $\\frac{180}{90} = \\mathbf{2}$ bags per hour worked.",
        "**المشروع أ**: ثلاثون طالباً ينظّفون شاطئاً ٣ ساعات. أي $30 \\times 3 = 90$ ساعة تطوّع، ويجمعون ١٨٠ كيساً — $\\frac{180}{90} = \\mathbf{2}$ كيس لكل ساعة عمل."
      ),
      bi(
        "**Project B**: 6 students spend 5 hours ($6 \\times 5 = 30$ hours) building bins and a rota that keeps that beach clean every week. On the day it collects nothing.",
        "**المشروع ب**: ستة طلاب يقضون ٥ ساعات ($6 \\times 5 = 30$ ساعة) في صنع حاويات ووضع جدول مناوبات يُبقي الشاطئ نظيفاً كل أسبوع. وفي اليوم نفسه لا يجمع شيئاً."
      ),
      bi(
        "By the day's numbers A wins and B looks like a failure. Run the **ten-year test**: A's beach is dirty again by Friday; B's is still clean next year. Measure what you actually want — and beware the project that photographs well precisely because it changes nothing.",
        "بأرقام اليوم يفوز «أ» ويبدو «ب» فاشلاً. أجرِ **اختبار العشر سنوات**: شاطئ «أ» يعود متّسخاً بحلول الجمعة، وشاطئ «ب» يبقى نظيفاً العام المقبل. قِس ما تريده فعلاً — واحذر المشروع الذي يصلح للصورة تحديداً لأنه لا يغيّر شيئاً."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "12 volunteers work 4 hours and tutor 24 children. What's the impact per volunteer-hour? And name the two goods in conflict when a friend asks you to hide their mistake from the team.",
        "اثنا عشر متطوّعاً يعملون ٤ ساعات ويدرّسون ٢٤ طفلاً. ما الأثر لكل ساعة تطوّع؟ وسمِّ الخيرين المتعارضين حين يطلب صديق أن تخفي خطأه عن الفريق."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Real dilemmas pit one good against another — name both, test them in daylight, swapped places and ten years, then say which you chose and why.",
        "المعضلات الحقيقية تضع خيراً في مواجهة خير — فسمِّ الاثنين، واختبرهما في ضوء النهار، وبتبادل المواقع، وبعشر سنوات، ثم قل أيّهما اخترت ولماذا."
      ),
    ],
  },
];

// ---- Flagship: Math · Year 6 · Algebra Foundations ----
const MATH_6: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("A letter isn't a mystery — it's a placeholder", "الحرف ليس لغزاً بل موضعٌ محجوز"),
    paras: [
      bi(
        "People think $x$ means ‘something hidden'. It doesn't. A letter is just **a box you haven't filled yet** — the same box you've used since Year 1 when you wrote $3 + \\square = 7$.",
        "يظنّ الناس أن $x$ تعني «شيئاً مخفياً». وليست كذلك. فالحرف مجرّد **صندوق لم تملأه بعد** — الصندوق نفسه الذي استعملته منذ السنة الأولى حين كتبت $3 + \\square = 7$."
      ),
      bi(
        "What changes this year is bigger than the letter: you stop answering ‘what is the total?' and start answering **‘what is the rule?'**. One rule handles the 5th case and the 500th at the same time — that's why algebra is worth the trouble.",
        "لكنّ ما يتغيّر هذا العام أكبر من الحرف: تكفّ عن الإجابة عن «كم المجموع؟» وتبدأ الإجابة عن **«ما القاعدة؟»**. فقاعدة واحدة تتكفّل بالحالة الخامسة والخمسمئة معاً — ولهذا يستحقّ الجبر عناءه."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Reading a sequence in three moves", "قراءة متتالية في ثلاث حركات"),
    flow: [
      { text: bi("Find the step", "جِد الخطوة"), tone: "force" },
      { text: bi("Work back to term zero", "ارجع إلى الحدّ صفر"), tone: "mass" },
      { text: bi("Write the rule", "اكتب القاعدة"), tone: "accel" },
    ],
    table: {
      head: [bi("Sequence", "المتتالية"), bi("Step", "الخطوة"), bi("Rule for term $n$", "قاعدة الحدّ $n$")],
      rows: [
        [bi("3, 7, 11, 15…", "٣، ٧، ١١، ١٥…"), bi("+4", "‎+٤"), bi("$4n - 1$", "$4n - 1$")],
        [bi("5, 10, 15, 20…", "٥، ١٠، ١٥، ٢٠…"), bi("+5", "‎+٥"), bi("$5n$", "$5n$")],
        [bi("20, 17, 14, 11…", "٢٠، ١٧، ١٤، ١١…"), bi("−3", "‎−٣"), bi("$23 - 3n$", "$23 - 3n$")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("The rule of a linear sequence", "قاعدة المتتالية الخطية"),
    paras: [
      bi(
        "In a **linear sequence** every term rises (or falls) by the same **step** $d$. The step multiplies $n$; then you adjust so that $n = 1$ gives the first term — which is the same as asking what term *zero* would have been:",
        "في **المتتالية الخطية** يزيد كل حدّ (أو ينقص) بالخطوة نفسها $d$. فالخطوة تضرب في $n$، ثم تضبط ليعطي $n = 1$ الحدَّ الأول — وهو نفسه سؤالك عن قيمة الحدّ *صفر*:"
      ),
      bi(
        "And the balance rule from equations still holds everywhere: whatever you do to one side, do to the other.",
        "وقاعدة التوازن في المعادلات تبقى سارية في كل مكان: ما تفعله بطرف افعله بالآخر."
      ),
    ],
    math: ["\\text{term}(n) = dn + (\\text{first} - d)"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Seating a long majlis", "ترتيب مجلس طويل"),
    paras: [
      bi(
        "One square table seats **6**. Push a second table against it and only **4** more people fit — two seats are lost where the tables meet. Three tables seat 14, four seat 18.",
        "طاولة مربّعة واحدة تتّسع لـ**٦**. وإن ضممت إليها ثانية اتّسعت لـ**٤** إضافيين فقط — إذ يُفقد مقعدان عند التقاء الطاولتين. فثلاث طاولات تتّسع لـ١٤، وأربع لـ١٨."
      ),
      bi(
        "The step is 4, and term zero would be $6 - 4 = 2$. So the rule is $\\text{seats} = 4t + 2$. Check it: $t = 1 \\Rightarrow 6$ ✓, $t = 3 \\Rightarrow 14$ ✓.",
        "الخطوة ٤، والحدّ صفر يساوي $6 - 4 = 2$. فالقاعدة $\\text{المقاعد} = 4t + 2$. تحقّق: $t = 1 \\Rightarrow 6$ ✓، و$t = 3 \\Rightarrow 14$ ✓."
      ),
      bi(
        "Now the question counting alone can't answer: **42 guests are coming — how many tables?** Solve $4t + 2 = 42$: subtract 2 from both sides, $4t = 40$, divide by 4, $t = \\mathbf{10}$. No drawing, no counting.",
        "والآن سؤال لا يجيب عنه العدّ وحده: **سيأتي ٤٢ ضيفاً — فكم طاولة؟** حُلّ $4t + 2 = 42$: اطرح ٢ من الطرفين فيصير $4t = 40$، ثم اقسم على ٤ فيكون $t = \\mathbf{10}$. بلا رسم ولا عدّ."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "Find the rule for 8, 13, 18, 23… and use it to get the 20th term. Then solve $3x - 5 = 16$, saying what you did to both sides each time.",
        "جِد قاعدة ٨، ١٣، ١٨، ٢٣… ثم استخدمها لإيجاد الحدّ العشرين. ثم حُلّ $3x - 5 = 16$ ذاكراً ما فعلته بالطرفين في كل خطوة."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "A letter is an unfilled box; find the step, work back to term zero, and one rule answers every case — then keep the equation balanced while you undo it.",
        "الحرف صندوق لم يُملأ؛ جِد الخطوة، وارجع إلى الحدّ صفر، فتُجيب قاعدة واحدة عن كل الحالات — ثم أبقِ المعادلة متوازنة وأنت تفكّها."
      ),
    ],
  },
];

// ---- Flagship: Physics · Year 3 · Light & Sound ----
const PHYSICS_3: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Light goes straight; sound is a shiver", "الضوء يمضي مستقيماً، والصوت رعشة"),
    paras: [
      bi(
        "Light only travels in **straight lines**. That one fact explains shadows: your body blocks the light, and the dark shape behind you is exactly the part of the wall the light couldn't reach. It's also why you can't see around a corner.",
        "لا ينتقل الضوء إلا في **خطوط مستقيمة**. وهذه الحقيقة وحدها تفسّر الظلال: جسمك يحجب الضوء، والشكل المعتم خلفك هو تحديداً الجزء الذي لم يبلغه الضوء من الجدار. ولهذا أيضاً لا ترى خلف الزاوية."
      ),
      bi(
        "Sound is different — it's something **shaking**. Put your hand on your throat and hum: that tickle is your voice shaking the air, and the air shakes your friend's eardrum. Stop the shaking and the sound stops instantly.",
        "أما الصوت فمختلف — إنه شيء **يهتزّ**. ضع يدك على حنجرتك وطنطِن: تلك الدغدغة هي صوتك يهزّ الهواء، والهواء يهزّ طبلة أذن صاحبك. وأوقِف الاهتزاز يتوقّف الصوت فوراً."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("What the shaking decides", "ما الذي يقرّره الاهتزاز"),
    flow: [
      { text: bi("Something shakes", "شيء يهتزّ"), tone: "force" },
      { text: bi("The air carries it", "الهواء ينقله"), tone: "mass" },
      { text: bi("Your ear feels it", "أذنك تشعر به"), tone: "accel" },
    ],
    table: {
      head: [bi("You hear", "تسمع"), bi("The shaking is…", "الاهتزاز…"), bi("Try it", "جرّبه")],
      rows: [
        [bi("A loud sound", "صوتاً عالياً"), bi("Bigger", "أكبر"), bi("Tap the drum harder", "اضرب الطبل أقوى")],
        [bi("A high squeak", "صريراً حادّاً"), bi("Faster", "أسرع"), bi("Pluck the short, tight string", "انقر الوتر القصير المشدود")],
        [bi("A deep boom", "دويّاً غليظاً"), bi("Slower", "أبطأ"), bi("Pluck the long, loose string", "انقر الوتر الطويل المرتخي")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Light wins the race", "الضوء يفوز بالسباق"),
    paras: [
      bi(
        "Light is unimaginably fast — it crosses a room before you can think. Sound is slow enough to catch: about **330 metres every second**. That gap is why you *see* lightning first and *hear* thunder after.",
        "الضوء سريع بما لا يُتخيّل — يعبر الغرفة قبل أن تفكّر. أما الصوت فبطيء بما يكفي لتلحقه: نحو **٣٣٠ متراً كل ثانية**. وهذه الفجوة سبب أنك *ترى* البرق أولاً ثم *تسمع* الرعد."
      ),
      bi(
        "Since 3 seconds of sound is roughly one kilometre, you can measure a storm by counting:",
        "وبما أن ثلاث ثوانٍ من الصوت نحو كيلومتر واحد، فتستطيع قياس بُعد العاصفة بالعدّ:"
      ),
    ],
    math: ["\\text{distance in km} \\approx \\frac{\\text{seconds counted}}{3}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("How far away is the storm?", "كم تبعد العاصفة؟"),
    paras: [
      bi(
        "You see a flash of lightning. You count slowly — one, two, three… — and the thunder arrives on **9**. Divide: $\\frac{9}{3} = \\mathbf{3}$ kilometres away.",
        "ترى وميض برق. فتعدّ ببطء — واحد، اثنان، ثلاثة… — ويصل الرعد عند **٩**. اقسم: $\\frac{9}{3} = \\mathbf{3}$ كيلومترات."
      ),
      bi(
        "A few minutes later the next flash comes and thunder arrives on **3** — that's $\\frac{3}{3} = 1$ km. The storm is **coming closer**, and you knew it just by counting.",
        "وبعد دقائق يأتي الوميض التالي ويصل الرعد عند **٣** — أي $\\frac{3}{3} = 1$ كيلومتر. فالعاصفة **تقترب**، وعرفت ذلك بالعدّ وحده."
      ),
      bi(
        "The lightning and the thunder happened at the *same moment*. Only the messengers travel at different speeds.",
        "والبرق والرعد حدثا في *اللحظة نفسها*. وإنما يختلف رسولاهما في السرعة."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "You count 12 seconds after a flash — how far is the storm? And is your shadow longer when the torch is close to you or far away? Try it and see.",
        "عددتَ ١٢ ثانية بعد الوميض — فكم تبعد العاصفة؟ وهل يطول ظلّك حين يقترب المصباح منك أم حين يبتعد؟ جرّب وانظر."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Light travels straight and arrives at once, so shadows are the light's missing shape; sound is shaking that takes about 3 seconds to cross a kilometre.",
        "الضوء يمضي مستقيماً ويصل فوراً، فالظلال هي شكل الضوء الغائب؛ والصوت اهتزاز يستغرق نحو ثلاث ثوانٍ ليقطع كيلومتراً."
      ),
    ],
  },
];

// ---- Flagship: Geography · Year 9 · The Connected World ----
const GEOGRAPHY_9: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Some places matter more than their size", "أماكن تفوق أهميتها حجمها"),
    paras: [
      bi(
        "Look at a world map of shipping and you won't see an even spread — you'll see threads pulled tight through a few narrow gaps. A **chokepoint** is a place where geography forces enormous traffic through a small opening.",
        "انظر إلى خريطة الملاحة العالمية فلن ترى انتشاراً متساوياً، بل خيوطاً تُشدّ عبر بضع فجوات ضيّقة. و**الممرّ الحرج** موضع تُجبر فيه الجغرافيا حركةً هائلة على المرور من فتحة صغيرة."
      ),
      bi(
        "That's why our region sits at the centre of world politics: **Hormuz, Bab al-Mandab and Suez** are three of the handful that matter. A country doesn't need a big army to matter if the world's cargo must pass its coastline.",
        "ولهذا تقع منطقتنا في قلب السياسة العالمية: **هرمز وباب المندب والسويس** ثلاثة من حفنة تهمّ العالم. فالبلد لا يحتاج جيشاً كبيراً ليكون مهماً إن كانت بضائع العالم مضطرّة للمرور بساحله."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Why narrow water buys influence", "لماذا يشتري الماء الضيّق نفوذاً"),
    flow: [
      { text: bi("Narrow water", "ماء ضيّق"), tone: "force" },
      { text: bi("Concentrated traffic", "حركة مكثّفة"), tone: "mass" },
      { text: bi("Outsized influence", "نفوذ يفوق الحجم"), tone: "accel" },
    ],
    table: {
      head: [bi("Chokepoint", "الممرّ"), bi("Connects", "يصل بين"), bi("If it closes", "إن أُغلق")],
      rows: [
        [bi("Hormuz", "هرمز"), bi("The Gulf ↔ the Indian Ocean", "الخليج ↔ المحيط الهندي"), bi("Most Gulf oil exports have no sea exit", "معظم صادرات نفط الخليج بلا منفذ بحري")],
        [bi("Bab al-Mandab", "باب المندب"), bi("The Red Sea ↔ the Indian Ocean", "البحر الأحمر ↔ المحيط الهندي"), bi("Suez traffic must turn back", "حركة السويس تعود أدراجها")],
        [bi("Suez", "السويس"), bi("The Mediterranean ↔ the Red Sea", "المتوسط ↔ البحر الأحمر"), bi("Europe–Asia ships go round Africa", "سفن أوروبا–آسيا تدور حول إفريقيا")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Costing a detour", "حساب كلفة الالتفاف"),
    paras: [
      bi(
        "A **chokepoint** is a narrow passage that carries a disproportionate share of world trade, so closing it is felt globally. Its value is measurable: it equals the detour everyone would otherwise sail. Ships move at a steady cruising speed in **knots** (nautical miles per hour), so:",
        "**الممرّ الحرج** ممرّ ضيّق يحمل حصّة غير متناسبة من تجارة العالم، فيُشعَر بإغلاقه عالمياً. وقيمته قابلة للقياس: فهي تساوي الالتفاف الذي كان الجميع سيبحره لولاه. وتسير السفن بسرعة ثابتة بالـ**عقدة** (ميل بحري في الساعة)، ومن ثمّ:"
      ),
    ],
    math: ["\\text{extra days} = \\frac{\\text{extra nautical miles}}{\\text{speed in knots} \\times 24}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Suez, or the long way round Africa", "السويس أم الطريق الطويل حول إفريقيا"),
    paras: [
      bi(
        "A tanker sails from the Gulf to Rotterdam. Through Suez the voyage is roughly **6,400 nautical miles**; around the Cape of Good Hope it is roughly **11,200** — about **4,800 nautical miles** further. (Figures are approximate and vary by exact ports.)",
        "ناقلة تبحر من الخليج إلى روتردام. فعبر السويس تبلغ الرحلة نحو **٦٬٤٠٠ ميل بحري**، وحول رأس الرجاء الصالح نحو **١١٬٢٠٠** — أي أطول بنحو **٤٬٨٠٠ ميل بحري**. (والأرقام تقريبية وتختلف بحسب الموانئ.)"
      ),
      bi(
        "At a cruising speed of 15 knots: $\\frac{4800}{15 \\times 24} = \\frac{4800}{360} \\approx \\mathbf{13}$ extra days at sea — each way. Add fuel, crew wages and cargo arriving a fortnight late.",
        "وبسرعة إبحار ١٥ عقدة: $\\frac{4800}{15 \\times 24} = \\frac{4800}{360} \\approx \\mathbf{13}$ يوماً إضافياً في البحر — في كل اتجاه. أضف إليها الوقود وأجور الطاقم وبضاعة تصل متأخّرة أسبوعين."
      ),
      bi(
        "That number *is* the canal's power. Geography didn't give Egypt the shipping — it gave it the **alternative**, and the alternative costs thirteen days. This is what people mean when they say geography drives politics.",
        "هذا الرقم *هو* قوّة القناة. فالجغرافيا لم تمنح مصر الملاحة، بل منحتها **البديل** — وكلفة البديل ثلاثة عشر يوماً. وهذا ما يعنيه القول إن الجغرافيا تحرّك السياسة."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "A detour adds 3,600 nautical miles and the ship cruises at 20 knots — how many extra days? And name one reason a country beside a chokepoint may still have little influence over it.",
        "التفافٌ يضيف ٣٬٦٠٠ ميل بحري والسفينة تبحر بـ٢٠ عقدة — كم يوماً إضافياً؟ وسمِّ سبباً قد يجعل بلداً مجاوراً لممرّ حرج قليل النفوذ عليه رغم ذلك."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Chokepoints concentrate the world's traffic into a few narrow seas, and their power equals the detour they save — which is why our region's straits shape global politics.",
        "الممرّات الحرجة تحشد حركة العالم في بحار ضيّقة معدودة، وقوّتها تساوي الالتفاف الذي توفّره — ولهذا تصوغ مضائق منطقتنا السياسة العالمية."
      ),
    ],
  },
];

// ---- Flagship: AI · Year 10 · Frontier AI & Your Future ----
const AI_10: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("The jump from answering to acting", "القفزة من الإجابة إلى الفعل"),
    paras: [
      bi(
        "A chatbot answers and stops. An **agent** is given tools and a loop: it decides a step, takes it, looks at the result, and decides again. The difference isn't intelligence — it's that an agent's mistakes **land in the world** instead of on a screen.",
        "روبوت المحادثة يجيب ويتوقّف. أما **الوكيل** فيُمنح أدوات وحلقة: يقرّر خطوة، وينفّذها، وينظر في النتيجة، ثم يقرّر من جديد. والفارق ليس في الذكاء، بل في أن أخطاء الوكيل **تقع في العالم** لا على الشاشة."
      ),
      bi(
        "So the frontier question isn't ‘can it do this?' but **‘how would we know if it got it wrong?'**. That's why the fastest-growing skill around AI is not building models — it's defining the task precisely, checking the output, and owning the consequence.",
        "فسؤال الحدود ليس «أيستطيع فعل هذا؟» بل **«كيف نعرف أنه أخطأ؟»**. ولهذا فإن أسرع المهارات نموّاً حول الذكاء الاصطناعي ليست بناء النماذج، بل تحديد المهمة بدقّة، وفحص المخرجات، وتحمّل التبعة."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("The agent loop, and where it breaks", "حلقة الوكيل وأين تنكسر"),
    flow: [
      { text: bi("Decide a step", "قرّر خطوة"), tone: "force" },
      { text: bi("Take the action", "نفّذ الفعل"), tone: "mass" },
      { text: bi("Check the result", "افحص النتيجة"), tone: "accel" },
    ],
    table: {
      head: [bi("System", "النظام"), bi("What it does", "ما يفعله"), bi("What can go wrong", "ما قد يسوء")],
      rows: [
        [bi("Chatbot", "روبوت محادثة"), bi("Answers once", "يجيب مرّة"), bi("A wrong answer you can read", "جواب خاطئ تستطيع قراءته")],
        [bi("Reasoning model", "نموذج استدلال"), bi("Works through steps first", "يخطو خطوات قبل الجواب"), bi("Confident reasoning built on a wrong fact", "استدلال واثق على معلومة خاطئة")],
        [bi("Agent", "وكيل"), bi("Acts, then re-plans", "يفعل ثم يعيد التخطيط"), bi("Small errors compounding unseen", "أخطاء صغيرة تتراكم دون أن تُرى")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Why long tasks are hard", "لماذا تصعب المهام الطويلة"),
    paras: [
      bi(
        "If every step must succeed for the whole task to succeed, reliability **multiplies** — it doesn't average. A chain of $n$ steps each right with probability $p$ finishes correctly with probability:",
        "إن كان نجاح المهمة كلّها يستلزم نجاح كل خطوة، فإن الموثوقية **تتضاعف ضرباً** لا متوسّطاً. فسلسلة من $n$ خطوة تصيب كلٌّ منها باحتمال $p$ تنتهي صحيحةً باحتمال:"
      ),
      bi(
        "This is the single most useful piece of maths for judging any claim about autonomous systems.",
        "وهذه أنفع قطعة رياضية للحكم على أي ادّعاء بشأن الأنظمة ذاتية التشغيل."
      ),
    ],
    math: ["P(\\text{success}) = p^{n}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("The 95% agent that fails most of the time", "وكيل بدقّة ٩٥٪ يفشل في معظم الأحيان"),
    paras: [
      bi(
        "An agent books a school trip in **10 steps**, each correct **95%** of the time. Sounds excellent. But $0.95^{10} \\approx 0.60$ — it completes the whole booking correctly only about **60%** of the time.",
        "وكيل يحجز رحلة مدرسية في **١٠ خطوات**، تصيب كلٌّ منها **٩٥٪** من المرّات. يبدو ممتازاً. لكن $0.95^{10} \\approx 0.60$ — أي يُتمّ الحجز كلّه بشكل صحيح في نحو **٦٠٪** فقط."
      ),
      bi(
        "Stretch it to **20 steps** and $0.95^{20} \\approx 0.36$: it now fails roughly two times in three. Nothing got worse — the chain just got longer.",
        "ومدّها إلى **٢٠ خطوة** فيكون $0.95^{20} \\approx 0.36$: أي يفشل نحو مرّتين من ثلاث. ولم يسُؤ شيء، وإنما طالت السلسلة فحسب."
      ),
      bi(
        "Now invert it. To finish 10 steps correctly **90%** of the time you need $p = \\sqrt[10]{0.9} \\approx 0.99$ per step. That gap between 95% and 99% is most of the engineering — and it's why serious systems add checkpoints where a human confirms before the chain continues.",
        "والآن اعكسها. لتُتمّ عشر خطوات بشكل صحيح في **٩٠٪** من المرّات تحتاج $p = \\sqrt[10]{0.9} \\approx 0.99$ لكل خطوة. وتلك الفجوة بين ٩٥٪ و٩٩٪ هي معظم الهندسة — ولهذا تضيف الأنظمة الجادّة نقاط تحقّق يؤكّد عندها إنسانٌ قبل أن تستمر السلسلة."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "An agent runs 5 steps at 90% each — what's the chance the whole task is right? And for your community capstone, name one step you would *not* let it take without a human confirming.",
        "وكيل ينفّذ ٥ خطوات بدقّة ٩٠٪ لكلٍّ — فما احتمال صحّة المهمة كلها؟ ولمشروعك الختامي، سمِّ خطوة واحدة *لن* تدعه ينفّذها دون تأكيد إنسان."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Agents act instead of answering, so reliability multiplies down the chain — judge them by $p^{n}$, and put a human checkpoint wherever a wrong step would be expensive to undo.",
        "الوكلاء يفعلون لا يجيبون، فتتضاعف الموثوقية ضرباً على طول السلسلة — احكم عليهم بـ$p^{n}$، وضع نقطة تحقّق بشرية حيثما كان التراجع عن خطوة خاطئة مكلفاً."
      ),
    ],
  },
];

// ---- Flagship: Languages · Year 9 · Thinking in a New Language ----
const LANGUAGES_9: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Translation is the bottleneck", "الترجمة هي عنق الزجاجة"),
    paras: [
      bi(
        "If you build every sentence in Arabic and then convert it, you can only speak as fast as you can translate — and the conversation moves on without you. The goal of this year is to **stop routing through your first language**.",
        "إن كنت تبني كل جملة بالعربية ثم تحوّلها، فلن تتكلّم أسرع مما تترجم — ويمضي الحوار من دونك. وهدف هذا العام أن **تكفّ عن المرور بلغتك الأولى**."
      ),
      bi(
        "It starts quietly, in your head: name what you see, plan tomorrow, argue with yourself — directly in the new language, with nobody listening and nothing at stake. The public fluency everyone notices grows out of that private practice.",
        "ويبدأ ذلك بهدوء في رأسك: سمِّ ما تراه، وخطّط ليومك التالي، وجادِل نفسك — مباشرةً باللغة الجديدة، بلا مستمع ولا مخاطرة. فالطلاقة العلنية التي يلاحظها الناس تنبت من ذلك التمرين الخاص."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("What to do instead of translating", "ماذا تفعل بدل الترجمة"),
    flow: [
      { text: bi("Think it directly", "فكّر بها مباشرة"), tone: "force" },
      { text: bi("Describe round gaps", "التفّ حول الفجوات بالوصف"), tone: "mass" },
      { text: bi("Keep the turn moving", "أبقِ الدور متحرّكاً"), tone: "accel" },
    ],
    table: {
      head: [bi("Instead of…", "بدلاً من…"), bi("Do this", "افعل هذا"), bi("Why", "لماذا")],
      rows: [
        [bi("Freezing on a missing word", "التجمّد عند كلمة ناقصة"), bi("Describe it: ‘the thing you open tins with'", "صِفها: «الشيء الذي تفتح به العلب»"), bi("The conversation keeps its rhythm", "يحتفظ الحوار بإيقاعه")],
        [bi("Translating a joke word for word", "ترجمة نكتة حرفياً"), bi("Find the situation that's funny to them", "ابحث عن الموقف المضحك عندهم"), bi("Humour lives in context, not words", "الطرافة في السياق لا في الكلمات")],
        [bi("Apologising for your accent", "الاعتذار عن لكنتك"), bi("Say the next sentence", "قل الجملة التالية"), bi("Accent is not an error", "اللكنة ليست خطأ")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("The cost of the extra step", "كلفة الخطوة الزائدة"),
    paras: [
      bi(
        "Conversation researchers find that speakers across many languages hand over turns with only a **fraction of a second** of silence between them — we are extremely sensitive to that gap. Every sentence you route through translation adds delay on top of it:",
        "يجد باحثو المحادثة أن المتحدثين في لغات كثيرة يتبادلون الأدوار بصمتٍ لا يتجاوز **جزءاً من الثانية** — ونحن شديدو الحساسية لتلك الفجوة. وكل جملة تمرّرها عبر الترجمة تضيف تأخيراً فوقها:"
      ),
      bi(
        "**Code-switching** — sliding between languages mid-sentence, as people across our region do daily — isn't laziness or weakness. It's reaching for whichever word arrives fastest, which is exactly what fluent bilinguals do.",
        "و**التنقّل بين اللغات** — الانزلاق بينها داخل الجملة كما يفعل الناس في منطقتنا يومياً — ليس كسلاً ولا ضعفاً. بل هو التقاط الكلمة الأسرع وصولاً، وهو تحديداً ما يفعله ثنائيّو اللغة الطليقون."
      ),
    ],
    math: ["\\text{extra silence} = \\text{delay per turn} \\times \\text{number of turns}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Why people stop waiting for you", "لماذا يكفّ الناس عن انتظارك"),
    paras: [
      bi(
        "You join a 30-turn conversation and each of your replies takes about **2 extra seconds** while you assemble it in Arabic and convert. Total: $2 \\times 30 = \\mathbf{60}$ seconds of added silence.",
        "تدخل حواراً من ٣٠ دوراً، ويستغرق كل ردّ لك نحو **ثانيتين إضافيتين** بينما تركّب الجملة بالعربية ثم تحوّلها. المجموع: $2 \\times 30 = \\mathbf{60}$ ثانية صمت مضاف."
      ),
      bi(
        "A full minute of gaps in one conversation. Long before that adds up, someone else has filled each pause — not to be rude, but because a pause is an invitation in every language.",
        "دقيقة كاملة من الفجوات في حوار واحد. وقبل أن تتراكم بكثير يكون غيرك قد ملأ كل وقفة — لا لقلّة أدب، بل لأن الوقفة دعوةٌ في كل اللغات."
      ),
      bi(
        "Halve the delay to 1 second and you save 30 seconds — but the real repair isn't speed, it's removing the step: think the sentence directly, and describe your way past the word you don't have.",
        "خفّض التأخير إلى ثانية فتوفّر ٣٠ ثانية — لكن العلاج الحقيقي ليس السرعة بل حذف الخطوة: فكّر الجملة مباشرة، وصِف طريقك متجاوزاً الكلمة التي لا تملكها."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "In a 45-turn conversation with a 3-second delay each turn, how much silence do you add? And describe ‘a stapler' in your new language without naming it.",
        "في حوار من ٤٥ دوراً بتأخير ٣ ثوانٍ لكل دور، كم صمتاً تضيف؟ وصِف «الدبّاسة» بلغتك الجديدة دون أن تسمّيها."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Translating in your head costs seconds you don't have — think directly, describe your way round missing words, and treat code-switching as a fluent move rather than a failure.",
        "الترجمة في رأسك تكلّفك ثوانيَ لا تملكها — ففكّر مباشرة، وصِف طريقك حول الكلمات الغائبة، واعتبر التنقّل بين اللغات مهارةً لا إخفاقاً."
      ),
    ],
  },
];

// ---- Flagship: Emotional Intelligence · Year 9 · Emotional Courage ----
const EQ_9: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Avoidance isn't free — it's paid in instalments", "التجنّب ليس مجانياً بل يُدفع أقساطاً"),
    paras: [
      bi(
        "The conversation you're dreading takes about ten minutes. Avoiding it doesn't cost nothing — it costs a small tax every day: rehearsing it in your head, steering round that person, the sentence you almost sent and deleted.",
        "الحديث الذي تخشاه يستغرق نحو عشر دقائق. وتجنّبه ليس بلا كلفة، بل يكلّفك ضريبة صغيرة كل يوم: تكراره في رأسك، والالتفاف حول ذلك الشخص، والرسالة التي كدت ترسلها ثم محوتها."
      ),
      bi(
        "**Emotional courage** isn't the absence of that fear — it's doing the ten minutes while still feeling it. And the thing you most avoid saying is usually the thing that ends the problem: ‘I didn't understand', ‘that hurt me', ‘I was wrong'.",
        "و**الشجاعة العاطفية** ليست غياب ذلك الخوف، بل أن تُنجز العشر دقائق وأنت تشعر به. وأكثر ما تتجنّب قوله هو غالباً ما يُنهي المشكلة: «لم أفهم»، «هذا آلمني»، «كنت مخطئاً»."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("What you fear vs what usually happens", "ما تخشاه مقابل ما يحدث عادةً"),
    flow: [
      { text: bi("Name the thing", "سمِّ الأمر"), tone: "force" },
      { text: bi("Say your part", "قل ما يخصّك"), tone: "mass" },
      { text: bi("Ask for theirs", "واسأل عمّا يخصّهم"), tone: "accel" },
    ],
    table: {
      head: [bi("You fear", "تخشى"), bi("Usually happens", "يحدث عادةً"), bi("Opener that works", "افتتاحية تنجح")],
      rows: [
        [bi("‘They'll be furious'", "«سيغضبون»"), bi("Relief — they noticed too", "ارتياح — فقد لاحظوا هم أيضاً"), bi("‘Can I say something awkward?'", "«أيمكنني قول شيء محرج؟»")],
        [bi("‘I'll look weak'", "«سأبدو ضعيفاً»"), bi("They trust you more, not less", "تزداد ثقتهم بك لا تقلّ"), bi("‘I got this wrong'", "«أخطأت في هذا»")],
        [bi("‘I'll be the only one'", "«سأكون الوحيد»"), bi("Others were waiting for a first voice", "كان غيرك ينتظر صوتاً أول"), bi("‘I see it differently'", "«أنا أراها بشكل مختلف»")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Counting what avoidance costs", "حساب كلفة التجنّب"),
    paras: [
      bi(
        "**Vulnerability** here means saying the true thing when hiding is safer. It reads as strength because it can't be faked cheaply — anyone can perform confidence; only someone secure admits a mistake.",
        "**الهشاشة** هنا أن تقول الصادق حين يكون الاختباء أأمن. وتُقرأ قوةً لأنها لا تُصطنع بثمن بخس — فكل أحد يستطيع تمثيل الثقة، ولا يعترف بالخطأ إلا واثق."
      ),
      bi(
        "To compare honestly, price both sides. The conversation is a one-off cost; the avoidance repeats (both numbers are your own estimates, not measurements):",
        "ولتقارن بصدق، سعّر الطرفين. فالحديث كلفة لمرّة واحدة، أما التجنّب فيتكرّر (والرقمان تقديرك أنت لا قياس):"
      ),
    ],
    math: ["\\text{cost of avoiding} = \\text{daily dread} \\times \\text{days}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Ten minutes against a month", "عشر دقائق في مواجهة شهر"),
    paras: [
      bi(
        "A friend keeps borrowing your things and not returning them. Saying so costs maybe **10 minutes** of discomfort. Avoiding it costs perhaps **5 minutes** of irritation and rehearsal a day.",
        "صديق يستعير أغراضك ولا يعيدها. قول ذلك يكلّفك نحو **١٠ دقائق** من الحرج. أما تجنّبه فيكلّفك ربما **٥ دقائق** من الضيق والتكرار الذهني يومياً."
      ),
      bi(
        "Over a month: $5 \\times 30 = \\mathbf{150}$ minutes — two and a half hours spent *not* having a ten-minute conversation. And the friendship quietly cools the whole time.",
        "وعلى شهر: $5 \\times 30 = \\mathbf{150}$ دقيقة — ساعتان ونصف تُنفَق في *عدم* إجراء حديث من عشر دقائق. وتفتر الصداقة بهدوء طوال المدّة."
      ),
      bi(
        "The numbers are estimates, not measurements — but the shape is always the same: the brave thing is **cheap and once**, the avoidant thing is **cheap each time and endless**. That asymmetry is the whole argument.",
        "والأرقام تقديرات لا قياسات — لكن الشكل واحد دائماً: الشجاع **رخيص ولمرّة**، والمتجنِّب **رخيص في كل مرّة وبلا نهاية**. وهذا التفاوت هو الحجّة كلها."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "If avoiding something costs you 8 minutes a day for three weeks, what have you spent? And write the first sentence of a conversation you've been putting off — just the first one.",
        "إن كان تجنّب أمرٍ يكلّفك ٨ دقائق يومياً لثلاثة أسابيع، فكم أنفقت؟ واكتب الجملة الأولى لحديث تؤجّله — الأولى فقط."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Courage isn't feeling no fear — it's paying the one-off cost instead of the daily one, and saying the true sentence you keep swallowing.",
        "الشجاعة ليست انعدام الخوف، بل أن تدفع الكلفة مرّةً بدل أن تدفعها كل يوم، وأن تقول الجملة الصادقة التي تظلّ تبتلعها."
      ),
    ],
  },
];

// ---- Flagship: Entrepreneurship · Year 2 · Money Basics ----
const ENTREPRENEURSHIP_2: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Money is a swap that always works", "المال مبادلة تنجح دائماً"),
    paras: [
      bi(
        "Long ago people swapped things directly. But if you had dates and wanted a ball, you had to find someone who had a ball **and** wanted dates — that's hard! Money fixed it: everyone accepts it, so you can always swap.",
        "قديماً كان الناس يتبادلون الأشياء مباشرةً. لكن إن كان عندك تمر وتريد كرة، فعليك أن تجد من عنده كرة **ويريد** تمراً — وهذا صعب! فحلّ المال المشكلة: الجميع يقبله، فتستطيع المبادلة دائماً."
      ),
      bi(
        "And money is really **stored work**. Somebody did something useful, and the coins are the proof they can use later. That's why finding money feels different from earning it.",
        "والمال في حقيقته **عملٌ مخزون**. فقد صنع أحدهم شيئاً نافعاً، والنقود دليلٌ يستعمله لاحقاً. ولهذا يختلف شعور العثور على المال عن شعور كسبه."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Need it, or want it?", "أتحتاجه أم تريده؟"),
    flow: [
      { text: bi("Earn it", "اكسبه"), tone: "force" },
      { text: bi("Save some", "ادّخر بعضه"), tone: "mass" },
      { text: bi("Choose carefully", "واختر بعناية"), tone: "accel" },
    ],
    table: {
      head: [bi("Thing", "الشيء"), bi("Need or want?", "حاجة أم رغبة؟"), bi("How to tell", "كيف تعرف")],
      rows: [
        [bi("School shoes", "حذاء المدرسة"), bi("Need", "حاجة"), bi("Something goes wrong without it", "يسوء أمرٌ من دونه")],
        [bi("A third toy car", "سيارة لعبة ثالثة"), bi("Want", "رغبة"), bi("Fun, but nothing breaks", "ممتع، ولا ينكسر شيء")],
        [bi("A gift for your sister", "هدية لأختك"), bi("Want — a kind one", "رغبة طيّبة"), bi("Wants aren't bad, they're choices", "الرغبات ليست سيئة، بل خيارات")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Saving is just waiting on purpose", "الادّخار انتظارٌ عن قصد"),
    paras: [
      bi(
        "**Saving** means keeping money now so you can buy something bigger later. To know how long you must wait, count how many weeks of saving fill up the price:",
        "**الادّخار** أن تحتفظ بالمال الآن لتشتري شيئاً أكبر لاحقاً. ولتعرف كم تنتظر، عُدّ كم أسبوعاً من الادّخار تملأ الثمن:"
      ),
    ],
    math: ["\\text{weeks} = \\frac{\\text{price}}{\\text{saved each week}}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Saving for a 60-dirham kite", "الادّخار لطائرة ورقية بستين درهماً"),
    paras: [
      bi(
        "The kite costs **60**. You save **5** every week. Count up in fives: 5, 10, 15, 20… you reach 60 after **12 weeks**. That's about three months of waiting.",
        "الطائرة بـ**٦٠**. وتدّخر **٥** كل أسبوع. عُدّ بالخمسات: ٥، ١٠، ١٥، ٢٠… تبلغ ٦٠ بعد **١٢ أسبوعاً**. أي نحو ثلاثة أشهر من الانتظار."
      ),
      bi(
        "Save **10** a week instead and you count 10, 20, 30… reaching 60 in only **6 weeks**. Saving twice as much halves the wait.",
        "وادّخر **١٠** أسبوعياً فتعدّ ١٠، ٢٠، ٣٠… وتبلغ ٦٠ في **٦ أسابيع** فقط. فمضاعفة الادّخار تنصّف الانتظار."
      ),
      bi(
        "Here's the tricky part: if you spend 5 on sweets in week 8, you don't lose one week — you go **backwards** and have to earn it again. That's why savers keep their money somewhere they can't reach easily.",
        "وإليك الجزء الصعب: إن أنفقت ٥ على الحلوى في الأسبوع الثامن، فلن تخسر أسبوعاً واحداً، بل ترجع **إلى الوراء** وعليك كسبها من جديد. ولهذا يضع المدّخرون مالهم في مكان لا تسهل الوصول إليه."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "A book costs 30 and you save 10 a week — how many weeks? And name one thing you *need* and one thing you *want* from your own room.",
        "كتاب ثمنه ٣٠ وتدّخر ١٠ أسبوعياً — كم أسبوعاً؟ وسمِّ شيئاً *تحتاجه* وشيئاً *تريده* من غرفتك."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Money is stored work that everyone accepts — earn it, save some each week, and know whether the thing you're buying is a need or a want.",
        "المال عملٌ مخزون يقبله الجميع — اكسبه، وادّخر بعضه كل أسبوع، واعرف أما تشتريه حاجةٌ أم رغبة."
      ),
    ],
  },
];

// ---- Flagship: Problem Solving · Year 10 · The Solver's Toolkit ----
const PROBLEM_SOLVING_10: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Estimate the size before you propose anything", "قدّر الحجم قبل أن تقترح شيئاً"),
    paras: [
      bi(
        "Ten years of tools come down to one habit: **find out how big the problem is before choosing a solution**. Is this a thousand-litre problem or a million-litre one? The answer decides whether the right move is a poster campaign or new plumbing.",
        "تتلخّص أدوات عشر سنوات في عادة واحدة: **اعرف حجم المشكلة قبل أن تختار الحل**. أهي مشكلة ألف لتر أم مليون لتر؟ فالجواب يقرّر أالحلُّ حملةُ ملصقات أم سباكةٌ جديدة."
      ),
      bi(
        "You almost never have exact data, and waiting for it is its own failure. So estimate deliberately: pick numbers you can defend, do the arithmetic, and **say out loud which numbers you guessed** — an estimate you can argue with beats a certainty nobody checked.",
        "ونادراً ما تملك بيانات دقيقة، وانتظارها فشلٌ بذاته. فقدّر عن قصد: اختر أرقاماً تستطيع الدفاع عنها، وأجرِ الحساب، و**قل جهراً أي الأرقام خمّنتها** — فتقديرٌ يمكن مجادلته خير من يقينٍ لم يراجعه أحد."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Testing a proposal before you build it", "اختبار المقترح قبل بنائه"),
    flow: [
      { text: bi("Estimate the size", "قدّر الحجم"), tone: "force" },
      { text: bi("Find the leverage point", "جِد نقطة الرافعة"), tone: "mass" },
      { text: bi("Test it small", "اختبره صغيراً"), tone: "accel" },
    ],
    table: {
      head: [bi("Proposal", "المقترح"), bi("What it quietly assumes", "ما يفترضه ضمناً"), bi("Cheap test", "اختبار رخيص")],
      rows: [
        [bi("An awareness campaign", "حملة توعية"), bi("People know but don't care", "الناس يعرفون ولا يبالون"), bi("Ask ten people what they already know", "اسأل عشرة عمّا يعرفونه")],
        [bi("New equipment", "معدّات جديدة"), bi("The old equipment is the cause", "المعدّات القديمة هي السبب"), bi("Measure one week before changing anything", "قِس أسبوعاً قبل تغيير شيء")],
        [bi("A new rule", "قاعدة جديدة"), bi("Someone will enforce it", "أن أحداً سيطبّقها"), bi("Name that person before proposing it", "سمِّ ذلك الشخص قبل الاقتراح")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Scale first, then leverage", "الحجم أولاً ثم الرافعة"),
    paras: [
      bi(
        "An **order-of-magnitude estimate** answers ‘roughly how big?' from numbers you can justify — not to be exact, but to rule things out. A total is usually people × rate × time; the saving is that total times the fraction your idea removes:",
        "**تقدير رتبة المقدار** يجيب عن «كم تقريباً؟» بأرقام تستطيع تبريرها — لا ليكون دقيقاً بل ليستبعد الاحتمالات. والإجمالي غالباً عدد × معدّل × زمن، والتوفير هو ذلك الإجمالي مضروباً في النسبة التي تزيلها فكرتك:"
      ),
      bi(
        "The **leverage point** is where a small change moves a large number — and you find it by comparing savings per unit of effort, not by which idea sounds most impressive.",
        "و**نقطة الرافعة** حيث يحرّك تغييرٌ صغير رقماً كبيراً — وتجدها بمقارنة التوفير لكل وحدة جهد، لا باختيار الفكرة الأكثر إبهاراً."
      ),
    ],
    math: [
      "\\text{total} = \\text{people} \\times \\text{rate} \\times \\text{time}",
      "\\text{saving} = \\text{total} \\times \\text{fraction removed}",
    ],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Water wasted at your school", "الماء المهدور في مدرستك"),
    paras: [
      bi(
        "Say **500 students** each leave a tap running about **2 minutes** a day, and a tap flows roughly **8 litres a minute** (real taps vary — measure yours with a bottle and a timer). Daily total: $500 \\times 2 \\times 8 = \\mathbf{8{,}000}$ litres.",
        "لنقل إن **٥٠٠ طالب** يترك كلٌّ منهم الصنبور جارياً نحو **دقيقتين** يومياً، وأن الصنبور يعطي نحو **٨ لترات في الدقيقة** (والصنابير تختلف — فقِس صنبورك بقارورة وساعة). الإجمالي اليومي: $500 \\times 2 \\times 8 = \\mathbf{8{,}000}$ لتر."
      ),
      bi(
        "Across a 180-day school year that's about **1.44 million litres**. Now compare two proposals: a poster campaign that might cut 20% ($\\approx 288{,}000$ L) against push-taps that close themselves, cutting perhaps 80% ($\\approx 1.15$ million L).",
        "وعلى عام دراسي من ١٨٠ يوماً يصير ذلك نحو **١٫٤٤ مليون لتر**. والآن قارن مقترحين: حملة ملصقات قد تخفض ٢٠٪ ($\\approx 288{,}000$ لتر) مقابل صنابير ذاتية الإغلاق تخفض ربما ٨٠٪ ($\\approx 1.15$ مليون لتر)."
      ),
      bi(
        "Every number here is an estimate, and a jury should attack them — that's the point. But the *shape* survives: this is a plumbing problem wearing a behaviour problem's clothes, and no amount of persuasion beats a tap that shuts itself.",
        "وكل رقم هنا تقدير، وعلى اللجنة أن تهاجمه — وهذا هو المقصود. لكن *الشكل* يصمد: فهذه مشكلة سباكة ترتدي ثوب مشكلة سلوك، ولا يغلب الإقناعُ صنبوراً يُغلق نفسه."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "300 people each idle a car engine 4 minutes a day. Estimate the yearly total in engine-minutes, then name the number you'd measure first to check yourself.",
        "٣٠٠ شخص يُبقي كلٌّ محرّك سيارته دائراً ٤ دقائق يومياً. قدّر الإجمالي السنوي بدقائق التشغيل، ثم سمِّ الرقم الذي ستقيسه أولاً للتحقّق من نفسك."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Estimate the size with numbers you can defend, name your guesses out loud, then pick the change that saves most per unit of effort — and test it small before you build it.",
        "قدّر الحجم بأرقام تستطيع الدفاع عنها، وسمِّ تخميناتك جهراً، ثم اختر التغيير الأكثر توفيراً لكل وحدة جهد — واختبره صغيراً قبل أن تبنيه."
      ),
    ],
  },
];

// ---- Flagship: Gaming · Year 2 · Board & Story Games ----
const GAMING_2: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("A game needs something in the way", "اللعبة تحتاج شيئاً يعترض الطريق"),
    paras: [
      bi(
        "Draw a path of squares and race to the end — that isn't a game yet, it's a walk. A game appears the moment something **gets in the way**: a square that sends you back, a card that steals your turn, a bridge you can only cross with a six.",
        "ارسم مساراً من المربّعات وتسابق إلى النهاية — لن تكون هذه لعبة بعد، بل مجرّد مشي. وتظهر اللعبة لحظة وجود شيء **يعترض الطريق**: مربّع يعيدك، أو بطاقة تسلبك دورك، أو جسر لا تعبره إلا بستّة."
      ),
      bi(
        "So every game you design needs four things: a **goal** (how you win), **moves** (what you may do on your turn), **obstacles** (what makes it hard), and an **ending** (when it stops). Miss one and players get confused or bored.",
        "فكل لعبة تصمّمها تحتاج أربعة أمور: **هدف** (كيف تفوز)، و**حركات** (ما يجوز لك في دورك)، و**عقبات** (ما يجعلها صعبة)، و**نهاية** (متى تتوقّف). وإن نقص واحد حار اللاعبون أو ملّوا."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("What happens if a part is missing", "ماذا يحدث إن نقص جزء"),
    flow: [
      { text: bi("Give it a goal", "اجعل لها هدفاً"), tone: "force" },
      { text: bi("Say how to move", "بيّن كيف يُتحرّك"), tone: "mass" },
      { text: bi("Put something in the way", "ضع ما يعترض"), tone: "accel" },
    ],
    table: {
      head: [bi("Missing part", "الجزء الناقص"), bi("What players say", "ماذا يقول اللاعبون"), bi("Quick fix", "إصلاح سريع")],
      rows: [
        [bi("No goal", "بلا هدف"), bi("‘So… what are we doing?'", "«إذن… ماذا نفعل؟»"), bi("First to the palm tree wins", "من يبلغ النخلة أولاً يفوز")],
        [bi("No obstacles", "بلا عقبات"), bi("‘This is boring'", "«هذه مملّة»"), bi("Add three go-back squares", "أضف ثلاثة مربّعات ترجعك")],
        [bi("No ending", "بلا نهاية"), bi("‘Can we stop now?'", "«أنتوقّف الآن؟»"), bi("Ten rounds, then count points", "عشر جولات ثم عُدّ النقاط")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("How long will my game take?", "كم ستستغرق لعبتي؟"),
    paras: [
      bi(
        "A game that lasts all afternoon never gets finished, and one that ends in a minute feels like nothing happened. You can guess the length before you play by counting how far a piece moves each turn:",
        "اللعبة التي تستغرق العصر كلّه لا تُنهى أبداً، والتي تنتهي في دقيقة تبدو كأن شيئاً لم يحدث. وتستطيع تخمين طولها قبل اللعب بعدّ ما تقطعه القطعة كل دور:"
      ),
    ],
    math: ["\\text{turns} = \\frac{\\text{squares on the board}}{\\text{squares moved each turn}}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Making the board the right size", "ضبط حجم اللوحة"),
    paras: [
      bi(
        "Your board has **30 squares** and a piece moves about **3** each turn. Count up in threes: 3, 6, 9… you reach 30 after **10 turns** each. With a break of 15 minutes, that fits nicely.",
        "لوحتك فيها **٣٠ مربّعاً**، وتتحرّك القطعة نحو **٣** كل دور. عُدّ بالثلاثات: ٣، ٦، ٩… تبلغ ٣٠ بعد **١٠ أدوار** لكل لاعب. ومع استراحة من ١٥ دقيقة يناسب ذلك تماماً."
      ),
      bi(
        "Make the board **60 squares** and it becomes 20 turns each — twice as long, and friends start wandering off. Half the board, half the game.",
        "واجعل اللوحة **٦٠ مربّعاً** فتصير ٢٠ دوراً لكل لاعب — ضِعف الطول، ويبدأ الأصدقاء بالانصراف. فنصف اللوحة نصف اللعبة."
      ),
      bi(
        "Careful with go-back squares though: each one *adds* turns. Three of them can quietly turn your neat 10-turn game into a game nobody finishes — so test it with a friend before you decorate it.",
        "لكن احذر مربّعات الرجوع: فكلٌّ منها *يضيف* أدواراً. وثلاثة منها قد تحوّل بهدوء لعبتك المرتّبة ذات العشرة أدوار إلى لعبة لا يُنهيها أحد — فجرّبها مع صديق قبل أن تزيّنها."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "A board has 20 squares and pieces move about 4 a turn — how many turns each? And name one obstacle you could add to a race game about camels.",
        "لوحة فيها ٢٠ مربّعاً وتتحرّك القطع نحو ٤ في الدور — كم دوراً لكل لاعب؟ وسمِّ عقبة واحدة تضيفها إلى لعبة سباق عن الإبل."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Goal, moves, obstacles, ending — and count your board before you draw it, because the number of squares decides how long your friends stay.",
        "هدف وحركات وعقبات ونهاية — وعُدّ لوحتك قبل رسمها، فعدد المربّعات يقرّر كم يبقى أصدقاؤك."
      ),
    ],
  },
];

// ---- Flagship: Leadership · Year 4 · Responsibility & Trust ----
const LEADERSHIP_4: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Nobody decides to trust you in one day", "لا أحد يقرّر الوثوق بك في يوم"),
    paras: [
      bi(
        "People don't choose to trust you because you asked them to. They watch: did you bring back the book? did you turn up when you said? did you tell the truth when it would have been easier not to? Trust is a **running total** of small answers.",
        "لا يقرّر الناس الوثوق بك لأنك طلبت ذلك، بل يراقبون: أأعدتَ الكتاب؟ أحضرتَ في الموعد الذي قلته؟ أصدقتَ حين كان الكذب أسهل؟ فالثقة **مجموع متراكم** من إجابات صغيرة."
      ),
      bi(
        "That's why **small duties matter more than big promises**. Feeding the class fish every day says more about you than announcing you'll organise the whole trip — because everyone can see whether the fish got fed.",
        "ولهذا **المهام الصغيرة أهم من الوعود الكبيرة**. فإطعامك سمك الصف كل يوم يقول عنك أكثر من إعلانك تنظيم الرحلة كلها — لأن الجميع يرى أأُطعمت السمكة أم لا."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("What a small duty tells people", "ماذا تقول المهمة الصغيرة عنك"),
    flow: [
      { text: bi("Promise something small", "عِد بشيء صغير"), tone: "force" },
      { text: bi("Do it, every time", "افعله في كل مرّة"), tone: "mass" },
      { text: bi("Say so when you can't", "وقُل حين لا تستطيع"), tone: "accel" },
    ],
    table: {
      head: [bi("What you do", "ما تفعله"), bi("What people conclude", "ما يستنتجه الناس"), bi("Next thing they'll ask you", "ما سيطلبونه منك بعده")],
      rows: [
        [bi("Return what you borrow", "تُعيد ما تستعير"), bi("‘Things are safe with them'", "«الأشياء آمنة معه»"), bi("Something that matters more", "شيء أهمّ")],
        [bi("Finish the boring part", "تُنهي الجزء الممل"), bi("‘They don't quit halfway'", "«لا ينسحب في المنتصف»"), bi("To lead a piece of it", "أن تقود جزءاً منه")],
        [bi("Say ‘I forgot' early", "تقول «نسيت» مبكراً"), bi("‘They tell me the truth'", "«يصدقني»"), bi("To be told things first", "أن تُخبَر أولاً")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Why one broken promise costs so much", "لماذا يكلّف وعدٌ مكسور هذا الثمن"),
    paras: [
      bi(
        "**Trust is earned in drops and lost in buckets.** Keeping a promise adds a little; breaking one takes away a lot, because people don't just lose the promise — they start wondering about all the others.",
        "**الثقة تُكسب قطرة قطرة وتُفقد دفعة واحدة.** فالوفاء بوعد يضيف قليلاً، وكسره يأخذ كثيراً، لأن الناس لا يفقدون ذلك الوعد وحده، بل يبدؤون التساؤل عن البقيّة."
      ),
      bi(
        "Imagine a rough score — not a real measurement, just a way to see the shape: each promise kept is +1, each one broken is −5.",
        "تخيّل نتيجةً تقريبية — ليست قياساً حقيقياً بل طريقة لرؤية الشكل: كل وعد تفي به ‎+١، وكل وعد تكسره ‎−٥."
      ),
    ],
    math: ["\\text{trust} \\approx (\\text{promises kept}) - 5 \\times (\\text{promises broken})"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Four good weeks and one Thursday", "أربعة أسابيع جيدة وخميس واحد"),
    paras: [
      bi(
        "You promise to bring the football every day. For **four days** you do it: that's $4 \\times 1 = 4$ points. On Friday you forget: $4 - 5 = \\mathbf{-1}$ — you're *below* where you started, and the team plans without you next week.",
        "تَعِد بإحضار الكرة كل يوم. وتفعل ذلك **أربعة أيام**: أي $4 \\times 1 = 4$ نقاط. وفي الجمعة تنسى: $4 - 5 = \\mathbf{-1}$ — فتصير *دون* نقطة البداية، ويخطّط الفريق من دونك الأسبوع المقبل."
      ),
      bi(
        "That feels unfair, and it is — but it's how people actually work. It also shows the repair: you don't win it back with an apology, you win it back with **the next four days**.",
        "يبدو ذلك ظالماً، وهو كذلك — لكنه ما يفعله الناس فعلاً. وهو يُظهر العلاج أيضاً: لا تستعيدها باعتذار، بل تستعيدها بـ**الأيام الأربعة التالية**."
      ),
      bi(
        "And here's the trick good leaders use: **promise less**. Say ‘I'll bring it Sunday and Tuesday' instead of ‘every day'. A small promise you always keep beats a big one you mostly keep.",
        "وإليك حيلة القادة الجيّدين: **عِد بأقلّ**. قل «سأحضرها الأحد والثلاثاء» بدل «كل يوم». فوعد صغير تفي به دائماً خير من كبير تفي به غالباً."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "Using the rough score, what do six kept promises and one broken one come to? And name one small duty at home you could promise for a week — and actually keep.",
        "بالنتيجة التقريبية، كم يبلغ مجموع ستة وعود موفاة ووعدٍ مكسور؟ وسمِّ مهمة صغيرة في البيت تَعِد بها أسبوعاً — وتفي بها فعلاً."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Trust is a running total built from small kept promises — so promise less than you can do, say early when you can't, and repair with days rather than words.",
        "الثقة مجموع متراكم من وعود صغيرة موفاة — فعِد بأقلّ مما تستطيع، وقل مبكراً حين لا تستطيع، وأصلِح بالأيام لا بالكلام."
      ),
    ],
  },
];

// ---- Flagship: Math · Year 1 · Numbers & Patterns ----
const MATH_1: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("The last number you say is how many", "آخر عدد تقوله هو الكم"),
    paras: [
      bi(
        "Counting isn't saying ‘one, two, three' quickly. It's **touching one thing for each word you say** — one word, one thing, nothing missed and nothing counted twice.",
        "العدّ ليس قول «واحد، اثنان، ثلاثة» بسرعة. بل **أن تلمس شيئاً واحداً مع كل كلمة تقولها** — كلمة لشيء، بلا نسيان ولا تكرار."
      ),
      bi(
        "And here's the big secret: the **last word you say is how many there are**. Count your pencils forwards or backwards, start from the middle — you still get the same number. The amount doesn't change just because you counted differently.",
        "وإليك السرّ الكبير: **آخر كلمة تقولها هي عددها**. عُدّ أقلامك من الأمام أو من الخلف أو من الوسط — يبقى العدد نفسه. فالكمّية لا تتغيّر لأنك عددت بطريقة أخرى."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Patterns tell you what comes next", "الأنماط تخبرك بما يأتي"),
    flow: [
      { text: bi("Touch each one", "المس كل واحد"), tone: "force" },
      { text: bi("Say one word", "قل كلمة واحدة"), tone: "mass" },
      { text: bi("The last word is the answer", "آخر كلمة هي الجواب"), tone: "accel" },
    ],
    table: {
      head: [bi("Pattern", "النمط"), bi("What comes next?", "ما التالي؟"), bi("The rule", "القاعدة")],
      rows: [
        [bi("🔴 🔵 🔴 🔵 🔴 …", "🔴 🔵 🔴 🔵 🔴 …"), bi("🔵", "🔵"), bi("Two things taking turns", "شيئان يتناوبان")],
        [bi("2, 4, 6, 8 …", "٢، ٤، ٦، ٨ …"), bi("10", "١٠"), bi("Add two each time", "أضف اثنين كل مرّة")],
        [bi("△ △ ◻ △ △ ◻ …", "△ △ ◻ △ △ ◻ …"), bi("△", "△"), bi("A group of three repeating", "مجموعة من ثلاثة تتكرّر")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Making ten to add", "صنع العشرة للجمع"),
    paras: [
      bi(
        "Ten is the easiest number to add to, because our whole way of writing numbers is built on it. So when a sum is hard, **fill up to ten first**, then add what's left over:",
        "العشرة أسهل عدد نجمع إليه، لأن طريقتنا كلها في كتابة الأعداد مبنيّة عليها. فإذا صعبت مسألة، **أكمِل إلى عشرة أولاً** ثم أضف الباقي:"
      ),
    ],
    math: ["8 + 5 = 8 + 2 + 3 = 10 + 3 = 13"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Eight dates and five more", "ثماني تمرات وخمس أخرى"),
    paras: [
      bi(
        "You have **8 dates** and your grandmother gives you **5** more. Counting them all one by one works, but it's slow and easy to lose your place.",
        "معك **٨ تمرات** فتعطيك جدّتك **٥** أخرى. عدُّها واحدة واحدة ينجح، لكنه بطيء ويسهل أن تضيع فيه."
      ),
      bi(
        "Instead, fill up to ten: 8 needs **2** more to make 10. Take 2 from the 5 — that leaves **3**. Now it's easy: $10 + 3 = \\mathbf{13}$.",
        "بدلاً من ذلك أكمِل إلى عشرة: الثمانية تحتاج **٢** لتصير ١٠. خذ ٢ من الخمسة فيتبقّى **٣**. والآن الأمر سهل: $10 + 3 = \\mathbf{13}$."
      ),
      bi(
        "It works every time because ten is a friendly number. Try $7 + 6$: 7 needs 3, leaving 3, so $10 + 3 = 13$ again!",
        "وينجح دائماً لأن العشرة عدد ودود. جرّب $7 + 6$: السبعة تحتاج ٣، فيتبقّى ٣، فيكون $10 + 3 = 13$ ثانيةً!"
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "Use the ten trick for 9 + 4. And look at this pattern: 5, 10, 15, 20 — what comes next, and what is the rule?",
        "استخدم حيلة العشرة لـ ٩ + ٤. وانظر إلى هذا النمط: ٥، ١٠، ١٥، ٢٠ — ما التالي، وما القاعدة؟"
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "One word for one thing, and the last word is how many — then use ten as your stepping stone, and look for the rule that says what comes next.",
        "كلمة واحدة لشيء واحد، وآخر كلمة هي العدد — ثم اتّخذ العشرة درجةً تصعد عليها، وابحث عن القاعدة التي تقول ما التالي."
      ),
    ],
  },
];

// ---- Flagship: Physics · Year 1 · The World Around Us ----
const PHYSICS_1: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Science starts with noticing", "العلم يبدأ بالملاحظة"),
    paras: [
      bi(
        "A scientist is someone who **notices and then checks**. You already do it: the metal spoon feels cold and the wooden one doesn't, even though they've been sitting on the same table all morning. That's a real question hiding in your kitchen.",
        "العالِم من **يلاحظ ثم يتحقّق**. وأنت تفعل ذلك سلفاً: الملعقة المعدنية باردة والخشبية ليست كذلك، مع أنهما على الطاولة نفسها طوال الصباح. وهذا سؤال حقيقي مختبئ في مطبخك."
      ),
      bi(
        "Every push and every pull moves something in your world. Opening a door is a **pull**. Kicking a ball is a **push**. Before you know any big words, you can say what made a thing move — and that is where physics begins.",
        "وكل دفعة وكل سحبة تحرّك شيئاً في عالمك. ففتح الباب **سحب**، وركل الكرة **دفع**. وقبل أن تعرف أي كلمات كبيرة تستطيع أن تقول ما الذي حرّك الشيء — ومن هنا تبدأ الفيزياء."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Testing fairly", "الاختبار العادل"),
    flow: [
      { text: bi("Notice something", "لاحِظ شيئاً"), tone: "force" },
      { text: bi("Change one thing only", "غيّر شيئاً واحداً فقط"), tone: "mass" },
      { text: bi("Watch what happens", "وراقب ما يحدث"), tone: "accel" },
    ],
    table: {
      head: [bi("You wonder", "تتساءل"), bi("Unfair test", "اختبار غير عادل"), bi("Fair test", "اختبار عادل")],
      rows: [
        [bi("Which ball rolls further?", "أي كرة تتدحرج أبعد؟"), bi("Push one harder", "تدفع إحداهما أقوى"), bi("Let both roll down the same ramp", "دَعهما تتدحرجان من المنحدر نفسه")],
        [bi("Does wood float?", "أيطفو الخشب؟"), bi("One in a bowl, one in the sea", "واحد في وعاء وآخر في البحر"), bi("Both in the same bowl of water", "كلاهما في وعاء الماء نفسه")],
        [bi("Which coat is warmer?", "أي معطف أدفأ؟"), bi("Wear one outside, one inside", "ترتدي واحداً خارجاً وآخر داخلاً"), bi("Same weather, same day, same hour", "الطقس نفسه واليوم نفسه والساعة نفسها")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Sorting and counting what you found", "تصنيف ما وجدت وعدّه"),
    paras: [
      bi(
        "A **fair test** changes **one thing** and keeps everything else the same — otherwise you never know which change caused what. And when you've sorted your objects into two groups, counting one group tells you the other:",
        "**الاختبار العادل** يغيّر **شيئاً واحداً** ويُبقي ما عداه كما هو — وإلا لن تعرف أي تغيير سبّب ماذا. ومتى صنّفت أشياءك إلى مجموعتين، أخبرك عدُّ إحداهما بعدد الأخرى:"
      ),
    ],
    math: ["\\text{sinkers} = \\text{all objects} - \\text{floaters}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("A bowl of water and twelve things", "وعاء ماء واثنا عشر شيئاً"),
    paras: [
      bi(
        "You collect **12 things** from around the house and drop them one at a time into the same bowl. **7 float**. How many sank? $12 - 7 = \\mathbf{5}$ — you didn't even need to count them again.",
        "تجمع **١٢ شيئاً** من أرجاء البيت وتُسقطها واحداً واحداً في الوعاء نفسه. فيطفو **٧**. فكم غرق؟ $12 - 7 = \\mathbf{5}$ — ولم تحتج حتى إلى إعادة العدّ."
      ),
      bi(
        "Now look at your two groups. The floaters are mostly light-for-their-size things: a cork, a leaf, an empty bottle. The sinkers are heavy-for-their-size: a coin, a stone, a key.",
        "والآن انظر إلى مجموعتيك. فالطافيات في الغالب خفيفة قياساً بحجمها: فلّينة وورقة وقارورة فارغة. والغارقات ثقيلة قياساً بحجمها: قطعة نقود وحجر ومفتاح."
      ),
      bi(
        "Then try the surprise: an empty closed bottle floats, but fill it with water and it sinks. **Same bottle, same size** — so it can't be about size alone. Noticing that puzzle now is what makes Year 7 easy later.",
        "ثم جرّب المفاجأة: القارورة الفارغة المغلقة تطفو، فإذا ملأتها بالماء غرقت. **القارورة نفسها والحجم نفسه** — فلا يمكن أن يكون الأمر عن الحجم وحده. وملاحظتك هذا اللغز الآن هي ما يجعل السنة السابعة سهلة لاحقاً."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "You test 15 objects and 6 sink — how many floated? And is opening a drawer a push or a pull?",
        "تختبر ١٥ شيئاً فيغرق ٦ — فكم طفا؟ وهل فتح الدرج دفعٌ أم سحب؟"
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Notice something odd, change only one thing when you test it, sort what you find into groups — and let the surprises be your next question.",
        "لاحِظ أمراً غريباً، وغيّر شيئاً واحداً فقط حين تختبره، وصنّف ما تجده مجموعات — واجعل المفاجآت سؤالك التالي."
      ),
    ],
  },
];

// ---- Flagship: Geography · Year 2 · Land, Sea & Sky ----
const GEOGRAPHY_2: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("The land has shapes, and they have names", "لليابسة أشكال، ولها أسماء"),
    paras: [
      bi(
        "Look out of any window and the ground is not flat everywhere. It rises into **mountains**, dips into **valleys**, stretches into **plains**, and stops at the **coast** where the sea begins. Each shape has a name, and naming them is how a geographer starts.",
        "انظر من أي نافذة تجد الأرض ليست مستوية في كل مكان. فهي ترتفع **جبالاً**، وتنخفض **أودية**، وتمتدّ **سهولاً**، وتنتهي عند **الساحل** حيث يبدأ البحر. ولكل شكل اسم، وتسميتها هي أول ما يفعله الجغرافي."
      ),
      bi(
        "Above all those shapes the sky keeps changing. **Weather** is what the sky is doing today — hot, windy, rainy. The **seasons** are the bigger pattern the weather follows all year round.",
        "وفوق تلك الأشكال كلها تتبدّل السماء دوماً. فـ**الطقس** ما تفعله السماء اليوم — حرّ أو ريح أو مطر. و**الفصول** هي النمط الأكبر الذي يتبعه الطقس على مدار السنة."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Naming what you can see", "تسمية ما تراه"),
    flow: [
      { text: bi("Look at the shape", "انظر إلى الشكل"), tone: "force" },
      { text: bi("Give it its name", "أعطِه اسمه"), tone: "mass" },
      { text: bi("Ask why it's there", "واسأل لماذا هو هناك"), tone: "accel" },
    ],
    table: {
      head: [bi("Shape", "الشكل"), bi("What it looks like", "كيف يبدو"), bi("Name", "الاسم")],
      rows: [
        [bi("Land much higher than around it", "أرض أعلى بكثير ممّا حولها"), bi("Rocky, cool at the top", "صخري وبارد في أعلاه"), bi("Mountain", "جبل")],
        [bi("Low land between two high parts", "أرض منخفضة بين مرتفعين"), bi("Often green, sometimes a river", "غالباً خضراء وفيها نهر أحياناً"), bi("Valley", "وادٍ")],
        [bi("Where land meets the sea", "حيث تلتقي اليابسة بالبحر"), bi("Sand or rocks, waves", "رمل أو صخر وأمواج"), bi("Coast", "ساحل")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Why deserts are hot AND cold", "لماذا الصحراء حارّة وباردة معاً"),
    paras: [
      bi(
        "A **desert** is land that gets very little rain. With almost no clouds, the sun pours straight down by day — and at night the heat escapes just as easily, because there are no clouds to hold it in.",
        "**الصحراء** أرض قليلة المطر جداً. ومع انعدام الغيوم تقريباً تصبّ الشمس أشعتها نهاراً — وفي الليل تهرب الحرارة بالسهولة نفسها، إذ لا غيوم تحبسها."
      ),
      bi(
        "So you can measure how big that daily swing is by subtracting (real deserts vary a lot from day to day — this is just how you'd measure yours):",
        "فتستطيع قياس مقدار ذلك التبدّل اليومي بالطرح (والصحارى الحقيقية تختلف كثيراً من يوم لآخر — وهذه طريقة قياس صحرائك فحسب):"
      ),
    ],
    math: ["\\text{swing} = \\text{day temperature} - \\text{night temperature}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("A day and a night in the desert", "يوم وليلة في الصحراء"),
    paras: [
      bi(
        "One afternoon the thermometer reads **42°C**. That same night it reads **18°C**. The swing is $42 - 18 = \\mathbf{24}$ degrees — in one day!",
        "بعد ظهر أحد الأيام يسجّل المِقياس **٤٢°م**. وفي الليلة نفسها يسجّل **١٨°م**. فالتبدّل $42 - 18 = \\mathbf{24}$ درجة — في يوم واحد!"
      ),
      bi(
        "Now compare a day by the coast: **34°C** in the afternoon, **28°C** at night — a swing of only $34 - 28 = \\mathbf{6}$ degrees. The sea heats up and cools down slowly, so it keeps the coast steady.",
        "والآن قارن يوماً على الساحل: **٣٤°م** بعد الظهر و**٢٨°م** ليلاً — أي تبدّل $34 - 28 = \\mathbf{6}$ درجات فقط. فالبحر يسخن ويبرد ببطء، فيُبقي الساحل معتدلاً."
      ),
      bi(
        "That's why desert travellers carry a warm cloak in summer, and why so many towns grew on coasts and at oases — the water nearby makes life gentler.",
        "ولهذا يحمل مسافر الصحراء عباءة دافئة في الصيف، ولهذا نشأت بلدات كثيرة على السواحل وعند الواحات — فالماء القريب يجعل الحياة ألطف."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "If the day is 39°C and the night is 21°C, what is the swing? And what do we call low land lying between two mountains?",
        "إن كان النهار ٣٩°م والليل ٢١°م، فكم التبدّل؟ وماذا نسمّي الأرض المنخفضة بين جبلين؟"
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Land has named shapes — mountain, valley, plain, coast — weather is today while seasons are the year's pattern, and water nearby keeps a place from swinging hot to cold.",
        "لليابسة أشكال مسمّاة — جبل ووادٍ وسهل وساحل — والطقس هو اليوم بينما الفصول نمط السنة، والماء القريب يمنع المكان من التأرجح بين الحرّ والبرد."
      ),
    ],
  },
];

// ---- Flagship: AI · Year 2 · Giving Instructions ----
const AI_2: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("A machine does what you SAY, not what you mean", "الآلة تفعل ما تقوله لا ما تقصده"),
    paras: [
      bi(
        "Tell a friend ‘make me a sandwich' and they know what you mean. Tell a robot the same and nothing happens — it needs every step: **take the bread, open the jar, spread the jam, close the bread**.",
        "قل لصديقك «اصنع لي شطيرة» فيفهم قصدك. وقل ذلك لروبوت فلا يحدث شيء — إذ يحتاج كل خطوة: **خذ الخبز، افتح المرطبان، وزّع المربّى، أغلِق الخبز**."
      ),
      bi(
        "A list of steps exact enough for a machine to follow is called an **algorithm**. And machines are painfully honest: if you leave out ‘open the jar', the robot will try to spread jam through a closed lid — and it will be **your instruction** that was wrong, not the robot.",
        "وقائمة الخطوات الدقيقة بما يكفي لتتبعها آلة تُسمّى **خوارزمية**. والآلات صادقة بشكل مؤلم: فإن أسقطت «افتح المرطبان» حاول الروبوت توزيع المربّى عبر غطاء مغلق — وستكون **تعليمتك** هي الخاطئة لا الروبوت."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Same words, wrong order", "الكلمات نفسها بترتيب خاطئ"),
    flow: [
      { text: bi("Say every step", "قل كل خطوة"), tone: "force" },
      { text: bi("Put them in order", "رتّبها"), tone: "mass" },
      { text: bi("Test and fix", "اختبر وأصلِح"), tone: "accel" },
    ],
    table: {
      head: [bi("You said", "قلتَ"), bi("The robot did", "فعل الروبوت"), bi("You meant", "قصدتَ")],
      rows: [
        [bi("‘Put on your shoes and socks'", "«البس حذاءك وجواربك»"), bi("Shoes first, socks on top", "الحذاء أولاً ثم الجوارب فوقه"), bi("Socks, then shoes", "الجوارب ثم الحذاء")],
        [bi("‘Walk to the door'", "«امشِ إلى الباب»"), bi("Walked into the table", "اصطدم بالطاولة"), bi("Walk around things", "امشِ متجنّباً الأشياء")],
        [bi("‘Add sugar'", "«أضف سكراً»"), bi("Poured the whole bag", "سكب الكيس كلّه"), bi("One spoon", "ملعقة واحدة")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Repeating without writing it twice", "التكرار دون كتابته مرّتين"),
    paras: [
      bi(
        "When steps repeat, you don't write them again — you say **‘repeat this N times'**. That's a **loop**, and it saves you from copying the same line over and over. To know how far the robot travels, multiply:",
        "حين تتكرّر الخطوات فلا تكتبها ثانية، بل تقول **«كرّر هذا N مرّة»**. وهذه **حلقة**، تُغنيك عن نسخ السطر نفسه مراراً. ولتعرف كم يقطع الروبوت، اضرب:"
      ),
    ],
    math: ["\\text{total steps} = \\text{repeats} \\times \\text{steps each time}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Walking a robot round a square", "تسيير روبوت حول مربّع"),
    paras: [
      bi(
        "You want the robot to walk a square. Write it long: forward 3, turn right, forward 3, turn right, forward 3, turn right, forward 3, turn right. Or write it short: **repeat 4 times (forward 3, turn right)**.",
        "تريد للروبوت أن يمشي مربّعاً. اكتبها طويلة: تقدّم ٣، در يميناً، تقدّم ٣، در يميناً، تقدّم ٣، در يميناً، تقدّم ٣، در يميناً. أو اكتبها قصيرة: **كرّر ٤ مرّات (تقدّم ٣، در يميناً)**."
      ),
      bi(
        "How many steps forward altogether? $4 \\times 3 = \\mathbf{12}$. And notice the loop is much shorter to write — and much easier to change: to make a bigger square you edit **one** number instead of four.",
        "فكم خطوة إلى الأمام إجمالاً؟ $4 \\times 3 = \\mathbf{12}$. ولاحظ أن الحلقة أقصر كتابةً — وأسهل تعديلاً: فلتكبير المربّع تغيّر **رقماً واحداً** بدل أربعة."
      ),
      bi(
        "Now the bug hunt: if you forget the last ‘turn right', the robot stops facing the wrong way. It followed you perfectly — which is exactly why **finding the bug means re-reading your own instructions**, not blaming the machine.",
        "والآن مطاردة الخلل: إن نسيت «در يميناً» الأخيرة توقّف الروبوت في اتجاه خاطئ. وقد اتّبعك تماماً — ولهذا بالذات فإن **اكتشاف الخلل يعني إعادة قراءة تعليماتك أنت**، لا لوم الآلة."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "‘Repeat 5 times (forward 2)' — how many steps is that? And write three exact steps for brushing your teeth, in the right order.",
        "«كرّر ٥ مرّات (تقدّم ٢)» — كم خطوة؟ واكتب ثلاث خطوات دقيقة لتنظيف أسنانك بالترتيب الصحيح."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Machines follow exactly what you wrote, in the order you wrote it — so spell out every step, use a repeat instead of copying, and when it goes wrong re-read your instructions first.",
        "تتبع الآلات ما كتبته تماماً وبالترتيب الذي كتبته — فبيّن كل خطوة، واستخدم التكرار بدل النسخ، وإذا أخفق فأعد قراءة تعليماتك أولاً."
      ),
    ],
  },
];

// ---- Flagship: Languages · Year 1 · Sounds & First Words ----
const LANGUAGES_1: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("A language is a music before it is a lesson", "اللغة موسيقى قبل أن تكون درساً"),
    paras: [
      bi(
        "Before you knew a single rule, you learned to speak by **copying sounds** you heard. That is still how it works. A new language isn't a wall of words — it's a new tune your mouth can learn to hum.",
        "قبل أن تعرف قاعدة واحدة تعلّمت الكلام بـ**تقليد الأصوات** التي سمعتها. وهكذا يجري الأمر إلى اليوم. فاللغة الجديدة ليست جداراً من الكلمات، بل لحنٌ جديد يستطيع فمك أن يتعلّم ترديده."
      ),
      bi(
        "So start with the words people actually say to each other every day: **hello, thank you, please, my name is…**. Say one of them to a real person and something wonderful happens — they answer, and you understood.",
        "فابدأ بالكلمات التي يقولها الناس فعلاً كل يوم: **مرحباً، شكراً، من فضلك، اسمي…**. وقل واحدة منها لشخص حقيقي فيحدث أمر جميل — يجيبك، وتكون قد فهمت."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Hello around the world", "مرحباً حول العالم"),
    flow: [
      { text: bi("Listen carefully", "استمع جيداً"), tone: "force" },
      { text: bi("Copy the sound", "قلّد الصوت"), tone: "mass" },
      { text: bi("Say it to someone", "وقُلها لأحد"), tone: "accel" },
    ],
    table: {
      head: [bi("Language", "اللغة"), bi("Hello", "مرحباً"), bi("It sounds like", "يُلفظ")],
      rows: [
        [bi("English", "الإنجليزية"), bi("Hello", "Hello"), bi("heh-LOH", "هِلـ‍وْ")],
        [bi("French", "الفرنسية"), bi("Bonjour", "Bonjour"), bi("bon-ZHOOR", "بونجور")],
        [bi("Swahili", "السواحيلية"), bi("Jambo", "Jambo"), bi("JAM-bo", "جامبو")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("A few words every day", "كلمات قليلة كل يوم"),
    paras: [
      bi(
        "Nobody learns a language in one afternoon, and nobody needs to. **A few words every day** beats a hundred words once, because your brain keeps what it meets again and again. To see how fast it adds up, multiply:",
        "لا أحد يتعلّم لغة في عصر واحد، ولا حاجة إلى ذلك. **كلمات قليلة كل يوم** تتفوّق على مئة كلمة مرّة واحدة، لأن عقلك يحتفظ بما يلقاه مراراً. ولترى كم تتراكم بسرعة، اضرب:"
      ),
    ],
    math: ["\\text{words} = \\text{words each day} \\times \\text{days}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("Two words a day", "كلمتان كل يوم"),
    paras: [
      bi(
        "Learn just **2 words a day** for one week. Count in twos: 2, 4, 6, 8, 10, 12, 14 — that's $2 \\times 7 = \\mathbf{14}$ words, more than the days in the week!",
        "تعلّم **كلمتين فقط كل يوم** لأسبوع واحد. عُدّ بالاثنينات: ٢، ٤، ٦، ٨، ١٠، ١٢، ١٤ — أي $2 \\times 7 = \\mathbf{14}$ كلمة، أكثر من أيام الأسبوع!"
      ),
      bi(
        "And here is the trick that makes them stick: **put them in a song**. A tune carries words along with it — that's why you can sing a whole rhyme you never sat down to memorise.",
        "وإليك الحيلة التي تُثبّتها: **ضعها في أغنية**. فاللحن يحمل الكلمات معه — ولهذا تستطيع إنشاد نشيد كامل لم تجلس لحفظه قط."
      ),
      bi(
        "Try it: sing your two new words to a tune you already know, then teach them to someone at home. Teaching a word is the fastest way to keep it.",
        "جرّب: غنِّ كلمتيك الجديدتين على لحن تعرفه، ثم علّمهما أحداً في البيت. فتعليم الكلمة أسرع طريقة للاحتفاظ بها."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "If you learn 3 words a day for 5 days, how many words is that? And say ‘hello' out loud in two languages that aren't your own.",
        "إن تعلّمت ٣ كلمات يومياً لخمسة أيام، فكم كلمة؟ وقل «مرحباً» بصوت عالٍ بلغتين غير لغتك."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Copy the sounds first, start with the words people say every day, learn a few each day rather than many at once — and sing them so they stay.",
        "قلّد الأصوات أولاً، وابدأ بالكلمات التي يقولها الناس كل يوم، وتعلّم قليلاً كل يوم لا كثيراً دفعةً واحدة — وغنِّها لتبقى."
      ),
    ],
  },
];

// ---- Flagship: Emotional Intelligence · Year 1 · Naming Feelings ----
// Age ~6. The maths stays inside counting-to-ten territory on purpose: the
// diary card is a real reason to count, not a maths lesson smuggled in.
const EQ_1: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Feelings are visitors, not owners", "المشاعر ضيوف لا أصحاب بيت"),
    paras: [
      bi(
        "A feeling is something that **visits** you. It knocks, it comes in, it sits with you for a while — and then it goes again. Happy visits. Sad visits. Angry visits. None of them moves in forever.",
        "الشعور شيء **يزورك**. يطرق الباب، ويدخل، ويجلس معك قليلاً — ثم يمضي. يزورك الفرح، ويزورك الحزن، ويزورك الغضب. ولا أحد منهم يسكن عندك للأبد."
      ),
      bi(
        "And here is the magic: the moment you **say its name** out loud — *‘I feel angry'* — the feeling gets a little smaller. A visitor with a name is much easier to sit with than a stranger you can't describe.",
        "وإليك السحر: في اللحظة التي **تقول فيها اسمه** بصوت مسموع — *«أنا غاضب»* — يصغر الشعور قليلاً. فالضيف الذي تعرف اسمه أسهل من غريب لا تستطيع وصفه."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Your body tells you first", "جسدك يخبرك أولاً"),
    flow: [
      { text: bi("Feel it in your body", "اشعر به في جسدك"), tone: "force" },
      { text: bi("Say its name", "قل اسمه"), tone: "mass" },
      { text: bi("Choose what to do", "اختر ماذا تفعل"), tone: "accel" },
    ],
    table: {
      head: [bi("Feeling", "الشعور"), bi("Where you might feel it", "أين قد تشعر به"), bi("It may be saying", "قد يقول لك")],
      rows: [
        [bi("Happy", "فرِح"), bi("Light chest, quick feet", "صدر خفيف وقدمان سريعتان"), bi("More of this, please", "المزيد من هذا من فضلك")],
        [bi("Sad", "حزين"), bi("Heavy eyes, slow body", "عينان ثقيلتان وجسد بطيء"), bi("Something mattered to me", "شيء ما كان يهمّني")],
        [bi("Angry", "غاضب"), bi("Hot face, tight hands", "وجه ساخن ويدان مشدودتان"), bi("That felt unfair", "هذا بدا ظالماً")],
        [bi("Scared", "خائف"), bi("Fast heart, tummy flip", "قلب سريع ومعدة تنقلب"), bi("Careful here", "انتبه هنا")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("A diary you can count", "دفتر تستطيع عدّه"),
    paras: [
      bi(
        "A **feelings diary** is a page where you draw or write one feeling you had. Do it **once in the morning and once at night**, and by the end of five days you can count how many you have caught:",
        "**دفتر المشاعر** صفحة ترسم فيها أو تكتب شعوراً واحداً مرّ بك. افعلها **مرّة في الصباح ومرّة في الليل**، وبعد خمسة أيام تستطيع أن تعدّ كم شعوراً اصطدت:"
      ),
    ],
    math: ["\\text{feelings named} = 2 \\times \\text{days}"],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("One real moment, step by step", "لحظة حقيقية، خطوة بخطوة"),
    paras: [
      bi(
        "You build a tall tower of blocks. Your little brother runs past and knocks it over. Your face goes hot and your hands squeeze shut.",
        "تبني برجاً عالياً من المكعّبات. يمرّ أخوك الصغير راكضاً فيسقطه. يسخن وجهك وتنغلق يداك بقوّة."
      ),
      bi(
        "**Feel it:** hot face, tight hands. **Name it:** *‘I feel angry, because I worked hard on that.'* **Choose:** breathe out slowly — one, two, three — then ask for help to build it again.",
        "**اشعر به:** وجه ساخن ويدان مشدودتان. **سمِّه:** *«أنا غاضب، لأنني تعبت عليه».* **اختر:** ازفر ببطء — واحد، اثنان، ثلاثة — ثم اطلب المساعدة لبنائه من جديد."
      ),
      bi(
        "Now count the diary. Two feelings a day for five days: 2, 4, 6, 8, 10 — that is $2 \\times 5 = \\mathbf{10}$ feelings you can already name. Ten is a lot for one small week!",
        "والآن عُدّ الدفتر. شعوران كل يوم لخمسة أيام: ٢، ٤، ٦، ٨، ١٠ — أي $2 \\times 5 = \\mathbf{10}$ مشاعر تعرف تسميتها. وعشرة كثير في أسبوع صغير!"
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "Someone hides your favourite toy and laughs. Where do you feel it in your body, and what is the feeling's name? Then say the whole sentence: *‘I feel ___ because ___.'*",
        "يخبّئ أحدهم لعبتك المفضّلة ويضحك. أين تشعر بذلك في جسدك، وما اسم الشعور؟ ثم قل الجملة كاملة: *«أشعر بـ ___ لأن ___».*"
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Every feeling is a visitor that comes and goes — feel it in your body, say its name, and only then choose what to do.",
        "كل شعور ضيف يأتي ويمضي — اشعر به في جسدك، وقل اسمه، وعندها فقط اختر ماذا تفعل."
      ),
    ],
  },
];

// ---- Flagship: Entrepreneurship · Year 10 · Launch Your Venture ----
// Capstone year. The runway formula is the one piece of arithmetic that decides
// whether a launch survives, so it carries the Formal Definition card.
const ENTREPRENEURSHIP_10: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("Launch is when the guessing stops", "الإطلاق حين يتوقّف التخمين"),
    paras: [
      bi(
        "Everything before launch is an opinion. The interviews, the plan, the beautiful deck — all of it is **your best guess about strangers**. Launch is the first day the world is allowed to answer, and its answer outranks every guess you made.",
        "كل ما يسبق الإطلاق رأي. المقابلات والخطة والعرض الأنيق — كلها **أفضل تخمينك عن غرباء**. والإطلاق أول يوم يُسمح فيه للعالم بالجواب، وجوابه يعلو على كل تخمين قدّمته."
      ),
      bi(
        "So launch **small and early**, on purpose. A quiet launch to thirty real people teaches you more than three more months of planning — and it teaches it while you still have the time and money to act on what you learn.",
        "فأطلق **صغيراً ومبكراً**، عن قصد. فإطلاق هادئ لثلاثين شخصاً حقيقياً يعلّمك أكثر من ثلاثة أشهر إضافية من التخطيط — ويعلّمك إياه ولديك بعدُ وقتٌ ومالٌ للتصرّف بما تعلّمت."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("The four gates, and who pays for each", "البوابات الأربع، ومن يموّل كلاً منها"),
    flow: [
      { text: bi("Research", "بحث"), tone: "force" },
      { text: bi("MVP", "منتج أوّلي"), tone: "mass" },
      { text: bi("Pitch", "عرض"), tone: "mass" },
      { text: bi("Launch", "إطلاق"), tone: "accel" },
    ],
    table: {
      head: [bi("Funding path", "مسار التمويل"), bi("What you give up", "ما تتنازل عنه"), bi("Usually fits when", "يناسب عادةً حين")],
      rows: [
        [bi("Your own savings", "مدّخراتك"), bi("Nothing but your risk", "لا شيء سوى مخاطرتك"), bi("The first MVP is cheap", "يكون المنتج الأوّلي رخيصاً")],
        [bi("Family & friends", "العائلة والأصدقاء"), bi("A relationship, if it fails", "علاقة، إن أخفق المشروع"), bi("You can explain the risk honestly", "تستطيع شرح المخاطرة بصدق")],
        [bi("Grant or accelerator", "منحة أو مسرّعة"), bi("Time, reporting, sometimes equity", "وقتاً وتقارير وأحياناً حصّة"), bi("You need mentors more than cash", "تحتاج مرشدين أكثر من المال")],
        [bi("Angel investor", "مستثمر ملاك"), bi("A slice of ownership", "شريحة من الملكية"), bi("Customers already repeat", "يعود العملاء فعلاً")],
        [bi("Venture capital", "رأس مال جريء"), bi("Ownership and control", "الملكية والسيطرة"), bi("Growth is proven and fast", "يكون النمو مثبتاً وسريعاً")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Runway — the number that sets your deadline", "المدرج — الرقم الذي يحدّد مهلتك"),
    paras: [
      bi(
        "**Burn** is what you spend each month; **runway** is how many months of it your cash can survive. Runway is not a financial detail — it is the real deadline behind every decision you make after launch.",
        "**الحرق** ما تنفقه كل شهر، و**المدرج** عدد الأشهر التي يصمد فيها نقدك. والمدرج ليس تفصيلاً مالياً، بل هو المهلة الحقيقية خلف كل قرار تتخذه بعد الإطلاق."
      ),
    ],
    math: [
      "\\text{runway (months)} = \\frac{\\text{cash on hand}}{\\text{monthly burn} - \\text{monthly revenue}}",
    ],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("A student venture, counted honestly", "مشروع طالب، محسوب بصدق"),
    paras: [
      bi(
        "You launch a weekend tutoring service. You have **9,000** saved, you spend **1,500** a month (materials, transport, a small ad budget), and in month one you earn **600**. The currency doesn't matter — the arithmetic is the same everywhere.",
        "تُطلق خدمة دروس في العطلة. لديك **٩٠٠٠** مدّخرة، وتنفق **١٥٠٠** شهرياً (مواد ومواصلات وميزانية إعلان صغيرة)، وتكسب في الشهر الأول **٦٠٠**. والعملة لا تهمّ — فالحساب نفسه في كل مكان."
      ),
      bi(
        "Net burn is $1500 - 600 = 900$ a month, so $\\text{runway} = 9000 \\div 900 = \\mathbf{10}$ months. Now raise revenue to 1,100: net burn falls to 400 and runway stretches to $9000 \\div 400 = \\mathbf{22.5}$ months. **A 500 rise in revenue bought you more than a year** — which is why founders chase revenue before they chase investors.",
        "صافي الحرق $1500 - 600 = 900$ شهرياً، إذاً $\\text{المدرج} = 9000 \\div 900 = \\mathbf{10}$ أشهر. والآن ارفع الإيراد إلى ١١٠٠: يهبط صافي الحرق إلى ٤٠٠ ويمتدّ المدرج إلى $9000 \\div 400 = \\mathbf{22.5}$ شهراً. **زيادة ٥٠٠ في الإيراد اشترت لك أكثر من سنة** — ولهذا يلاحق المؤسّسون الإيراد قبل أن يلاحقوا المستثمرين."
      ),
      bi(
        "These numbers are an illustration, not a forecast — the point is the shape of the curve, not the digits. And the region has real places to take a venture next: Hub71 and in5 in the UAE, Monsha'at in Saudi Arabia, Berytech in Lebanon, Oasis500 in Jordan. Their terms and programmes change, so check each one directly before you plan around it.",
        "هذه الأرقام توضيحية لا تنبؤية — فالمقصود شكل المنحنى لا الأرقام. وفي المنطقة أماكن حقيقية تأخذ إليها مشروعك: «حب ٧١» و«in5» في الإمارات، و«منشآت» في السعودية، و«بيريتك» في لبنان، و«أويسس ٥٠٠» في الأردن. وشروطها وبرامجها تتغيّر، فتحقّق من كل منها مباشرة قبل أن تبني خطتك عليها."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "You hold 12,000, burn 2,000 a month and earn 800. What is your runway? Then say which is worth more to you next month: cutting 400 of spending, or adding 400 of revenue — and why they are not the same thing.",
        "تملك ١٢٠٠٠، وتحرق ٢٠٠٠ شهرياً، وتكسب ٨٠٠. فما مدرجك؟ ثم قل أيّهما أثمن لك الشهر القادم: خفض ٤٠٠ من الإنفاق أم إضافة ٤٠٠ إلى الإيراد — ولماذا ليسا الشيء نفسه."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Launch early and small so the world can correct you while you can still afford it — and know your runway, because it is the deadline every other decision answers to.",
        "أطلق مبكراً وصغيراً ليصحّحك العالم وأنت قادر بعدُ على التصحيح — واعرف مدرجك، فهو المهلة التي تخضع لها كل قراراتك الأخرى."
      ),
    ],
  },
];

// ---- Flagship: Problem Solving · Year 5 · Logic & Clues ----
// Age ~10-11. The truth table earns its place here: "or" meaning *at least one*
// is the single idea that trips learners up for years afterwards.
const PROBLEM_SOLVING_5: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("‘Maybe' is a real answer", "«ربما» جواب حقيقي"),
    paras: [
      bi(
        "Logic asks one question about every statement: **can I prove it from what I already know?** If yes, it's true. If it contradicts what I know, it's false. And if neither — it's **maybe**, which is an honest answer, not a failed one.",
        "يسأل المنطق سؤالاً واحداً عن كل عبارة: **هل أستطيع إثباتها ممّا أعرفه؟** فإن استطعت فهي صواب. وإن ناقضت ما أعرفه فهي خطأ. وإن لم يكن هذا ولا ذاك فهي **ربما** — وهو جواب صادق لا جواب فاشل."
      ),
      bi(
        "Most wrong answers aren't wrong reasoning — they're **‘maybe' upgraded to ‘true'** because it felt likely. A detective who guesses is just a person with an opinion.",
        "معظم الأجوبة الخاطئة ليست استدلالاً خاطئاً، بل **«ربما» رُقِّيت إلى «صواب»** لأنها بدت مرجّحة. والمحقّق الذي يخمّن مجرّد شخص لديه رأي."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("What ‘and' and ‘or' really mean", "ما تعنيه «و» و«أو» حقاً"),
    flow: [
      { text: bi("List what's certain", "اسرد ما هو مؤكّد"), tone: "force" },
      { text: bi("Cross out the impossible", "اشطب المستحيل"), tone: "mass" },
      { text: bi("What's left is true", "ما بقي هو الصواب"), tone: "accel" },
    ],
    table: {
      head: [bi("A", "أ"), bi("B", "ب"), bi("A and B", "أ و ب"), bi("A or B", "أ أو ب")],
      rows: [
        [bi("true", "صواب"), bi("true", "صواب"), bi("true", "صواب"), bi("true", "صواب")],
        [bi("true", "صواب"), bi("false", "خطأ"), bi("false", "خطأ"), bi("true", "صواب")],
        [bi("false", "خطأ"), bi("true", "صواب"), bi("false", "خطأ"), bi("true", "صواب")],
        [bi("false", "خطأ"), bi("false", "خطأ"), bi("false", "خطأ"), bi("false", "خطأ")],
      ],
    },
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Three little words with exact jobs", "ثلاث كلمات صغيرة بمهام دقيقة"),
    paras: [
      bi(
        "Logic writes ‘and', ‘or' and ‘not' as symbols so nobody can argue about what was meant:",
        "يكتب المنطق «و» و«أو» و«ليس» رموزاً حتى لا يختلف أحد على المقصود:"
      ),
      bi(
        "The trap is **‘or'**. In everyday speech ‘tea or coffee?' means *pick one*. In logic, ‘or' is true when **at least one** is true — including both. So ‘she plays chess or swims' stays true for someone who does both.",
        "والفخّ هو **«أو»**. ففي الكلام اليومي «شاي أم قهوة؟» تعني *اختر واحداً*. أما في المنطق فـ«أو» صواب حين يكون **واحد على الأقل** صواباً — بما في ذلك كلاهما. فقولك «تلعب الشطرنج أو تسبح» يظلّ صواباً لمن تفعل الاثنتين."
      ),
    ],
    math: [
      "A \\land B \\;\\;\\text{(and)} \\qquad A \\lor B \\;\\;\\text{(or)} \\qquad \\lnot A \\;\\;\\text{(not)}",
      "A \\lor B \\;\\text{ is true when } \\textbf{at least one} \\text{ is true}",
    ],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("An elimination grid, solved", "شبكة استبعاد، محلولة"),
    paras: [
      bi(
        "Salma, Yusuf and Dana each joined a different club: chess, swimming or art. **Clue 1:** Dana is not in art. **Clue 2:** Yusuf is in neither art nor swimming.",
        "انضمّ كلٌّ من سلمى ويوسف ودانة إلى ناد مختلف: الشطرنج أو السباحة أو الرسم. **القرينة ١:** دانة ليست في الرسم. **القرينة ٢:** يوسف ليس في الرسم ولا في السباحة."
      ),
      bi(
        "Start with the clue that removes the most. Clue 2 leaves Yusuf only one option, so **Yusuf → chess**. Chess is now taken, and clue 1 rules out art for Dana, so **Dana → swimming**. Only art is left, so **Salma → art**. Notice you never needed a clue about Salma at all.",
        "ابدأ بالقرينة التي تحذف الأكثر. فالقرينة ٢ لا تترك ليوسف إلا خياراً واحداً، إذاً **يوسف ← الشطرنج**. وقد شُغل الشطرنج، والقرينة ١ تستبعد الرسم عن دانة، إذاً **دانة ← السباحة**. ولم يبقَ إلا الرسم، إذاً **سلمى ← الرسم**. ولاحظ أنك لم تحتج قرينة عن سلمى إطلاقاً."
      ),
      bi(
        "Now the trick question: *‘A farmer has 12 sheep and all but 7 run away. How many are left?'* Read the exact words, not the shape of the question — ‘all but 7' **is** the answer: **7**. Trick questions don't test cleverness; they test whether you slowed down.",
        "والآن السؤال الخادع: *«لدى مزارع ١٢ خروفاً، وهربت كلّها إلا ٧. فكم بقي؟»* اقرأ الكلمات بدقّة لا شكل السؤال — فـ«كلها إلا ٧» **هي** الجواب: **٧**. والأسئلة الخادعة لا تختبر الذكاء، بل تختبر هل تمهّلت."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "‘Omar has a cat or a dog' — is that true for someone who has both? And if you know only ‘Layla is not in the red team', can you say which team she *is* in, or is the honest answer ‘maybe'?",
        "«عمر لديه قطة أو كلب» — أصوابٌ هذا لمن يملك الاثنين؟ وإن كنت تعرف فقط أن «ليلى ليست في الفريق الأحمر»، أتستطيع تحديد فريقها، أم أن الجواب الصادق «ربما»؟"
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Prove it, disprove it, or say ‘maybe' — cross out the impossible before you guess, and remember that ‘or' means at least one.",
        "أثبتها أو ادحضها أو قل «ربما» — اشطب المستحيل قبل أن تخمّن، وتذكّر أن «أو» تعني واحداً على الأقل."
      ),
    ],
  },
];

// ---- Flagship: Gaming · Year 6 · Art & Sound ----
// Age ~11-12. The pixel-count arithmetic is the honest reason pixel artists
// work small, so it carries the Formal Definition card.
const GAMING_6: NoteCard[] = [
  {
    icon: "📖",
    label: bi("Simple Explanation", "شرح مبسّط"),
    sub: bi("The player feels the game before they read it", "يشعر اللاعب باللعبة قبل أن يقرأها"),
    paras: [
      bi(
        "Long before a player understands your rules, the **colours and the sound have already told them how to feel**: safe or hunted, playful or serious, morning or midnight. Art isn't decoration on top of a game — it is the first instruction the game gives.",
        "قبل أن يفهم اللاعب قواعدك بوقت طويل، تكون **الألوان والأصوات قد أخبرته كيف يشعر**: آمن أم مُطارَد، مرح أم جادّ، صباح أم منتصف ليل. فالفنّ ليس زينة فوق اللعبة، بل أول تعليمة تعطيها اللعبة."
      ),
      bi(
        "That's why **consistency beats quality**. One simple style used everywhere looks like a world; beautiful pieces in three different styles look like a folder of files.",
        "ولهذا **الاتّساق يتقدّم على الإتقان**. فأسلوب بسيط واحد مستعمل في كل مكان يبدو عالماً؛ أما قطع جميلة بثلاثة أساليب فتبدو مجلّد ملفات."
      ),
    ],
  },
  {
    icon: "🗺️",
    label: bi("Visual Representation", "تمثيل بصري"),
    sub: bi("Colour, mood and what players expect", "اللون والمزاج وما يتوقّعه اللاعب"),
    flow: [
      { text: bi("Choose the mood", "اختر المزاج"), tone: "force" },
      { text: bi("Pick a small palette", "اختر لوحة صغيرة"), tone: "mass" },
      { text: bi("Match the sound", "طابِق الصوت"), tone: "accel" },
    ],
    table: {
      head: [bi("Colour", "اللون"), bi("Common feeling", "الشعور الشائع"), bi("Players often expect", "يتوقّع اللاعبون غالباً")],
      rows: [
        [bi("Warm sand / gold", "رملي دافئ / ذهبي"), bi("Safe, home", "أمان، بيت"), bi("A town, a save point", "بلدة أو نقطة حفظ")],
        [bi("Deep blue", "أزرق غامق"), bi("Night, cold, alone", "ليل، برد، وحدة"), bi("Slower, careful play", "لعب أبطأ وأكثر حذراً")],
        [bi("Green", "أخضر"), bi("Growth, life", "نموّ وحياة"), bi("Healing, nature", "شفاء أو طبيعة")],
        [bi("Sharp red", "أحمر حادّ"), bi("Danger, urgency", "خطر واستعجال"), bi("Damage, a timer", "ضرر أو مؤقّت")],
      ],
    },
    paras: [
      bi(
        "These are **conventions, not rules** — they come from games and films players have already seen, and they differ between cultures. White means mourning in some places and weddings in others. Use the convention, or break it on purpose and teach the player the new meaning early.",
        "هذه **أعراف لا قوانين** — مصدرها ألعاب وأفلام رآها اللاعبون سلفاً، وتختلف بين الثقافات. فالأبيض حِداد في أماكن وزفاف في أخرى. استعمل العُرف، أو اكسره عن قصد وعلّم اللاعب المعنى الجديد مبكراً."
      ),
    ],
  },
  {
    icon: "🎯",
    label: bi("Formal Definition", "التعريف الرسمي"),
    sub: bi("Why pixel artists work small", "لماذا يعمل فنّانو البكسل بمساحات صغيرة"),
    paras: [
      bi(
        "A sprite is a grid, and every square is a decision you have to make by hand. The count grows with **both** sides at once, so doubling the width doubles the height's work too:",
        "الكائن شبكة، وكل مربّع قرار تتّخذه بيدك. والعدد يكبر بـ**الضلعين معاً**، فمضاعفة العرض تضاعف عمل الطول أيضاً:"
      ),
    ],
    math: [
      "\\text{pixels} = \\text{width} \\times \\text{height}",
      "16 \\times 16 = 256 \\qquad 64 \\times 64 = 4096",
    ],
  },
  {
    icon: "✏️",
    label: bi("Worked Example", "مثال محلول"),
    sub: bi("An oasis scene, decided on purpose", "مشهد واحة، مقرَّر عن قصد"),
    paras: [
      bi(
        "You're making a desert-oasis level. **Mood:** relief after a hard crossing. **Palette:** four colours only — sand, deep palm green, water blue, and one warm gold for anything the player can pick up. Because gold appears nowhere else, players learn in about three seconds that gold means *take me*.",
        "تصنع مرحلة واحة صحراوية. **المزاج:** راحة بعد عبور شاقّ. **اللوحة:** أربعة ألوان فقط — رملي، وأخضر نخيل غامق، وأزرق ماء، وذهبي دافئ واحد لكل ما يمكن التقاطه. ولأن الذهبي لا يظهر في مكان آخر يتعلّم اللاعبون في نحو ثلاث ثوانٍ أن الذهبي يعني *خُذني*."
      ),
      bi(
        "**Size:** at $16 \\times 16 = 256$ pixels a palm tree takes an afternoon. At $64 \\times 64 = 4096$ it's $4096 \\div 256 = \\mathbf{16}$ times the squares — the same tree becomes a week. Small isn't a limitation you accept sadly; it's what lets one person finish a whole world.",
        "**الحجم:** عند $16 \\times 16 = 256$ بكسل تأخذ النخلة عصراً واحداً. وعند $64 \\times 64 = 4096$ تصير المربّعات $4096 \\div 256 = \\mathbf{16}$ ضعفاً — فالنخلة نفسها تصير أسبوعاً. والصِّغَر ليس قيداً تقبله مُكرهاً، بل ما يتيح لشخص واحد إتمام عالم كامل."
      ),
      bi(
        "**Sound:** give every important action one short sound, and keep the music quieter than the effects — a player must hear the danger over the melody. A three-second oud phrase looping under the oasis says ‘you are somewhere from here' faster than any signpost.",
        "**الصوت:** اجعل لكل فعل مهمّ صوتاً قصيراً واحداً، وأبقِ الموسيقى أخفض من المؤثّرات — فعلى اللاعب أن يسمع الخطر فوق اللحن. وجملة عود من ثلاث ثوانٍ تدور تحت الواحة تقول «أنت في مكان من هنا» أسرع من أي لافتة."
      ),
    ],
  },
  {
    icon: "🧩",
    label: bi("Quick Check", "تحقّق سريع"),
    sub: bi("A small question to test yourself", "سؤال صغير لتختبر نفسك"),
    paras: [
      bi(
        "How many pixels are in a $32 \\times 32$ sprite, and how many times bigger is that than $16 \\times 16$? Then name the one colour you'd reserve so that it always means ‘danger' in your game.",
        "كم بكسلاً في كائن $32 \\times 32$، وكم ضعفاً هو من $16 \\times 16$؟ ثم سمِّ اللون الوحيد الذي ستحجزه ليعني «خطر» دائماً في لعبتك."
      ),
    ],
  },
  {
    icon: "📌",
    label: bi("One-Line Summary", "الخلاصة في سطر"),
    sub: bi("The whole idea in one line", "الفكرة كلها في سطر"),
    paras: [
      bi(
        "Colour and sound tell the player how to feel before the rules do — so pick a small palette, reserve a colour for meaning, keep effects above the music, and stay consistent rather than fancy.",
        "اللون والصوت يخبران اللاعب كيف يشعر قبل القواعد — فاختر لوحة صغيرة، واحجز لوناً لمعنى، وأبقِ المؤثّرات فوق الموسيقى، وكن متّسقاً لا فخماً."
      ),
    ],
  },
];

const FLAGSHIPS: Record<string, NoteCard[]> = {
  "gaming-6": GAMING_6,
  "problem-solving-5": PROBLEM_SOLVING_5,
  "entrepreneurship-10": ENTREPRENEURSHIP_10,
  "emotional-intelligence-1": EQ_1,
  "languages-1": LANGUAGES_1,
  "ai-2": AI_2,
  "geography-2": GEOGRAPHY_2,
  "physics-1": PHYSICS_1,
  "math-1": MATH_1,
  "leadership-4": LEADERSHIP_4,
  "gaming-2": GAMING_2,
  "problem-solving-10": PROBLEM_SOLVING_10,
  "entrepreneurship-2": ENTREPRENEURSHIP_2,
  "emotional-intelligence-9": EQ_9,
  "languages-9": LANGUAGES_9,
  "ai-10": AI_10,
  "geography-9": GEOGRAPHY_9,
  "physics-3": PHYSICS_3,
  "math-6": MATH_6,
  "leadership-9": LEADERSHIP_9,
  "gaming-8": GAMING_8,
  "problem-solving-3": PROBLEM_SOLVING_3,
  "entrepreneurship-8": ENTREPRENEURSHIP_8,
  "emotional-intelligence-6": EQ_6,
  "languages-6": LANGUAGES_6,
  "ai-8": AI_8,
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

const SPOTLIGHT_EMOJI: Record<string, string> = {
  "dual-coding": "✏️",
  "melody-mnemonic": "🎵",
  "act-it-out": "🤸",
  "become-concept": "📖",
  "indirect-analogy": "🌍",
  "take-home-trophy": "🏆",
};

// The "Learn It Your Way" card. NOTE: this renders six rows from lib/methods.ts
// as an emoji, a name and one sentence — the Catalog Trap described in
// BRIEF.md Part 1. It survives only until the real engines land; Phase 2
// deletes lib/methods.ts or demotes it to docs/research/learning-science.md.
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

export function buildDeck(subject: Subject, level: Level): NoteCard[] | null {
  const base = FLAGSHIPS[`${subject.slug}-${level.n}`];
  // No hand-authored deck means this lesson is NOT written yet. It must not
  // render generated filler dressed as a lesson — callers show the honest
  // "in authoring" state instead. See CLAUDE.md DO NOT #2.
  if (!base) return null;
  const deck = [...base];
  // Weave the multi-modal card in before the closing summary card.
  const insertAt = Math.max(0, deck.length - 1);
  deck.splice(insertAt, 0, methodsCard());
  return deck;
}

/**
 * True when a real human-authored deck exists for this lesson. The 57 lessons
 * without one are shown as "in authoring" rather than filled with placeholder
 * text — they are a known gap (docs/AUDIT.md), not content.
 */
export function isAuthored(subjectSlug: string, level: number): boolean {
  return Boolean(FLAGSHIPS[`${subjectSlug}-${level}`]);
}

/** @deprecated Use `isAuthored`. Retained so existing callers keep compiling. */
export function isFlagship(subjectSlug: string, level: number): boolean {
  return isAuthored(subjectSlug, level);
}
