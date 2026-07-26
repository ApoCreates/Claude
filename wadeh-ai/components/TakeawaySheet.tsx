"use client";

import { usePrefs } from "@/lib/prefs";
import type { Subject, Level } from "@/lib/curriculum";
import { buildDeck } from "@/lib/notebook";

// A printable "take it home" sheet — the trophy the learner keeps after class.
// Opens a clean print window and triggers Save-as-PDF; no external library.
export function TakeawaySheet({ subject, level }: { subject: Subject; level: Level }) {
  const { lang } = usePrefs();
  const ar = lang === "ar";

  const make = () => {
    const deck = buildDeck(subject, level);
    const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

    const cards = deck
      .map((c) => {
        const paras = (c.paras ?? []).map((p) => `<p>${esc(p[lang].replace(/\$([^$]+)\$/g, "$1"))}</p>`).join("");
        const tqs = (c.techniques ?? [])
          .map((tq) => `<li><b>${tq.emoji} ${esc(tq.name[lang])}</b> — ${esc(tq.blurb[lang])}</li>`)
          .join("");
        const units = (c.table ? "" : "");
        return `<section><h3>${esc(c.label[lang])}</h3>${paras}${tqs ? `<ul>${tqs}</ul>` : ""}${units}</section>`;
      })
      .join("");

    const dir = ar ? "rtl" : "ltr";
    const title = `${subject.name[lang]} · ${level.title[lang]}`;
    const html = `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8">
<title>${esc(title)} — ${ar ? "ورقة العودة للبيت" : "Take-home sheet"}</title>
<style>
  @page { margin: 20mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Amiri', serif; color: #15140f; background: #fff; line-height: 1.5; max-width: 720px; margin: 0 auto; padding: 24px; }
  .brand { font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: #c4612a; }
  h1 { font-size: 26px; margin: 6px 0 2px; }
  .meta { color: #6e685d; font-size: 13px; margin-bottom: 18px; }
  h3 { font-size: 15px; margin: 18px 0 4px; border-bottom: 1px solid #e2d9c6; padding-bottom: 3px; }
  p, li { font-size: 13.5px; }
  ul { padding-inline-start: 18px; }
  .foot { margin-top: 26px; border-top: 1px solid #e2d9c6; padding-top: 10px; color: #6e685d; font-size: 12px; display:flex; justify-content:space-between; }
  .trophy { font-size: 40px; text-align:center; margin: 8px 0; }
</style></head>
<body>
  <div class="brand">wadehAI · ${ar ? "ورقة العودة للبيت" : "Take-home sheet"}</div>
  <h1>${esc(title)}</h1>
  <div class="meta">${ar ? "السنة" : "Year"} ${level.n} / 10 · ${esc(level.focus[lang])}</div>
  <div class="trophy">🏆</div>
  ${cards}
  <div class="foot"><span>${ar ? "اسم المتعلّم:" : "Learner:"} ____________________</span><span>${ar ? "التاريخ:" : "Date:"} __________</span></div>
</body></html>`;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 350);
  };

  return (
    <button onClick={make} className="btn-paper">
      <span aria-hidden>🏆</span> {ar ? "خذها للبيت (PDF)" : "Take it home (PDF)"}
    </button>
  );
}
