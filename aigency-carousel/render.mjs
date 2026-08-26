/* Renders each frame of carousel.html to out/aigency-floor-NN.png at 1080×1350. */
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const here = fileURLToPath(new URL(".", import.meta.url));
mkdirSync(here + "frames", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await page.goto("file://" + here + "carousel.html", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

const ids = await page.$$eval("section.frame", els => els.map(e => e.id));
for (const id of ids) {
  const n = id.replace("f", "");
  await page.locator("#" + id).screenshot({ path: `${here}frames/aigency-floor-${n}.png` });
  console.log("rendered", `frames/aigency-floor-${n}.png`);
}
await browser.close();
