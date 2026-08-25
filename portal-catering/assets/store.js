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
    subscribe: subscribe
  };
})(typeof window !== 'undefined' ? window : globalThis);
