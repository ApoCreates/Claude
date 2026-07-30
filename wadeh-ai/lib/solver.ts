// Offline math solver — computes arithmetic and simple operations locally with
// a worked, age-calibrated explanation, so trivial questions like "5x6",
// "144 ÷ 12", "25% of 80" or "1/2 + 1/4" NEVER touch the paid API.
//
// Safe evaluation (no eval): tokenizer + shunting-yard over + - * / ^ ( ) and %.

import type { Bi } from "./curriculum";

const AR_DIGITS: Record<string, string> = { "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9", "٪": "%" };

function normalize(raw: string): string {
  let s = raw.toLowerCase().trim();
  s = s.replace(/[٠-٩٪]/g, (c) => AR_DIGITS[c] ?? c);
  // strip polite framing
  s = s.replace(/^(what\s*is|whats|calculate|compute|solve|كم\s*(يساوي|هو)?|احسب|ما\s*(هو|ناتج)?)\s*/i, "");
  s = s.replace(/[?؟.]+$/g, "").trim();
  // "5x6" / "5 x 6" (x between numbers) → multiply
  s = s.replace(/(\d)\s*[x×*]\s*(\d)/g, "$1*$2");
  // words → operators (EN + AR)
  s = s
    .replace(/\b(times|multiplied by|x)\b/gi, "*")
    .replace(/\b(plus|and)\b/gi, "+")
    .replace(/\b(minus|less|take away)\b/gi, "-")
    .replace(/\b(divided by|over)\b/gi, "/")
    .replace(/\b(squared)\b/gi, "^2")
    .replace(/\b(cubed)\b/gi, "^3")
    .replace(/(?:في|ضرب)/g, "*")
    .replace(/(?:زائد|جمع|و)/g, "+")
    .replace(/(?:ناقص|طرح)/g, "-")
    .replace(/(?:على|تقسيم|قسمة)/g, "/")
    .replace(/×/g, "*")
    .replace(/[÷]/g, "/");
  // "half of N" / "نصف N"
  s = s.replace(/\bhalf of\b/gi, "0.5*").replace(/نصف/g, "0.5*");
  s = s.replace(/\bdouble\b/gi, "2*").replace(/ضعف/g, "2*");
  return s.replace(/\s+/g, " ").trim();
}

// "A% of B" / "A percent of B" / "A بالمئة من B" -> A/100*B
function expandPercentOf(s: string): string {
  return s
    .replace(/(\d+(?:\.\d+)?)\s*%?\s*(?:percent\s*)?of\s*(\d+(?:\.\d+)?)/gi, "($1/100*$2)")
    .replace(/(\d+(?:\.\d+)?)\s*(?:%|بالمئة|بالمائة|في\s*المئة)\s*من\s*(\d+(?:\.\d+)?)/g, "($1/100*$2)")
    // trailing standalone "N%" -> (N/100)
    .replace(/(\d+(?:\.\d+)?)\s*%/g, "($1/100)");
}

type Tok = { t: "num" | "op" | "lp" | "rp"; v: string };

function tokenize(s: string): Tok[] | null {
  const toks: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === " ") { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let n = "";
      while (i < s.length && /[0-9.]/.test(s[i])) n += s[i++];
      if ((n.match(/\./g) || []).length > 1) return null;
      toks.push({ t: "num", v: n });
      continue;
    }
    if ("+-*/^".includes(c)) { toks.push({ t: "op", v: c }); i++; continue; }
    if (c === "(") { toks.push({ t: "lp", v: c }); i++; continue; }
    if (c === ")") { toks.push({ t: "rp", v: c }); i++; continue; }
    return null; // unknown char → not a pure math expression
  }
  return toks;
}

const PREC: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 3 };

function evaluate(toks: Tok[]): number | null {
  const out: Tok[] = [];
  const ops: Tok[] = [];
  // handle unary minus by inserting 0
  const norm: Tok[] = [];
  for (let k = 0; k < toks.length; k++) {
    const tk = toks[k];
    if (tk.t === "op" && tk.v === "-" && (k === 0 || toks[k - 1].t === "op" || toks[k - 1].t === "lp")) {
      norm.push({ t: "num", v: "0" });
    }
    norm.push(tk);
  }
  for (const tk of norm) {
    if (tk.t === "num") out.push(tk);
    else if (tk.t === "op") {
      while (ops.length && ops[ops.length - 1].t === "op") {
        const top = ops[ops.length - 1];
        const rightAssoc = tk.v === "^";
        if ((rightAssoc ? PREC[top.v] > PREC[tk.v] : PREC[top.v] >= PREC[tk.v])) out.push(ops.pop()!);
        else break;
      }
      ops.push(tk);
    } else if (tk.t === "lp") ops.push(tk);
    else if (tk.t === "rp") {
      while (ops.length && ops[ops.length - 1].t !== "lp") out.push(ops.pop()!);
      if (!ops.length) return null;
      ops.pop();
    }
  }
  while (ops.length) { const o = ops.pop()!; if (o.t === "lp") return null; out.push(o); }

  const st: number[] = [];
  for (const tk of out) {
    if (tk.t === "num") st.push(parseFloat(tk.v));
    else {
      const b = st.pop(), a = st.pop();
      if (a === undefined || b === undefined) return null;
      let r: number;
      switch (tk.v) {
        case "+": r = a + b; break;
        case "-": r = a - b; break;
        case "*": r = a * b; break;
        case "/": if (b === 0) return null; r = a / b; break;
        case "^": r = Math.pow(a, b); break;
        default: return null;
      }
      st.push(r);
    }
  }
  return st.length === 1 ? st[0] : null;
}

const fmt = (n: number): string => (Number.isInteger(n) ? String(n) : String(Math.round(n * 1e6) / 1e6));

export interface SolverResult {
  reply: Bi;
}

// Returns a worked bilingual answer if the message is a computable expression,
// else null. `level` gently calibrates how much explanation to add.
export function solveMath(raw: string, level = 5): SolverResult | null {
  if (!raw) return null;
  let s = normalize(raw);
  s = expandPercentOf(s);
  // must actually contain an operator and a digit to be a calculation
  if (!/[0-9]/.test(s) || !/[+\-*/^]/.test(s)) return null;
  // reject if there are letters left (it's a word problem, not pure arithmetic)
  if (/[a-z؀-ۿ]/i.test(s.replace(/[eE](?=[+-]?\d)/g, ""))) return null;

  const toks = tokenize(s);
  if (!toks || toks.length < 3) return null;
  const val = evaluate(toks);
  if (val === null || !isFinite(val)) return null;

  const pretty = s.replace(/\*/g, " × ").replace(/\//g, " ÷ ").replace(/\^/g, " ^ ");
  const ans = fmt(val);

  // A light, age-appropriate nudge to keep it a lesson, not just a calculator.
  const nudgeEn =
    level <= 3
      ? "\n\nTip: try counting it out in groups to see why — then check with me!"
      : "\n\nWant to see the steps, or try a harder one? Just ask.";
  const nudgeAr =
    level <= 3
      ? "\n\nنصيحة: جرّب العدّ في مجموعات لترى السبب — ثم تحقّق معي!"
      : "\n\nتريد الخطوات أم مسألة أصعب؟ فقط اسأل.";

  return {
    reply: {
      en: `${pretty} = **${ans}**${nudgeEn}`,
      ar: `${pretty} = **${ans}**${nudgeAr}`,
    },
  };
}
