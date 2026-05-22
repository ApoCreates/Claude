const fs = require("fs");
const PDFDocument = require("pdfkit");
const SVGtoPDF = require("svg-to-pdfkit");

const OUT = "/home/user/Claude/deliverables";

// Per-engagement fill-ins — change these two per project.
const CLIENT = "Al Safadi Restaurant";
const DOC_DATE = "22 May 2026";

const RED = "#c8102e";
const INK = "#14202e";
const SLATE = "#41506a";
const MUTE = "#5b6b7d";
const LINE = "#d7dde5";
const PANEL = "#f3f5f8";
const TEAL = "#0e7c86";
const TEALTINT = "#eaf5f6";

/* ----------------------------- Architecture PDF ----------------------------- */
function buildArchitecture() {
  let svg = fs.readFileSync(`${OUT}/architecture.svg`, "utf8");
  svg = svg.replace(/\[Client\]/g, CLIENT).replace(/\[Date\]/g, DOC_DATE);
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });
  const stream = fs.createWriteStream(`${OUT}/architecture.pdf`);
  doc.pipe(stream);
  const w = 805, h = w * (794 / 1123);
  const x = (841.89 - w) / 2;
  const y = (595.28 - h) / 2;
  SVGtoPDF(doc, svg, x, y, { width: w, height: h, assumePt: true, preserveAspectRatio: "xMidYMid meet" });
  doc.end();
  return new Promise((res) => stream.on("finish", res));
}

/* ------------------------------ Questions PDF ------------------------------- */
const META = {
  title: "Unified Sales Intelligence Platform",
  subtitle:
    "System-level technical deep dive & suggested approaches — Business Central, LS Retail, Squirrel, Bayan and the unified data layer.",
  meta: `Prepared for: ${CLIENT}    |    The Aigency · lab@ai-gency.ai    |    Date: ${DOC_DATE}`,
  intro:
    "We've deliberately skipped the obvious. The questions below are the ones that genuinely shape the architecture, the data fidelity and the timeline — the places where these specific systems tend to bite. Where we're already confident in the right pattern, we've included our suggested approach so you can see how we'd solve it, not just what we'd ask. Treat the suggested approaches as our opening recommendation, to be confirmed against your environment.",
};

