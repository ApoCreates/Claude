/* QC gate 2 helper: reports any block that overflows its box, plus safe-zone breaches. */
import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
await page.goto("file://" + new URL(".", import.meta.url).pathname + "carousel.html");
await page.evaluate(() => document.fonts.ready);

const report = await page.evaluate(() => {
  const out = [];
  for (const f of document.querySelectorAll("section.frame")) {
    const ft = f.getBoundingClientRect().top;
    for (const el of f.querySelectorAll(".body,.tools,.desk,.floorline,.facts,.ask,.chips,.flow,.band,.org")) {
      if (el.scrollHeight - el.clientHeight > 2)
        out.push(`${f.id} OVERFLOW ${el.className || el.tagName} +${el.scrollHeight - el.clientHeight}px`);
    }
    for (const el of f.querySelectorAll(".body,.band,.flow,.progress,.title,.sub,.ask,.facts,.floorline,.swipe")) {
      const b = el.getBoundingClientRect().bottom - ft;
      if (b > 1130) out.push(`${f.id} SAFE-ZONE ${el.className} bottom ${Math.round(b)} > 1130`);
    }
  }
  return out;
});
console.log(report.length ? report.join("\n") : "clean — no overflow, nothing important below y=1130");
await browser.close();
