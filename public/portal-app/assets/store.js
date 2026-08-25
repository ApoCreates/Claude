/* eslint-disable */
/**
 * assets/store.js — مصدر الحقيقة القابل للتعديل
 * ==============================================
 * تُنسخ البذرة المدمجة (window.PORTAL_SEED) إلى localStorage عند أول تشغيل،
 * ثم تصبح نسخة localStorage هي المرجع لكل الشاشات. لا شبكة، لا باك-إند.
 */
(function (global) {
  'use strict';

  var KEY = 'portal.catering.dataset.v1';
  var state = null;
  var listeners = [];

  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  function storageAvailable() {
    try {
      var k = '__portal_probe__';
      global.localStorage.setItem(k, '1');
      global.localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  }

  var HAS_STORAGE = storageAvailable();

  /* ---------------- التحقق من صحة مجموعة بيانات مستوردة ---------------- */
  function validateDataset(obj) {
    var errors = [];
    if (!obj || typeof obj !== 'object') { errors.push('الملف ليس كائن JSON صالحاً.'); return errors; }
    if (!Array.isArray(obj.events)) { errors.push('الملف لا يحتوي على مصفوفة events.'); return errors; }
    obj.events.forEach(function (ev, i) {
      var at = 'الفعالية رقم ' + (i + 1) + (ev && ev.event_id ? ' (' + ev.event_id + ')' : '');
      if (!ev || typeof ev !== 'object') { errors.push(at + ': ليست كائناً.'); return; }
      if (!ev.event_id) errors.push(at + ': ينقصها event_id.');
      if (!ev.event_name) errors.push(at + ': ينقصها event_name.');
      if (!ev.food_kg || typeof ev.food_kg !== 'object') errors.push(at + ': ينقصها كائن food_kg.');
      else if (Number(ev.food_kg.wasted) > Number(ev.food_kg.delivered))
        errors.push(at + ': الكمية المتلفة أكبر من المورّدة.');
    });
    var ids = obj.events.map(function (e) { return e && e.event_id; });
    ids.forEach(function (id, i) {
      if (id && ids.indexOf(id) !== i) errors.push('معرّف مكرر: ' + id);
    });
    return errors;
  }

  /* ---------------- التحميل والحفظ ---------------- */
  function load() {
    if (state) return state;
    if (HAS_STORAGE) {
      try {
        var raw = global.localStorage.getItem(KEY);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (!validateDataset(parsed).length) { state = parsed; return state; }
        }
      } catch (e) { /* بيانات تالفة — نعود للبذرة */ }
    }
    state = deepClone(global.PORTAL_SEED);
    persist();
    return state;
  }

  function persist() {
    if (!HAS_STORAGE || !state) return false;
    try {
      state.events_count = state.events.length;
      state.golden_examples = state.events
        .filter(function (e) { return e.golden_solution && e.golden_solution.status === 'golden_approved'; })
        .map(function (e) { return e.event_id; });
      global.localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) { return false; }
  }

  function emit() {
    listeners.forEach(function (fn) { try { fn(state); } catch (e) { console.error(e); } });
  }

  function commit() { persist(); emit(); }

  /* ---------------- واجهة القراءة ---------------- */
  function all() { return load().events; }
  function dataset() { return load(); }
  function byId(id) {
    return all().filter(function (e) { return e.event_id === id; })[0] || null;
  }
  function goldenEvents() {
    return all().filter(function (e) {
      return e.golden_solution && e.golden_solution.status === 'golden_approved';
    });
  }

  /** أصغر معرّف متاح بصيغة EV-XXX */
  function nextId() {
    var max = 0;
    all().forEach(function (e) {
      var m = /^EV-(\d+)$/.exec(e.event_id || '');
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return 'EV-' + String(max + 1).padStart(3, '0');
  }

  /* ---------------- واجهة الكتابة ---------------- */
  function addEvent(ev) {
    load();
    state.events.push(ev);
    commit();
    return ev;
  }

  function updateEvent(id, patch) {
    load();
    var ev = byId(id);
    if (!ev) return null;
    Object.keys(patch).forEach(function (k) { ev[k] = patch[k]; });
    commit();
    return ev;
  }

  function setSolution(id, solution) {
    return updateEvent(id, { golden_solution: solution });
  }

  function deleteEvent(id) {
    load();
    var i = state.events.findIndex(function (e) { return e.event_id === id; });
    if (i === -1) return false;
    state.events.splice(i, 1);
    commit();
    return true;
  }

  function reset() {
    state = deepClone(global.PORTAL_SEED);
    commit();
    return state;
  }

  /* ---------------- التصدير والاستيراد ---------------- */
  function exportJson() {
    var d = deepClone(load());
    d.events_count = d.events.length;
    d.golden_examples = d.events
      .filter(function (e) { return e.golden_solution && e.golden_solution.status === 'golden_approved'; })
      .map(function (e) { return e.event_id; });
    return JSON.stringify(d, null, 2);
  }

  /**
   * mode = 'replace' يستبدل المجموعة كاملة
   * mode = 'merge'   يضيف الجديد ويحدّث المتطابق بالمعرّف
   */
  function importJson(obj, mode) {
    var errors = validateDataset(obj);
    if (errors.length) return { ok: false, errors: errors };

    load();
    if (mode === 'replace') {
      state = deepClone(obj);
    } else {
      var added = 0, updated = 0;
      obj.events.forEach(function (incoming) {
        var existing = byId(incoming.event_id);
        if (existing) {
          Object.keys(incoming).forEach(function (k) { existing[k] = deepClone(incoming[k]); });
          updated++;
        } else {
          state.events.push(deepClone(incoming));
          added++;
        }
      });
      commit();
      return { ok: true, added: added, updated: updated, total: state.events.length };
    }
    commit();
    return { ok: true, added: state.events.length, updated: 0, total: state.events.length };
  }

  /* ------------------------------------------------------------------ *
   * ملف نموذجي للتعبئة — يُنزَّل، يُملأ في أي محرر، ثم يُستورد
   * بنفس مخطط البيانات تماماً، مع صف واحد مشروح حقلاً حقلاً.
   * ------------------------------------------------------------------ */
  function sampleTemplate() {
    var base = load();
    return {
      dataset_name: base.dataset_name,
      purpose_ar: base.purpose_ar,
      data_type: base.data_type,
      locale: base.locale,
      currency: base.currency,
      problem_categories: base.problem_categories.slice(),
      تعليمات_التعبئة: [
        '1) هذا الملف نموذج جاهز للتعبئة — كرّر الكائن داخل events لكل فعالية جديدة.',
        '2) event_id يجب أن يكون فريداً بصيغة EV-XXX ولا يكرر معرّفاً موجوداً لديك.',
        '3) الحقول الكمية إلزامية: attendance و meals و food_kg و avg_cost_aed_per_kg.',
        '4) المتلف والمستهلك معاً لا يتجاوزان المورَّد، والمقدَّم لا يتجاوز المطلوب.',
        '5) waste_pct = المتلف ÷ المورَّد × 100، و waste_cost_aed = المتلف × كلفة الكيلو. ' +
          'تُحسبان تلقائياً عند الإضافة من داخل المنصة، واحسبهما يدوياً هنا.',
        '6) اترك severity فارغاً ("") ليحسبه المحرك من مصفوفة المحاور الثلاثة.',
        '7) النصوص (supply_chain_issue / receiving_intake_issue / root_cause) هي ما يقرأه ' +
          'المحرك للتصنيف وتحديد نمط الفشل — كن محدداً فيها، فهي مصدر جودة الحل.',
        '8) اترك golden_solution = null ليولّد المحرك الحل بعد الاستيراد.',
        '9) احذف هذا الحقل «تعليمات_التعبئة» قبل الاستيراد إن أردت، أو اتركه — المنصة تتجاهله.',
        '10) بعد التعبئة: زر «استيراد» ← «دمج» لإضافتها إلى بياناتك الحالية.'
      ],
      events_count: 1,
      events: [{
        event_id: nextId(),
        event_name: 'اكتب اسم الفعالية هنا',
        date: '2026-01-01',
        emirate: 'أبوظبي',
        venue: 'اسم الموقع',
        event_type: 'مؤتمر حكومي',
        catering_provider: 'اسم مزود التموين',
        attendance: { expected: 500, actual: 430, variance_pct: -14 },
        meals: { ordered: 520, served: 415 },
        food_kg: { delivered: 400, consumed: 300, wasted: 100, waste_pct: 25 },
        avg_cost_aed_per_kg: 40,
        waste_cost_aed: 4000,
        supply_chain_issue: 'صف مشكلة النقل أو الموردين أو الجدولة — أو اكتب «سليمة» إن لم توجد.',
        receiving_intake_issue: 'صف مشكلة الاستلام أو الفحص أو الوزن — أو «الاستلام سليم».',
        root_cause: 'لماذا حدث ما حدث؟ اذهب لأبعد من العَرَض إلى الطبقة التي أنتجته.',
        severity: '',
        impact: 'ماذا كلّف هذا الفشل؟ كمية، مال، وقت، سمعة.',
        narrative_ar: 'قصة الفعالية كما جرت في فقرة قصيرة.',
        incidents: [{
          category: 'التخطيط والتنبؤ',
          stage: 'قبل الفعالية',
          description: 'ماذا حدث بالضبط في هذه الطبقة؟',
          direct_effect: 'ما النتيجة الفورية؟'
        }],
        portal_recommendation_required: true,
        golden_solution: null
      }],
      golden_examples: [],
      golden_note_ar: 'ملف نموذجي للتعبئة — ليس بيانات حقيقية.'
    };
  }

  function subscribe(fn) {
    listeners.push(fn);
    return function () { listeners = listeners.filter(function (f) { return f !== fn; }); };
  }

  global.Store = {
    KEY: KEY,
    HAS_STORAGE: HAS_STORAGE,
    all: all,
    dataset: dataset,
    byId: byId,
    goldenEvents: goldenEvents,
    nextId: nextId,
    addEvent: addEvent,
    updateEvent: updateEvent,
    setSolution: setSolution,
    deleteEvent: deleteEvent,
    reset: reset,
    exportJson: exportJson,
    importJson: importJson,
    validateDataset: validateDataset,
    sampleTemplate: sampleTemplate,
    subscribe: subscribe
  };
})(typeof window !== 'undefined' ? window : globalThis);
