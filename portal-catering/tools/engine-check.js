/**
 * tools/engine-check.js — فحص المحرك الحتمي بلا متصفح وبلا اعتماديات.
 * التشغيل: npm test   أو   node tools/engine-check.js
 *
 * يتحقق من:
 *   1. مطابقة كل حل مولَّد لمخطط golden_solution حرفياً (لا حقول زائدة ولا ناقصة).
 *   2. القواعد الصارمة على المحتوى (3 توصيات بمالك وإطار وأثر، أتمتة بصيغة مشغّل←شرط←إجراء، 2–3 KPIs).
 *   3. التخصيص: كل حل يذكر حقائق فعاليته (الاسم، الكميات، الموقع/المزود).
 *   4. الحتمية: نفس المدخل ⇒ نفس المخرَج حرفياً.
 *   5. معايير القبول: EV-008 ≈ EV-001، EV-019 ≈ EV-010، EV-002 يمزج EV-010 وEV-020.
 *   6. اتساق الخطورة المحسوبة مع المسجّلة في البيانات.
 *   7. دورة كاملة لورقة التعبئة: بناء ملف xlsx ← قراءته ← تحويله إلى فعالية ← توليد حل.
 */
require('../assets/logic.js');
require('../assets/rule-engine.js');
require('../assets/xlsx.js');
require('../assets/workbook.js');

const E = globalThis.RuleEngine;
const data = require('../data/catering_incidents_dataset.json');
const golden = data.events.filter((e) => e.golden_solution);

const SOL_KEYS = ['status', 'portal_module', 'diagnosis_ar', 'recommendations', 'automations', 'kpis'];
const REC_KEYS = ['priority', 'type', 'action_ar', 'owner_ar', 'timeline_ar', 'expected_impact_ar'];
const AUT_KEYS = ['name_ar', 'trigger_ar', 'condition_ar', 'action_ar', 'portal_module'];
const KPI_KEYS = ['name_ar', 'target_ar'];

let pass = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) pass++;
  else failures.push(`${name}${detail ? ' — ' + detail : ''}`);
}

function keysAre(obj, expected) {
  return JSON.stringify(Object.keys(obj)) === JSON.stringify(expected);
}

/* ------------------- 1–4: كل الفعاليات العشرين ------------------- */
for (const ev of data.events) {
  const id = ev.event_id;
  const sol = E.generate(ev, golden);

  check(`${id} مخطط الحل`, keysAre(sol, SOL_KEYS), `المفاتيح: ${Object.keys(sol)}`);
  check(`${id} الحالة generated`, sol.status === 'generated');
  check(`${id} الوحدة معروفة`,
    globalThis.PortalLogic.MODULES.some((m) => m.name === sol.portal_module), sol.portal_module);

  check(`${id} عدد التوصيات ≤ 3`, sol.recommendations.length >= 1 && sol.recommendations.length <= 3,
    `${sol.recommendations.length}`);
  sol.recommendations.forEach((r, i) => {
    check(`${id} مخطط التوصية ${i + 1}`, keysAre(r, REC_KEYS));
    check(`${id} أولوية التوصية ${i + 1}`, r.priority === i + 1);
    check(`${id} نوع التوصية ${i + 1}`,
      ['وقائي', 'تشغيلي', 'تعاقدي'].includes(r.type), r.type);
    REC_KEYS.slice(2).forEach((k) => {
      check(`${id} التوصية ${i + 1} حقل ${k} غير فارغ`, !!(r[k] && r[k].trim()));
    });
  });
  if (sol.recommendations.length === 3) {
    const types = new Set(sol.recommendations.map((r) => r.type));
    check(`${id} مزيج أنواع التوصيات`, types.size >= 2, [...types].join('/'));
  }

  check(`${id} عدد الأتمتة 2–3`, sol.automations.length >= 2 && sol.automations.length <= 3,
    `${sol.automations.length}`);
  sol.automations.forEach((a, i) => {
    check(`${id} مخطط الأتمتة ${i + 1}`, keysAre(a, AUT_KEYS));
    AUT_KEYS.forEach((k) => check(`${id} الأتمتة ${i + 1} حقل ${k}`, !!(a[k] && a[k].trim())));
  });

  check(`${id} عدد المؤشرات 2–3`, sol.kpis.length >= 2 && sol.kpis.length <= 3);
  sol.kpis.forEach((k, i) => check(`${id} مخطط المؤشر ${i + 1}`, keysAre(k, KPI_KEYS)));

  /* التخصيص */
  const wastedT = Number(ev.food_kg.wasted).toLocaleString('en-US');
  check(`${id} التشخيص يذكر اسم الفعالية`, sol.diagnosis_ar.includes(ev.event_name));
  check(`${id} التشخيص يذكر الكمية المتلفة`, sol.diagnosis_ar.includes(wastedT));
  check(`${id} التشخيص يميّز ما نجح عما فشل`,
    sol.diagnosis_ar.includes('ما نجح:') && sol.diagnosis_ar.includes('ما فشل:'));

  const recText = sol.recommendations.map((r) => r.action_ar + ' ' + r.expected_impact_ar).join(' ');
  const cited = [ev.event_name, ev.venue, ev.emirate, ev.catering_provider, ev.event_type,
                 Number(ev.food_kg.delivered).toLocaleString('en-US'), wastedT]
    .filter((v) => recText.includes(v));
  check(`${id} التوصيات تحمل حقائق الفعالية`, cited.length > 0, 'لا حقيقة واحدة');

  /* الحتمية */
  check(`${id} حتمية المخرَج`,
    JSON.stringify(E.generate(ev, golden)) === JSON.stringify(sol));
}

