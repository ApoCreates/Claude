// The wadehAI quiz engine.
// Math (all years) and physics (years 6-10) draw from MULTIPLE procedural
// templates per school year, so a five-question quiz mixes patterns and never
// repeats. Early physics and conceptual subjects draw from curated bilingual
// banks in banks.ts; the AI tutor extends everything live.

import type { Bi } from "./curriculum";
import { BANKS, PHYSICS_EARLY_BANK } from "./banks";

export interface QuizQ {
  q: Bi;
  choices: Bi[];
  correct: number; // index into choices
  explain: Bi;
}

export const XP_CORRECT = 10;
export const XP_LEVEL_MASTERED = 50;
export const XP_QUEST = 30;
export const XP_LAB = 15;

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

/** Same, but with bilingual text choices. */
function mkText(q: Bi, choices: Bi[], correct: number, explain: Bi): QuizQ {
  return { q, choices, correct, explain };
}

// ---------------------------------------------------------------- Mathematics
// Two to three templates per school year; one is chosen at random each time.

const MATH_GENS: Record<number, (() => QuizQ)[]> = {
  1: [
    () => {
      const a = ri(2, 9), b = ri(2, 9);
      return mk(
        { en: `What is ${a} + ${b}?`, ar: `كم يساوي ${a} + ${b}؟` },
        a + b, [a + b + 1, a + b - 1, a + b + 2],
        { en: `Count on from ${a}: ${b} more steps lands on ${a + b}.`, ar: `عُدّ ابتداءً من ${a}: بعد ${b} خطوات تصل إلى ${a + b}.` }
      );
    },
    () => {
      const a = ri(6, 18), b = ri(1, a - 2);
      return mk(
        { en: `What is ${a} − ${b}?`, ar: `كم يساوي ${a} − ${b}؟` },
        a - b, [a - b + 1, a - b - 1, a + b],
        { en: `Count back ${b} from ${a} to reach ${a - b}.`, ar: `عُدّ تنازلياً ${b} خطوات من ${a} لتصل إلى ${a - b}.` }
      );
    },
    () => {
      const a = ri(2, 9), x = ri(1, 9);
      return mk(
        { en: `${a} + ▢ = ${a + x}. What goes in the box?`, ar: `${a} + ▢ = ${a + x}. ما العدد الناقص؟` },
        x, [x + 1, x - 1, a],
        { en: `Think: how far from ${a} to ${a + x}? Exactly ${x}.`, ar: `فكّر: كم الفرق بين ${a} و${a + x}؟ إنه ${x} تماماً.` }
      );
    },
  ],
  2: [
    () => {
      const a = ri(120, 480), b = ri(110, 380);
      return mk(
        { en: `What is ${a} + ${b}?`, ar: `كم يساوي ${a} + ${b}؟` },
        a + b, [a + b + 10, a + b - 10, a + b + 100],
        { en: `Add ones, then tens, then hundreds: ${a} + ${b} = ${a + b}.`, ar: `اجمع الآحاد ثم العشرات ثم المئات: ${a} + ${b} = ${a + b}.` }
      );
    },
    () => {
      const b = ri(120, 400), a = b + ri(100, 400);
      return mk(
        { en: `What is ${a} − ${b}?`, ar: `كم يساوي ${a} − ${b}؟` },
        a - b, [a - b + 10, a - b - 10, a - b + 100],
        { en: `Subtract column by column: ${a} − ${b} = ${a - b}.`, ar: `اطرح عموداً عموداً: ${a} − ${b} = ${a - b}.` }
      );
    },
    () => {
      const a = ri(5, 45), b = ri(5, 45);
      return mk(
        { en: `A juice costs ${a} and a sandwich costs ${b}. How much together?`, ar: `ثمن العصير ${a} وثمن الشطيرة ${b}. كم المجموع؟` },
        a + b, [a + b - 5, a + b + 5, Math.abs(a - b)],
        { en: `Total price = ${a} + ${b} = ${a + b}.`, ar: `المجموع = ${a} + ${b} = ${a + b}.` }
      );
    },
  ],
  3: [
    () => {
      const a = ri(3, 12), b = ri(3, 12);
      return mk(
        { en: `What is ${a} × ${b}?`, ar: `كم يساوي ${a} × ${b}؟` },
        a * b, [a * b + a, a * b - b, a * (b + 1)],
        { en: `${a} groups of ${b} make ${a * b}.`, ar: `${a} مجموعات في كل منها ${b} تساوي ${a * b}.` }
      );
    },
    () => {
      const b = ri(3, 9), q = ri(3, 9);
      return mk(
        { en: `What is ${b * q} ÷ ${b}?`, ar: `كم يساوي ${b * q} ÷ ${b}؟` },
        q, [q + 1, q - 1, b],
        { en: `How many ${b}s fit in ${b * q}? Exactly ${q}.`, ar: `كم مرة يدخل ${b} في ${b * q}؟ بالضبط ${q} مرات.` }
      );
    },
    () => {
      const g = ri(3, 6), n = ri(4, 8);
      return mk(
        { en: `${g * n} students form teams of ${g}. How many teams?`, ar: `${g * n} طالباً يشكّلون فرقاً من ${g}. كم فريقاً؟` },
        n, [n + 1, n - 1, g],
        { en: `${g * n} ÷ ${g} = ${n} teams.`, ar: `${g * n} ÷ ${g} = ${n} فرق.` }
      );
    },
  ],
  4: [
    () => {
      const b = pick([2, 3, 4, 5]), k = pick([2, 3, 4]);
      return mk(
        { en: `Which fraction equals 1/${b}?`, ar: `أي كسر يساوي 1/${b}؟` },
        `${k}/${b * k}`, [`${k}/${b * k + 1}`, `${k + 1}/${b * k}`, `1/${b + k}`],
        { en: `Multiply top and bottom by ${k}: 1/${b} = ${k}/${b * k}.`, ar: `اضرب البسط والمقام في ${k}: إذن 1/${b} = ${k}/${b * k}.` }
      );
    },
    () => {
      const b = pick([2, 3, 4, 6]), n = b * ri(3, 12);
      return mk(
        { en: `What is 1/${b} of ${n}?`, ar: `كم يساوي 1/${b} من ${n}؟` },
        n / b, [n / b + 2, n / b - 1, n - b],
        { en: `Divide by ${b}: ${n} ÷ ${b} = ${n / b}.`, ar: `اقسم على ${b}: ${n} ÷ ${b} = ${n / b}.` }
      );
    },
    () => {
      const a = ri(11, 89) / 10, b = ri(11, 89) / 10;
      const s = (Math.round((a + b) * 10) / 10).toFixed(1);
      return mk(
        { en: `What is ${a.toFixed(1)} + ${b.toFixed(1)}?`, ar: `كم يساوي ${a.toFixed(1)} + ${b.toFixed(1)}؟` },
        s, [(Number(s) + 0.1).toFixed(1), (Number(s) - 0.1).toFixed(1), (Number(s) + 1).toFixed(1)],
        { en: `Line up the decimal points, then add: ${s}.`, ar: `حاذِ الفواصل العشرية ثم اجمع: ${s}.` }
      );
    },
  ],
  5: [
    () => {
      const p = pick([10, 20, 25, 50]), n = pick([40, 60, 80, 120, 200]);
      return mk(
        { en: `What is ${p}% of ${n}?`, ar: `كم يساوي ${p}٪ من ${n}؟` },
        (p * n) / 100, [(p * n) / 100 + 5, (p * n) / 50, n - p],
        { en: `${p}% means ${p}/100, so ${p}% of ${n} = ${(p * n) / 100}.`, ar: `${p}٪ تعني ${p}/100، إذن ${p}٪ من ${n} = ${(p * n) / 100}.` }
      );
    },
    () => {
      const a = ri(1, 4), b = ri(1, 4), k = ri(3, 8);
      return mk(
        { en: `Split ${(a + b) * k} in the ratio ${a}:${b}. How big is the first share?`, ar: `اقسم ${(a + b) * k} بنسبة ${a}:${b}. كم يبلغ النصيب الأول؟` },
        a * k, [b * k, a * k + k, (a + b) * k - 1],
        { en: `${a + b} parts of size ${k} each; the first share is ${a} × ${k} = ${a * k}.`, ar: `${a + b} أجزاء حجم كل منها ${k}؛ النصيب الأول ${a} × ${k} = ${a * k}.` }
      );
    },
    () => {
      const n = pick([50, 80, 100, 120, 200]), p = pick([10, 20, 25, 50]);
      const sale = n - (n * p) / 100;
      return mk(
        { en: `A ${n} jacket has a ${p}% discount. What is the sale price?`, ar: `سترة ثمنها ${n} عليها خصم ${p}٪. كم السعر بعد الخصم؟` },
        sale, [sale + 5, (n * p) / 100, n - p],
        { en: `Discount = ${(n * p) / 100}; price = ${n} − ${(n * p) / 100} = ${sale}.`, ar: `الخصم = ${(n * p) / 100}؛ السعر = ${n} − ${(n * p) / 100} = ${sale}.` }
      );
    },
  ],
  6: [
    () => {
      const x = ri(-8, 12), a = ri(2, 9);
      return mk(
        { en: `Solve: x + ${a} = ${x + a}`, ar: `حُلّ: س + ${a} = ${x + a}` },
        x, [x + 1, x - 1, x + a],
        { en: `Subtract ${a} from both sides: x = ${x + a} − ${a} = ${x}.`, ar: `اطرح ${a} من الطرفين: س = ${x + a} − ${a} = ${x}.` }
      );
    },
    () => {
      const a = ri(2, 9), b = ri(2, 9), c = ri(2, 9);
      return mk(
        { en: `What is ${a} + ${b} × ${c}?`, ar: `كم يساوي ${a} + ${b} × ${c}؟` },
        a + b * c, [(a + b) * c, a + b + c, a * b + c],
        { en: `Multiply first, then add: ${a} + ${b * c} = ${a + b * c}.`, ar: `الضرب قبل الجمع: ${a} + ${b * c} = ${a + b * c}.` }
      );
    },
    () => {
      const a = ri(3, 12), b = ri(1, 15);
      return mk(
        { en: `What is (−${a}) + ${b}?`, ar: `كم يساوي (−${a}) + ${b}؟` },
        b - a, [a - b, -(a + b), a + b],
        { en: `Start at −${a} and move ${b} to the right: you land on ${b - a}.`, ar: `ابدأ من −${a} وتحرك ${b} خطوات يميناً: تصل إلى ${b - a}.` }
      );
    },
  ],
  7: [
    () => {
      const x = ri(2, 9), a = ri(1, 9);
      return mk(
        { en: `Solve: 2x + ${a} = ${2 * x + a}`, ar: `حُلّ: ٢س + ${a} = ${2 * x + a}` },
        x, [x + 1, x - 1, 2 * x],
        { en: `Subtract ${a}, then divide by 2: x = ${x}.`, ar: `اطرح ${a} ثم اقسم على ٢: س = ${x}.` }
      );
    },
    () => {
      const m = ri(2, 6), c = ri(-5, 8), x = ri(2, 6);
      return mk(
        { en: `If y = ${m}x ${c >= 0 ? "+" : "−"} ${Math.abs(c)}, what is y when x = ${x}?`, ar: `إذا كانت ص = ${m}س ${c >= 0 ? "+" : "−"} ${Math.abs(c)}، فما قيمة ص عندما س = ${x}؟` },
        m * x + c, [m * x - c, m * x + c + m, m + x + c],
        { en: `y = ${m}·${x} ${c >= 0 ? "+" : "−"} ${Math.abs(c)} = ${m * x + c}.`, ar: `ص = ${m}×${x} ${c >= 0 ? "+" : "−"} ${Math.abs(c)} = ${m * x + c}.` }
      );
    },
    () => {
      const a = ri(2, 9), b = ri(a + 2, 20), k = b - a;
      return mkText(
        { en: `Solve the inequality: x + ${a} > ${b}`, ar: `حُلّ المتباينة: س + ${a} > ${b}` },
        [
          { en: `x > ${k}`, ar: `س > ${k}` },
          { en: `x < ${k}`, ar: `س < ${k}` },
          { en: `x > ${k + 2}`, ar: `س > ${k + 2}` },
          { en: `x < ${k - 1}`, ar: `س < ${k - 1}` },
        ],
        0,
        { en: `Subtract ${a} from both sides: x > ${k}. The inequality's direction doesn't change.`, ar: `اطرح ${a} من الطرفين: س > ${k}. اتجاه المتباينة لا يتغير.` }
      );
    },
  ],
  8: [
    () => {
      const t = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15]]);
      return mk(
        { en: `A right triangle has legs ${t[0]} and ${t[1]}. How long is the hypotenuse?`, ar: `مثلث قائم ضلعاه القائمان ${t[0]} و${t[1]}. كم طول الوتر؟` },
        t[2], [t[2] + 1, t[0] + t[1], t[2] - 1],
        { en: `Pythagoras: √(${t[0]}² + ${t[1]}²) = ${t[2]}.`, ar: `فيثاغورس: جذر (${t[0]}² + ${t[1]}²) = ${t[2]}.` }
      );
    },
    () => {
      const x = ri(5, 15), y = ri(1, x - 1);
      return mk(
        { en: `Two numbers: sum ${x + y}, difference ${x - y}. What is the larger number?`, ar: `عددان: مجموعهما ${x + y} وفرقهما ${x - y}. ما العدد الأكبر؟` },
        x, [y, x + 1, x - 1],
        { en: `Larger = (sum + difference) ÷ 2 = ${x}.`, ar: `الأكبر = (المجموع + الفرق) ÷ ٢ = ${x}.` }
      );
    },
    () => {
      const k = ri(-5, 9), x = ri(2, 6);
      return mk(
        { en: `f(x) = x² ${k >= 0 ? "+" : "−"} ${Math.abs(k)}. What is f(${x})?`, ar: `د(س) = س² ${k >= 0 ? "+" : "−"} ${Math.abs(k)}. كم تساوي د(${x})؟` },
        x * x + k, [x * x - k, 2 * x + k, (x + k) * (x + k)],
        { en: `f(${x}) = ${x}² ${k >= 0 ? "+" : "−"} ${Math.abs(k)} = ${x * x + k}.`, ar: `د(${x}) = ${x}² ${k >= 0 ? "+" : "−"} ${Math.abs(k)} = ${x * x + k}.` }
      );
    },
  ],
  9: [
    () => {
      const p = ri(1, 6), q = ri(1, 6);
      return mk(
        { en: `x² − ${p + q}x + ${p * q} = 0. One solution is x = ${p}. What is the other?`, ar: `س² − ${p + q}س + ${p * q} = 0. أحد الحلّين هو س = ${p}. فما الحل الآخر؟` },
        q, [q + 1, p + q, p * q],
        { en: `The equation factors as (x − ${p})(x − ${q}) = 0, so x = ${q}.`, ar: `تتحلّل المعادلة إلى (س − ${p})(س − ${q}) = 0، إذن س = ${q}.` }
      );
    },
    () => {
      const p = ri(2, 7), q = ri(2, 7);
      return mk(
        { en: `A quadratic has roots ${p} and ${q}: x² − ${p + q}x + C = 0. What is C?`, ar: `معادلة تربيعية جذراها ${p} و${q}: س² − ${p + q}س + جـ = 0. كم تساوي جـ؟` },
        p * q, [p + q, p * q + p, p * q - q],
        { en: `The constant term is the product of the roots: ${p} × ${q} = ${p * q}.`, ar: `الحد الثابت هو حاصل ضرب الجذرين: ${p} × ${q} = ${p * q}.` }
      );
    },
    () => {
      return mkText(
        { en: "In a 3-4-5 right triangle, what is tan of the angle opposite the side of length 3?", ar: "في مثلث قائم أضلاعه 3-4-5، كم يساوي ظل الزاوية المقابلة للضلع 3؟" },
        [num("3/4"), num("4/3"), num("3/5"), num("4/5")],
        0,
        { en: "tan = opposite ÷ adjacent = 3/4. (3/5 and 4/5 are sin and cos.)", ar: "الظل = المقابل ÷ المجاور = 3/4. (أما 3/5 و4/5 فهما الجيب وجيب التمام.)" }
      );
    },
  ],
  10: [
    () => {
      const a = pick([2, 3]), first = ri(2, 5);
      const fourth = first * a * a * a;
      return mk(
        { en: `A sequence starts ${first}, ${first * a}, ${first * a * a}, … What is the 4th term?`, ar: `متتالية تبدأ بـ ${first}، ${first * a}، ${first * a * a}، … ما الحد الرابع؟` },
        fourth, [fourth + a, first * a * 3, fourth - a],
        { en: `Each term is ×${a}: the 4th term is ${fourth}.`, ar: `كل حد يُضرب في ${a}: الحد الرابع هو ${fourth}.` }
      );
    },
    () => {
      const p0 = pick([2, 5, 10]), n = ri(3, 5);
      return mk(
        { en: `A colony of ${p0} cells doubles every hour. How many after ${n} hours?`, ar: `مستعمرة من ${p0} خلايا تتضاعف كل ساعة. كم عددها بعد ${n} ساعات؟` },
        p0 * 2 ** n, [p0 * 2 * n, p0 * 2 ** (n - 1), p0 * 2 ** n + p0],
        { en: `${p0} × 2^${n} = ${p0 * 2 ** n} — that's exponential growth.`, ar: `${p0} × ٢^${n} = ${p0 * 2 ** n} — هذا هو النمو الأسّي.` }
      );
    },
    () => {
      const n = pick([10, 15, 20]);
      return mk(
        { en: `What is 1 + 2 + … + ${n}?`, ar: `كم يساوي ١ + ٢ + … + ${n}؟` },
        (n * (n + 1)) / 2, [(n * (n - 1)) / 2, n * n, (n * (n + 1)) / 2 + n],
        { en: `Gauss's trick: n(n+1)/2 = ${n}·${n + 1}/2 = ${(n * (n + 1)) / 2}.`, ar: `حيلة غاوس: ن(ن+١)/٢ = ${n}×${n + 1}/٢ = ${(n * (n + 1)) / 2}.` }
      );
    },
  ],
};

