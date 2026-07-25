// The wadehAI quiz engine.
// Math and upper-level physics questions are generated procedurally, so every
// quiz run is fresh (retrieval practice with unlimited variations). Conceptual
// subjects draw from curated bilingual banks; the AI tutor extends them live.

import type { Bi, Lang } from "./curriculum";

export interface QuizQ {
  q: Bi;
  choices: Bi[];
  correct: number; // index into choices
  explain: Bi;
}

export const XP_CORRECT = 10;
export const XP_LEVEL_MASTERED = 50;
export const XP_QUEST = 30;

const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const num = (v: number | string): Bi => ({ en: String(v), ar: String(v) });

/** Build a 4-choice question from a correct value and distractor values. */
function mk(q: Bi, correctVal: number | string, distractors: (number | string)[], explain: Bi): QuizQ {
  const set = Array.from(new Set([String(correctVal), ...distractors.map(String)])).slice(0, 4);
  while (set.length < 4) set.push(String(Number(correctVal) + set.length * 3 + 1));
  const order = set
    .map((v, i) => ({ v, r: Math.random(), isCorrect: i === 0 }))
    .sort((a, b) => a.r - b.r);
  return {
    q,
    choices: order.map((o) => num(o.v)),
    correct: order.findIndex((o) => o.isCorrect),
    explain,
  };
}

// ---------------------------------------------------------------- Mathematics

function mathQ(level: number): QuizQ {
  switch (level) {
    case 1: {
      const a = ri(2, 9), b = ri(2, 9);
      return mk(
        { en: `What is ${a} + ${b}?`, ar: `كم يساوي ${a} + ${b}؟` },
        a + b,
        [a + b + 1, a + b - 1, a + b + 2],
        { en: `Count on from ${a}: ${b} more steps lands on ${a + b}.`, ar: `عُدّ ابتداءً من ${a}: بعد ${b} خطوات تصل إلى ${a + b}.` }
      );
    }
    case 2: {
      const a = ri(120, 480), b = ri(110, 380);
      return mk(
        { en: `What is ${a} + ${b}?`, ar: `كم يساوي ${a} + ${b}؟` },
        a + b,
        [a + b + 10, a + b - 10, a + b + 100],
        { en: `Add ones, then tens, then hundreds: ${a} + ${b} = ${a + b}.`, ar: `اجمع الآحاد ثم العشرات ثم المئات: ${a} + ${b} = ${a + b}.` }
      );
    }
    case 3: {
      const a = ri(3, 12), b = ri(3, 12);
      return mk(
        { en: `What is ${a} × ${b}?`, ar: `كم يساوي ${a} × ${b}؟` },
        a * b,
        [a * b + a, a * b - b, a * (b + 1)],
        { en: `${a} groups of ${b} make ${a * b}.`, ar: `${a} مجموعات في كل منها ${b} تساوي ${a * b}.` }
      );
    }
    case 4: {
      const b = pick([2, 3, 4, 5]), k = pick([2, 3, 4]);
      return mk(
        { en: `Which fraction equals 1/${b}?`, ar: `أي كسر يساوي 1/${b}؟` },
        `${k}/${b * k}`,
        [`${k}/${b * k + 1}`, `${k + 1}/${b * k}`, `1/${b + k}`],
        { en: `Multiply top and bottom by ${k}: 1/${b} = ${k}/${b * k}.`, ar: `اضرب البسط والمقام في ${k}: إذن 1/${b} = ${k}/${b * k}.` }
      );
    }
    case 5: {
      const p = pick([10, 20, 25, 50]), n = pick([40, 60, 80, 120, 200]);
      return mk(
        { en: `What is ${p}% of ${n}?`, ar: `كم يساوي ${p}٪ من ${n}؟` },
        (p * n) / 100,
        [(p * n) / 100 + 5, (p * n) / 50, n - p],
        { en: `${p}% means ${p}/100, so ${p}% of ${n} = ${(p * n) / 100}.`, ar: `${p}٪ تعني ${p}/100، إذن ${p}٪ من ${n} = ${(p * n) / 100}.` }
      );
    }
    case 6: {
      const x = ri(-8, 12), a = ri(2, 9);
      return mk(
        { en: `Solve: x + ${a} = ${x + a}`, ar: `حُلّ: س + ${a} = ${x + a}` },
        x,
        [x + 1, x - 1, x + a],
        { en: `Subtract ${a} from both sides: x = ${x + a} − ${a} = ${x}.`, ar: `اطرح ${a} من الطرفين: س = ${x + a} − ${a} = ${x}.` }
      );
    }
    case 7: {
      const x = ri(2, 9), a = ri(1, 9);
      return mk(
        { en: `Solve: 2x + ${a} = ${2 * x + a}`, ar: `حُلّ: ٢س + ${a} = ${2 * x + a}` },
        x,
        [x + 1, x - 1, 2 * x],
        { en: `Subtract ${a}, then divide by 2: x = ${x}.`, ar: `اطرح ${a} ثم اقسم على ٢: س = ${x}.` }
      );
    }
    case 8: {
      const t = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15]]);
      return mk(
        { en: `A right triangle has legs ${t[0]} and ${t[1]}. How long is the hypotenuse?`, ar: `مثلث قائم ضلعاه القائمان ${t[0]} و${t[1]}. كم طول الوتر؟` },
        t[2],
        [t[2] + 1, t[0] + t[1], t[2] - 1],
        { en: `Pythagoras: √(${t[0]}² + ${t[1]}²) = ${t[2]}.`, ar: `فيثاغورس: جذر (${t[0]}² + ${t[1]}²) = ${t[2]}.` }
      );
    }
    case 9: {
      const p = ri(1, 6), q = ri(1, 6);
      return mk(
        { en: `x² − ${p + q}x + ${p * q} = 0. One solution is x = ${p}. What is the other?`, ar: `س² − ${p + q}س + ${p * q} = 0. أحد الحلّين هو س = ${p}. فما الحل الآخر؟` },
        q,
        [q + 1, p + q, p * q],
        { en: `The equation factors as (x − ${p})(x − ${q}) = 0, so x = ${q}.`, ar: `تتحلّل المعادلة إلى (س − ${p})(س − ${q}) = 0، إذن س = ${q}.` }
      );
    }
    default: {
      const a = pick([2, 3]), first = ri(2, 5);
      const fourth = first * a * a * a;
      return mk(
        { en: `A sequence starts ${first}, ${first * a}, ${first * a * a}, … What is the 4th term?`, ar: `متتالية تبدأ بـ ${first}، ${first * a}، ${first * a * a}، … ما الحد الرابع؟` },
        fourth,
        [fourth + a, first * a * 3, fourth - a],
        { en: `Each term is ×${a}: the 4th term is ${fourth}.`, ar: `كل حد يُضرب في ${a}: الحد الرابع هو ${fourth}.` }
      );
    }
  }
}