/* ------------------- 5: معايير القبول ------------------- */
function templateOf(id) {
  const ev = data.events.find((e) => e.event_id === id);
  const x = E.explain(ev, golden);
  return { primary: x.templates.primary.id, blend: x.templates.blend ? x.templates.blend.id : null, x };
}

const t8 = templateOf('EV-008');
check('EV-008 يسحب قالبه من EV-001', t8.primary === 'EV-001', `القالب: ${t8.primary}`);
check('EV-008 نمطه نقطة فشل واحدة', t8.x.pattern.key === 'spof', t8.x.pattern.name);

const t19 = templateOf('EV-019');
check('EV-019 يسحب قالبه من EV-010', t19.primary === 'EV-010', `القالب: ${t19.primary}`);
check('EV-019 نمطه قرار مبكر غير قابل للتصحيح',
  t19.x.pattern.key === 'early_decision', t19.x.pattern.name);

const t2 = templateOf('EV-002');
check('EV-002 قالبه الأساسي EV-010', t2.primary === 'EV-010', `القالب: ${t2.primary}`);
check('EV-002 يمزج EV-020', t2.blend === 'EV-020', `المزج: ${t2.blend}`);

const sol2 = E.generate(data.events.find((e) => e.event_id === 'EV-002'), golden);
const text2 = JSON.stringify(sol2);
check('EV-002 حله يحمل منطق EV-010 (تنبؤ/حضور)',
  /التنبؤ|الحضور|التسجيل|الإنتاج المرحلي/.test(text2));
check('EV-002 حله يحمل منطق EV-020 (فائض/تبرع)',
  /تبرع|فائض|بنك طعام|إعادة توجيه/.test(text2));

/* لا نسخ حرفي للقالب */
const goldenById = Object.fromEntries(golden.map((g) => [g.event_id, g.golden_solution]));
for (const ev of data.events) {
  const sol = E.generate(ev, golden);
  const src = goldenById[templateOf(ev.event_id).primary];
  const copied = sol.recommendations.some((r) =>
    src.recommendations.some((g) => g.action_ar === r.action_ar));
  check(`${ev.event_id} لا نسخ حرفي لتوصيات القالب`, !copied);
}

/* ------------------- 6: اتساق الخطورة ------------------- */
let sevMatch = 0;
const sevGaps = [];
for (const ev of data.events) {
  const computed = E.assessSeverity(ev);
  if (computed.level === ev.severity) sevMatch++;
  else sevGaps.push(`${ev.event_id}: محسوب=${computed.level} (${computed.drivingAxisName}) مسجّل=${ev.severity}`);
}
check('اتساق الخطورة ≥ 18/20', sevMatch >= 18, `${sevMatch}/20`);


