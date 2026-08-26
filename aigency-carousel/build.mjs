/* The Aigency — carousel builder.
   Emits carousel.html: ten 1080×1350 frames. Edit DESKS / COVER / FLOOR / ASK below. */

import { writeFileSync } from "node:fs";
import { ICONS } from "./icons.mjs";

const S = (b) => `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.7"
  stroke-linecap="square" stroke-linejoin="miter">${b}</svg>`;

/* one schematic glyph per desk — hairline, flat, no fill */
const GLYPH = {
  brief: S(`<circle cx="30" cy="50" r="7"/>
    <path d="M46 34a20 20 0 0 1 0 32"/><path d="M58 24a34 34 0 0 1 0 52"/><path d="M70 14a48 48 0 0 1 0 72"/>`),
  research: S(`<circle cx="44" cy="44" r="26"/><path d="M44 24v40M24 44h40"/><path d="M63 63 84 84"/>
    <rect x="70" y="70" width="8" height="8"/>`),
  words: S(`<path d="M18 26h64M18 40h64M18 54h44M18 68h30"/><path d="M56 62l22 18M78 62 56 80"/>`),
  design: S(`<rect x="16" y="16" width="68" height="68"/><path d="M16 39h68M16 61h68M39 16v68M61 16v68"/>
    <circle cx="50" cy="50" r="21"/>`),
  build: S(`<rect x="14" y="30" width="72" height="46"/><path d="M14 44h72"/><path d="M30 20h40"/>
    <path d="M34 58l-8 8 8 8M66 58l8 8-8 8"/>`),
  arabic: S(`<rect x="14" y="18" width="72" height="64"/><path d="M14 50h72"/>
    <path d="M74 34H30"/><path d="M40 25l-10 9 10 9"/>
    <path d="M26 66h44"/><path d="M60 57l10 9-10 9"/>`),
  ship: S(`<path d="M50 14v52"/><path d="M34 50l16 16 16-16"/><path d="M14 78h72"/>`),
  review: S(`<path d="M14 20v48M26 20v48M38 20v48"/><path d="M10 76h80"/>
    <rect x="54" y="24" width="34" height="34"/><path d="M60 42l8 8 14-17"/>`),
};