// -------------------------------------------------------------------- Physics

const PHYSICS_BANK: Record<number, QuizQ[]> = {
  1: [
    {
      q: { en: "Which of these will float in water?", ar: "أي مما يلي يطفو على الماء؟" },
      choices: [
        { en: "A wooden spoon", ar: "ملعقة خشبية" },
        { en: "A metal key", ar: "مفتاح معدني" },
        { en: "A stone", ar: "حجر" },
        { en: "A coin", ar: "قطعة نقود" },
      ],
      correct: 0,
      explain: { en: "Wood is lighter than the same amount of water, so it floats.", ar: "الخشب أخف من كمية الماء المساوية له حجماً، لذلك يطفو." },
    },
    {
      q: { en: "To make a toy car move, you must…", ar: "لتحريك سيارة لعبة يجب أن…" },
      choices: [
        { en: "Push or pull it", ar: "تدفعها أو تسحبها" },
        { en: "Look at it", ar: "تنظر إليها" },
        { en: "Name it", ar: "تسمّيها" },
        { en: "Paint it", ar: "تلوّنها" },
      ],
      correct: 0,
      explain: { en: "Things move when a force — a push or a pull — acts on them.", ar: "تتحرك الأشياء حين تؤثر فيها قوة — دفعٌ أو سحب." },
    },
  ],
  2: [
    {
      q: { en: "Why is it hard to slide on a rough carpet?", ar: "لماذا يصعب الانزلاق على سجادة خشنة؟" },
      choices: [
        { en: "Friction is high", ar: "الاحتكاك كبير" },
        { en: "The carpet is cold", ar: "السجادة باردة" },
        { en: "Gravity is stronger", ar: "الجاذبية أقوى" },
        { en: "The air pushes back", ar: "الهواء يقاوم" },
      ],
      correct: 0,
      explain: { en: "Rough surfaces grip: high friction resists sliding.", ar: "الأسطح الخشنة تُمسك: الاحتكاك العالي يقاوم الانزلاق." },
    },
    {
      q: { en: "Which will a magnet attract?", ar: "أي شيء يجذبه المغناطيس؟" },
      choices: [
        { en: "An iron nail", ar: "مسمار حديدي" },
        { en: "A plastic ruler", ar: "مسطرة بلاستيكية" },
        { en: "A wooden pencil", ar: "قلم خشبي" },
        { en: "A paper sheet", ar: "ورقة" },
      ],
      correct: 0,
      explain: { en: "Magnets attract iron and steel, not plastic, wood or paper.", ar: "يجذب المغناطيس الحديد والفولاذ، لا البلاستيك أو الخشب أو الورق." },
    },
  ],
  3: [
    {
      q: { en: "A shadow forms because light…", ar: "يتكوّن الظل لأن الضوء…" },
      choices: [
        { en: "Travels in straight lines", ar: "ينتقل في خطوط مستقيمة" },
        { en: "Is very hot", ar: "ساخن جداً" },
        { en: "Moves slowly", ar: "يتحرك ببطء" },
        { en: "Is yellow", ar: "أصفر اللون" },
      ],
      correct: 0,
      explain: { en: "Light can't bend around an object, so a dark shape appears behind it.", ar: "لا يستطيع الضوء الالتفاف حول الجسم، فيظهر شكل مظلم خلفه." },
    },
    {
      q: { en: "Sound is made by…", ar: "ينشأ الصوت من…" },
      choices: [
        { en: "Vibrations", ar: "الاهتزازات" },
        { en: "Light", ar: "الضوء" },
        { en: "Shadows", ar: "الظلال" },
        { en: "Heat", ar: "الحرارة" },
      ],
      correct: 0,
      explain: { en: "Anything that vibrates pushes the air in waves we hear as sound.", ar: "كل ما يهتز يدفع الهواء في موجات نسمعها صوتاً." },
    },
  ],
  4: [
    {
      q: { en: "When ice melts it becomes…", ar: "عندما يذوب الجليد يتحول إلى…" },
      choices: [
        { en: "Liquid water", ar: "ماء سائل" },
        { en: "Steam only", ar: "بخار فقط" },
        { en: "A new solid", ar: "مادة صلبة جديدة" },
        { en: "Air", ar: "هواء" },
      ],
      correct: 0,
      explain: { en: "Melting is the change from solid to liquid — same water, new state.", ar: "الانصهار تحوّل من الحالة الصلبة إلى السائلة — الماء نفسه بحالة جديدة." },
    },
    {
      q: { en: "Wet clothes dry on a line because water…", ar: "تجف الملابس المبللة على الحبل لأن الماء…" },
      choices: [
        { en: "Evaporates", ar: "يتبخر" },
        { en: "Freezes", ar: "يتجمد" },
        { en: "Melts", ar: "ينصهر" },
        { en: "Disappears forever", ar: "يختفي إلى الأبد" },
      ],
      correct: 0,
      explain: { en: "Heat turns liquid water into invisible vapour that rises into the air.", ar: "تحوّل الحرارة الماء السائل إلى بخار غير مرئي يرتفع في الهواء." },
    },
  ],
  5: [
    {
      q: { en: "A battery in a torch stores…", ar: "تخزّن البطارية في المصباح…" },
      choices: [
        { en: "Chemical energy", ar: "طاقة كيميائية" },
        { en: "Sound energy", ar: "طاقة صوتية" },
        { en: "Wind energy", ar: "طاقة رياح" },
        { en: "Shadow energy", ar: "طاقة الظل" },
      ],
      correct: 0,
      explain: { en: "The battery's chemical energy becomes electrical, then light.", ar: "تتحول الطاقة الكيميائية في البطارية إلى كهرباء ثم إلى ضوء." },
    },
    {
      q: { en: "For a bulb to light, the circuit must be…", ar: "لكي يضيء المصباح يجب أن تكون الدارة…" },
      choices: [
        { en: "Closed (complete)", ar: "مغلقة (مكتملة)" },
        { en: "Open (broken)", ar: "مفتوحة (مقطوعة)" },
        { en: "Wet", ar: "مبللة" },
        { en: "Very long", ar: "طويلة جداً" },
      ],
      correct: 0,
      explain: { en: "Current only flows around an unbroken loop.", ar: "لا يسري التيار إلا في حلقة غير مقطوعة." },
    },
  ],
};