function mathQ(level: number): QuizQ {
  return pick(MATH_GENS[level] ?? MATH_GENS[10])();
}

// -------------------------------------------------------------------- Physics

const PHYSICS_GENS: Record<number, (() => QuizQ)[]> = {
  6: [
    () => {
      const t = ri(2, 6), v = ri(3, 12);
      return mk(
        { en: `A falcon flies ${v * t} km in ${t} hours. What is its speed in km/h?`, ar: `يطير صقر ${v * t} كم في ${t} ساعات. ما سرعته بالكيلومتر في الساعة؟` },
        v, [v + 1, v * t, v - 1],
        { en: `Speed = distance ÷ time = ${v * t} ÷ ${t} = ${v} km/h.`, ar: `السرعة = المسافة ÷ الزمن = ${v * t} ÷ ${t} = ${v} كم/س.` }
      );
    },
    () => {
      const v = ri(40, 120), t = ri(2, 5);
      return mk(
        { en: `A car travels at ${v} km/h for ${t} hours. How far does it go (km)?`, ar: `تسير سيارة بسرعة ${v} كم/س لمدة ${t} ساعات. كم المسافة المقطوعة (كم)؟` },
        v * t, [v + t, v * t + 10, v * (t - 1)],
        { en: `Distance = speed × time = ${v} × ${t} = ${v * t} km.`, ar: `المسافة = السرعة × الزمن = ${v} × ${t} = ${v * t} كم.` }
      );
    },
  ],
  7: [
    () => {
      const m = ri(2, 10), a = ri(2, 6);
      return mk(
        { en: `F = ma. A ${m} kg cart accelerates at ${a} m/s². What force acts on it (N)?`, ar: `ق = ك × ت. عربة كتلتها ${m} كغ وتسارعها ${a} م/ث². ما القوة المؤثرة عليها (نيوتن)؟` },
        m * a, [m + a, m * a + 5, m * a - 2],
        { en: `Force = mass × acceleration = ${m} × ${a} = ${m * a} N.`, ar: `القوة = الكتلة × التسارع = ${m} × ${a} = ${m * a} نيوتن.` }
      );
    },
    () => {
      const m = ri(2, 12);
      return mk(
        { en: `Taking g = 10 m/s², what is the weight of a ${m} kg bag (N)?`, ar: `باعتبار ج = ١٠ م/ث²، ما وزن حقيبة كتلتها ${m} كغ (نيوتن)؟` },
        m * 10, [m, m * 10 + 10, m * 5],
        { en: `Weight = mass × g = ${m} × 10 = ${m * 10} N. Mass and weight are different things!`, ar: `الوزن = الكتلة × ج = ${m} × ١٠ = ${m * 10} نيوتن. الكتلة والوزن شيئان مختلفان!` }
      );
    },
  ],
  8: [
    () => {
      const i = ri(2, 6), r = ri(2, 8);
      return mk(
        { en: `V = IR. A current of ${i} A flows through ${r} Ω. What is the voltage (V)?`, ar: `ج = ت × م. يمر تيار ${i} أمبير في مقاومة ${r} أوم. ما الجهد (فولت)؟` },
        i * r, [i + r, i * r + 2, i * r - 2],
        { en: `Voltage = current × resistance = ${i} × ${r} = ${i * r} V.`, ar: `الجهد = التيار × المقاومة = ${i} × ${r} = ${i * r} فولت.` }
      );
    },
    () => {
      const i = ri(2, 6), r = ri(2, 8);
      return mk(
        { en: `A ${i * r} V battery drives a circuit of ${i} A. What is the resistance (Ω)?`, ar: `بطارية ${i * r} فولت تدفع تياراً قدره ${i} أمبير. كم المقاومة (أوم)؟` },
        r, [i, r + 2, i * r],
        { en: `R = V ÷ I = ${i * r} ÷ ${i} = ${r} Ω.`, ar: `م = ج ÷ ت = ${i * r} ÷ ${i} = ${r} أوم.` }
      );
    },
  ],
  9: [
    () => {
      const f = pick([2, 4, 5, 10]), l = ri(2, 8);
      return mk(
        { en: `v = fλ. A wave has frequency ${f} Hz and wavelength ${l} m. What is its speed (m/s)?`, ar: `ع = د × ل. موجة ترددها ${f} هرتز وطولها الموجي ${l} م. ما سرعتها (م/ث)؟` },
        f * l, [f + l, f * l + 3, f * l - 1],
        { en: `Speed = frequency × wavelength = ${f} × ${l} = ${f * l} m/s.`, ar: `السرعة = التردد × الطول الموجي = ${f} × ${l} = ${f * l} م/ث.` }
      );
    },
    () => {
      const f = pick([2, 4, 5, 10, 20]);
      const t = 1 / f;
      const tStr = t < 1 ? t.toFixed(f === 20 ? 2 : 1) : String(t);
      return mk(
        { en: `A wave has frequency ${f} Hz. What is its period (seconds)?`, ar: `موجة ترددها ${f} هرتز. كم زمنها الدوري (ثانية)؟` },
        tStr, [String(f), (2 / f).toFixed(1), (1 / (f + 1)).toFixed(2)],
        { en: `Period = 1 ÷ frequency = 1/${f} = ${tStr} s.`, ar: `الزمن الدوري = ١ ÷ التردد = ١/${f} = ${tStr} ث.` }
      );
    },
  ],
  10: [
    () => {
      const m = ri(2, 8), v = ri(3, 9);
      return mk(
        { en: `p = mv. A ${m} kg ball moves at ${v} m/s. What is its momentum (kg·m/s)?`, ar: `ز = ك × ع. كرة كتلتها ${m} كغ تتحرك بسرعة ${v} م/ث. ما زخمها (كغ·م/ث)؟` },
        m * v, [m + v, m * v + 4, m * v - 3],
        { en: `Momentum = mass × velocity = ${m} × ${v} = ${m * v} kg·m/s.`, ar: `الزخم = الكتلة × السرعة = ${m} × ${v} = ${m * v} كغ·م/ث.` }
      );
    },
    () => {
      const m = pick([2, 4, 6, 8]), v = pick([2, 4, 6]);
      return mk(
        { en: `KE = ½mv². A ${m} kg drone flies at ${v} m/s. What is its kinetic energy (J)?`, ar: `ط = ½ك ع². طائرة مسيّرة كتلتها ${m} كغ تطير بسرعة ${v} م/ث. ما طاقتها الحركية (جول)؟` },
        0.5 * m * v * v, [m * v, m * v * v, 0.5 * m * v],
        { en: `KE = ½ × ${m} × ${v}² = ${0.5 * m * v * v} J.`, ar: `ط = ½ × ${m} × ${v}² = ${0.5 * m * v * v} جول.` }
      );
    },
  ],
};

function physicsQ(level: number): QuizQ {
  if (level <= 5) return pick(PHYSICS_EARLY_BANK[level]);
  return pick(PHYSICS_GENS[level] ?? PHYSICS_GENS[10])();
}

// ------------------------------------------------------------------ Interface

/** Produce one quiz question for a subject at a given level. */
export function generateQuestion(subject: string, level: number): QuizQ {
  if (subject === "math") return mathQ(level);
  if (subject === "physics") return physicsQ(level);
  const bank = BANKS[subject] ?? BANKS["problem-solving"];
  // Pick from the questions pitched nearest to this school year.
  const sorted = [...bank].sort((a, b) => Math.abs(a.lv - level) - Math.abs(b.lv - level));
  return pick(sorted.slice(0, 3));
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