const DESKS = [
  { n:"01", key:"brief", dept:"BRIEF", name:"The Listener",
    sub:"It hears the room before we write a word.",
    status:"listening. taking notes",
    tools:[
      ["One conversation","It starts as a call, not a form.","waves"],
      ["The room","Who reads this, and what they know.","room"],
      ["The intensity dial","One level, set by the room. Held.","dial"],
      ["Scope, plain","What we make — and what we don't.","brackets"]],
    chips:[["WHO","reads it"],["WHY","now"],["WHAT","we make"]],
    delivers:["The brief","Audience read","Intensity level","Scope line"],
    flow:[["Listen","The call comes first."],["Narrow","One idea, named."],["Set the level","The room decides."]] },

  { n:"02", key:"research", dept:"RESEARCH", name:"The Researcher",
    sub:"It finds the proof, or it cuts the claim.",
    status:"source unverified. cut",
    tools:[
      ["Sources first","Every figure traced to its source.","link"],
      ["The proof hook","Named subject, real number.","target"],
      ["The competitive read","What the room has already seen.","eye"],
      ["The cut list","Unsourced claims do not ship.","cut"]],
    chips:[["SOURCE","traced"],["FIGURE","checked"],["CLAIM","or cut"]],
    delivers:["Sourced facts","Proof hooks","Reference set","Cut list"],
    flow:[["Gather","Read wider than needed."],["Verify","Back to the primary source."],["Cite","The link travels with the line."]] },

  { n:"03", key:"words", dept:"WORDS", name:"The Writer",
    sub:"It writes plain, then it cuts.",
    status:"draft four. still long",
    tools:[
      ["The Triple Hook","Visual, proof, stakes. In order.","triple"],
      ["One idea per frame","Interior frames carry one.","one"],
      ["The word list","Words we use. Words we never do.","list"],
      ["One breath","Unreadable in one? Rewritten.","breath"]],
    chips:[["VISUAL","hook"],["PROOF","hook"],["STAKES","hook"]],
    delivers:["Headlines","Body copy","Captions","Scripts"],
    flow:[["Draft","Long and honest."],["Cut","Half the words, all the meaning."],["Read aloud","The ear catches what the eye forgives."]] },

  { n:"04", key:"design", dept:"DESIGN", name:"The Designer",
    sub:"It sets every artefact in the same grid.",
    status:"grid set. subtracting",
    tools:[
      ["Tokens only","Every colour from one file.","swatch"],
      ["Seventy · twenty · ten","Paper, ink, accent. Held.","ratio"],
      ["Flat surfaces","Hairlines, square corners, flat.","corner"],
      ["Space is content","Emptiness is never filled.","space"]],
    chips:[["70","paper"],["20","ink"],["10","accent"]],
    delivers:["Layouts","Decks","Carousels","Documents"],
    flow:[["Grid","Structure before style."],["Set","Type does the work."],["Subtract","Remove until it stops improving."]] },

  { n:"05", key:"build", dept:"BUILD", name:"The Builder",
    sub:"It makes the thing run, not just look right.",
    status:"render done. exporting",
    tools:[
      ["Built, not drawn","Code before it is a file.","code"],
      ["The print engine","PDFs set to the millimetre.","page"],
      ["Prototypes","Pages and tools you can click.","cursor"],
      ["One source","One file, many exports.","node"]],
    chips:[["PDF","print"],["DECK","the room"],["WEB","screen"]],
    delivers:["Documents","Slides","Web pages","Prototypes"],
    flow:[["Build","Structure in code."],["Render","Look at the pixels."],["Export","Every format from one source."]] },

  { n:"06", key:"arabic", dept:"ARABIC", name:"The Arabist",
    sub:"It gives both languages the same care.",
    status:"joins clean. verified",
    tools:[
      ["One Arabic face","Real weights. Never faked.","type"],
      ["Right to left","Direction is layout, not a switch.","rtl"],
      ["Mixed lines","Latin inside Arabic, set right.","mix"],
      ["Read it as pixels","Extraction lies. We look.","pixels"]],
    chips:[["العربية","right to left","ar"],["English","left to right"],["×1.12","type scale"]],
    delivers:["Arabic copy","RTL layouts","Bilingual documents","Shaping check"],
    flow:[["Translate","Meaning, not words."],["Set RTL","The page turns, not the type."],["Inspect","Every join, at print size."]] },

  { n:"07", key:"review", dept:"REVIEW", name:"The Reviewer",
    sub:"Nothing leaves the studio until it passes.",
    status:"gate six of six. clean",
    tools:[
      ["Source check","No stray colour, one spelling.","search"],
      ["Rendered look","Every page seen at size.","frame"],
      ["Contrast","Body 4.5:1. Display 3:1.","contrast"],
      ["The handover note","What was checked, and what was left.","note"]],
    chips:[["GREP","gate one"],["RENDER","gate two"],["SIGN","handover"]],
    delivers:["QC report","Fixes","Handover note","The go-ahead"],
    flow:[["Check","The whole source, line by line."],["Render","Pixels, not promises."],["Sign","Or send it back."]] },
];

const FRAMES = 10;
const head = (i) => `
  <div class="head">
    <div class="brandline">
      <img src="assets/sun-320.png" alt="">
      <span class="wordline">The Aigency</span>
    </div>
    <div class="counter"><b>${String(i).padStart(2,"0")}</b> / ${FRAMES}</div>
  </div>
  <hr class="rule">`;

const foot = (mid) => `
  <div class="foot"><span>The Aigency · Abu Dhabi</span><span>${mid}</span><span class="lc">ai-gency.ai</span></div>`;

const progress = (key) => `
  <div class="progress">${DESKS.map(d =>
    `<div class="p${d.key===key?" on":""}"><i></i><b>${d.dept}</b></div>`).join("")}
  </div>`;

/* ---------- 01 · cover ---------- */
const wires = () => {
  const w = 904, y0 = 0, y1 = 100, cx = w/2;
  const cols = Array.from({length:7}, (_,i) => (w/7)*(i+.5));
  return `<svg class="wires" viewBox="0 0 ${w} ${y1}" preserveAspectRatio="none">
    ${cols.map(x => `<path d="M${cx} ${y0} L${x} ${y1}" stroke="currentColor" stroke-width="1"
      opacity=".55" fill="none"/>`).join("")}</svg>`;
};