function physicsQ(level: number): QuizQ {
  if (level <= 5) return pick(PHYSICS_BANK[level]);
  switch (level) {
    case 6: {
      const t = ri(2, 6), v = ri(3, 12);
      return mk(
        { en: `A falcon flies ${v * t} km in ${t} hours. What is its speed in km/h?`, ar: `يطير صقر ${v * t} كم في ${t} ساعات. ما سرعته بالكيلومتر في الساعة؟` },
        v,
        [v + 1, v * t, v - 1],
        { en: `Speed = distance ÷ time = ${v * t} ÷ ${t} = ${v} km/h.`, ar: `السرعة = المسافة ÷ الزمن = ${v * t} ÷ ${t} = ${v} كم/س.` }
      );
    }
    case 7: {
      const m = ri(2, 10), a = ri(2, 6);
      return mk(
        { en: `F = ma. A ${m} kg cart accelerates at ${a} m/s². What force acts on it (N)?`, ar: `ق = ك × ت. عربة كتلتها ${m} كغ وتسارعها ${a} م/ث². ما القوة المؤثرة عليها (نيوتن)؟` },
        m * a,
        [m + a, m * a + 5, m * a - 2],
        { en: `Force = mass × acceleration = ${m} × ${a} = ${m * a} N.`, ar: `القوة = الكتلة × التسارع = ${m} × ${a} = ${m * a} نيوتن.` }
      );
    }
    case 8: {
      const i = ri(2, 6), r = ri(2, 8);
      return mk(
        { en: `V = IR. A current of ${i} A flows through ${r} Ω. What is the voltage (V)?`, ar: `ج = ت × م. يمر تيار ${i} أمبير في مقاومة ${r} أوم. ما الجهد (فولت)؟` },
        i * r,
        [i + r, i * r + 2, i * r - 2],
        { en: `Voltage = current × resistance = ${i} × ${r} = ${i * r} V.`, ar: `الجهد = التيار × المقاومة = ${i} × ${r} = ${i * r} فولت.` }
      );
    }
    case 9: {
      const f = pick([2, 4, 5, 10]), l = ri(2, 8);
      return mk(
        { en: `v = fλ. A wave has frequency ${f} Hz and wavelength ${l} m. What is its speed (m/s)?`, ar: `ع = د × ل. موجة ترددها ${f} هرتز وطولها الموجي ${l} م. ما سرعتها (م/ث)؟` },
        f * l,
        [f + l, f * l + 3, f * l - 1],
        { en: `Speed = frequency × wavelength = ${f} × ${l} = ${f * l} m/s.`, ar: `السرعة = التردد × الطول الموجي = ${f} × ${l} = ${f * l} م/ث.` }
      );
    }
    default: {
      const m = ri(2, 8), v = ri(3, 9);
      return mk(
        { en: `p = mv. A ${m} kg ball moves at ${v} m/s. What is its momentum (kg·m/s)?`, ar: `ز = ك × ع. كرة كتلتها ${m} كغ تتحرك بسرعة ${v} م/ث. ما زخمها (كغ·م/ث)؟` },
        m * v,
        [m + v, m * v + 4, m * v - 3],
        { en: `Momentum = mass × velocity = ${m} × ${v} = ${m * v} kg·m/s.`, ar: `الزخم = الكتلة × السرعة = ${m} × ${v} = ${m * v} كغ·م/ث.` }
      );
    }
  }
}

