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
 */
require('../assets/logic.js');
require('../assets/rule-engine.js');

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

/* ------------------- التقرير ------------------- */
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