const cover = () => `
<section class="frame night" id="f01">
  ${head(1)}
  <div class="cover-top mono sm"><span>Seven desks</span><span>One studio</span><span>One standard</span></div>

  <div class="hook">
    <div class="num">07</div>
    <div class="num-cap">desks on<br>the studio<br>floor</div>
  </div>
  <h1 class="display cover-h1">We built an<br><span class="accent">AI studio floor</span></h1>
  <p class="cover-proof">Seven desks carry every artefact we make — from the first call, through Arabic,
    to the six checks that decide whether it ships at all.</p>

  <div class="org" style="color:var(--accent)">
    <div class="node"><b>The Aigency</b><span>The studio floor</span></div>
    ${wires()}
    <div class="desks">${DESKS.map(d =>
      `<div class="d">${GLYPH[d.key]}<b>${d.dept}</b></div>`).join("")}</div>
  </div>
  <p class="swipe">swipe to meet the floor →</p>
  ${foot("AI for the better")}
</section>`;

/* ---------- 02–08 · desks ---------- */
const desk = (d, i) => `
<section class="frame" id="f${String(i).padStart(2,"0")}">
  ${head(i)}
  <p class="kicker mono sm">Desk ${d.n} / 07 · ${d.dept}</p>
  <h2 class="display title">${d.name}</h2>
  <p class="sub">${d.sub}</p>

  <div class="body">
    <div class="tools">${d.tools.map(([t,p,ic]) => `
      <div class="tool"><div class="g">${ICONS[ic]}</div>
        <div><h4>${t}</h4><p>${p}</p></div></div>`).join("")}
    </div>
    <div class="desk">
      <div class="status"><span>${d.status}</span><i class="caret"></i></div>
      <div class="glyph">${GLYPH[d.key]}</div>
      <div class="plate">${d.dept} desk</div>
      <div class="chips">${d.chips.map(([b,s,ar]) =>
        `<div class="chip"><b${ar?' class="ar" dir="rtl" lang="ar"':""}>${b}</b><span>${s}</span></div>`).join("")}</div>
    </div>
  </div>

  <div class="band">
    <div class="lbl mono">What it leaves behind</div>
    <ul>${d.delivers.map(x => `<li>${x}</li>`).join("")}</ul>
  </div>

  <div class="flow">${d.flow.map(([b,s],k) =>
    `${k?'<span class="arrow">→</span>':""}<div class="step"><b>${b}</b><span>${s}</span></div>`).join("")}
  </div>

  ${progress(d.key)}
  ${foot(`${d.dept} · one job`)}
</section>`;

/* ---------- 09 · the loop ---------- */
const floor = () => `
<section class="frame" id="f09">
  ${head(9)}
  <div class="loop-head">
    <p class="mono sm soft">How the work gets made</p>
    <h2 class="display">The same line,<br><span class="accent">every time</span></h2>
  </div>

  <div class="loop">
    ${DESKS.map(d => `
      <div class="row">${GLYPH[d.key]}<b>${d.dept.charAt(0) + d.dept.slice(1).toLowerCase()}</b>
        <span>— ${d.name.toLowerCase()}</span></div>
      <div class="down">↓</div>`).join("")}
    <div class="row last">${GLYPH.ship}<b>Ship</b>
      <span>— nothing leaves until it passes</span></div>
  </div>
  ${foot("Brief → review → ship")}
</section>`;

/* ---------- 10 · the ask ---------- */
const ask = () => `
<section class="frame night" id="f10">
  ${head(10)}
  <div class="ask">
    <div class="lockup">
      <img src="assets/sun-320.png" alt="">
      <img class="wm" src="assets/wordmark-paper-900.png" alt="The Aigency">
      <p class="tagline">A creative <span class="accent">solutions</span> AI studio.</p>
    </div>
    <h2>Bring us the room.<br>We will bring the floor.</h2>
    <p>Proposals, decks, documents, Arabic and prototypes — made by a studio
      that checks its own work first.</p>
    <div class="cta">Follow <span class="lc">@theaigency.io</span></div>
    <div class="contact"><span class="lc">lab@ai-gency.ai</span> · <span class="lc">ai-gency.ai</span><br>Abu Dhabi, UAE</div>
  </div>
  ${foot("AI for the better")}
</section>`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>The Aigency — the studio floor</title>
<link rel="stylesheet" href="carousel.css">
</head><body>
${cover()}
${DESKS.map((d,k) => desk(d, k+2)).join("\n")}
${floor()}
${ask()}
</body></html>`;

writeFileSync(new URL("./carousel.html", import.meta.url), html);
console.log(`carousel.html written · ${FRAMES} frames`);