// [question, whyWeAsk, suggestedApproach|null]
const SECTIONS = [
  {
    h: "1. Business Central — extraction throughput & financial truth",
    why: "BC is your revenue system of record. How we extract from it, and which layer we treat as truth, decides both data freshness and whether the numbers ever survive an audit.",
    qs: [
      [
        "Have you enabled the native Business Central to Microsoft Fabric (OneLake) data link, or is downstream extraction expected to run against the standard API/OData endpoints? At real transaction volumes the public APIs hit per-environment throttling (HTTP 429) quickly.",
        "The extraction method caps how fresh and complete the revenue feed can be without degrading BC for your own users.",
        "We'd extract via the Fabric/OneLake link, or change-tracking delta queries filtered on lastModifiedDateTime, for incremental throttle-safe loads — never full-table OData polling in production.",
      ],
      [
        "For the revenue source of truth, should we read posted financial figures (G/L, Cust. Ledger, Value Entries) or operational sales documents (posted sales invoices, item ledger entries)? They diverge on timing, returns and tax treatment.",
        "G/L is audit-grade but lags operational reality; item/sales entries are timelier but pre-reconciliation. Leadership usually wants both.",
        "We model both: an operational \"flash\" sales layer for same-day visibility, reconciled nightly to posted G/L so the fast number and the final number always agree by period close.",
      ],
      [
        "How disciplined is Dimension posting across modules — are Department/Brand/Region/Outlet enforced as mandatory default dimensions with combination rules, or are there historical periods where entries posted without full dimensioning?",
        "Dimensions are stored as Dimension Set Entries, not columns. Gaps mean revenue that can't be sliced and quietly falls into \"unclassified.\"",
        "We profile dimension completeness up front and, where gaps exist, build a deterministic back-classification mapping (by G/L account, location or item category) rather than leaving revenue unattributed.",
      ],
      [
        "Do you run AppSource or custom AL extensions that add business-meaningful fields to sales/item documents (revenue categories, consignment flags, inter-company markers), and are inter-company sales or eliminations posted within the same environment?",
        "Custom fields often hold the real classification, and inter-company traffic double-counts revenue if it isn't isolated.",
        "We map custom fields explicitly and tag inter-company/elimination entries so consolidated revenue is clean from day one.",
      ],
    ],
  },
  {
    h: "2. LS Retail / LS Central — POS truth, replication & promotions",
    why: "LS is where retail sales are born. Its replication model and promotion schema are the two things that most often make a dashboard disagree with the store.",
    qs: [
      [
        "Are you on LS Central (embedded in BC) or LS Nav/LS Retail on classic NAV — and should we read the head-office-replicated transaction tables (Transaction Header / Transaction Sales Entry) or only posted Statements?",
        "Pre-statement transaction tables give near-real-time sales but aren't yet financially posted; statements are posted but batched. This is the latency-vs-finality trade-off.",
        "We read HO-replicated transaction entries for live sales, then reconcile to posted statements — so the dashboard is real-time yet provably ties to finance once statements post.",
      ],
      [
        "What is your store-to-head-office replication cadence and mechanism (LS scheduler jobs / Data Director), and how are offline POS terminals that resync late handled?",
        "Replication lag and late resync are the classic causes of phantom gaps and double counts in LS environments.",
        "We design the pipeline append-only with late-arriving-data handling keyed on transaction GUID + business date, so a terminal syncing hours late restates cleanly without double-counting.",
      ],
      [
        "How are promotions modeled — periodic discounts, multibuy / mix-and-match, coupons, member prices — and are discounts captured at line level or only as a transaction total?",
        "Net-vs-gross sales and true margin depend entirely on where and how discounts land in the LS schema.",
        "We decompose discounts to line level (Transaction Discount Entry) so the dashboard separates gross sales, discount give-back and net — the view merchandising and finance both trust.",
      ],
      [
        "Do you use LS Member Management / loyalty, and should member identity flow through to cross-channel customer analytics?",
        "Member Sales Entries are the only reliable bridge between a retail basket and a known customer.",
        null,
      ],
    ],
  },
  {
    h: "3. Squirrel — hospitality semantics & business-day boundaries",
    why: "Hospitality has a different rhythm to retail. The business-day boundary and check lifecycle are where F&B revenue silently drifts from finance.",
    qs: [
      [
        "Which Squirrel generation are you on (legacy on-prem back-office vs. Squirrel Cloud), and what is the sanctioned data egress — the Squirrel API / integration services, ODBC to the back-office database, or scheduled flat-file exports?",
        "Squirrel deployments vary widely; the egress route dictates whether hospitality sales can be near-real-time or strictly end-of-day.",
        "Where only the back-office DB is exposed, we attach a read-only replica and extract via change-data-capture rather than querying the live POS database — zero impact on service-time performance.",
      ],
      [
        "How is the hospitality \"business day\" defined for late-night venues — does a check opened at 01:00 belong to the prior trading day — and how are split checks, transfers, voids, comps and gratuities represented?",
        "Business-day boundary and check-lifecycle events are the single biggest source of POS-to-finance variance in F&B.",
        "We anchor every transaction to three timestamps — open, close and business day — and model voids/comps/transfers as first-class events, so revenue centers and dayparts reconcile exactly to the venue's own end-of-day.",
      ],
      [
        "How do tenders and tax reconcile — service charge vs. tip handling, VAT on inclusive menu pricing, and house-account / charge-to-room postings that settle later?",
        "UAE VAT on tax-inclusive F&B pricing and deferred house-account settlement both distort naive revenue capture.",
        "We separate gross menu revenue, service charge, VAT and tips at source, and treat house-account settlements as a deferred-revenue bridge into Business Central.",
      ],
    ],
  },
  {
    h: "4. Bayan — labor intelligence, aligned to sales",
    why: "HR turns revenue into productivity. The only useful version of that aligns labor to the same outlet and daypart that produced the sales — and exposes no individual.",
    qs: [
      [
        "Does Bayan hold time-and-attendance / scheduling, or only payroll master and WPS disbursement — and can labor cost be resolved to the same cost-center / outlet grain (ideally daypart) as POS revenue?",
        "Labor-to-sales productivity is only meaningful if labor hours align to the revenue center and daypart that generated the sales.",
        "If scheduling lives elsewhere, we blend Bayan payroll cost with the attendance source and compute productivity at outlet/daypart, exposing only aggregates — never individual pay.",
      ],
      [
        "For WPS / payroll cycles, what are the cut-off and accrual conventions, so monthly labor cost aligns to the revenue period rather than the disbursement date?",
        "Payroll disbursement dates rarely match revenue periods; a naive join misstates labor %.",
        "We accrue labor to the revenue period using your cycle cut-offs, matching finance's own accrual logic so labor % is comparable period to period.",
      ],
    ],
  },
  {
    h: "5. Unification, reconciliation & master data",
    why: "This is the real engineering. Four systems each define \"outlet,\" \"product\" and \"day\" differently, and POS will never tie to finance to the cent. The question is how we govern that.",
    qs: [
      [
        "Across BC dimension values, LS Store No. and Squirrel revenue centers, is there any existing crosswalk for \"outlet,\" or do these identifiers live independently — and likewise for product category and customer?",
        "Without a conformed key, no cross-channel rollup is trustworthy, no matter how good the visuals are.",
        "We stand up a governed conformed-dimension mapping (outlet, product category, calendar) maintained as version-controlled reference data with a named steward — the backbone of the unified model.",
      ],
      [
        "What variance tolerance is acceptable between operational POS net sales and posted BC revenue by period, and who owns sign-off when they differ?",
        "There will always be timing variance; the real questions are what counts as \"in tolerance\" and who adjudicates exceptions.",
        "We build a reconciliation ledger with configurable thresholds and automated variance alerts, so exceptions surface to a named owner instead of eroding trust silently.",
      ],
      [
        "Are backdated postings or prior-period adjustments common in BC (restating closed periods), and how should the dashboard represent a restatement leadership has already seen?",
        "Backdated entries silently change \"final\" numbers, which is corrosive to executive trust if unmanaged.",
        "We keep an immutable as-reported snapshot alongside a current-restated view, so history is auditable and every restatement is explicit rather than invisible.",
      ],
    ],
  },
  {
    h: "6. Connectivity, identity & residency — security posture",
    why: "These determine how fast we clear your InfoSec review and whether the platform is compliant by design. We come in with the secure pattern already chosen.",
    qs: [
      [
        "For the on-prem sources (LS head office, Squirrel back-office), can we deploy an outbound-only secure data gateway (self-hosted integration runtime / on-prem data gateway) rather than opening inbound VPN into your network?",
        "Outbound-only egress is materially more secure and usually far quicker to pass an InfoSec review than inbound firewall changes.",
        "We standardize on an outbound-only gateway reading from least-privilege replicas — no inbound ports opened on your network.",
      ],
      [
        "For service-to-service auth into Business Central and Entra ID, can you provision an app registration / service principal with certificate-based credentials and least-privilege API permissions, and is Conditional Access scoped to allow it?",
        "Conditional Access frequently blocks service principals using user-style auth; certificate-based app auth is the robust pattern.",
        "We authenticate via a dedicated service principal with certificate auth and granular, least-privilege permissions — never embedded user credentials.",
      ],
      [
        "Must all processing — including the AI layer — remain within the UAE (e.g., Azure UAE North), and if a required model isn't available in-region, is aggregated / de-identified egress acceptable under your PDPL interpretation?",
        "This decides whether the AI runs fully in-region or whether we must design an explicit anonymization boundary.",
        "We deploy the data platform and, where possible, the model in Azure UAE North; if a needed model is out-of-region, we aggregate / de-identify before any egress so no raw PII or transaction-level data leaves the country.",
      ],
    ],
  },
];

