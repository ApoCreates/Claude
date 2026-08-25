/* eslint-disable */
/**
 * assets/app.js — واجهة Portal (عربية RTL، بلا إطار عمل وبلا شبكة)
 * ================================================================
 * ست شاشات: لوحة القيادة • سجل الفعاليات • تفاصيل الفعالية •
 *            توليد الحل • إضافة فعالية • صفحة المنطق
 */
(function () {
  'use strict';

  var L = window.PortalLogic;
  var E = window.RuleEngine;
  var S = window.Store;
  var C = window.Charts;
  var W = window.Workbook;

  var esc = C.esc;
  var fmt = C.fmt;

  /* ================================================================== *
   * أدوات عامة
   * ================================================================== */

  function el(id) { return document.getElementById(id); }

  function fmt1(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return (Math.round(Number(n) * 10) / 10).toLocaleString('en-US');
  }

  function pct(part, whole) {
    if (!whole) return 0;
    return Math.round((part / whole) * 1000) / 10;
  }

  function sevClass(level) { return 'sev sev-' + level; }
  function sevBadge(level) { return '<span class="' + sevClass(level) + '">' + esc(level) + '</span>'; }

  /** زر تعريف بجوار أي رقم أو رسم — يفتح «ماذا يقيس / كيف يُحسب / لماذا يهم» */
  function infoBtn(metricId) {
    if (!L.METRICS[metricId]) return '';
    return '<button class="info-btn" data-metric="' + esc(metricId) +
           '" aria-label="تعريف المقياس" title="ما معنى هذا الرقم؟">؟</button>';
  }

  function openMetricModal(id) {
    var m = L.METRICS[id];
    if (!m) return;
    openModal({
      title: m.label,
      body:
        '<dl class="metric-def">' +
          '<dt>ماذا يقيس</dt><dd>' + esc(m.what) + '</dd>' +
          '<dt>كيف يُحسب</dt><dd>' + esc(m.how) + '</dd>' +
          '<dt>لماذا يهم</dt><dd>' + esc(m.why) + '</dd>' +
        '</dl>',
      foot: '<button class="btn" data-modal-close="1">إغلاق</button>'
    });
  }

  function statusBadge(sol) {
    if (!sol) return '<span class="badge badge-gray">بلا حل</span>';
    if (sol.status === 'golden_approved') return '<span class="badge badge-gold">★ معتمد ذهبي</span>';
    return '<span class="badge badge-blue">مولَّد</span>';
  }

  function catColor(name) {
    var c = L.CATEGORY_BY_NAME[name];
    return c ? c.color : '#64748b';
  }

  /** الفئة الرئيسية المعروضة لفعالية: أول مشكلة فرعية، وإلا تصنيف المحرك */
  function primaryCategory(ev) {
    if (ev.incidents && ev.incidents.length && ev.incidents[0].category) return ev.incidents[0].category;
    return E.classify(ev).primary.name;
  }

  function monthKey(dateStr) {
    var m = /^(\d{4})-(\d{2})/.exec(dateStr || '');
    return m ? m[1] + '-' + m[2] : '—';
  }

  var MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                   'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  function monthLabel(key) {
    var m = /^(\d{4})-(\d{2})$/.exec(key);
    if (!m) return key;
    return MONTHS_AR[parseInt(m[2], 10) - 1] + ' ' + m[1].slice(2);
  }

  function monthShort(key) {
    var m = /^(\d{4})-(\d{2})$/.exec(key);
    if (!m) return key;
    return C.MONTHS_SHORT[parseInt(m[2], 10) - 1];
  }

  function uniq(arr) {
    return arr.filter(function (v, i) { return v && arr.indexOf(v) === i; }).sort();
  }

  /* ---------------- التنبيهات ---------------- */
  function toast(msg, kind) {
    var host = el('toasts');
    var d = document.createElement('div');
    d.className = 'toast ' + (kind || '');
    d.textContent = msg;
    host.appendChild(d);
    setTimeout(function () {
      d.style.transition = 'opacity .25s';
      d.style.opacity = '0';
      setTimeout(function () { d.remove(); }, 250);
    }, 3400);
  }

  /* ---------------- النوافذ ---------------- */
  var modalState = null;

  function openModal(opts) {
    modalState = opts;
    var host = el('modal-host');
    host.innerHTML =
      '<div class="modal-backdrop" data-close-backdrop="1">' +
        '<div class="modal" role="dialog" aria-modal="true" aria-label="' + esc(opts.title) + '">' +
          '<div class="modal-head">' +
            '<h3>' + esc(opts.title) + '</h3>' +
            '<button class="btn btn-ghost btn-sm" data-modal-close="1" aria-label="إغلاق">✕</button>' +
          '</div>' +
          '<div class="modal-body" id="modal-body">' + opts.body + '</div>' +
          (opts.foot ? '<div class="modal-foot">' + opts.foot + '</div>' : '') +
        '</div>' +
      '</div>';
    if (opts.onMount) opts.onMount(el('modal-body'));
  }

  function closeModal() {
    modalState = null;
    el('modal-host').innerHTML = '';
  }

  function confirmDialog(title, message, confirmLabel, onConfirm, danger) {
    openModal({
      title: title,
      body: '<div class="alert ' + (danger ? 'alert-warn' : 'alert-info') + '">' + message + '</div>',
      foot: '<button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" data-confirm-yes="1">' +
              esc(confirmLabel) + '</button>' +
            '<button class="btn" data-modal-close="1">إلغاء</button>',
      onConfirmYes: onConfirm
    });
  }

  /* ================================================================== *
   * التوجيه
   * ================================================================== */
  var ROUTES = [
    { key: 'dashboard', label: 'لوحة القيادة' },
    { key: 'events', label: 'سجل الفعاليات' },
    { key: 'new', label: 'إضافة فعالية' },
    { key: 'logic', label: 'منطق المنصة' }
  ];

  function currentRoute() {
    var h = (location.hash || '#/dashboard').replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean);
    return { name: parts[0] || 'dashboard', arg: parts[1] || null };
  }

  function go(path) {
    if (location.hash === '#/' + path) render();
    else location.hash = '#/' + path;
  }

  /* ================================================================== *
   * حالة سجل الفعاليات (فرز وتصفية)
   * ================================================================== */
  var listState = {
    q: '', category: '', severity: '', emirate: '', provider: '', solution: '', month: '',
    sortBy: 'date', sortDir: 'desc'
  };

  function clearFilters() {
    listState.q = ''; listState.category = ''; listState.severity = '';
    listState.emirate = ''; listState.provider = ''; listState.solution = ''; listState.month = '';
  }

  /* المرشّحات النشطة كرقائق قابلة للإزالة — حتى لا يحتار المستخدم لماذا القائمة قصيرة */
  var FILTER_LABELS = {
    q: 'بحث', category: 'الفئة', severity: 'الخطورة', emirate: 'الإمارة',
    provider: 'المزود', solution: 'الحل', month: 'الشهر'
  };
  var SOLUTION_LABELS = { golden_approved: 'معتمد ذهبي', generated: 'مولَّد', none: 'بلا حل' };

  function activeFilters() {
    return Object.keys(FILTER_LABELS)
      .filter(function (k) { return listState[k]; })
      .map(function (k) {
        var v = listState[k];
        if (k === 'solution') v = SOLUTION_LABELS[v] || v;
        if (k === 'month') v = monthLabel(v);
        return { key: k, label: FILTER_LABELS[k], value: v };
      });
  }

  /* ================================================================== *
   * الحسابات الحية للوحة القيادة
   * ================================================================== */
  function computeMetrics(events) {
    var m = {
      count: events.length,
      delivered: 0, consumed: 0, wasted: 0, cost: 0,
      highOrCritical: 0,
      severity: { 'حرجة': 0, 'عالية': 0, 'متوسطة': 0, 'منخفضة': 0 },
      byCategory: {}, byMonth: {}, byEmirate: {}, byProvider: {},
      solved: 0, approved: 0, generated: 0, unsolved: 0
    };

    L.CATEGORIES.forEach(function (c) { m.byCategory[c.name] = { wasted: 0, cost: 0, count: 0 }; });

    events.forEach(function (ev) {
      var fk = ev.food_kg || {};
      m.delivered += Number(fk.delivered) || 0;
      m.consumed += Number(fk.consumed) || 0;
      m.wasted += Number(fk.wasted) || 0;
      m.cost += Number(ev.waste_cost_aed) || 0;

      var sev = ev.severity || E.assessSeverity(ev).level;
      if (m.severity[sev] !== undefined) m.severity[sev]++;
      if (sev === 'عالية' || sev === 'حرجة') m.highOrCritical++;

      var cat = primaryCategory(ev);
      if (!m.byCategory[cat]) m.byCategory[cat] = { wasted: 0, cost: 0, count: 0 };
      m.byCategory[cat].wasted += Number(fk.wasted) || 0;
      m.byCategory[cat].cost += Number(ev.waste_cost_aed) || 0;
      m.byCategory[cat].count++;

      var mk = monthKey(ev.date);
      if (!m.byMonth[mk]) m.byMonth[mk] = { wasted: 0, cost: 0, count: 0 };
      m.byMonth[mk].wasted += Number(fk.wasted) || 0;
      m.byMonth[mk].cost += Number(ev.waste_cost_aed) || 0;
      m.byMonth[mk].count++;

      [['byEmirate', ev.emirate], ['byProvider', ev.catering_provider]].forEach(function (p) {
        var bucket = m[p[0]], k = p[1] || '—';
        if (!bucket[k]) bucket[k] = { wasted: 0, cost: 0, count: 0 };
        bucket[k].wasted += Number(fk.wasted) || 0;
        bucket[k].cost += Number(ev.waste_cost_aed) || 0;
        bucket[k].count++;
      });

      if (ev.golden_solution) {
        m.solved++;
        if (ev.golden_solution.status === 'golden_approved') m.approved++;
        else m.generated++;
      } else m.unsolved++;
    });

    m.wastePct = pct(m.wasted, m.delivered);

    // الفئة الأثقل هدراً — تُعرض على بطاقة المتلف كإشارة «أين تُصلح أولاً»
    var topCat = null;
    Object.keys(m.byCategory).forEach(function (k) {
      if (!topCat || m.byCategory[k].wasted > m.byCategory[topCat].wasted) topCat = k;
    });
    m.topCategory = topCat && m.byCategory[topCat].wasted > 0 ? topCat : null;

    // ما كان يمكن إنقاذه لو بلغت كل فعالية هدف الـ8%
    m.recoverableKg = 0; m.recoverableAed = 0;
    events.forEach(function (ev) {
      var d = Number(ev.food_kg.delivered) || 0, w = Number(ev.food_kg.wasted) || 0;
      var over = w - d * (L.WASTE_TARGET_PCT / 100);
      if (over > 0) {
        m.recoverableKg += over;
        m.recoverableAed += over * (Number(ev.avg_cost_aed_per_kg) || 0);
      }
    });
    m.recoverableKg = Math.round(m.recoverableKg);
    m.recoverableAed = Math.round(m.recoverableAed);
    return m;
  }

  /* ================================================================== *
   * الشاشة 1 — لوحة القيادة
   * ================================================================== */
  function viewDashboard() {
    var events = S.all();
    var m = computeMetrics(events);

    if (!events.length) {
      return '<div class="card"><div class="empty"><b>لا توجد فعاليات</b>' +
             'أضف فعالية أو استورد ملف بيانات للبدء.' +
             '<div class="mt"><button class="btn btn-primary" data-go="new">+ إضافة فعالية</button></div></div></div>';
    }

    var gap = m.wastePct - L.WASTE_TARGET_PCT;

    var recoverKg = m.recoverableKg;
    var recoverAed = Math.round(m.recoverableAed);

    var kpis = [
      { id: 'events_count', label: 'عدد الفعاليات', value: fmt(m.count), unit: '',
        sub: m.approved + ' معتمد • ' + m.generated + ' مولَّد • ' + m.unsolved + ' بلا حل',
        cls: '', go: '' },
      { id: 'delivered', label: 'إجمالي المورَّد', value: fmt(m.delivered), unit: 'كغ',
        sub: 'استُهلك منه ' + fmt(m.consumed) + ' كغ', cls: '' },
      { id: 'wasted', label: 'إجمالي المتلف', value: fmt(m.wasted), unit: 'كغ',
        sub: 'أعلى فئة: ' + esc(m.topCategory || '—'), cls: 'is-alert' },
      { id: 'waste_pct', label: 'نسبة الهدر المرجحة', value: fmt1(m.wastePct), unit: '%',
        sub: 'الهدف < ' + L.WASTE_TARGET_PCT + '% — الفجوة ' + fmt1(gap) + ' نقطة',
        cls: m.wastePct > L.WASTE_TARGET_PCT ? 'is-alert' : 'is-good' },
      { id: 'waste_cost', label: 'كلفة الهدر', value: fmt(m.cost), unit: 'د.إ',
        sub: 'متوسط ' + fmt(Math.round(m.cost / (m.count || 1))) + ' د.إ للفعالية', cls: 'is-gold' },
      { id: 'high_critical', label: 'حوادث عالية/حرجة', value: fmt(m.highOrCritical), unit: 'حادثة',
        sub: m.severity['حرجة'] + ' حرجة • ' + m.severity['عالية'] + ' عالية',
        cls: m.highOrCritical ? 'is-alert' : 'is-good',
        filter: { key: 'severity', value: 'عالية' } }
    ];

    var kpiHtml = kpis.map(function (k) {
      var clickable = k.filter ? ' data-chart-filter="' + esc(JSON.stringify(k.filter)) + '"' : '';
      return '<div class="kpi ' + k.cls + (k.filter ? ' is-clickable' : '') + '"' + clickable + '>' +
               '<div class="kpi-label">' + esc(k.label) + infoBtn(k.id) + '</div>' +
               '<div class="kpi-value">' + esc(k.value) + (k.unit ? '<small>' + esc(k.unit) + '</small>' : '') + '</div>' +
               '<div class="kpi-sub">' + esc(k.sub) + '</div>' +
             '</div>';
    }).join('');

    /* الهدر حسب الفئات الست */
    var catRows = L.CATEGORIES.map(function (c) {
      var b = m.byCategory[c.name] || { wasted: 0, cost: 0, count: 0 };
      return { label: c.name, value: b.wasted, color: c.color, sub: b.count + ' حادثة',
               filter: { key: 'category', value: c.name } };
    }).sort(function (a, b) { return b.value - a.value; });

    var catCostRows = L.CATEGORIES.map(function (c) {
      var b = m.byCategory[c.name] || { cost: 0 };
      return { label: c.name, value: b.cost, color: c.color,
               filter: { key: 'category', value: c.name } };
    }).sort(function (a, b) { return b.value - a.value; });

    /* عبر الزمن */
    var months = Object.keys(m.byMonth).filter(function (k) { return k !== '—'; }).sort();
    // التسمية المختصرة تحمل السنة عند تغيّرها فقط (البيانات تمتد على أكثر من سنة)
    var lastYear = null;
    var monthPoints = months.map(function (k) {
      var year = k.slice(0, 4);
      var short = monthShort(k) + (year !== lastYear ? ' ' + year.slice(2) : '');
      lastYear = year;
      return { label: monthLabel(k), short: short, value: m.byMonth[k].wasted, color: '#1c3557',
               filter: { key: 'month', value: k } };
    });

    /* الخطورة */
    var sevColors = { 'حرجة': '#b3261e', 'عالية': '#c2620d', 'متوسطة': '#9a7209', 'منخفضة': '#17693f' };
    var sevSlices = ['حرجة', 'عالية', 'متوسطة', 'منخفضة'].map(function (s) {
      return { label: s, value: m.severity[s], color: sevColors[s],
               filter: { key: 'severity', value: s } };
    });

    /* الإمارات والمزودون */
    function bucketRows(bucket, palette, filterKey) {
      return Object.keys(bucket).map(function (k, i) {
        return { label: k, value: bucket[k].wasted, color: palette[i % palette.length],
                 sub: bucket[k].count + ' حادثة', filter: { key: filterKey, value: k } };
      }).sort(function (a, b) { return b.value - a.value; });
    }
    var pal = ['#1c3557', '#2c4d78', '#3f7796', '#6b5b95', '#a67c1a', '#2f7d55'];

    return '' +
      '<div class="split mb">' +
        '<h2 class="section-title" style="margin:0">لوحة القيادة</h2>' +
        '<span class="chip">كل الأرقام محسوبة حياً من ' + m.count + ' فعالية في التخزين المحلي</span>' +
        '<span class="push"></span>' +
        '<button class="btn btn-primary btn-sm" data-go="new">+ إضافة فعالية</button>' +
      '</div>' +

      '<div class="grid grid-kpi mb">' + kpiHtml + '</div>' +

      '<div class="hint-bar mb">' +
        '<span>انقر أي عمود أو شريحة للانتقال إلى الفعاليات التي كوّنته.</span>' +
        '<span class="push">لو بلغت كل فعالية هدف الـ' + L.WASTE_TARGET_PCT + '%: توفير ' +
        fmt(recoverKg) + ' كغ ≈ ' + fmt(recoverAed) + ' د.إ ' + infoBtn('recovery') + '</span>' +
      '</div>' +

      '<div class="grid grid-2">' +
        '<div class="card">' +
          '<div class="card-head"><h3>الهدر حسب الفئات الست</h3><span class="hint">كغ متلفة</span>' + infoBtn('by_category') + '</div>' +
          '<div class="card-body">' + C.barsH(catRows, { unit: 'كغ', title: 'الهدر حسب الفئة' }) + '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-head"><h3>كلفة الهدر حسب الفئة</h3><span class="hint">درهم إماراتي</span>' + infoBtn('cost_by_category') + '</div>' +
          '<div class="card-body">' + C.barsH(catCostRows, { unit: 'د.إ', title: 'الكلفة حسب الفئة' }) + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="grid grid-2 mt">' +
        '<div class="card">' +
          '<div class="card-head"><h3>الهدر عبر الزمن</h3><span class="hint">كغ متلفة شهرياً • الخط الذهبي اتجاه</span>' + infoBtn('over_time') + '</div>' +
          '<div class="card-body">' +
            (monthPoints.length
              ? C.timeSeries(monthPoints, { unit: 'كغ', title: 'الهدر الشهري' })
              : '<div class="empty">لا توجد تواريخ صالحة</div>') +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-head"><h3>توزيع الخطورة</h3><span class="hint">حسب مصفوفة المحاور الثلاثة</span>' + infoBtn('severity_mix') + '</div>' +
          '<div class="card-body">' +
            C.donut(sevSlices, { centerLabel: 'حادثة', title: 'توزيع الخطورة' }) +
            '<div class="legend">' +
              sevSlices.map(function (s) {
                return '<span><i style="background:' + s.color + '"></i>' + esc(s.label) + ' — ' + s.value + '</span>';
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="grid grid-2 mt">' +
        '<div class="card">' +
          '<div class="card-head"><h3>الهدر حسب الإمارة</h3>' + infoBtn('by_emirate') + '</div>' +
          '<div class="card-body">' + C.barsH(bucketRows(m.byEmirate, pal, 'emirate'), { unit: 'كغ' }) + '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-head"><h3>الهدر حسب مزود التموين</h3>' + infoBtn('by_provider') + '</div>' +
          '<div class="card-body">' + C.barsH(bucketRows(m.byProvider, pal, 'provider'), { unit: 'كغ' }) + '</div>' +
        '</div>' +
      '</div>' +

      '<h2 class="section-title">مؤشرات المنصة العليا</h2>' +
      '<div class="card"><div class="card-body stack">' +
        '<div class="kpi-row"><span>نسبة الهدر المرجحة</span><b>' + fmt1(m.wastePct) + '% / الهدف < ' +
          L.WASTE_TARGET_PCT + '%</b></div>' +
        '<div class="kpi-row"><span>كلفة الهدر التراكمية</span><b>' + fmt(m.cost) + ' د.إ</b></div>' +
        '<div class="kpi-row"><span>عدد الحوادث عالية/حرجة</span><b>' + m.highOrCritical + ' من ' + m.count + '</b></div>' +
        '<div class="kpi-row"><span>الفعاليات التي تحمل حلاً' + infoBtn('solved') + '</span><b>' + m.solved + ' من ' + m.count +
          ' (' + pct(m.solved, m.count) + '%)</b></div>' +
        '<div class="kpi-row"><span>الحلول المولَّدة التي اعتُمدت' + infoBtn('approved') + '</span><b>' + m.approved + ' معتمد • ' +
          m.generated + ' بانتظار الاعتماد</b></div>' +
      '</div></div>';
  }

  /* ================================================================== *
   * الشاشة 2 — سجل الفعاليات
   * ================================================================== */
  function filteredEvents() {
    var rows = S.all().slice();
    var q = listState.q.trim();

    if (q) {
      rows = rows.filter(function (ev) {
        return [ev.event_id, ev.event_name, ev.venue, ev.emirate, ev.catering_provider,
                ev.event_type, ev.root_cause, ev.supply_chain_issue, ev.receiving_intake_issue]
          .some(function (v) { return v && String(v).indexOf(q) !== -1; });
      });
    }
    if (listState.category) rows = rows.filter(function (ev) { return primaryCategory(ev) === listState.category; });
    if (listState.severity) rows = rows.filter(function (ev) { return ev.severity === listState.severity; });
    if (listState.emirate) rows = rows.filter(function (ev) { return ev.emirate === listState.emirate; });
    if (listState.provider) rows = rows.filter(function (ev) { return ev.catering_provider === listState.provider; });
    if (listState.solution) {
      rows = rows.filter(function (ev) {
        var st = ev.golden_solution ? ev.golden_solution.status : 'none';
        return st === listState.solution;
      });
    }
    if (listState.month) rows = rows.filter(function (ev) { return monthKey(ev.date) === listState.month; });

    var dir = listState.sortDir === 'asc' ? 1 : -1;
    var key = listState.sortBy;
    var sevRank = L.SEVERITY_RANK;

    rows.sort(function (a, b) {
      var va, vb;
      switch (key) {
        case 'wasted': va = a.food_kg.wasted; vb = b.food_kg.wasted; break;
        case 'waste_pct': va = a.food_kg.waste_pct; vb = b.food_kg.waste_pct; break;
        case 'cost': va = a.waste_cost_aed; vb = b.waste_cost_aed; break;
        case 'severity': va = sevRank[a.severity] || 0; vb = sevRank[b.severity] || 0; break;
        case 'name': va = a.event_name; vb = b.event_name; break;
        case 'id': va = a.event_id; vb = b.event_id; break;
        default: va = a.date; vb = b.date;
      }
      if (typeof va === 'string' || typeof vb === 'string') {
        return String(va).localeCompare(String(vb), 'ar') * dir;
      }
      return ((Number(va) || 0) - (Number(vb) || 0)) * dir;
    });

    return rows;
  }

  function viewEvents() {
    var all = S.all();
    var rows = filteredEvents();
    var sel = rows.reduce(function (a, ev) {
      a.wasted += Number(ev.food_kg.wasted) || 0;
      a.cost += Number(ev.waste_cost_aed) || 0;
      return a;
    }, { wasted: 0, cost: 0 });

    function opts(list, selected, anyLabel) {
      return '<option value="">' + esc(anyLabel) + '</option>' +
        list.map(function (v) {
          return '<option value="' + esc(v) + '"' + (v === selected ? ' selected' : '') + '>' + esc(v) + '</option>';
        }).join('');
    }

    function th(key, label, cls) {
      var active = listState.sortBy === key;
      var arrow = active ? '<span class="arrow">' + (listState.sortDir === 'asc' ? '▲' : '▼') + '</span>' : '';
      return '<th class="sortable ' + (cls || '') + '" data-sort="' + key + '">' + esc(label) + ' ' + arrow + '</th>';
    }

    var body = rows.map(function (ev) {
      var cat = primaryCategory(ev);
      return '<tr data-event="' + esc(ev.event_id) + '">' +
        '<td class="num muted">' + esc(ev.event_id) + '</td>' +
        '<td><div class="name">' + esc(ev.event_name) + '</div>' +
            '<div class="muted">' + esc(ev.venue) + ' • ' + esc(ev.event_type) + '</div></td>' +
        '<td class="num muted nowrap">' + esc(ev.date) + '</td>' +
        '<td><span class="chip" style="border-color:' + catColor(cat) + '33;color:' + catColor(cat) + '">' +
            esc(cat) + '</span></td>' +
        '<td class="nowrap">' + esc(ev.emirate) + '</td>' +
        '<td class="nowrap muted">' + esc(ev.catering_provider) + '</td>' +
        '<td class="num">' + fmt(ev.food_kg.wasted) + '</td>' +
        '<td class="num">' + fmt1(ev.food_kg.waste_pct) + '%</td>' +
        '<td class="num">' + fmt(ev.waste_cost_aed) + '</td>' +
        '<td><span class="' + sevClass(ev.severity) + '">' + esc(ev.severity) + '</span></td>' +
        '<td>' + statusBadge(ev.golden_solution) + '</td>' +
      '</tr>';
    }).join('');

    return '' +
      '<div class="split mb">' +
        '<h2 class="section-title" style="margin:0">سجل الفعاليات</h2>' +
        '<span class="chip">' + rows.length + ' من ' + all.length + ' فعالية</span>' +
        '<span class="push"></span>' +
        '<button class="btn btn-primary btn-sm" data-go="new">+ إضافة فعالية</button>' +
      '</div>' +

      (activeFilters().length
        ? '<div class="active-filters mb">' +
            '<span class="af-label">مُصفّى حسب</span>' +
            activeFilters().map(function (f) {
              return '<button class="af-chip" data-drop-filter="' + esc(f.key) + '">' +
                     esc(f.label) + ': <b>' + esc(f.value) + '</b><span aria-hidden="true">✕</span></button>';
            }).join('') +
            '<button class="btn btn-ghost btn-sm" id="f-clear">مسح الكل</button>' +
            '<span class="push muted small">' + fmt(sel.wasted) + ' كغ متلفة • ' +
            fmt(sel.cost) + ' د.إ في هذا التحديد</span>' +
          '</div>'
        : '') +

      '<div class="card mb"><div class="card-body">' +
        '<div class="filters">' +
          '<div class="field grow"><label for="f-q">بحث</label>' +
            '<input id="f-q" type="search" placeholder="اسم، موقع، سبب جذري…" value="' + esc(listState.q) + '"></div>' +
          '<div class="field"><label for="f-cat">الفئة</label><select id="f-cat">' +
            opts(L.CATEGORIES.map(function (c) { return c.name; }), listState.category, 'كل الفئات') + '</select></div>' +
          '<div class="field"><label for="f-sev">الخطورة</label><select id="f-sev">' +
            opts(L.SEVERITY_LEVELS.slice().reverse(), listState.severity, 'كل الدرجات') + '</select></div>' +
          '<div class="field"><label for="f-emi">الإمارة</label><select id="f-emi">' +
            opts(uniq(all.map(function (e) { return e.emirate; })), listState.emirate, 'كل الإمارات') + '</select></div>' +
          '<div class="field"><label for="f-prov">المزود</label><select id="f-prov">' +
            opts(uniq(all.map(function (e) { return e.catering_provider; })), listState.provider, 'كل المزودين') + '</select></div>' +
          '<div class="field"><label for="f-sol">الحل</label><select id="f-sol">' +
            '<option value="">الكل</option>' +
            '<option value="golden_approved"' + (listState.solution === 'golden_approved' ? ' selected' : '') + '>معتمد ذهبي</option>' +
            '<option value="generated"' + (listState.solution === 'generated' ? ' selected' : '') + '>مولَّد</option>' +
            '<option value="none"' + (listState.solution === 'none' ? ' selected' : '') + '>بلا حل</option>' +
          '</select></div>' +
          '<div class="field"><label for="f-month">الشهر</label><select id="f-month">' +
            opts(uniq(all.map(function (e) { return monthKey(e.date); })).map(function (k) { return k; }),
                 listState.month, 'كل الشهور') + '</select></div>' +
          '<div class="field" style="min-width:auto"><label>&nbsp;</label>' +
            '<button class="btn" id="f-clear-2">مسح المرشحات</button></div>' +
        '</div>' +
      '</div></div>' +

      '<div class="card"><div class="table-wrap">' +
        (rows.length ?
          '<table class="data"><thead><tr>' +
            th('id', 'المعرّف') +
            th('name', 'الفعالية') +
            th('date', 'التاريخ') +
            '<th>الفئة</th><th>الإمارة</th><th>المزود</th>' +
            th('wasted', 'متلف (كغ)', 'num') +
            th('waste_pct', 'نسبة الهدر', 'num') +
            th('cost', 'الكلفة (د.إ)', 'num') +
            th('severity', 'الخطورة') +
            '<th>الحل</th>' +
          '</tr></thead><tbody>' + body + '</tbody></table>'
          : '<div class="empty"><b>لا نتائج مطابقة</b>جرّب تعديل المرشحات أو مسحها.</div>') +
      '</div></div>';
  }

  /* ================================================================== *
   * الشاشة 3 — تفاصيل الفعالية
   * ================================================================== */
  function renderSolution(ev, sol, editable) {
    var approved = sol.status === 'golden_approved';

    var recs = sol.recommendations.map(function (r) {
      return '<div class="rec" data-priority="' + esc(r.priority) + '">' +
        '<div class="rec-head">' +
          '<span class="rec-prio">' + esc(r.priority) + '</span>' +
          '<span class="chip type-' + esc(r.type) + '">' + esc(r.type) + '</span>' +
        '</div>' +
        '<div class="rec-action">' + esc(r.action_ar) + '</div>' +
        '<div class="rec-foot">' +
          '<span>المالك: <b>' + esc(r.owner_ar) + '</b></span>' +
          '<span>الإطار الزمني: <b>' + esc(r.timeline_ar) + '</b></span>' +
          '<span>الأثر المتوقع: <b>' + esc(r.expected_impact_ar) + '</b></span>' +
        '</div>' +
      '</div>';
    }).join('');

    var autos = sol.automations.map(function (a) {
      return '<div class="auto">' +
        '<div class="auto-name">' + esc(a.name_ar) +
          ' <span class="chip">' + esc(a.portal_module) + '</span></div>' +
        '<div class="auto-flow">' +
          '<div class="flow-step trigger"><small>المُشغّل</small><span>' + esc(a.trigger_ar) + '</span></div>' +
          '<div class="flow-step"><small>الشرط</small><span>' + esc(a.condition_ar) + '</span></div>' +
          '<div class="flow-step action"><small>الإجراء الآلي</small><span>' + esc(a.action_ar) + '</span></div>' +
        '</div>' +
      '</div>';
    }).join('');

    var kpis = sol.kpis.map(function (k) {
      return '<div class="kpi-row"><span>' + esc(k.name_ar) + '</span><b>' + esc(k.target_ar) + '</b></div>';
    }).join('');

    return '<div class="card solution' + (approved ? ' approved' : '') + '">' +
      '<div class="solution-head">' +
        statusBadge(sol) +
        '<h3>الحل المعتمد داخل المنصة</h3>' +
        '<span class="chip">الوحدة: ' + esc(sol.portal_module) + '</span>' +
        '<span class="push"></span>' +
        (editable ?
          '<button class="btn btn-sm" data-edit-solution="' + esc(ev.event_id) + '">تعديل الحل</button>' +
          (approved ? '' :
            '<button class="btn btn-gold btn-sm" data-approve="' + esc(ev.event_id) + '">★ اعتماد الحل</button>') +
          '<button class="btn btn-danger btn-sm" data-drop-solution="' + esc(ev.event_id) + '">حذف الحل</button>'
          : '') +
      '</div>' +
      '<div class="card-body stack">' +
        '<div><h4 class="mb">التشخيص</h4><div class="diagnosis">' + esc(sol.diagnosis_ar) + '</div></div>' +
        '<div><h4 class="mb">التوصيات (مرتبة بالأولوية)</h4>' + recs + '</div>' +
        '<div><h4 class="mb">الأتمتة (مشغّل ← شرط ← إجراء)</h4>' + autos + '</div>' +
        '<div><h4 class="mb">مؤشرات القياس</h4>' + kpis + '</div>' +
      '</div>' +
    '</div>';
  }

  function renderTrace(ev) {
    var x = E.explain(ev, S.goldenEvents());
    var cls = x.classification, pat = x.pattern, sev = x.severity, tpl = x.templates;

    var kw = cls.primary.keywords.slice(0, 8).map(function (k) {
      return '<span class="kw">' + esc(k) + '</span>';
    }).join('');

    var evid = pat.evidence.slice(0, 6).map(function (k) {
      return '<span class="kw">' + esc(k) + '</span>';
    }).join('') || '<span class="muted small">لا مؤشر صريح — استُخدم النمط الافتراضي للفئة</span>';

    var axes = ['financial', 'safety', 'reputation'].map(function (k) {
      var a = sev.axes[k];
      return '<div class="axis-row' + (sev.drivingAxis === k ? ' is-driver' : '') + '">' +
        '<span class="axis-name">' + esc(a.name) + '</span>' +
        '<span class="' + sevClass(a.level) + '">' + esc(a.level) + '</span>' +
        '<span class="muted small">' + esc(a.label) + '</span>' +
        (sev.drivingAxis === k ? '<span class="chip push">المحور الحاكم</span>' : '') +
      '</div>';
    }).join('');

    var recorded = ev.severity;
    var divergence = recorded && recorded !== sev.level
      ? '<div class="alert alert-warn mt">الخطورة المحسوبة من المصفوفة (<b>' + esc(sev.level) +
        '</b>، محورها ' + esc(sev.drivingAxisName) + ') تختلف عن الخطورة المسجّلة يدوياً في البيانات (<b>' +
        esc(recorded) + '</b>). المنصة لا تعدّل السجل تلقائياً — القرار للمراجع البشري.</div>'
      : '';

    var steps = [
      { h: 'التصنيف بالكلمات المفتاحية',
        p: 'الفئة الرئيسية: <b>' + esc(cls.primary.name) + '</b> بنقاط ' + cls.primary.score +
           (cls.secondary.length ? ' • فئات ثانوية: ' + cls.secondary.map(function (s) {
             return esc(s.name) + ' (' + s.score + ')'; }).join('، ') : '') +
           '<div class="mt">' + kw + '</div>' },
      { h: 'تحديد نمط الفشل',
        p: '<b>' + esc(pat.name) + '</b> — ' + esc(pat.definition) + '<div class="mt">' + evid + '</div>' },
      { h: 'اختيار المثال الذهبي الأقرب',
        p: 'القالب: <b>' + esc(tpl.primary.id) + ' — ' + esc(tpl.primary.name) + '</b> (' +
           (tpl.primary.reasons.length ? esc(tpl.primary.reasons.join('، ')) : 'أعلى تطابق متاح') + ')' +
           (tpl.blend ? '<br>قالب مزج: <b>' + esc(tpl.blend.id) + ' — ' + esc(tpl.blend.name) +
             '</b> لتغطية الطبقة الثانية المصرَّح بها في مشكلات الفعالية' : '') },
      { h: 'التخصيص بحقائق الفعالية',
        p: 'حُقنت في نصوص الحل: الاسم، الموقع (' + esc(ev.venue) + ')، الإمارة، المزود، والكميات (' +
           fmt(x.facts.delivered) + ' كغ مورّدة • ' + fmt(x.facts.wasted) + ' كغ متلفة • ' +
           fmt(x.facts.cost) + ' د.إ)' +
           (x.topics.length ? '<br>قواعد الموضوع المطبَّقة: <code>' + esc(x.topics.join(', ')) + '</code>' : '') },
      { h: 'حساب الخطورة وإرفاق المؤشرات',
        p: 'الوحدة المسؤولة: <b>' + esc(x.module) + '</b> — الخطورة أعلى المحاور الثلاثة، لا متوسطها.' }
    ];

    return '<div class="card trace"><div class="card-head">' +
        '<h3>أثر المحرك الحتمي</h3>' +
        '<span class="hint">كيف وصلت المنصة إلى هذا الحل — القسم 8 من منطق المنصة</span>' +
      '</div><div class="card-body">' +
      '<div class="trace-steps">' +
        steps.map(function (s, i) {
          return '<div class="trace-step"><span class="trace-num">' + (i + 1) + '</span>' +
                 '<div><h4>' + s.h + '</h4><p>' + s.p + '</p></div></div>';
        }).join('') +
      '</div>' +
      '<h4 class="mt mb">مصفوفة الخطورة</h4>' + axes + divergence +
    '</div></div>';
  }

  function viewEventDetail(id) {
    var ev = S.byId(id);
    if (!ev) {
      return '<div class="card"><div class="empty"><b>الفعالية غير موجودة</b>' +
             'ربما حُذفت أو أُعيد تعيين البيانات.' +
             '<div class="mt"><button class="btn" data-go="events">العودة للسجل</button></div></div></div>';
    }

    var fk = ev.food_kg || {}, att = ev.attendance || {}, meals = ev.meals || {};

    var stats = [
      { v: fmt(fk.delivered) + ' كغ', l: 'مورَّد' },
      { v: fmt(fk.consumed) + ' كغ', l: 'مستهلك' },
      { v: fmt(fk.wasted) + ' كغ', l: 'متلف' },
      { v: fmt1(fk.waste_pct) + '%', l: 'نسبة الهدر' },
      { v: fmt(ev.waste_cost_aed) + ' د.إ', l: 'كلفة الهدر' },
      { v: fmt(ev.avg_cost_aed_per_kg) + ' د.إ', l: 'متوسط الكلفة/كغ' },
      { v: fmt(att.expected), l: 'الحضور المتوقع' },
      { v: fmt(att.actual), l: 'الحضور الفعلي' },
      { v: fmt1(att.variance_pct) + '%', l: 'انحراف الحضور' },
      { v: fmt(meals.ordered), l: 'وجبات مطلوبة' },
      { v: fmt(meals.served), l: 'وجبات مقدَّمة' }
    ].map(function (s) {
      return '<div class="stat"><b>' + esc(s.v) + '</b><span>' + esc(s.l) + '</span></div>';
    }).join('');

    var incidents = (ev.incidents || []).map(function (inc) {
      return '<div class="issue">' +
        '<div class="issue-head">' +
          '<span class="chip" style="border-color:' + catColor(inc.category) + '33;color:' + catColor(inc.category) + '">' +
            esc(inc.category) + '</span>' +
          '<span class="badge badge-neutral">' + esc(inc.stage) + '</span>' +
        '</div>' +
        '<p>' + esc(inc.description) + '</p>' +
        '<div class="effect">الأثر المباشر: ' + esc(inc.direct_effect) + '</div>' +
      '</div>';
    }).join('') || '<div class="muted small">لا مشكلات فرعية مسجَّلة.</div>';

    var solutionBlock = ev.golden_solution
      ? renderSolution(ev, ev.golden_solution, true)
      : '<div class="card"><div class="card-body">' +
          '<div class="empty"><b>لا يوجد حل لهذه الفعالية بعد</b>' +
          'شغّل المحرك الحتمي ليولّد حلاً بنفس بنية الأمثلة الذهبية، ثم راجعه واعتمده.' +
          '<div class="mt"><button class="btn btn-primary" data-generate="' + esc(ev.event_id) + '">' +
            '⚡ ولّد الحل</button></div></div>' +
        '</div></div>';

    return '' +
      '<div class="split mb">' +
        '<button class="btn btn-sm" data-go="events">→ العودة للسجل</button>' +
        '<span class="push"></span>' +
        (ev.golden_solution ? '' :
          '<button class="btn btn-primary btn-sm" data-generate="' + esc(ev.event_id) + '">⚡ ولّد الحل</button>') +
        '<button class="btn btn-danger btn-sm" data-delete-event="' + esc(ev.event_id) + '">حذف الفعالية</button>' +
      '</div>' +

      '<div class="card mb"><div class="card-body">' +
        '<div class="detail-head">' +
          '<div>' +
            '<h2>' + esc(ev.event_name) + '</h2>' +
            '<div class="detail-meta">' +
              '<span class="chip">' + esc(ev.event_id) + '</span>' +
              '<span class="chip">' + esc(ev.date) + '</span>' +
              '<span class="chip">' + esc(ev.event_type) + '</span>' +
              '<span class="chip">' + esc(ev.venue) + ' — ' + esc(ev.emirate) + '</span>' +
              '<span class="chip">' + esc(ev.catering_provider) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="push split">' +
            '<span class="' + sevClass(ev.severity) + '">' + esc(ev.severity) + '</span>' +
            statusBadge(ev.golden_solution) +
          '</div>' +
        '</div>' +
        '<div class="stat-grid">' + stats + '</div>' +
      '</div></div>' +

      '<div class="grid grid-2">' +
        '<div class="card"><div class="card-head"><h3>وصف المشكلة</h3></div><div class="card-body">' +
          '<dl class="kv">' +
            '<dt>سلسلة الإمداد</dt><dd>' + esc(ev.supply_chain_issue) + '</dd>' +
            '<dt>الاستلام والإدخال</dt><dd>' + esc(ev.receiving_intake_issue) + '</dd>' +
            '<dt>السبب الجذري</dt><dd><b>' + esc(ev.root_cause) + '</b></dd>' +
            '<dt>الأثر</dt><dd>' + esc(ev.impact) + '</dd>' +
          '</dl>' +
        '</div></div>' +
        '<div class="card"><div class="card-head"><h3>المشكلات الفرعية</h3>' +
          '<span class="hint">' + ((ev.incidents || []).length) + ' مشكلة</span></div>' +
          '<div class="card-body">' + incidents + '</div>' +
        '</div>' +
      '</div>' +

      '<h2 class="section-title">السرد</h2>' +
      '<div class="narrative">' + esc(ev.narrative_ar) + '</div>' +

      '<h2 class="section-title">الحل</h2>' +
      solutionBlock +

      '<h2 class="section-title">تحليل المحرك</h2>' +
      renderTrace(ev);
  }

  /* ================================================================== *
   * الشاشة 4 — توليد الحل (نافذة مراجعة قبل الحفظ)
   * ================================================================== */
  var pendingSolution = null;

  function openGenerateModal(id) {
    var ev = S.byId(id);
    if (!ev) return;

    var golden = S.goldenEvents();
    if (!golden.length) {
      toast('لا يوجد أي مثال ذهبي معتمد ليُستخدم قالباً. أعد تعيين البيانات أو اعتمد حلاً أولاً.', 'err');
      return;
    }

    var sol = E.generate(ev, golden);
    var x = E.explain(ev, golden);
    pendingSolution = { id: id, solution: sol };

    var summary =
      '<div class="alert alert-info mb">' +
        'وُلّد الحل حتمياً بقواعد القسم 8: صُنّفت الفعالية في فئة <b>' + esc(x.classification.primary.name) +
        '</b>، ونمط الفشل <b>' + esc(x.pattern.name) + '</b>، وسُحب القالب من <b>' + esc(x.templates.primary.id) +
        '</b>' + (x.templates.blend ? ' ممزوجاً بـ <b>' + esc(x.templates.blend.id) + '</b>' : '') +
        '، ثم خُصّص بحقائق «' + esc(ev.event_name) + '». راجعه وعدّله قبل الاعتماد.' +
      '</div>';

    openModal({
      title: 'مراجعة الحل المولَّد — ' + ev.event_id,
      body: summary + '<div id="gen-preview">' + renderSolution(ev, sol, false) + '</div>',
      foot:
        '<button class="btn btn-primary" data-save-generated="1">حفظ كحل مولَّد</button>' +
        '<button class="btn btn-gold" data-save-approved="1">★ حفظ واعتماد كذهبي</button>' +
        '<button class="btn" data-open-editor="1">تعديل قبل الحفظ</button>' +
        '<button class="btn btn-ghost" data-modal-close="1">إلغاء</button>'
    });
  }

  /* ---------------- محرر الحل ---------------- */
  function solutionEditorBody(sol) {
    function recFields(r, i) {
      return '<div class="card mb"><div class="card-body">' +
        '<div class="split mb"><b>التوصية ' + (i + 1) + '</b>' +
          '<select data-rec="' + i + '" data-key="type" style="width:auto">' +
            L.RECOMMENDATION_TYPES.map(function (t) {
              return '<option value="' + esc(t) + '"' + (t === r.type ? ' selected' : '') + '>' + esc(t) + '</option>';
            }).join('') +
          '</select></div>' +
        '<div class="field mb"><label>الإجراء <span class="req">*</span></label>' +
          '<textarea data-rec="' + i + '" data-key="action_ar">' + esc(r.action_ar) + '</textarea></div>' +
        '<div class="filters">' +
          '<div class="field grow"><label>المالك <span class="req">*</span></label>' +
            '<input data-rec="' + i + '" data-key="owner_ar" value="' + esc(r.owner_ar) + '"></div>' +
          '<div class="field grow"><label>الإطار الزمني <span class="req">*</span></label>' +
            '<input data-rec="' + i + '" data-key="timeline_ar" value="' + esc(r.timeline_ar) + '"></div>' +
        '</div>' +
        '<div class="field mt"><label>الأثر المتوقع <span class="req">*</span></label>' +
          '<input data-rec="' + i + '" data-key="expected_impact_ar" value="' + esc(r.expected_impact_ar) + '"></div>' +
      '</div></div>';
    }

    function autoFields(a, i) {
      return '<div class="card mb"><div class="card-body">' +
        '<div class="field mb"><label>اسم الأتمتة <span class="req">*</span></label>' +
          '<input data-auto="' + i + '" data-key="name_ar" value="' + esc(a.name_ar) + '"></div>' +
        '<div class="filters">' +
          '<div class="field grow"><label>المُشغّل <span class="req">*</span></label>' +
            '<input data-auto="' + i + '" data-key="trigger_ar" value="' + esc(a.trigger_ar) + '"></div>' +
          '<div class="field grow"><label>الشرط <span class="req">*</span></label>' +
            '<input data-auto="' + i + '" data-key="condition_ar" value="' + esc(a.condition_ar) + '"></div>' +
        '</div>' +
        '<div class="field mt"><label>الإجراء الآلي <span class="req">*</span></label>' +
          '<textarea data-auto="' + i + '" data-key="action_ar">' + esc(a.action_ar) + '</textarea></div>' +
        '<div class="field mt"><label>وحدة المنصة</label>' +
          '<select data-auto="' + i + '" data-key="portal_module">' +
            L.MODULES.map(function (m) {
              return '<option value="' + esc(m.name) + '"' + (m.name === a.portal_module ? ' selected' : '') + '>' +
                     esc(m.name) + '</option>';
            }).join('') +
          '</select></div>' +
      '</div></div>';
    }

    function kpiFields(k, i) {
      return '<div class="filters mb">' +
        '<div class="field grow"><label>المؤشر ' + (i + 1) + ' <span class="req">*</span></label>' +
          '<input data-kpi="' + i + '" data-key="name_ar" value="' + esc(k.name_ar) + '"></div>' +
        '<div class="field grow"><label>الهدف <span class="req">*</span></label>' +
          '<input data-kpi="' + i + '" data-key="target_ar" value="' + esc(k.target_ar) + '"></div>' +
      '</div>';
    }

    return '<div id="editor-errors"></div>' +
      '<div class="field mb"><label>وحدة المنصة المسؤولة</label>' +
        '<select id="ed-module">' +
          L.MODULES.map(function (m) {
            return '<option value="' + esc(m.name) + '"' + (m.name === sol.portal_module ? ' selected' : '') + '>' +
                   esc(m.name) + '</option>';
          }).join('') +
        '</select></div>' +
      '<div class="field mb"><label>التشخيص <span class="req">*</span></label>' +
        '<textarea id="ed-diagnosis" style="min-height:110px">' + esc(sol.diagnosis_ar) + '</textarea>' +
        '<div class="field-hint">قاعدة المنطق: يسمّي نمط الفشل ويميّز ما نجح (ليُثبَّت) عمّا فشل (ليُصلَح).</div></div>' +
      '<h4 class="mb">التوصيات</h4>' + sol.recommendations.map(recFields).join('') +
      '<h4 class="mb">الأتمتة</h4>' + sol.automations.map(autoFields).join('') +
      '<h4 class="mb">المؤشرات</h4>' + sol.kpis.map(kpiFields).join('');
  }

  function readSolutionEditor(base) {
    var body = el('modal-body');
    var sol = JSON.parse(JSON.stringify(base));
    sol.portal_module = body.querySelector('#ed-module').value;
    sol.diagnosis_ar = body.querySelector('#ed-diagnosis').value.trim();

    ['rec', 'auto', 'kpi'].forEach(function (kind) {
      var target = kind === 'rec' ? sol.recommendations : kind === 'auto' ? sol.automations : sol.kpis;
      Array.prototype.forEach.call(body.querySelectorAll('[data-' + kind + ']'), function (input) {
        var i = parseInt(input.getAttribute('data-' + kind), 10);
        if (target[i]) target[i][input.getAttribute('data-key')] = input.value.trim();
      });
    });

    sol.recommendations.forEach(function (r, i) { r.priority = i + 1; });

    var errors = [];
    if (sol.diagnosis_ar.length < 30) errors.push('التشخيص قصير جداً — المطلوب 2–3 جمل تسمّي نمط الفشل وتميّز ما نجح عما فشل.');
    sol.recommendations.forEach(function (r, i) {
      ['action_ar', 'owner_ar', 'timeline_ar', 'expected_impact_ar'].forEach(function (k) {
        if (!r[k]) errors.push('التوصية ' + (i + 1) + ': الحقل «' + k + '» إلزامي (توصية بلا مالك لن تُنفذ).');
      });
    });
    sol.automations.forEach(function (a, i) {
      ['name_ar', 'trigger_ar', 'condition_ar', 'action_ar'].forEach(function (k) {
        if (!a[k]) errors.push('الأتمتة ' + (i + 1) + ': الحقل «' + k + '» إلزامي (مشغّل ← شرط ← إجراء).');
      });
    });
    sol.kpis.forEach(function (k, i) {
      if (!k.name_ar || !k.target_ar) errors.push('المؤشر ' + (i + 1) + ': الاسم والهدف إلزاميان.');
    });

    return { solution: sol, errors: errors };
  }

  function openEditor(id, base, opts) {
    opts = opts || {};
    openModal({
      title: (opts.title || 'تعديل الحل') + ' — ' + id,
      body: solutionEditorBody(base),
      foot:
        '<button class="btn btn-primary" data-editor-save="' + esc(id) + '">حفظ التعديلات</button>' +
        '<button class="btn btn-gold" data-editor-save-approve="' + esc(id) + '">★ حفظ واعتماد</button>' +
        '<button class="btn btn-ghost" data-modal-close="1">إلغاء</button>',
      editorBase: base
    });
  }

  function saveSolution(id, sol, approve) {
    sol.status = approve ? 'golden_approved' : (sol.status === 'golden_approved' ? 'golden_approved' : 'generated');
    S.setSolution(id, sol);
    closeModal();
    toast(approve ? 'اعتُمد الحل كمثال ذهبي وأصبح متاحاً كقالب للمحرك.' : 'حُفظ الحل بحالة «مولَّد».', 'ok');
    go('event/' + id);
  }

  /* ================================================================== *
   * الشاشة 5 — إضافة فعالية
   * ================================================================== */
  var newIncidents = [{ category: 'التخطيط والتنبؤ', stage: '', description: '', direct_effect: '' }];

  function incidentRow(inc, i) {
    return '<div class="card mb" data-incident-row="' + i + '"><div class="card-body">' +
      '<div class="split mb"><b>مشكلة فرعية ' + (i + 1) + '</b>' +
        '<span class="push"></span>' +
        (i > 0 ? '<button type="button" class="btn btn-ghost btn-sm" data-remove-incident="' + i + '">حذف</button>' : '') +
      '</div>' +
      '<div class="filters">' +
        '<div class="field grow"><label>الفئة <span class="req">*</span></label>' +
          '<select data-inc="' + i + '" data-key="category">' +
            L.CATEGORIES.map(function (c) {
              return '<option value="' + esc(c.name) + '"' + (c.name === inc.category ? ' selected' : '') + '>' +
                     esc(c.name) + '</option>';
            }).join('') +
          '</select></div>' +
        '<div class="field grow"><label>المرحلة <span class="req">*</span></label>' +
          '<input data-inc="' + i + '" data-key="stage" placeholder="النقل / منصة الاستلام / بعد الفعالية" value="' +
            esc(inc.stage) + '"></div>' +
      '</div>' +
      '<div class="field mt"><label>الوصف <span class="req">*</span></label>' +
        '<textarea data-inc="' + i + '" data-key="description" placeholder="ماذا حدث بالضبط؟">' +
          esc(inc.description) + '</textarea></div>' +
      '<div class="field mt"><label>الأثر المباشر <span class="req">*</span></label>' +
        '<input data-inc="' + i + '" data-key="direct_effect" placeholder="ما النتيجة الفورية؟" value="' +
          esc(inc.direct_effect) + '"></div>' +
    '</div></div>';
  }

  function viewNewEvent() {
    var all = S.all();
    var emirates = uniq(all.map(function (e) { return e.emirate; }));
    var providers = uniq(all.map(function (e) { return e.catering_provider; }));
    var types = uniq(all.map(function (e) { return e.event_type; }));

    function datalist(id, values) {
      return '<datalist id="' + id + '">' +
        values.map(function (v) { return '<option value="' + esc(v) + '"></option>'; }).join('') + '</datalist>';
    }

    return '' +
      '<div class="split mb">' +
        '<h2 class="section-title" style="margin:0">إضافة فعالية</h2>' +
        '<span class="push"></span>' +
        '<button class="btn btn-sm" id="btn-template">⬇ نزّل ورقة التعبئة (Excel)</button>' +
      '</div>' +

      '<div class="alert alert-info mb">' +
        'لديك طريقان: املأ النموذج أدناه مباشرة، أو <b>نزّل ورقة التعبئة</b> — ملف Excel فيه ' +
        'سؤال عربي في كل عمود يملؤه أي زميل بلا معرفة تقنية (مفيد لتجميع فعاليات من فرق مختلفة) — ' +
        'ثم ارفعه عبر <b>استيراد ← دمج</b>. المنصة تقرأ الورقة وتحسب النسب والكلفة والخطورة ' +
        'وتصنّف كل فعالية داخل متصفحك، بلا خادم وبلا مفاتيح.' +
      '</div>' +

      '<form id="new-event-form" novalidate>' +
        '<div id="form-errors"></div>' +

        '<div class="card mb"><div class="card-head"><h3>التعريف</h3></div><div class="card-body">' +
          '<div class="filters">' +
            '<div class="field"><label>المعرّف <span class="req">*</span></label>' +
              '<input name="event_id" value="' + esc(S.nextId()) + '" required>' +
              '<div class="field-hint">بصيغة EV-XXX ويجب ألا يتكرر</div></div>' +
            '<div class="field grow"><label>اسم الفعالية <span class="req">*</span></label>' +
              '<input name="event_name" placeholder="مثال: مؤتمر حكومي لتجربة المتعاملين" required></div>' +
            '<div class="field"><label>التاريخ <span class="req">*</span></label>' +
              '<input type="date" name="date" required></div>' +
          '</div>' +
          '<div class="filters mt">' +
            '<div class="field grow"><label>الإمارة <span class="req">*</span></label>' +
              '<input name="emirate" list="dl-emirates" required></div>' +
            '<div class="field grow"><label>الموقع <span class="req">*</span></label>' +
              '<input name="venue" placeholder="مركز أدنيك للمعارض" required></div>' +
            '<div class="field grow"><label>نوع الفعالية <span class="req">*</span></label>' +
              '<input name="event_type" list="dl-types" required></div>' +
            '<div class="field grow"><label>مزود التموين <span class="req">*</span></label>' +
              '<input name="catering_provider" list="dl-providers" required></div>' +
          '</div>' +
          datalist('dl-emirates', emirates) + datalist('dl-types', types) + datalist('dl-providers', providers) +
        '</div></div>' +

        '<div class="card mb"><div class="card-head"><h3>الأرقام</h3>' +
          '<span class="hint">نسبة الهدر وكلفته تُحسبان تلقائياً</span></div><div class="card-body">' +
          '<div class="filters">' +
            '<div class="field"><label>الحضور المتوقع <span class="req">*</span></label>' +
              '<input type="number" name="expected" min="0" step="1" required></div>' +
            '<div class="field"><label>الحضور الفعلي <span class="req">*</span></label>' +
              '<input type="number" name="actual" min="0" step="1" required></div>' +
            '<div class="field"><label>وجبات مطلوبة <span class="req">*</span></label>' +
              '<input type="number" name="ordered" min="0" step="1" required></div>' +
            '<div class="field"><label>وجبات مقدَّمة <span class="req">*</span></label>' +
              '<input type="number" name="served" min="0" step="1" required></div>' +
          '</div>' +
          '<div class="filters mt">' +
            '<div class="field"><label>مورَّد (كغ) <span class="req">*</span></label>' +
              '<input type="number" name="delivered" min="0" step="0.1" required></div>' +
            '<div class="field"><label>مستهلك (كغ) <span class="req">*</span></label>' +
              '<input type="number" name="consumed" min="0" step="0.1" required></div>' +
            '<div class="field"><label>متلف (كغ) <span class="req">*</span></label>' +
              '<input type="number" name="wasted" min="0" step="0.1" required>' +
              '<div class="field-hint">يجب ألا يتجاوز المورَّد</div></div>' +
            '<div class="field"><label>متوسط الكلفة (د.إ/كغ) <span class="req">*</span></label>' +
              '<input type="number" name="avg_cost_aed_per_kg" min="0" step="0.5" required></div>' +
          '</div>' +
          '<div class="alert alert-info mt" id="calc-preview">أدخل الكميات لعرض نسبة الهدر وكلفته المحسوبتين.</div>' +
        '</div></div>' +

        '<div class="card mb"><div class="card-head"><h3>وصف المشكلة</h3>' +
          '<span class="hint">هذه النصوص هي ما يقرأه المحرك للتصنيف وتحديد نمط الفشل</span></div>' +
          '<div class="card-body">' +
          '<div class="field mb"><label>مشكلة سلسلة الإمداد <span class="req">*</span></label>' +
            '<textarea name="supply_chain_issue" placeholder="اكتب «سليمة» إن لم توجد مشكلة"></textarea></div>' +
          '<div class="field mb"><label>مشكلة الاستلام والإدخال <span class="req">*</span></label>' +
            '<textarea name="receiving_intake_issue" placeholder="اكتب «الاستلام سليم» إن لم توجد مشكلة"></textarea></div>' +
          '<div class="field mb"><label>السبب الجذري <span class="req">*</span></label>' +
            '<textarea name="root_cause" placeholder="لماذا حدث ما حدث؟ اذهب لأبعد من العَرَض"></textarea></div>' +
          '<div class="field mb"><label>الأثر <span class="req">*</span></label>' +
            '<input name="impact" placeholder="ماذا كلّف هذا الفشل؟"></div>' +
          '<div class="field"><label>السرد <span class="req">*</span></label>' +
            '<textarea name="narrative_ar" style="min-height:100px" placeholder="قصة الفعالية كما جرت"></textarea></div>' +
        '</div></div>' +

        '<div class="card mb"><div class="card-head"><h3>الخطورة</h3>' +
          '<span class="hint">يحسبها المحرك من المصفوفة، ويمكن تجاوزها يدوياً</span></div><div class="card-body">' +
          '<div class="field" style="max-width:280px"><label>درجة الخطورة</label>' +
            '<select name="severity">' +
              '<option value="">احسبها آلياً من المصفوفة (موصى به)</option>' +
              L.SEVERITY_LEVELS.slice().reverse().map(function (s) {
                return '<option value="' + esc(s) + '">' + esc(s) + '</option>';
              }).join('') +
            '</select></div>' +
        '</div></div>' +

        '<div class="card mb"><div class="card-head"><h3>المشكلات الفرعية</h3>' +
          '<span class="hint">الفئة الأولى تُعتبر الطبقة الفاشلة الرئيسية</span>' +
          '<span class="push"></span>' +
          '<button type="button" class="btn btn-sm" id="add-incident">+ إضافة مشكلة</button></div>' +
          '<div class="card-body"><div id="incidents-host">' +
            newIncidents.map(incidentRow).join('') +
          '</div></div>' +
        '</div>' +

        '<div class="split mb">' +
          '<button type="submit" class="btn btn-primary">حفظ الفعالية</button>' +
          '<button type="button" class="btn" id="save-and-generate">حفظ ثم توليد الحل</button>' +
          '<button type="button" class="btn btn-ghost" data-go="events">إلغاء</button>' +
        '</div>' +
      '</form>';
  }

  function collectIncidents(form) {
    var out = [];
    Array.prototype.forEach.call(form.querySelectorAll('[data-incident-row]'), function (row) {
      var i = row.getAttribute('data-incident-row');
      var inc = { category: '', stage: '', description: '', direct_effect: '' };
      Array.prototype.forEach.call(row.querySelectorAll('[data-inc="' + i + '"]'), function (input) {
        inc[input.getAttribute('data-key')] = input.value.trim();
      });
      out.push(inc);
    });
    return out;
  }

  function validateNewEvent(form) {
    var f = {};
    Array.prototype.forEach.call(form.elements, function (input) {
      if (input.name) f[input.name] = input.value.trim();
    });

    var errors = [];
    var invalid = [];

    function req(name, label) {
      if (!f[name]) { errors.push('الحقل «' + label + '» إلزامي.'); invalid.push(name); return false; }
      return true;
    }

    req('event_id', 'المعرّف');
    req('event_name', 'اسم الفعالية');
    req('date', 'التاريخ');
    req('emirate', 'الإمارة');
    req('venue', 'الموقع');
    req('event_type', 'نوع الفعالية');
    req('catering_provider', 'مزود التموين');
    ['supply_chain_issue', 'receiving_intake_issue', 'root_cause', 'impact', 'narrative_ar']
      .forEach(function (k, i) {
        req(k, ['مشكلة سلسلة الإمداد', 'مشكلة الاستلام والإدخال', 'السبب الجذري', 'الأثر', 'السرد'][i]);
      });

    if (f.event_id && !/^EV-\d{3,}$/.test(f.event_id)) {
      errors.push('المعرّف يجب أن يكون بصيغة EV-XXX (مثال: EV-021).'); invalid.push('event_id');
    }
    if (f.event_id && S.byId(f.event_id)) {
      errors.push('المعرّف «' + f.event_id + '» مستخدم بالفعل — اختر معرّفاً آخر.'); invalid.push('event_id');
    }

    if (f.date) {
      var d = new Date(f.date + 'T00:00:00');
      if (isNaN(d.getTime())) { errors.push('التاريخ غير صالح.'); invalid.push('date'); }
      else if (d.getFullYear() < 2000 || d.getFullYear() > 2100) {
        errors.push('التاريخ خارج النطاق المعقول (2000–2100).'); invalid.push('date');
      }
    }

    var nums = {};
    [['expected', 'الحضور المتوقع'], ['actual', 'الحضور الفعلي'], ['ordered', 'وجبات مطلوبة'],
     ['served', 'وجبات مقدَّمة'], ['delivered', 'مورَّد (كغ)'], ['consumed', 'مستهلك (كغ)'],
     ['wasted', 'متلف (كغ)'], ['avg_cost_aed_per_kg', 'متوسط الكلفة']].forEach(function (p) {
      var v = f[p[0]];
      if (v === '' || v === undefined) { errors.push('الحقل «' + p[1] + '» إلزامي.'); invalid.push(p[0]); return; }
      var n = Number(v);
      if (isNaN(n) || n < 0) { errors.push('«' + p[1] + '» يجب أن يكون رقماً غير سالب.'); invalid.push(p[0]); return; }
      nums[p[0]] = n;
    });

    if (nums.delivered !== undefined && nums.wasted !== undefined && nums.wasted > nums.delivered) {
      errors.push('الكمية المتلفة (' + fmt(nums.wasted) + ' كغ) لا يمكن أن تتجاوز المورَّدة (' +
                  fmt(nums.delivered) + ' كغ).');
      invalid.push('wasted');
    }
    if (nums.delivered !== undefined && nums.consumed !== undefined && nums.consumed > nums.delivered) {
      errors.push('الكمية المستهلكة لا يمكن أن تتجاوز المورَّدة.'); invalid.push('consumed');
    }
    if (nums.delivered !== undefined && nums.consumed !== undefined && nums.wasted !== undefined &&
        nums.consumed + nums.wasted > nums.delivered + 0.001) {
      errors.push('مجموع المستهلك والمتلف (' + fmt1(nums.consumed + nums.wasted) +
                  ' كغ) يتجاوز المورَّد (' + fmt(nums.delivered) + ' كغ).');
      invalid.push('consumed'); invalid.push('wasted');
    }
    if (nums.served !== undefined && nums.ordered !== undefined && nums.served > nums.ordered) {
      errors.push('الوجبات المقدَّمة لا يمكن أن تتجاوز المطلوبة.'); invalid.push('served');
    }

    var incidents = collectIncidents(form);
    if (!incidents.length) errors.push('يجب إضافة مشكلة فرعية واحدة على الأقل.');
    incidents.forEach(function (inc, i) {
      if (!inc.stage || !inc.description || !inc.direct_effect) {
        errors.push('المشكلة الفرعية ' + (i + 1) + ': المرحلة والوصف والأثر المباشر إلزامية.');
      }
    });

    Array.prototype.forEach.call(form.querySelectorAll('.invalid'), function (n) { n.classList.remove('invalid'); });
    invalid.forEach(function (name) {
      var node = form.querySelector('[name="' + name + '"]');
      if (node) node.classList.add('invalid');
    });

    if (errors.length) return { errors: errors };

    var wastePct = nums.delivered ? Math.round((nums.wasted / nums.delivered) * 1000) / 10 : 0;
    var ev = {
      event_id: f.event_id,
      event_name: f.event_name,
      date: f.date,
      emirate: f.emirate,
      venue: f.venue,
      event_type: f.event_type,
      catering_provider: f.catering_provider,
      attendance: {
        expected: nums.expected,
        actual: nums.actual,
        variance_pct: nums.expected ? Math.round(((nums.actual - nums.expected) / nums.expected) * 1000) / 10 : 0
      },
      meals: { ordered: nums.ordered, served: nums.served },
      food_kg: {
        delivered: nums.delivered, consumed: nums.consumed,
        wasted: nums.wasted, waste_pct: wastePct
      },
      avg_cost_aed_per_kg: nums.avg_cost_aed_per_kg,
      waste_cost_aed: Math.round(nums.wasted * nums.avg_cost_aed_per_kg),
      supply_chain_issue: f.supply_chain_issue,
      receiving_intake_issue: f.receiving_intake_issue,
      root_cause: f.root_cause,
      severity: f.severity || '',
      impact: f.impact,
      narrative_ar: f.narrative_ar,
      incidents: incidents,
      portal_recommendation_required: true,
      golden_solution: null
    };

    if (!ev.severity) ev.severity = E.assessSeverity(ev).level;
    return { event: ev };
  }

  function updateCalcPreview(form) {
    var d = Number(form.elements.delivered.value);
    var w = Number(form.elements.wasted.value);
    var c = Number(form.elements.avg_cost_aed_per_kg.value);
    var host = form.querySelector('#calc-preview');
    if (!d || isNaN(w)) {
      host.className = 'alert alert-info mt';
      host.innerHTML = 'أدخل الكميات لعرض نسبة الهدر وكلفته المحسوبتين.';
      return;
    }
    if (w > d) {
      host.className = 'alert alert-error mt';
      host.innerHTML = 'الكمية المتلفة (' + fmt(w) + ' كغ) تتجاوز المورَّدة (' + fmt(d) + ' كغ).';
      return;
    }
    var p = Math.round((w / d) * 1000) / 10;
    host.className = 'alert ' + (p > L.WASTE_TARGET_PCT ? 'alert-warn' : 'alert-info') + ' mt';
    host.innerHTML = 'نسبة الهدر المحسوبة: <b>' + fmt1(p) + '%</b> • كلفة الهدر: <b>' +
                     fmt(Math.round(w * (c || 0))) + ' د.إ</b> • هدف المنصة < ' + L.WASTE_TARGET_PCT + '%';
  }

  /* ================================================================== *
   * الشاشة 6 — منطق المنصة
   * ================================================================== */
  function viewLogic() {
    var cats = L.CATEGORIES.map(function (c) {
      return '<div class="card cat-card" style="border-inline-start-color:' + c.color + '">' +
        '<div class="card-body">' +
          '<div class="split mb"><b style="color:' + c.color + '">' + c.id + '. ' + esc(c.name) + '</b>' +
            '<span class="chip push">' + esc(L.MODULE_FOR_CATEGORY[c.key]) + '</span></div>' +
          '<p class="small">' + esc(c.definition) + '</p>' +
          '<div>' + c.core.map(function (k) { return '<span class="kw">' + esc(k) + '</span>'; }).join('') + '</div>' +
        '</div></div>';
    }).join('');

    var matrixRows = L.SEVERITY_MATRIX.map(function (axis) {
      return '<tr><th>' + esc(axis.name) + '</th>' +
        axis.levels.map(function (lv, i) {
          return '<td class="lv-' + i + '">' + esc(lv) + '</td>';
        }).join('') + '</tr>';
    }).join('');

    var patterns = L.FAILURE_PATTERNS.map(function (p) {
      return '<div class="card"><div class="card-body">' +
        '<b>' + esc(p.name) + '</b>' +
        '<p class="small">' + esc(p.definition) + '</p>' +
        '<div class="small muted mb">مؤشرات الكشف:</div>' +
        '<div>' + p.indicators.filter(function (i) { return i.w === 2; }).slice(0, 9)
                    .map(function (i) { return '<span class="kw">' + esc(i.t) + '</span>'; }).join('') + '</div>' +
      '</div></div>';
    }).join('');

    var modules = L.MODULES.map(function (m) {
      return '<div class="card"><div class="card-body">' +
        '<b>' + esc(m.name) + '</b>' +
        '<p class="small">' + esc(m.role) + '</p>' +
        '<div>' + m.categories.map(function (k) {
          var c = L.CATEGORY_BY_KEY[k];
          return '<span class="chip" style="color:' + c.color + '">' + esc(c.name) + '</span>';
        }).join(' ') + '</div>' +
      '</div></div>';
    }).join('');

    var rules = L.CONTENT_RULES.map(function (r) {
      return '<li><b>' + esc(r.title) + ':</b> ' + esc(r.body) + '</li>';
    }).join('');

    var goldens = L.GOLDEN_RATIONALE.map(function (g) {
      var exists = !!S.byId(g.id);
      return '<tr' + (exists ? ' data-event="' + esc(g.id) + '" style="cursor:pointer"' : '') + '>' +
        '<td class="name">' + esc(g.id) + '<div class="muted">' + esc(g.title) + '</div></td>' +
        '<td>' + esc(g.category) + '</td><td>' + esc(g.pattern) + '</td><td>' + esc(g.module) + '</td>' +
        '<td class="small">' + esc(g.teaches) + '</td></tr>';
    }).join('');

    var steps = L.ENGINE_STEPS.map(function (s, i) {
      return '<div class="trace-step"><span class="trace-num">' + (i + 1) + '</span><div><p>' + esc(s) + '</p></div></div>';
    }).join('');

    /* كتلة الكود اتجاهها LTR، فتُعزل القيم العربية داخل <bdi> كي لا تتشوه علامات الترقيم */
    var schema = JSON.stringify(L.SOLUTION_SCHEMA, null, 2)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/"([^"]+)":/g, '"<span class="k">$1</span>":')
      .replace(/: "([^"]*[\u0600-\u06FF][^"]*)"/g, ': "<bdi>$1</bdi>"');

    return '' +
      '<div class="split mb">' +
        '<h2 class="section-title" style="margin:0">منطق المنصة</h2>' +
        '<span class="chip">portal_logic.md مُدمجاً كوحدة قواعد تنفيذية</span>' +
      '</div>' +

      '<div class="logic-nav">' +
        '<a href="#/logic" data-scroll="lg-principle">المبدأ الحاكم</a>' +
        '<a href="#/logic" data-scroll="lg-cats">الفئات الست</a>' +
        '<a href="#/logic" data-scroll="lg-matrix">مصفوفة الخطورة</a>' +
        '<a href="#/logic" data-scroll="lg-patterns">أنماط الفشل</a>' +
        '<a href="#/logic" data-scroll="lg-schema">بنية الحل</a>' +
        '<a href="#/logic" data-scroll="lg-modules">وحدات المنصة</a>' +
        '<a href="#/logic" data-scroll="lg-golden">الأمثلة الذهبية</a>' +
        '<a href="#/logic" data-scroll="lg-engine">المحرك الحتمي</a>' +
      '</div>' +

      '<div id="lg-principle" class="quote mb">« ' + esc(L.GOVERNING_PRINCIPLE) + ' »</div>' +
      '<p class="small muted mb">' + esc(L.PRINCIPLE_NOTE) + '</p>' +

      '<h3 id="lg-cats" class="section-title">1 • التصنيف: الفئات الست</h3>' +
      '<p class="small muted">تغطي دورة حياة الطعام كاملة: قبل الفعالية، في الطريق، عند الباب، ' +
        'داخل الموقع، فوق كل ذلك حوكمةً، وبعد الخدمة. الكلمات أدناه هي ما يبحث عنه المحرك فعلياً في النصوص.</p>' +
      '<div class="grid grid-3">' + cats + '</div>' +

      '<h3 id="lg-matrix" class="section-title">2 • مصفوفة الخطورة</h3>' +
      '<div class="card mb"><div class="table-wrap"><table class="matrix"><thead><tr>' +
        '<th>المحور</th><th>منخفضة</th><th>متوسطة</th><th>عالية</th><th>حرجة</th>' +
      '</tr></thead><tbody>' + matrixRows + '</tbody></table></div></div>' +
      '<div class="alert alert-warn">الخطورة = <b>أعلى</b> درجة من المحاور الثلاثة، لا متوسطها. ' +
        esc(L.SEVERITY_RATIONALE) + '</div>' +

      '<h3 id="lg-patterns" class="section-title">3 • أنماط الفشل الأربعة</h3>' +
      '<p class="small muted">السؤال المتسلسل «لماذا؟» يتوقف عند أحد هذه الأنماط — وهو ما يحدد شكل الحل.</p>' +
      '<div class="grid grid-2">' + patterns + '</div>' +

      '<h3 id="lg-schema" class="section-title">4 • بنية الحل الإلزامية</h3>' +
      '<div class="grid grid-2">' +
        '<div class="card"><div class="card-body"><pre class="schema">' + schema + '</pre></div></div>' +
        '<div class="card"><div class="card-head"><h3>قواعد صارمة على المحتوى</h3></div>' +
          '<div class="card-body"><ol class="rules-list">' + rules + '</ol></div></div>' +
      '</div>' +

      '<h3 id="lg-modules" class="section-title">5 • وحدات المنصة الأربع</h3>' +
      '<div class="grid grid-2">' + modules + '</div>' +

      '<h3 id="lg-golden" class="section-title">6 • لماذا هذه الأمثلة الذهبية الأربعة؟</h3>' +
      '<div class="card mb"><div class="table-wrap"><table class="data" style="min-width:720px"><thead><tr>' +
        '<th>المثال</th><th>الفئة</th><th>نمط الفشل</th><th>الوحدة</th><th>ما يعلّمه للمحرك</th>' +
      '</tr></thead><tbody>' + goldens + '</tbody></table></div></div>' +

      '<h3 id="lg-engine" class="section-title">7 • قواعد المحرك الحتمي</h3>' +
      '<p class="small muted">بلا نموذج لغوي وبلا اتصال: نفس المدخل يعطي نفس المخرَج دائماً. ' +
        'هذه القواعد نفسها تصبح لاحقاً الـ System Prompt عند ربط نموذج لغوي حقيقي — البنية لا تتغير، ' +
        'فقط جودة التخصيص ترتفع.</p>' +
      '<div class="card"><div class="card-body"><div class="trace-steps">' + steps + '</div></div></div>' +

      '<h3 class="section-title">8 • مؤشرات المنصة العليا</h3>' +
      '<div class="card"><div class="card-body stack">' +
        L.TOP_KPIS.map(function (k) {
          return '<div class="kpi-row"><span>' + esc(k.name) + '</span><b>' + esc(k.target) + '</b></div>';
        }).join('') +
      '</div></div>';
  }

  /* ================================================================== *
   * الاستيراد والتصدير
   * ================================================================== */
  function exportFileName() {
    if (modalState && modalState.exportName) return modalState.exportName;
    var d = new Date();
    return 'catering_incidents_dataset_' + d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0') + '.json';
  }

  /**
   * التصدير يعرض مسارين معاً لأن بعض بيئات العرض المضمّنة (iframe بصلاحيات محدودة)
   * تمنع التنزيل الذي تبدأه الصفحة نفسها — فالنسخ إلى الحافظة يبقى مساراً يعمل دائماً.
   */
  function downloadJson() {
    var text = S.exportJson();
    var count = S.all().length;

    openModal({
      title: 'تصدير البيانات — ' + count + ' فعالية',
      body:
        '<div class="alert alert-info mb">ملف JSON بنفس المخطط الأصلي حرفياً، جاهز لإعادة الاستيراد. ' +
        'إن لم يبدأ التنزيل (بعض بيئات العرض تمنعه)، استخدم «نسخ إلى الحافظة».</div>' +
        '<textarea id="export-text" readonly spellcheck="false" ' +
        'style="min-height:260px;direction:ltr;text-align:left;font-family:monospace;font-size:.72rem">' +
        esc(text) + '</textarea>',
      foot:
        '<button class="btn btn-primary" data-export-download="1">⬇ تنزيل الملف</button>' +
        '<button class="btn" data-export-copy="1">نسخ إلى الحافظة</button>' +
        '<button class="btn btn-ghost" data-modal-close="1">إغلاق</button>',
      exportText: text
    });
  }

  /* مسار الحفظ لدى المضيف (بيئات العرض المضمّنة) — يُحلّ لاحقاً وقد يكون غائباً */
  var hostDownloads = null;

  function initHostDownloads() {
    if (!(window.claude && typeof window.claude.use === 'function')) return;
    try {
      window.claude.use('downloads').then(function (ns) { hostDownloads = ns || null; },
                                          function () { hostDownloads = null; });
    } catch (e) { hostDownloads = null; }
  }

  var DOWNLOAD_ERRORS = {
    declined: 'أُلغي الحفظ.',
    rate_limited: 'هناك طلب حفظ مفتوح بالفعل — أعد المحاولة بعد لحظات.',
    too_large: 'الملف أكبر من الحد المسموح — استخدم «نسخ إلى الحافظة».',
    bad_request: 'تعذّر تجهيز الملف — استخدم «نسخ إلى الحافظة».'
  };

  /** المسار الاحتياطي: رابط تنزيل من blob (يعمل عند فتح الملف محلياً) */
  function blobDownload(text) {
    try {
      var blob = new Blob([text], { type: 'application/json;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = exportFileName();
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
      closeModal();   // اكتملت المهمة — لا داعي لإبقاء النافذة تحجب الواجهة
      toast('بدأ تنزيل ' + exportFileName(), 'ok');
    } catch (e) {
      toast('تعذّر التنزيل في هذه البيئة — استخدم «نسخ إلى الحافظة».', 'err');
    }
  }

  function triggerDownload(text) {
    if (hostDownloads && typeof hostDownloads.save === 'function') {
      hostDownloads.save({ filename: exportFileName(), data: text }).then(function () {
        closeModal();
        toast('حُفظ ' + exportFileName(), 'ok');
      }, function (err) {
        var code = err && err.code;
        // أخطاء دورة الحياة تعني أن الحفظ غير متاح هنا — جرّب المسار الاحتياطي
        if (code === 'unavailable' || code === 'not_granted' ||
            code === 'capability_disabled' || code === 'capability_removed') {
          hostDownloads = null;
          blobDownload(text);
          return;
        }
        toast(DOWNLOAD_ERRORS[code] || 'تعذّر الحفظ — استخدم «نسخ إلى الحافظة».',
              code === 'declined' ? '' : 'err');
      });
      return;
    }
    blobDownload(text);
  }

  function copyExport(text) {
    var area = el('export-text');
    function fallback() {
      if (!area) return false;
      area.focus();
      area.select();
      try { return document.execCommand('copy'); } catch (e) { return false; }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast('نُسخت البيانات إلى الحافظة (' + S.all().length + ' فعالية).', 'ok');
      }, function () {
        toast(fallback() ? 'نُسخت البيانات إلى الحافظة.' : 'تعذّر النسخ — حدّد النص يدوياً وانسخه.',
              fallback() ? 'ok' : 'err');
      });
    } else {
      toast(fallback() ? 'نُسخت البيانات إلى الحافظة.' : 'تعذّر النسخ — حدّد النص يدوياً وانسخه.',
            fallback() ? 'ok' : 'err');
    }
  }

  /* ------------------------------------------------------------------ *
   * ورقة التعبئة: أسئلة بالعربية يملؤها إنسان في Excel، لا JSON
   * ------------------------------------------------------------------ */

  /** حفظ ملف ثنائي (xlsx) — مسار blob لأنه يعمل في المتصفح وعند فتح الملف محلياً */
  function saveBytes(bytes, filename, mime) {
    try {
      var blob = new Blob([bytes], { type: mime });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
      closeModal();
      toast('بدأ تنزيل ' + filename, 'ok');
      return true;
    } catch (e) {
      toast('تعذّر التنزيل في هذه البيئة.', 'err');
      return false;
    }
  }

  function templateQuestionRows() {
    return W.EVENT_COLUMNS.map(function (c) {
      return '<tr>' +
        '<td>' + esc(c.q) + (c.required ? ' <span class="req">*</span>' : '') + '</td>' +
        '<td class="muted">' + esc(c.hint) + '</td>' +
      '</tr>';
    }).join('');
  }

  function downloadTemplate() {
    var nextId = S.nextId();

    openModal({
      title: 'ورقة التعبئة — ' + W.EVENT_COLUMNS.length + ' سؤالاً',
      body:
        '<div class="alert alert-info mb">' +
          'ملف Excel فيه ثلاث أوراق: <b>' + esc(W.SHEET_EVENTS) + '</b> (سؤال في كل عمود، صف لكل فعالية)، ' +
          '<b>' + esc(W.SHEET_ISSUES) + '</b> (صف لكل طبقة فشل)، و<b>' + esc(W.SHEET_GUIDE) + '</b>. ' +
          'يفتح في Excel وNumbers وGoogle Sheets. املأه، ثم ارفعه عبر <b>استيراد</b> ' +
          'فتقرأه المنصة وتحلّله داخل متصفحك — بلا خادم وبلا إنترنت.' +
        '</div>' +
        '<div class="alert alert-ok mb">' +
          '<b>لا تحسب شيئاً بنفسك.</b> نسبة الهدر وكلفته وفرق الحضور ودرجة الخطورة تُحسب آلياً من ' +
          'الأرقام التي تدخلها، والتصنيف والحل المقترح يُولَّدان بعد الرفع.' +
        '</div>' +
        '<h4 class="mb">الأسئلة التي ستملؤها</h4>' +
        '<div class="table-wrap"><table class="table"><thead><tr>' +
          '<th>السؤال</th><th>المطلوب</th>' +
        '</tr></thead><tbody>' + templateQuestionRows() + '</tbody></table></div>',
      foot:
        '<button class="btn btn-primary" data-template-xlsx="1">⬇ تنزيل ورقة Excel (.xlsx)</button>' +
        '<button class="btn" data-template-csv="1">⬇ نسخة CSV</button>' +
        '<button class="btn btn-ghost" data-modal-close="1">إغلاق</button>',
      templateId: nextId
    });
  }

  function emitTemplateXlsx(nextId) {
    try {
      saveBytes(W.buildTemplate(nextId),
                'portal_catering_form.xlsx',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } catch (e) {
      toast('تعذّر توليد ملف Excel: ' + e.message, 'err');
    }
  }

  function emitTemplateCsv(nextId) {
    try {
      // BOM حتى يفتح Excel النص العربي بالترميز الصحيح دون سؤال
      var text = '﻿' + W.buildCsvTemplate(nextId);
      saveBytes(new Blob([text], { type: 'text/csv;charset=utf-8' }),
                'portal_catering_form.csv', 'text/csv;charset=utf-8');
    } catch (e) {
      toast('تعذّر توليد ملف CSV: ' + e.message, 'err');
    }
  }

  /* ------------------------------------------------------------------ *
   * الاستيراد: xlsx / csv / json
   * ------------------------------------------------------------------ */

  /** الملاحظات التي لا تمنع الاستيراد (تنبيه فقط) تُفصل عن الأخطاء المانعة */
  function isNoteOnly(msg) {
    return msg.indexOf('سيُحدَّث عند الدمج') !== -1 ||
           msg.indexOf('حُسبت آلياً بدلاً منها') !== -1;
  }

  function errorList(items, limit) {
    limit = limit || 12;
    return '<ul>' +
      items.slice(0, limit).map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') +
      (items.length > limit ? '<li>… و' + (items.length - limit) + ' أخرى</li>' : '') +
      '</ul>';
  }

  function invalidFileModal(title, items) {
    openModal({
      title: title,
      body: '<div class="alert alert-error"><b>لم يُستورد شيء.</b>' + errorList(items) + '</div>',
      foot: '<button class="btn" data-modal-close="1">إغلاق</button>'
    });
  }

  /** يبني حمولة استيراد كاملة: بيانات وصفية حالية + الفعاليات المقروءة */
  function sheetPayload(events) {
    var base = S.dataset();
    var payload = {};
    Object.keys(base).forEach(function (k) {
      if (k !== 'events') payload[k] = JSON.parse(JSON.stringify(base[k]));
    });
    payload.events = events;
    return payload;
  }

  function sheetPreviewRows(events) {
    return events.slice(0, 25).map(function (ev) {
      var fk = ev.food_kg || {};
      return '<tr>' +
        '<td class="mono">' + esc(ev.event_id) + '</td>' +
        '<td>' + esc(ev.event_name) + '</td>' +
        '<td>' + fmt(fk.wasted) + ' كغ (' + fmt(fk.waste_pct) + '%)</td>' +
        '<td>' + fmt(ev.waste_cost_aed) + ' د.إ</td>' +
        '<td>' + sevBadge(ev.severity) + '</td>' +
      '</tr>';
    }).join('');
  }

  function showSheetImport(parsed, fileName) {
    var blocking = parsed.errors.filter(function (e) { return !isNoteOnly(e); });
    var notes = parsed.errors.filter(isNoteOnly);

    if (!parsed.events.length) {
      invalidFileModal('لم نجد فعاليات في «' + fileName + '»',
        blocking.length ? blocking
                        : ['الورقة فارغة أو تحتوي على صف المثال وحده. املأ صفاً واحداً على الأقل تحت صف التلميحات.']);
      return;
    }
    if (blocking.length) { invalidFileModal('راجع «' + fileName + '» قبل الرفع', blocking); return; }

    var payload = sheetPayload(parsed.events);
    var known = S.all().map(function (e) { return e.event_id; });
    var overlap = parsed.events.filter(function (e) { return known.indexOf(e.event_id) !== -1; }).length;

    openModal({
      title: 'قراءة «' + fileName + '»',
      body:
        '<div class="alert alert-ok mb">' +
          'قُرئت <b>' + parsed.events.length + '</b> فعالية' +
          (parsed.skipped ? '، وتُجوهل <b>' + parsed.skipped + '</b> صف مثال' : '') +
          (overlap ? '، منها <b>' + overlap + '</b> معرّف موجود لديك حالياً' : '') + '. ' +
          'نسبة الهدر والكلفة ودرجة الخطورة حُسبت آلياً مما أدخلته.' +
        '</div>' +
        (notes.length ? '<div class="alert alert-warn mb"><b>ملاحظات:</b>' + errorList(notes, 6) + '</div>' : '') +
        '<div class="table-wrap"><table class="table"><thead><tr>' +
          '<th>المعرّف</th><th>الفعالية</th><th>الهدر</th><th>الكلفة</th><th>الخطورة</th>' +
        '</tr></thead><tbody>' + sheetPreviewRows(parsed.events) + '</tbody></table></div>' +
        (parsed.events.length > 25
          ? '<p class="muted mt">تُعرض أول 25 فعالية فقط — ستُستورد كلها.</p>' : '') +
        '<div class="stack mt">' +
          '<div class="alert alert-info"><b>دمج:</b> يضيف الجديد ويحدّث المتطابق بالمعرّف — لا شيء يُحذف.</div>' +
          '<div class="alert alert-warn"><b>استبدال:</b> يمسح كل بياناتك الحالية ويضع محتوى الملف مكانها.</div>' +
        '</div>',
      foot:
        '<button class="btn btn-primary" data-import-mode="merge">دمج</button>' +
        '<button class="btn btn-danger" data-import-mode="replace">استبدال كامل</button>' +
        '<button class="btn btn-ghost" data-modal-close="1">إلغاء</button>',
      importPayload: payload
    });
  }

  function showJsonImport(obj) {
    var errors = S.validateDataset(obj);
    if (errors.length) { invalidFileModal('الملف غير صالح', errors); return; }

    var incoming = obj.events.length;
    var known = S.all().map(function (e) { return e.event_id; });
    var overlap = obj.events.filter(function (e) { return known.indexOf(e.event_id) !== -1; }).length;

    openModal({
      title: 'استيراد البيانات',
      body:
        '<div class="alert alert-info">الملف يحتوي <b>' + incoming + '</b> فعالية، منها <b>' + overlap +
          '</b> معرّفات موجودة لديك حالياً (' + S.all().length + ' فعالية).</div>' +
        '<div class="stack mt">' +
          '<div class="alert alert-info"><b>دمج:</b> يضيف الجديد ويحدّث المتطابق بالمعرّف — لا شيء يُحذف.</div>' +
          '<div class="alert alert-warn"><b>استبدال:</b> يمسح كل بياناتك الحالية ويضع محتوى الملف مكانها.</div>' +
        '</div>',
      foot:
        '<button class="btn btn-primary" data-import-mode="merge">دمج</button>' +
        '<button class="btn btn-danger" data-import-mode="replace">استبدال كامل</button>' +
        '<button class="btn btn-ghost" data-modal-close="1">إلغاء</button>',
      importPayload: obj
    });
  }

  function handleImportFile(file) {
    var name = file.name || 'الملف';
    toast('جارٍ قراءة ' + name + '…');

    W.readFile(file, { existingIds: S.all().map(function (e) { return e.event_id; }) })
      .then(function (res) {
        if (res.kind === 'json') showJsonImport(res.json);
        else showSheetImport(res, name);
      })
      .catch(function (err) {
        invalidFileModal('تعذّرت قراءة «' + name + '»', [
          err && err.message ? err.message : 'خطأ غير معروف.',
          'المقبول: ورقة Excel ‎.xlsx‎ أو ‎.csv‎ أو ملف ‎.json‎ مُصدَّر من المنصة.'
        ]);
      });
  }

  /* ================================================================== *
   * العرض
   * ================================================================== */
  function render() {
    var r = currentRoute();

    Array.prototype.forEach.call(document.querySelectorAll('.nav button'), function (b) {
      var key = b.getAttribute('data-route');
      var active = key === r.name || (r.name === 'event' && key === 'events');
      b.classList.toggle('active', active);
    });

    var host = el('view');
    var html;
    switch (r.name) {
      case 'events': html = viewEvents(); break;
      case 'event': html = viewEventDetail(r.arg); break;
      case 'new': html = viewNewEvent(); break;
      case 'logic': html = viewLogic(); break;
      default: html = viewDashboard();
    }
    host.innerHTML = html;
    window.scrollTo(0, 0);

    if (r.name === 'new') mountNewForm();
  }

  function mountNewForm() {
    var form = el('new-event-form');
    if (!form) return;

    ['delivered', 'wasted', 'avg_cost_aed_per_kg'].forEach(function (n) {
      form.elements[n].addEventListener('input', function () { updateCalcPreview(form); });
    });

    el('add-incident').addEventListener('click', function () {
      newIncidents = collectIncidents(form);
      newIncidents.push({ category: 'التخطيط والتنبؤ', stage: '', description: '', direct_effect: '' });
      el('incidents-host').innerHTML = newIncidents.map(incidentRow).join('');
    });

    el('incidents-host').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-remove-incident]');
      if (!btn) return;
      newIncidents = collectIncidents(form);
      newIncidents.splice(parseInt(btn.getAttribute('data-remove-incident'), 10), 1);
      if (!newIncidents.length) {
        newIncidents = [{ category: 'التخطيط والتنبؤ', stage: '', description: '', direct_effect: '' }];
      }
      el('incidents-host').innerHTML = newIncidents.map(incidentRow).join('');
    });

    function submit(thenGenerate) {
      var res = validateNewEvent(form);
      var host = el('form-errors');
      if (res.errors) {
        host.innerHTML = '<div class="alert alert-error mb"><b>تعذّر الحفظ — صحّح ما يلي:</b><ul>' +
          res.errors.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div>';
        host.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      host.innerHTML = '';
      S.addEvent(res.event);
      newIncidents = [{ category: 'التخطيط والتنبؤ', stage: '', description: '', direct_effect: '' }];
      toast('أُضيفت الفعالية ' + res.event.event_id + ' وحُدّثت كل المؤشرات.', 'ok');
      location.hash = '#/event/' + res.event.event_id;
      if (thenGenerate) setTimeout(function () { openGenerateModal(res.event.event_id); }, 60);
    }

    form.addEventListener('submit', function (e) { e.preventDefault(); submit(false); });
    el('save-and-generate').addEventListener('click', function () { submit(true); });
  }

  /* ================================================================== *
   * الأحداث العامة (تفويض)
   * ================================================================== */
  function bindGlobalEvents() {
    document.addEventListener('click', function (e) {
      var t = e.target;

      var navBtn = t.closest('.nav button[data-route]');
      if (navBtn) { go(navBtn.getAttribute('data-route')); return; }

      var goBtn = t.closest('[data-go]');
      if (goBtn) { go(goBtn.getAttribute('data-go')); return; }

      var scrollLink = t.closest('[data-scroll]');
      if (scrollLink) {
        e.preventDefault();
        var target = el(scrollLink.getAttribute('data-scroll'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      /* ----- النوافذ ----- */
      if (t.closest('[data-modal-close]') ||
          (t.hasAttribute && t.hasAttribute('data-close-backdrop'))) { closeModal(); return; }

      var yes = t.closest('[data-confirm-yes]');
      if (yes && modalState && modalState.onConfirmYes) {
        var fn = modalState.onConfirmYes;
        closeModal();
        fn();
        return;
      }

      var importBtn = t.closest('[data-import-mode]');
      if (importBtn && modalState && modalState.importPayload) {
        var mode = importBtn.getAttribute('data-import-mode');
        var payload = modalState.importPayload;
        var res = S.importJson(payload, mode);
        closeModal();
        if (res.ok) {
          toast(mode === 'replace'
            ? 'استُبدلت البيانات — ' + res.total + ' فعالية.'
            : 'دُمجت البيانات — أُضيفت ' + res.added + ' وحُدّثت ' + res.updated + ' (الإجمالي ' + res.total + ').', 'ok');
          var here = currentRoute();
          if (here.name === 'event' && !S.byId(here.arg)) go('events');
          else render();
        } else toast('فشل الاستيراد.', 'err');
        return;
      }

      if (t.closest('[data-export-download]') && modalState && modalState.exportText) {
        triggerDownload(modalState.exportText); return;
      }
      if (t.closest('[data-export-copy]') && modalState && modalState.exportText) {
        copyExport(modalState.exportText); return;
      }
      if (t.closest('[data-template-xlsx]') && modalState && modalState.templateId) {
        emitTemplateXlsx(modalState.templateId); return;
      }
      if (t.closest('[data-template-csv]') && modalState && modalState.templateId) {
        emitTemplateCsv(modalState.templateId); return;
      }

      /* ----- شريط الأدوات ----- */
      if (t.closest('#btn-template')) { downloadTemplate(); return; }
      if (t.closest('#btn-export')) { downloadJson(); return; }
      if (t.closest('#btn-import')) { el('file-input').click(); return; }
      if (t.closest('#btn-reset')) {
        confirmDialog(
          'إعادة تعيين البيانات',
          'ستُستبدل كل البيانات الحالية (' + S.all().length + ' فعالية) بالبيانات الأصلية العشرين، ' +
          'وتُفقد كل الفعاليات المضافة والحلول المولَّدة. لا يمكن التراجع.',
          'نعم، أعد التعيين',
          function () {
            S.reset();
            toast('أُعيدت البيانات الأصلية — 20 فعالية، 4 أمثلة ذهبية.', 'ok');
            go('dashboard');   // قد تكون الشاشة الحالية فعالية لم تعد موجودة
          },
          true
        );
        return;
      }

      /* ----- الفعاليات ----- */
      var row = t.closest('[data-event]');
      if (row) { go('event/' + row.getAttribute('data-event')); return; }

      // تعريف مقياس
      var mBtn = t.closest('[data-metric]');
      if (mBtn) { e.stopPropagation(); openMetricModal(mBtn.getAttribute('data-metric')); return; }

      // نقر على رسم أو بطاقة ← انتقل للسجل مُصفّى
      var chartHit = t.closest('[data-chart-filter]');
      if (chartHit) {
        var f;
        try { f = JSON.parse(chartHit.getAttribute('data-chart-filter')); } catch (err) { f = null; }
        if (f && f.key) {
          clearFilters();
          listState[f.key] = f.value;
          listState.sortBy = 'wasted';
          listState.sortDir = 'desc';
          go('events');
        }
        return;
      }

      // إزالة مرشّح واحد
      var dropF = t.closest('[data-drop-filter]');
      if (dropF) { listState[dropF.getAttribute('data-drop-filter')] = ''; render(); return; }

      var sortTh = t.closest('th[data-sort]');
      if (sortTh) {
        var key = sortTh.getAttribute('data-sort');
        if (listState.sortBy === key) listState.sortDir = listState.sortDir === 'asc' ? 'desc' : 'asc';
        else { listState.sortBy = key; listState.sortDir = key === 'name' || key === 'id' ? 'asc' : 'desc'; }
        render();
        return;
      }

      if (t.closest('#f-clear') || t.closest('#f-clear-2')) { clearFilters(); render(); return; }

      /* ----- الحلول ----- */
      var gen = t.closest('[data-generate]');
      if (gen) { openGenerateModal(gen.getAttribute('data-generate')); return; }

      if (t.closest('[data-save-generated]') && pendingSolution) {
        saveSolution(pendingSolution.id, pendingSolution.solution, false); return;
      }
      if (t.closest('[data-save-approved]') && pendingSolution) {
        saveSolution(pendingSolution.id, pendingSolution.solution, true); return;
      }
      if (t.closest('[data-open-editor]') && pendingSolution) {
        openEditor(pendingSolution.id, pendingSolution.solution, { title: 'تعديل الحل المولَّد' });
        return;
      }

      var editBtn = t.closest('[data-edit-solution]');
      if (editBtn) {
        var eid = editBtn.getAttribute('data-edit-solution');
        var target = S.byId(eid);
        if (target && target.golden_solution) openEditor(eid, target.golden_solution);
        return;
      }

      var edSave = t.closest('[data-editor-save]');
      var edApprove = t.closest('[data-editor-save-approve]');
      if (edSave || edApprove) {
        var eId = (edSave || edApprove).getAttribute(edSave ? 'data-editor-save' : 'data-editor-save-approve');
        var out = readSolutionEditor(modalState.editorBase);
        if (out.errors.length) {
          el('editor-errors').innerHTML = '<div class="alert alert-error mb"><b>تعذّر الحفظ:</b><ul>' +
            out.errors.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
          el('editor-errors').scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        saveSolution(eId, out.solution, !!edApprove);
        return;
      }

      var appr = t.closest('[data-approve]');
      if (appr) {
        var aid = appr.getAttribute('data-approve');
        var aev = S.byId(aid);
        if (!aev || !aev.golden_solution) return;
        confirmDialog(
          'اعتماد الحل',
          'سيتحول حل <b>' + esc(aev.event_name) + '</b> إلى <b>golden_approved</b>، ' +
          'ويصبح متاحاً للمحرك كقالب للفعاليات المشابهة.',
          '★ اعتماد',
          function () {
            var s = S.byId(aid).golden_solution;
            s.status = 'golden_approved';
            S.setSolution(aid, s);
            toast('اعتُمد الحل — أصبح مثالاً ذهبياً.', 'ok');
            render();
          }
        );
        return;
      }

      var drop = t.closest('[data-drop-solution]');
      if (drop) {
        var did = drop.getAttribute('data-drop-solution');
        confirmDialog('حذف الحل', 'سيُحذف الحل الحالي وتعود الفعالية إلى حالة «بلا حل». يمكنك توليده مجدداً.',
          'حذف الحل', function () {
            S.setSolution(did, null);
            toast('حُذف الحل.', 'ok');
            render();
          }, true);
        return;
      }

      var delEv = t.closest('[data-delete-event]');
      if (delEv) {
        var evId = delEv.getAttribute('data-delete-event');
        var evObj = S.byId(evId);
        confirmDialog('حذف الفعالية',
          'ستُحذف <b>' + esc(evObj ? evObj.event_name : evId) + '</b> نهائياً من التخزين المحلي، ' +
          'وتتحدّث كل المؤشرات. صدّر نسخة أولاً إن أردت الاحتفاظ بها.',
          'حذف نهائي', function () {
            S.deleteEvent(evId);
            toast('حُذفت الفعالية ' + evId + '.', 'ok');
            go('events');
          }, true);
        return;
      }
    });

    /* المرشحات */
    document.addEventListener('input', function (e) {
      if (e.target.id === 'f-q') {
        listState.q = e.target.value;
        var pos = e.target.selectionStart;
        render();
        var again = el('f-q');
        if (again) { again.focus(); again.setSelectionRange(pos, pos); }
      }
    });

    document.addEventListener('change', function (e) {
      var map = { 'f-cat': 'category', 'f-sev': 'severity', 'f-emi': 'emirate',
                  'f-prov': 'provider', 'f-sol': 'solution', 'f-month': 'month' };
      if (map[e.target.id]) { listState[map[e.target.id]] = e.target.value; render(); return; }

      if (e.target.id === 'file-input' && e.target.files && e.target.files[0]) {
        handleImportFile(e.target.files[0]);
        e.target.value = '';
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalState) { closeModal(); return; }
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest &&
          e.target.closest('[data-chart-filter]')) {
        e.preventDefault();
        e.target.closest('[data-chart-filter]').dispatchEvent(
          new MouseEvent('click', { bubbles: true }));
      }
    });

    window.addEventListener('hashchange', render);
  }

  /* ================================================================== *
   * الإقلاع
   * ================================================================== */
  function boot() {
    var nav = el('nav');
    nav.innerHTML = ROUTES.map(function (r) {
      return '<button data-route="' + r.key + '">' + esc(r.label) + '</button>';
    }).join('');

    if (!S.HAS_STORAGE) {
      el('storage-warn').innerHTML =
        '<div class="alert alert-warn" style="margin:0 1.1rem 1rem">' +
        'التخزين المحلي غير متاح في هذا المتصفح (وضع خاص؟). سيعمل البروتوتايب بالكامل ' +
        'لكن التعديلات لن تبقى بعد تحديث الصفحة.</div>';
    }

    S.subscribe(function () {
      var badge = el('data-badge');
      if (badge) badge.textContent = S.all().length + ' فعالية';
    });

    el('data-badge').textContent = S.all().length + ' فعالية';
    initHostDownloads();
    bindGlobalEvents();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