// -------------------------------------------- Conceptual subjects (curated banks)

interface TaggedQ extends QuizQ {
  lv: number; // the school year this question is pitched at
}

const BANKS: Record<string, TaggedQ[]> = {
  geography: [
    {
      lv: 3,
      q: { en: "On a compass, the sun rises in the…", ar: "على البوصلة، تشرق الشمس من جهة…" },
      choices: [{ en: "East", ar: "الشرق" }, { en: "West", ar: "الغرب" }, { en: "North", ar: "الشمال" }, { en: "South", ar: "الجنوب" }],
      correct: 0,
      explain: { en: "Earth spins toward the east, so the sun appears there first.", ar: "تدور الأرض نحو الشرق، فتظهر الشمس هناك أولاً." },
    },
    {
      lv: 5,
      q: { en: "Which strait connects the Gulf to the open ocean?", ar: "أي مضيق يصل الخليج بالمحيط المفتوح؟" },
      choices: [{ en: "Hormuz", ar: "هرمز" }, { en: "Gibraltar", ar: "جبل طارق" }, { en: "Bosphorus", ar: "البوسفور" }, { en: "Malacca", ar: "ملقا" }],
      correct: 0,
      explain: { en: "The Strait of Hormuz links the Arabian Gulf to the Gulf of Oman and the Indian Ocean.", ar: "يصل مضيق هرمز الخليج العربي بخليج عُمان والمحيط الهندي." },
    },
    {
      lv: 8,
      q: { en: "Desertification means…", ar: "التصحّر يعني…" },
      choices: [
        { en: "Fertile land becoming desert", ar: "تحوّل الأرض الخصبة إلى صحراء" },
        { en: "Deserts becoming forests", ar: "تحوّل الصحارى إلى غابات" },
        { en: "Building cities in deserts", ar: "بناء المدن في الصحارى" },
        { en: "Sand storms in winter", ar: "عواصف رملية شتوية" },
      ],
      correct: 0,
      explain: { en: "Overgrazing, drought and misuse turn productive land into desert.", ar: "الرعي الجائر والجفاف وسوء الاستخدام تحوّل الأرض المنتجة إلى صحراء." },
    },
  ],
  ai: [
    {
      lv: 2,
      q: { en: "An algorithm is most like a…", ar: "الخوارزمية أشبه ما تكون بـ…" },
      choices: [{ en: "Recipe", ar: "وصفة طبخ" }, { en: "Painting", ar: "لوحة" }, { en: "Song", ar: "أغنية" }, { en: "Ball", ar: "كرة" }],
      correct: 0,
      explain: { en: "Both are exact steps followed in order to get a result.", ar: "كلاهما خطوات دقيقة تُتَّبع بالترتيب للوصول إلى نتيجة." },
    },
    {
      lv: 5,
      q: { en: "In supervised learning, the model learns from…", ar: "في التعلّم الموجّه، يتعلم النموذج من…" },
      choices: [
        { en: "Labelled examples", ar: "أمثلة موسومة" },
        { en: "Pure guessing", ar: "التخمين المحض" },
        { en: "Its dreams", ar: "أحلامه" },
        { en: "One example only", ar: "مثال واحد فقط" },
      ],
      correct: 0,
      explain: { en: "Each training example comes with the right answer attached.", ar: "كل مثال تدريبي يأتي مرفقاً بالإجابة الصحيحة." },
    },
    {
      lv: 7,
      q: { en: "The best first move when an AI answer looks wrong is to…", ar: "أفضل خطوة أولى حين تبدو إجابة الذكاء الاصطناعي خاطئة هي…" },
      choices: [
        { en: "Verify it against a trusted source", ar: "التحقق منها من مصدر موثوق" },
        { en: "Share it anyway", ar: "نشرها على أي حال" },
        { en: "Assume it's right", ar: "افتراض صحتها" },
        { en: "Delete the app", ar: "حذف التطبيق" },
      ],
      correct: 0,
      explain: { en: "Models can hallucinate; verification is part of using AI well.", ar: "قد تهلوس النماذج؛ التحقق جزء من حسن استخدام الذكاء الاصطناعي." },
    },
  ],
  gaming: [
    {
      lv: 3,
      q: { en: "A game stays fun when challenge is…", ar: "تبقى اللعبة ممتعة حين يكون التحدي…" },
      choices: [
        { en: "Slightly above your skill", ar: "أعلى قليلاً من مهارتك" },
        { en: "Impossible", ar: "مستحيلاً" },
        { en: "Absent", ar: "غائباً" },
        { en: "Random", ar: "عشوائياً تماماً" },
      ],
      correct: 0,
      explain: { en: "That balance point is called 'flow' — hard enough to grip, fair enough to win.", ar: "تلك النقطة تسمى «الانسياب» — صعبة بما يكفي لتشدّك وعادلة بما يكفي لتفوز." },
    },
    {
      lv: 8,
      q: { en: "In game code, the player's score is stored in a…", ar: "في كود اللعبة، تُخزَّن نقاط اللاعب في…" },
      choices: [{ en: "Variable", ar: "متغيّر" }, { en: "Shadow", ar: "ظل" }, { en: "Pixel", ar: "بكسل" }, { en: "Sound file", ar: "ملف صوتي" }],
      correct: 0,
      explain: { en: "A variable is a named box whose value can change as you play.", ar: "المتغيّر صندوق مسمّى تتغير قيمته أثناء اللعب." },
    },
    {
      lv: 9,
      q: { en: "The main goal of a playtest is to…", ar: "الهدف الأساسي من جلسة الاختبار هو…" },
      choices: [
        { en: "Watch where players struggle", ar: "مراقبة أين يتعثر اللاعبون" },
        { en: "Prove you're right", ar: "إثبات أنك على حق" },
        { en: "Win the game yourself", ar: "أن تفوز أنت باللعبة" },
        { en: "Sell copies", ar: "بيع النسخ" },
      ],
      correct: 0,
      explain: { en: "You learn most from watching real players get stuck — silently.", ar: "تتعلم أكثر من مشاهدة لاعبين حقيقيين يتعثرون — بصمت." },
    },
  ],
  entrepreneurship: [
    {
      lv: 4,
      q: { en: "You sell lemonade for 5 and each cup costs 2 to make. Your profit per cup is…", ar: "تبيع كوب الليمونادة بـ٥ وتكلفة صنعه ٢. ربحك من الكوب هو…" },
      choices: [{ en: "3", ar: "3" }, { en: "7", ar: "7" }, { en: "2", ar: "2" }, { en: "5", ar: "5" }],
      correct: 0,
      explain: { en: "Profit = price − cost = 5 − 2 = 3.", ar: "الربح = السعر − التكلفة = ٥ − ٢ = ٣." },
    },
    {
      lv: 7,
      q: { en: "An MVP exists mainly to…", ar: "الهدف الأساسي من المنتج الأوّلي هو…" },
      choices: [
        { en: "Test your riskiest assumption", ar: "اختبار أخطر افتراضاتك" },
        { en: "Impress investors with polish", ar: "إبهار المستثمرين بالإتقان" },
        { en: "Include every feature", ar: "تضمين كل الميزات" },
        { en: "Win design awards", ar: "الفوز بجوائز التصميم" },
      ],
      correct: 0,
      explain: { en: "Build the smallest thing that tells you whether the idea works.", ar: "ابنِ أصغر شيء يخبرك إن كانت الفكرة تنجح." },
    },
    {
      lv: 9,
      q: { en: "Retention matters more than acquisition because…", ar: "الاحتفاظ بالعملاء أهم من اكتسابهم لأن…" },
      choices: [
        { en: "A leaky bucket never fills", ar: "الدلو المثقوب لا يمتلئ أبداً" },
        { en: "Ads are cheap", ar: "الإعلانات رخيصة" },
        { en: "New users pay more", ar: "المستخدمين الجدد يدفعون أكثر" },
        { en: "It looks good in pitches", ar: "يبدو جيداً في العروض" },
      ],
      correct: 0,
      explain: { en: "If customers keep leaving, no amount of new ones saves the business.", ar: "إذا استمر العملاء بالمغادرة، فلن ينقذ العملُ أيُّ عدد من الجدد." },
    },
  ],
  leadership: [
    {
      lv: 3,
      q: { en: "A good team role for someone who loves details is…", ar: "الدور المناسب في الفريق لمن يحب التفاصيل هو…" },
      choices: [{ en: "Checker / quality lead", ar: "المدقّق / مسؤول الجودة" }, { en: "No role", ar: "بلا دور" }, { en: "Doing everything", ar: "فعل كل شيء" }, { en: "Watching only", ar: "المشاهدة فقط" }],
      correct: 0,
      explain: { en: "Great teams match roles to strengths.", ar: "الفرق العظيمة توائم الأدوار مع نقاط القوة." },
    },
    {
      lv: 7,
      q: { en: "In a conflict, the first thing to find is…", ar: "في أي خلاف، أول ما ينبغي البحث عنه هو…" },
      choices: [
        { en: "The real issue underneath", ar: "القضية الحقيقية الكامنة" },
        { en: "Who to blame", ar: "من نلوم" },
        { en: "Who is louder", ar: "من صوته أعلى" },
        { en: "A way to avoid everyone", ar: "طريقة لتجنّب الجميع" },
      ],
      correct: 0,
      explain: { en: "Arguments are usually about something deeper than the trigger.", ar: "الخلافات عادة حول شيء أعمق من شرارتها." },
    },
    {
      lv: 9,
      q: { en: "Servant leadership means the leader…", ar: "القيادة الخادمة تعني أن القائد…" },
      choices: [
        { en: "Puts the team's needs first", ar: "يقدّم احتياجات الفريق أولاً" },
        { en: "Gives the most orders", ar: "يُصدر أكثر الأوامر" },
        { en: "Takes the credit", ar: "يستأثر بالفضل" },
        { en: "Avoids decisions", ar: "يتجنب القرارات" },
      ],
      correct: 0,
      explain: { en: "Power is used to serve the people you lead, not yourself.", ar: "تُستخدم السلطة لخدمة من تقودهم، لا لخدمة نفسك." },
    },
  ],
  "problem-solving": [
    {
      lv: 3,
      q: { en: "The best first step with a big, scary problem is to…", ar: "أفضل خطوة أولى مع مشكلة كبيرة مخيفة هي…" },
      choices: [
        { en: "Break it into smaller pieces", ar: "تفكيكها إلى قطع أصغر" },
        { en: "Give up", ar: "الاستسلام" },
        { en: "Solve it all at once", ar: "حلها دفعة واحدة" },
        { en: "Wait for luck", ar: "انتظار الحظ" },
      ],
      correct: 0,
      explain: { en: "Decomposition turns one impossible task into many possible ones.", ar: "التفكيك يحوّل مهمة مستحيلة واحدة إلى مهام ممكنة عديدة." },
    },
    {
      lv: 6,
      q: { en: "A feedback loop is when…", ar: "حلقة التغذية الراجعة تحدث حين…" },
      choices: [
        { en: "An effect feeds back into its cause", ar: "تعود النتيجة لتؤثر في سببها" },
        { en: "Two people argue", ar: "يتجادل شخصان" },
        { en: "A plan is written twice", ar: "تُكتب الخطة مرتين" },
        { en: "Music repeats", ar: "تتكرر الموسيقى" },
      ],
      correct: 0,
      explain: { en: "Like a rumour: the more it spreads, the more people spread it.", ar: "كالإشاعة: كلما انتشرت أكثر، زاد من ينشرها." },
    },
    {
      lv: 8,
      q: { en: "Before running an experiment, a good solver writes down…", ar: "قبل إجراء التجربة، يكتب الحلّال الجيد…" },
      choices: [
        { en: "A hypothesis to test", ar: "فرضية للاختبار" },
        { en: "The conclusion", ar: "الاستنتاج النهائي" },
        { en: "Nothing at all", ar: "لا شيء إطلاقاً" },
        { en: "Someone to blame", ar: "اسم من سيلومه" },
      ],
      correct: 0,
      explain: { en: "A written hypothesis keeps the test honest.", ar: "الفرضية المكتوبة تُبقي الاختبار صادقاً." },
    },
  ],
  "emotional-intelligence": [
    {
      lv: 2,
      q: { en: "When anger feels huge, a first good tool is…", ar: "حين يشتد الغضب، أداة أولى جيدة هي…" },
      choices: [
        { en: "Slow belly breathing", ar: "تنفّس البطن البطيء" },
        { en: "Shouting louder", ar: "الصراخ أعلى" },
        { en: "Breaking something", ar: "كسر شيء ما" },
        { en: "Blaming a friend", ar: "لوم صديق" },
      ],
      correct: 0,
      explain: { en: "Slow breathing calms the body so the thinking brain can return.", ar: "التنفس البطيء يهدّئ الجسد ليعود العقل المفكر." },
    },
    {
      lv: 5,
      q: { en: "Reading the room mostly means noticing…", ar: "قراءة الموقف تعني غالباً ملاحظة…" },
      choices: [
        { en: "Tone and body language", ar: "النبرة ولغة الجسد" },
        { en: "The furniture", ar: "الأثاث" },
        { en: "The time", ar: "الوقت" },
        { en: "Your phone", ar: "هاتفك" },
      ],
      correct: 0,
      explain: { en: "Most of what people feel is said without words.", ar: "معظم ما يشعر به الناس يُقال بلا كلمات." },
    },
    {
      lv: 6,
      q: { en: "Resilience means…", ar: "المرونة النفسية تعني…" },
      choices: [
        { en: "Bouncing back after setbacks", ar: "النهوض بعد الكبوات" },
        { en: "Never feeling sad", ar: "ألا تحزن أبداً" },
        { en: "Avoiding all risk", ar: "تجنّب كل مخاطرة" },
        { en: "Hiding feelings", ar: "إخفاء المشاعر" },
      ],
      correct: 0,
      explain: { en: "Everyone falls; resilience is the getting up.", ar: "الكل يقع؛ المرونة هي النهوض." },
    },
  ],
  languages: [
    {
      lv: 3,
      q: { en: "Spaced repetition means reviewing words…", ar: "المراجعة المتباعدة تعني مراجعة الكلمات…" },
      choices: [
        { en: "At growing intervals over days", ar: "على فترات متزايدة عبر الأيام" },
        { en: "Once and never again", ar: "مرة واحدة فقط" },
        { en: "All in one night", ar: "كلها في ليلة واحدة" },
        { en: "Only before exams", ar: "قبل الامتحانات فقط" },
      ],
      correct: 0,
      explain: { en: "Memory strengthens most when you recall just before forgetting.", ar: "تقوى الذاكرة أكثر حين تتذكر قُبيل النسيان." },
    },
    {
      lv: 5,
      q: { en: "'Shadowing' a speaker means…", ar: "«محاكاة» المتحدث تعني…" },
      choices: [
        { en: "Repeating right behind their voice", ar: "الترديد خلف صوته مباشرة" },
        { en: "Following them home", ar: "اتباعه إلى بيته" },
        { en: "Writing their biography", ar: "كتابة سيرته" },
        { en: "Staying silent", ar: "التزام الصمت" },
      ],
      correct: 0,
      explain: { en: "You mimic rhythm and sounds in real time — the fastest route to accent and flow.", ar: "تحاكي الإيقاع والأصوات لحظياً — أسرع طريق للنطق والانسياب." },
    },
    {
      lv: 6,
      q: { en: "When you meet an unknown word while reading, first…", ar: "حين تقابل كلمة مجهولة أثناء القراءة، أولاً…" },
      choices: [
        { en: "Guess it from context", ar: "خمّنها من السياق" },
        { en: "Stop reading", ar: "توقف عن القراءة" },
        { en: "Skip the book", ar: "اترك الكتاب" },
        { en: "Memorise the page", ar: "احفظ الصفحة" },
      ],
      correct: 0,
      explain: { en: "Context carries most meanings; the dictionary comes second.", ar: "السياق يحمل معظم المعاني؛ والقاموس يأتي ثانياً." },
    },
  ],
};

/** Produce one quiz question for a subject at a given level. */
export function generateQuestion(subject: string, level: number): QuizQ {
  if (subject === "math") return mathQ(level);
  if (subject === "physics") return physicsQ(level);
  const bank = BANKS[subject] ?? BANKS["problem-solving"];
  // Pick from the questions pitched nearest to this school year.
  const sorted = [...bank].sort((a, b) => Math.abs(a.lv - level) - Math.abs(b.lv - level));
  return pick(sorted.slice(0, 2));
}

export function generateQuiz(subject: string, level: number, count: number): QuizQ[] {
  const out: QuizQ[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard < count * 12) {
    guard++;
    const q = generateQuestion(subject, level);
    const key = q.q.en + q.choices.map((c) => c.en).join("|");
    if (!seen.has(key)) {
      seen.add(key);
      out.push(q);
    }
  }
  return out;
}