function buildQuestions() {
  const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
  const stream = fs.createWriteStream(`${OUT}/discovery-questions.pdf`);
  doc.pipe(stream);

  const ML = 48, MR = 48, MT = 54, MB = 60;
  const PW = 595.28, PH = 841.89;
  const CW = PW - ML - MR;
  let y = MT;
  let qn = 0;

  const ensure = (need) => {
    if (y + need > PH - MB) {
      doc.addPage();
      y = MT;
    }
  };

  // ---- Cover header ----
  doc.font("Helvetica-Bold").fontSize(8).fillColor(RED).text("TECHNICAL DISCOVERY  ·  CONFIDENTIAL", ML, y);
  y += 16;
  doc.font("Helvetica-Bold").fontSize(20).fillColor(INK).text(META.title, ML, y, { width: CW });
  y = doc.y + 4;
  doc.font("Helvetica").fontSize(10).fillColor(SLATE).text(META.subtitle, ML, y, { width: CW });
  y = doc.y + 6;
  doc.font("Helvetica").fontSize(9).fillColor(MUTE).text(META.meta, ML, y, { width: CW });
  y = doc.y + 8;
  doc.moveTo(ML, y).lineTo(PW - MR, y).lineWidth(2).strokeColor(RED).stroke();
  y += 14;

  // ---- Intro box ----
  const introPad = 10;
  doc.font("Helvetica").fontSize(9.5);
  const introH = doc.heightOfString(META.intro, { width: CW - introPad * 2 }) + introPad * 2;
  doc.rect(ML, y, CW, introH).fill(PANEL);
  doc.rect(ML, y, 4, introH).fill(RED);
  doc.fillColor(SLATE).font("Helvetica").fontSize(9.5).text(META.intro, ML + introPad, y + introPad, { width: CW - introPad * 2 });
  y += introH + 14;

  // ---- Sections ----
  for (const sec of SECTIONS) {
    doc.font("Helvetica-Bold").fontSize(12.5);
    const hH = doc.heightOfString(sec.h, { width: CW });
    doc.font("Helvetica-Oblique").fontSize(9.5);
    const whyH = doc.heightOfString(sec.why, { width: CW });
    ensure(hH + whyH + 30);

    doc.font("Helvetica-Bold").fontSize(12.5).fillColor(INK).text(sec.h, ML, y, { width: CW });
    y = doc.y + 3;
    doc.moveTo(ML, y).lineTo(PW - MR, y).lineWidth(0.7).strokeColor(LINE).stroke();
    y += 5;
    doc.font("Helvetica-Oblique").fontSize(9.5).fillColor(MUTE).text(sec.why, ML, y, { width: CW });
    y = doc.y + 9;

    for (const [q, why, sol] of sec.qs) {
      qn++;
      const numW = 22;
      const qx = ML + numW;
      const qw = CW - numW;
      const solPad = 8;

      doc.font("Helvetica-Bold").fontSize(10.5);
      const qH = doc.heightOfString(q, { width: qw });
      doc.font("Helvetica").fontSize(9.5);
      const whyH2 = doc.heightOfString("Why we ask:  " + why, { width: qw });
      let solBoxH = 0;
      const solText = sol ? "Suggested approach:  " + sol : null;
      if (solText) {
        doc.font("Helvetica").fontSize(9.5);
        solBoxH = doc.heightOfString(solText, { width: qw - solPad * 2 }) + solPad * 2 + 6;
      }
      ensure(qH + whyH2 + solBoxH + 16);

      // number + question
      doc.font("Helvetica-Bold").fontSize(10.5).fillColor(RED).text(qn + ".", ML, y, { width: numW });
      doc.font("Helvetica-Bold").fontSize(10.5).fillColor(INK).text(q, qx, y, { width: qw });
      y = doc.y + 2;
      // why
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(SLATE).text("Why we ask:  ", qx, y, { continued: true });
      doc.font("Helvetica").fillColor(SLATE).text(why, { width: qw });
      y = doc.y + 4;
      // suggested approach box
      if (solText) {
        doc.font("Helvetica").fontSize(9.5);
        const innerW = qw - solPad * 2;
        const txtH = doc.heightOfString(solText, { width: innerW });
        const boxH = txtH + solPad * 2;
        doc.rect(qx, y, qw, boxH).fill(TEALTINT);
        doc.rect(qx, y, 3, boxH).fill(TEAL);
        doc.font("Helvetica-Bold").fontSize(9.5).fillColor(TEAL).text("Suggested approach:  ", qx + solPad, y + solPad, { width: innerW, continued: true });
        doc.font("Helvetica").fillColor("#1d4f54").text(sol, { width: innerW });
        y += boxH + 10;
      } else {
        y += 6;
      }
    }
    y += 4;
  }

  // ---- Footer on every page ----
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc.font("Helvetica").fontSize(8).fillColor(MUTE);
    doc.moveTo(ML, PH - MB + 16).lineTo(PW - MR, PH - MB + 16).lineWidth(0.7).strokeColor(LINE).stroke();
    doc.fillColor(MUTE).text("The Aigency · lab@ai-gency.ai — Confidential. Suggested approaches are our opening recommendation, confirmed against your environment.", ML, PH - MB + 22, { width: CW - 60 });
    doc.text("Page " + (i + 1) + " of " + range.count, PW - MR - 60, PH - MB + 22, { width: 60, align: "right" });
  }

  doc.end();
  return new Promise((res) => stream.on("finish", res));
}

(async () => {
  await buildArchitecture();
  await buildQuestions();
  console.log("done");
})();