/** يبني xlsx كما يكتبه Excel: كل إدخال مضغوط deflate والنصوص في sharedStrings */
async function excelLikeZip(rows) {
  const enc = new TextEncoder();
  const strings = [];
  const index = new Map();
  const si = (v) => {
    if (!index.has(v)) { index.set(v, strings.length); strings.push(v); }
    return index.get(v);
  };
  const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const colRef = (n) => {
    let s = ''; n++;
    while (n) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = (n - r - 1) / 26; }
    return s;
  };

  let sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
  rows.forEach((row, r) => {
    sheet += `<row r="${r + 1}">`;
    row.forEach((v, c) => {
      if (v === '' || v === null || v === undefined) return;
      sheet += `<c r="${colRef(c)}${r + 1}" t="s"><v>${si(String(v))}</v></c>`;
    });
    sheet += '</row>';
  });
  sheet += '</sheetData></worksheet>';

  const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const entries = [
    ['[Content_Types].xml',
      '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      + '<Default Extension="xml" ContentType="application/xml"/></Types>'],
    ['_rels/.rels',
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml',
      `<?xml version="1.0"?><workbook xmlns="${NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`
      + `<sheets><sheet name="${W_SHEET_EVENTS}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels',
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'],
    ['xl/sharedStrings.xml',
      `<?xml version="1.0"?><sst xmlns="${NS}" count="${strings.length}" uniqueCount="${strings.length}">`
      + strings.map((s) => `<si><t xml:space="preserve">${esc(s)}</t></si>`).join('') + '</sst>'],
    ['xl/worksheets/sheet1.xml', sheet]
  ];

  async function deflateRaw(u8) {
    const cs = new CompressionStream('deflate-raw');
    const writer = cs.writable.getWriter();
    writer.write(u8); writer.close();
    const reader = cs.readable.getReader();
    const parts = []; let len = 0;
    for (;;) {
      const step = await reader.read();
      if (step.done) break;
      parts.push(step.value); len += step.value.length;
    }
    const out = new Uint8Array(len); let at = 0;
    parts.forEach((p) => { out.set(p, at); at += p.length; });
    return out;
  }

  const crc32 = globalThis.Xlsx._crc32;
  const local = [], central = [];
  let offset = 0;
  for (const [name, text] of entries) {
    const data = enc.encode(text);
    const comp = await deflateRaw(data);
    const nameB = enc.encode(name);
    const crc = crc32(data);

    const lh = new Uint8Array(30 + nameB.length);
    const dv = new DataView(lh.buffer);
    dv.setUint32(0, 0x04034b50, true); dv.setUint16(4, 20, true);
    dv.setUint16(6, 0x0800, true); dv.setUint16(8, 8, true);
    dv.setUint32(14, crc, true); dv.setUint32(18, comp.length, true);
    dv.setUint32(22, data.length, true); dv.setUint16(26, nameB.length, true);
    lh.set(nameB, 30);
    local.push(lh, comp);

    const ch = new Uint8Array(46 + nameB.length);
    const cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true); cv.setUint16(10, 8, true);
    cv.setUint32(16, crc, true); cv.setUint32(20, comp.length, true);
    cv.setUint32(24, data.length, true); cv.setUint16(28, nameB.length, true);
    cv.setUint32(42, offset, true); ch.set(nameB, 46);
    central.push(ch);

    offset += lh.length + comp.length;
  }

  const cdSize = central.reduce((a, c) => a + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev2 = new DataView(eocd.buffer);
  ev2.setUint32(0, 0x06054b50, true); ev2.setUint16(8, entries.length, true);
  ev2.setUint16(10, entries.length, true); ev2.setUint32(12, cdSize, true);
  ev2.setUint32(16, offset, true);

  const parts = [...local, ...central, eocd];
  const zip = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
  let at = 0;
  parts.forEach((p) => { zip.set(p, at); at += p.length; });
  return zip;
}

const W_SHEET_EVENTS = globalThis.Workbook.SHEET_EVENTS;

/* ------------------- 7: دورة ورقة التعبئة ------------------- */
async function workbookCheck() {
  const X = globalThis.Xlsx;
  const W = globalThis.Workbook;

  const bytes = W.buildTemplate('EV-021');
  check('ورقة التعبئة تُبنى', bytes instanceof Uint8Array && bytes.length > 2000);
  check('توقيع ZIP صحيح', bytes[0] === 0x50 && bytes[1] === 0x4b);

  const sheets = await X.read(bytes);
  check('الأوراق الثلاث موجودة',
    [W.SHEET_EVENTS, W.SHEET_ISSUES, W.SHEET_GUIDE].every((n) => sheets[n]),
    Object.keys(sheets).join(' | '));

  const rows = sheets[W.SHEET_EVENTS];
  check('ترويسة الفعاليات كاملة', rows[0].length === W.EVENT_COLUMNS.length,
    `${rows[0].length} من ${W.EVENT_COLUMNS.length}`);
  W.EVENT_COLUMNS.forEach((c, i) => {
    check(`الترويسة ${i + 1} تحمل السؤال`, rows[0][i].replace(/\s*\*$/, '') === c.q,
      `${rows[0][i]} ≠ ${c.q}`);
  });

  // صف المثال يُتجاهل كما هو
  const asIs = W.parseSheets({ [W.SHEET_EVENTS]: rows.map((r) => r.slice()) }, {});
  check('صف المثال يُتجاهل', asIs.skipped === 1 && asIs.events.length === 0,
    `skipped=${asIs.skipped} events=${asIs.events.length}`);

  // نفس الصف بعد نزع كلمة «مثال:» يجب أن يمر كاملاً
  const filled = rows.map((r) => r.slice());
  filled[2][1] = filled[2][1].replace(/^مثال:\s*/, '');
  const parsed = W.parseSheets(
    { [W.SHEET_EVENTS]: filled, [W.SHEET_ISSUES]: sheets[W.SHEET_ISSUES] },
    { existingIds: data.events.map((e) => e.event_id) }
  );
  check('لا أخطاء في الصف المكتمل', parsed.errors.length === 0, parsed.errors.join(' | '));
  check('قُرئت فعالية واحدة', parsed.events.length === 1);

  const ev = parsed.events[0];
  check('الحقول المشتقة محسوبة',
    ev.food_kg.waste_pct === 25 && ev.waste_cost_aed === 4000 && ev.attendance.variance_pct === -14,
    `${ev.food_kg.waste_pct}% / ${ev.waste_cost_aed} د.إ / ${ev.attendance.variance_pct}%`);
  check('الخطورة مُسندة آلياً',
    globalThis.PortalLogic.SEVERITY_LEVELS.includes(ev.severity), ev.severity);
  check('المشكلات الفرعية مربوطة بالمعرّف', ev.incidents.length === 2, `${ev.incidents.length}`);
  check('التاريخ بصيغة ISO', /^\d{4}-\d{2}-\d{2}$/.test(ev.date), ev.date);

  // الفعالية المقروءة تمر في محرك التوليد كأي فعالية أخرى
  const sol = E.generate(ev, golden);
  check('الفعالية المقروءة تولّد حلاً', keysAre(sol, SOL_KEYS));
  check('الحل يذكر اسم الفعالية', sol.diagnosis_ar.includes(ev.event_name));

  // التحقق يمسك الأخطاء التي يقع فيها البشر
  const bad = rows.map((r) => r.slice());
  bad[2][1] = 'فعالية بأرقام متناقضة';
  bad[2][0] = 'EV21';                                   // معرّف بصيغة خاطئة
  bad[2][W.EVENT_COLUMNS.findIndex((c) => c.key === 'food_kg.wasted')] = '900';
  const badParsed = W.parseSheets({ [W.SHEET_EVENTS]: bad }, {});
  check('يُرفض المعرّف المشوّه',
    badParsed.errors.some((e) => e.includes('EV-XXX')), badParsed.errors.join(' | '));
  check('يُمسك تجاوز المتلف للمورَّد',
    badParsed.errors.some((e) => e.includes('أكبر من المورَّد')), badParsed.errors.join(' | '));

  // ترويسة غير معروفة ⇒ رسالة واضحة لا انهيار
  const unknown = W.parseSheets({ ورقة1: [['a', 'b'], ['c', 'd'], ['1', '2']] }, {});
  check('ترويسة مجهولة تعطي رسالة مفهومة',
    unknown.events.length === 0 && unknown.errors.length === 1, unknown.errors.join(' | '));

  // مسار Excel الحقيقي: إدخالات مضغوطة deflate + sharedStrings.
  // الملف الذي تولّده المنصة مخزَّن بلا ضغط، فلولا هذا الفحص لبقي فك الضغط
  // وقراءة السلاسل المشتركة — وهما ما يصل من Excel فعلياً — بلا تغطية.
  const excelLike = await excelLikeZip(filled);
  const excelSheets = await X.read(excelLike);
  const excelParsed = W.parseSheets(excelSheets, {});
  check('ملف بأسلوب Excel (deflate + sharedStrings) يُقرأ',
    excelParsed.events.length === 1 && excelParsed.errors.length === 0,
    excelParsed.errors.join(' | '));
  check('القيم تنجو من مسار السلاسل المشتركة',
    excelParsed.events[0] && excelParsed.events[0].event_name === ev.event_name,
    excelParsed.events[0] && excelParsed.events[0].event_name);

  // «لا مشكلة» يجب ألا تشدّ التصنيف إلى طبقة لم يحدث فيها شيء
  const benign = filled.map((r) => r.slice());
  const ix = (k) => W.EVENT_COLUMNS.findIndex((c) => c.key === k);
  benign[2][ix('supply_chain_issue')] = 'التوريد سليم';
  benign[2][ix('receiving_intake_issue')] = 'الاستلام سليم';
  benign[2][ix('root_cause')] = 'التقدير بُني على قوائم الدعوات لا على تأكيدات الحضور';
  benign[2][ix('impact')] = 'فائض كبير بلا مسار تصريف';
  const benignParsed = W.parseSheets({ [W.SHEET_EVENTS]: benign }, {});
  const bev = benignParsed.events[0];
  check('«سليم» تُطبَّع إلى عبارة محايدة',
    bev && bev.receiving_intake_issue.indexOf('استلام') === -1, bev && bev.receiving_intake_issue);
  check('«لا مشكلة» لا تُصنَّف في طبقة الاستلام',
    bev && E.classify(bev).primary.name !== 'الاستلام والإدخال',
    bev && E.classify(bev).primary.name);

  // CSV: نفس المسار بصيغة أبسط
  const csvRows = X.fromCsv(W.buildCsvTemplate('EV-021'));
  check('CSV يحفظ عدد الأعمدة', csvRows[0].length === W.EVENT_COLUMNS.length,
    `${csvRows[0].length}`);
  csvRows[2][1] = csvRows[2][1].replace(/^مثال:\s*/, '');
  const csvParsed = W.parseSheets({ [W.SHEET_EVENTS]: csvRows }, {});
  check('CSV يُقرأ كفعالية', csvParsed.events.length === 1, csvParsed.errors.join(' | '));
}

/* ------------------- التقرير ------------------- */
function report() {
  console.log(`\n✔ نجح ${pass} فحصاً`);
  if (sevGaps.length) {
    console.log(`\nفروقات الخطورة (المصفوفة مقابل السجل اليدوي) — ${sevGaps.length}:`);
    sevGaps.forEach((g) => console.log('  · ' + g));
  }
  if (failures.length) {
    console.log(`\n✘ فشل ${failures.length} فحصاً:`);
    failures.forEach((f) => console.log('  · ' + f));
    process.exit(1);
  }
  console.log('\nكل الفحوص ناجحة.\n');
}

workbookCheck()
  .then(report, (err) => {
    failures.push('دورة ورقة التعبئة انهارت — ' + err.message);
    report();
  });
