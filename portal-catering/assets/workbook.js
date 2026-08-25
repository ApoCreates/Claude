/* eslint-disable */
/**
 * assets/workbook.js — جسر بين ورقة Excel التي يملؤها إنسان ومخطط بيانات المنصة
 * ============================================================================
 * الفكرة: المستخدم لا يرى JSON ولا حقولاً تقنية. يرى أسئلة بالعربية في جدول،
 * يملؤها في Excel أو Numbers أو Google Sheets، ثم يرفع الملف فتقرأه المنصة
 * وتحلّله بمحركها الداخلي — بلا API وبلا خادم.
 *
 * ما تسأله الورقة هو ما لا يستطيع الحاسوب استنتاجه فقط. أما نسبة الهدر وكلفته
 * والخطورة فتُحسب هنا آلياً، فلا نطلب من المستخدم حساباً يمكن أن يخطئ فيه.
 */
(function (global) {
  'use strict';

  var X = global.Xlsx;
  var L = global.PortalLogic;

  var SHEET_EVENTS = 'الفعاليات';
  var SHEET_ISSUES = 'المشكلات الفرعية';
  var SHEET_GUIDE = 'التعليمات';

  /* ------------------------------------------------------------------ *
   * أعمدة ورقة الفعاليات — سؤال لكل عمود
   *   key      المسار داخل مخطط البيانات
   *   q        السؤال كما يقرأه المستخدم
   *   hint     مثال أو توضيح يظهر تحت الترويسة
   *   type     text | number | date
   *   required إلزامي؟
   * ------------------------------------------------------------------ */
  var EVENT_COLUMNS = [
    { key: 'event_id', q: 'معرّف الفعالية', hint: 'مثل EV-021 — فريد ولا يتكرر', type: 'text', required: true, width: 14 },
    { key: 'event_name', q: 'اسم الفعالية', hint: 'مؤتمر حكومي لتجربة المتعاملين', type: 'text', required: true, width: 30 },
    { key: 'date', q: 'تاريخ الفعالية', hint: 'بصيغة YYYY-MM-DD', type: 'date', required: true, width: 14 },
    { key: 'emirate', q: 'الإمارة', hint: 'أبوظبي / دبي / الشارقة…', type: 'text', required: true, width: 14 },
    { key: 'venue', q: 'الموقع', hint: 'مركز أدنيك للمعارض', type: 'text', required: true, width: 26 },
    { key: 'event_type', q: 'نوع الفعالية', hint: 'مؤتمر حكومي / حفل زفاف / مهرجان…', type: 'text', required: true, width: 20 },
    { key: 'catering_provider', q: 'مزود التموين', hint: 'اسم الشركة المنفذة', type: 'text', required: true, width: 20 },

    { key: 'attendance.expected', q: 'الحضور المتوقع', hint: 'عدد الأشخاص المخطط لهم', type: 'number', required: true, width: 13 },
    { key: 'attendance.actual', q: 'الحضور الفعلي', hint: 'من حضر فعلاً', type: 'number', required: true, width: 13 },
    { key: 'meals.ordered', q: 'الوجبات المطلوبة', hint: 'عدد الوجبات في أمر الشراء', type: 'number', required: true, width: 14 },
    { key: 'meals.served', q: 'الوجبات المقدَّمة', hint: 'ما قُدّم فعلاً', type: 'number', required: true, width: 14 },

    { key: 'food_kg.delivered', q: 'الطعام المورَّد (كغ)', hint: 'ما دخل الموقع', type: 'number', required: true, width: 15 },
    { key: 'food_kg.consumed', q: 'الطعام المستهلك (كغ)', hint: 'ما أُكل فعلاً', type: 'number', required: true, width: 16 },
    { key: 'food_kg.wasted', q: 'الطعام المتلف (كغ)', hint: 'ما انتهى إلى الإتلاف', type: 'number', required: true, width: 15 },
    { key: 'avg_cost_aed_per_kg', q: 'متوسط كلفة الكيلو (د.إ)', hint: 'تحسب المنصة الكلفة تلقائياً', type: 'number', required: true, width: 17 },

    { key: 'supply_chain_issue', q: 'ما الذي حدث في النقل أو التوريد؟', hint: 'اكتب «لا مشكلة» إن لم يحدث شيء', type: 'text', required: true, width: 42, benignable: true },
    { key: 'receiving_intake_issue', q: 'ما الذي حدث عند الاستلام والفحص؟', hint: 'اكتب «لا مشكلة» إن لم يحدث شيء', type: 'text', required: true, width: 42, benignable: true },
    { key: 'root_cause', q: 'ما السبب الجذري؟', hint: 'لماذا حدث ما حدث — أبعد من العَرَض', type: 'text', required: true, width: 42 },
    { key: 'impact', q: 'ما الأثر؟', hint: 'كمية، مال، وقت، سمعة', type: 'text', required: true, width: 34 },
    { key: 'narrative_ar', q: 'سرد مختصر لما جرى', hint: 'اختياري لكنه يحسّن دقة التحليل', type: 'text', required: false, width: 46 },
    { key: 'severity', q: 'درجة الخطورة', hint: 'اتركها فارغة ليحسبها النظام', type: 'text', required: false, width: 15 }
  ];

  var ISSUE_COLUMNS = [
    { key: 'event_id', q: 'معرّف الفعالية', hint: 'نفس المعرّف في ورقة الفعاليات', type: 'text', required: true, width: 14 },
    { key: 'category', q: 'الفئة (طبقة الفشل)', hint: 'واحدة من الفئات الست حرفياً', type: 'text', required: true, width: 22 },
    { key: 'stage', q: 'المرحلة', hint: 'النقل / منصة الاستلام / بعد الفعالية…', type: 'text', required: true, width: 20 },
    { key: 'description', q: 'ماذا حدث في هذه الطبقة؟', hint: 'وصف محدد', type: 'text', required: true, width: 46 },
    { key: 'direct_effect', q: 'ما الأثر المباشر؟', hint: 'النتيجة الفورية', type: 'text', required: true, width: 34 }
  ];

  /* ------------------------------------------------------------------ *
   * بناء الملف النموذجي
   * ------------------------------------------------------------------ */
  function headerRows(cols) {
    return [
      cols.map(function (c) {
        return { v: c.q + (c.required ? ' *' : ''), style: X.STYLE.header };
      }),
      cols.map(function (c) { return { v: c.hint, style: X.STYLE.note }; })
    ];
  }

  function exampleEventRow(nextId) {
    var vals = {
      'event_id': nextId,
      'event_name': 'مثال: مؤتمر بلدي لتجربة المتعاملين',
      'date': '2026-01-15',
      'emirate': 'أبوظبي',
      'venue': 'مركز المؤتمرات الرئيسي',
      'event_type': 'مؤتمر حكومي',
      'catering_provider': 'مزود التموين أ',
      'attendance.expected': 500,
      'attendance.actual': 430,
      'meals.ordered': 520,
      'meals.served': 415,
      'food_kg.delivered': 400,
      'food_kg.consumed': 300,
      'food_kg.wasted': 100,
      'avg_cost_aed_per_kg': 40,
      'supply_chain_issue': 'تأخرت الشاحنة المبردة ساعتين ولا شاحنة احتياطية في خطة المزود',
      'receiving_intake_issue': 'فحص الاستلام كشف تجاوز حرارة البروتينات ورُفضت الدفعة',
      'root_cause': 'انكسار سلسلة التبريد أثناء النقل مع غياب بديل جاهز',
      'impact': 'إتلاف 100 كغ وشراء طارئ بسعر مضاعف وتأخر الغداء 40 دقيقة',
      'narrative_ar': 'اكتب هنا قصة الفعالية كما جرت. احذف هذا الصف المثال قبل الرفع أو اتركه — المنصة تتجاهل الصفوف المعلَّمة كمثال.',
      'severity': ''
    };
    return EVENT_COLUMNS.map(function (c) {
      return { v: vals[c.key], style: X.STYLE.example };
    });
  }

  function exampleIssueRows(nextId) {
    return [
      [nextId, 'سلسلة الإمداد', 'النقل', 'تأخر الشاحنة المبردة وانكسار سلسلة التبريد', 'رفض دفعة البروتينات كاملة'],
      [nextId, 'الاستلام والإدخال', 'منصة الاستلام', 'كشف الفحص التجاوز الحراري ولا بديل مؤهل', 'شراء طارئ وتأخر الخدمة']
    ].map(function (r) {
      return r.map(function (v) { return { v: v, style: X.STYLE.example }; });
    });
  }

  function guideRows() {
    var rows = [
      [{ v: 'كيف تملأ هذا الملف', style: X.STYLE.title }],
      [],
      [{ v: '1) املأ ورقة «' + SHEET_EVENTS + '»: صف واحد لكل فعالية. الأعمدة المعلَّمة بنجمة * إلزامية.' }],
      [{ v: '2) املأ ورقة «' + SHEET_ISSUES + '»: صف واحد لكل طبقة فشل في الفعالية، واربطه بمعرّف الفعالية نفسه.' }],
      [{ v: '3) الصفوف الملوّنة أمثلة — عدّلها أو احذفها. المنصة تتجاهل أي صف يبدأ اسمه بـ «مثال:».' }],
      [{ v: '4) لا تحسب نسبة الهدر ولا كلفته ولا الخطورة — المنصة تحسبها كلها تلقائياً من الأرقام التي أدخلتها.' }],
      [{ v: '5) في عمودَي النقل والاستلام اكتب «لا مشكلة» إن لم يحدث شيء — لا تتركهما فارغين.' }],
      [{ v: '6) احفظ الملف ثم ارفعه من زر «استيراد» في المنصة. يقبل .xlsx و .csv و .json.' }],
      [],
      [{ v: 'قواعد لا بد أن تتحقق', style: X.STYLE.title }],
      [{ v: '• المتلف + المستهلك لا يتجاوزان المورَّد.' }],
      [{ v: '• الوجبات المقدَّمة لا تتجاوز المطلوبة.' }],
      [{ v: '• معرّف الفعالية فريد بصيغة EV-XXX ولا يكرر معرّفاً موجوداً في المنصة.' }],
      [{ v: '• التاريخ بصيغة YYYY-MM-DD (مثال 2026-01-15).' }],
      [],
      [{ v: 'الفئات الست — انسخ القيمة حرفياً في عمود «الفئة»', style: X.STYLE.title }]
    ];

    L.CATEGORIES.forEach(function (c) {
      rows.push([{ v: c.name, style: X.STYLE.example }, { v: c.definition, style: X.STYLE.note }]);
    });

    rows.push([]);
    rows.push([{ v: 'كيف تُحسب الخطورة (إن تركتها فارغة)', style: X.STYLE.title }]);
    rows.push([{ v: 'أعلى درجة من ثلاثة محاور — لا متوسطها: مالي (كلفة الهدر)، سلامة غذائية، سمعة/تعاقد.' }]);
    rows.push([{ v: 'حادثة بكلفة صغيرة لكن فيها طعام خطر وصل للضيوف تبقى حرجة.' }]);
    rows.push([]);
    rows.push([{ v: 'ماذا يحدث بعد الرفع', style: X.STYLE.title }]);
    rows.push([{ v: 'تصنّف المنصة كل فعالية في إحدى الطبقات الست، وتحدد نمط الفشل، وتحسب الخطورة،' }]);
    rows.push([{ v: 'ثم تولّد حلاً مقترحاً (تشخيص + توصيات بأولوية ومالك وإطار زمني + أتمتة + مؤشرات قياس).' }]);
    rows.push([{ v: 'كل ذلك يجري داخل متصفحك — بلا إنترنت وبلا إرسال بياناتك إلى أي جهة.' }]);

    return rows;
  }

  /** يبني المصنّف النموذجي كاملاً (Uint8Array جاهز للحفظ) */
  function buildTemplate(nextId) {
    var eventRows = headerRows(EVENT_COLUMNS).concat([exampleEventRow(nextId)]);
    var issueRows = headerRows(ISSUE_COLUMNS).concat(exampleIssueRows(nextId));

    return X.write([
      { name: SHEET_EVENTS, rows: eventRows, widths: EVENT_COLUMNS.map(function (c) { return c.width; }), freeze: 2 },
      { name: SHEET_ISSUES, rows: issueRows, widths: ISSUE_COLUMNS.map(function (c) { return c.width; }), freeze: 2 },
      { name: SHEET_GUIDE, rows: guideRows(), widths: [64, 52] }
    ]);
  }

  /** نسخة CSV لورقة الفعاليات وحدها — لمن يفضّل أبسط صيغة */
  function buildCsvTemplate(nextId) {
    return X.toCsv(headerRows(EVENT_COLUMNS).concat([exampleEventRow(nextId)]));
  }

  /* ------------------------------------------------------------------ *
   * القراءة: صفوف الورقة → فعاليات بمخطط المنصة
   * ------------------------------------------------------------------ */
  function setPath(obj, path, value) {
    var parts = path.split('.'), cur = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }

  function normalizeHeader(s) {
    return String(s || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  }

  /** يطابق ترويسات الورقة مع الأعمدة المعرّفة، ويعيد خريطة فهرس→عمود */
  function mapHeaders(headerRow, cols) {
    var map = {};
    headerRow.forEach(function (cell, i) {
      var h = normalizeHeader(cell);
      if (!h) return;
      var col = cols.filter(function (c) { return normalizeHeader(c.q) === h; })[0];
      if (col) map[i] = col;
    });
    return map;
  }

  function toNumber(v) {
    if (v === '' || v === null || v === undefined) return null;
    var n = Number(String(v).replace(/[,\s]/g, '').replace(/[٠-٩]/g, function (d) {
      return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d));
    }));
    return isFinite(n) ? n : null;
  }

  /** تاريخ Excel التسلسلي أو نص YYYY-MM-DD */
  function toDate(v) {
    var s = String(v || '').trim();
    if (!s) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    var serial = Number(s);
    if (isFinite(serial) && serial > 20000 && serial < 80000) {
      var ms = (serial - 25569) * 86400000;      // 25569 = 1970-01-01 في تقويم Excel
      return new Date(ms).toISOString().slice(0, 10);
    }
    var m = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(s);   // DD/MM/YYYY
    if (m) return m[3] + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[1]).padStart(2, '0');
    return s;
  }

  /**
   * إجابة «لا مشكلة» يجب ألا تحمل أي إشارة تصنيف.
   * «الاستلام سليم» مثلاً تحتوي كلمة «استلام» وهي مفتاح فئة — فتشدّ التصنيف
   * نحو طبقة لم يحدث فيها شيء. نطبّعها إلى عبارة محايدة قبل أن يراها المحرك.
   */
  var BENIGN_RE = /^(?:[^\S\n]|[\u0600-\u06FF\s])*?(?:لا\s*(?:يوجد|توجد|مشكلة|شيء|شيئ)|بلا\s*مشكلة|سليم(?:ة|ه)?|طبيعي(?:ة|ه)?|جيد(?:ة|ه)?|بخير|مطابق(?:ة|ه)?)\s*[.؟!]?$/;
  var BENIGN_TEXT = 'لا مشكلة مسجّلة في هذه الطبقة';

  function normalizeBenign(val) {
    var s = String(val || '').trim();
    if (!s) return s;
    if (s === '-' || s === '—' || s === 'N/A' || s === 'na') return BENIGN_TEXT;
    if (s.length <= 40 && BENIGN_RE.test(s)) return BENIGN_TEXT;
    return s;
  }

  function isExampleRow(ev) {
    return /^مثال\s*:/.test(String(ev.event_name || '').trim());
  }

  /**
   * يحوّل أوراق المصنّف إلى فعاليات جاهزة للاستيراد.
   * يعيد { events, errors, skipped }
   */
  function parseSheets(sheets, opts) {
    opts = opts || {};
    var errors = [];
    var names = Object.keys(sheets);

    // اقبل الورقة الأولى إن لم تُسمَّ كما في النموذج (المستخدمون يعيدون التسمية)
    var evRows = sheets[SHEET_EVENTS] || sheets[names[0]] || [];
    var isRows = sheets[SHEET_ISSUES] || [];

    if (!evRows.length) {
      return { events: [], errors: ['الملف لا يحتوي على أي صفوف في ورقة «' + SHEET_EVENTS + '».'], skipped: 0 };
    }

    var evMap = mapHeaders(evRows[0], EVENT_COLUMNS);
    if (!Object.keys(evMap).length) {
      return {
        events: [],
        errors: ['تعذّر التعرّف على ترويسات الأعمدة في ورقة «' + SHEET_EVENTS + '». ' +
                 'استخدم الملف النموذجي دون تغيير أسماء الأعمدة في الصف الأول.'],
        skipped: 0
      };
    }

    // اجمع المشكلات الفرعية حسب معرّف الفعالية
    var issuesById = {};
    if (isRows.length) {
      var isMap = mapHeaders(isRows[0], ISSUE_COLUMNS);
      for (var r = 1; r < isRows.length; r++) {
        var rec = {};
        var any = false;
        isRows[r].forEach(function (cell, i) {
          var col = isMap[i];
          if (!col) return;
          var val = String(cell || '').trim();
          if (val) any = true;
          rec[col.key] = val;
        });
        if (!any || !rec.event_id) continue;
        if (!issuesById[rec.event_id]) issuesById[rec.event_id] = [];
        issuesById[rec.event_id].push({
          category: rec.category || '',
          stage: rec.stage || '',
          description: rec.description || '',
          direct_effect: rec.direct_effect || ''
        });
      }
    }

    var events = [], skipped = 0, seen = {};

    for (var i = 2; i < evRows.length; i++) {
      var row = evRows[i];
      if (!row || !row.length) continue;

      var raw = {};
      var hasAny = false;
      row.forEach(function (cell, ci) {
        var col = evMap[ci];
        if (!col) return;
        var val = String(cell === null || cell === undefined ? '' : cell).trim();
        if (val) hasAny = true;
        raw[col.key] = val;
      });
      if (!hasAny) continue;

      var ev = { event_id: '', event_name: '' };
      var where = 'الصف ' + (i + 1);
      var rowErrors = [];

      EVENT_COLUMNS.forEach(function (col) {
        var val = raw[col.key];
        if (col.type === 'number') {
          var n = toNumber(val);
          if (n === null) {
            if (col.required) rowErrors.push(where + ': «' + col.q + '» مطلوب ويجب أن يكون رقماً.');
            setPath(ev, col.key, 0);
          } else if (n < 0) {
            rowErrors.push(where + ': «' + col.q + '» لا يمكن أن يكون سالباً.');
            setPath(ev, col.key, 0);
          } else setPath(ev, col.key, n);
        } else if (col.type === 'date') {
          var d = toDate(val);
          if (!d && col.required) rowErrors.push(where + ': «' + col.q + '» مطلوب.');
          setPath(ev, col.key, d);
        } else {
          if (!val && col.required) rowErrors.push(where + ': «' + col.q + '» مطلوب.');
          setPath(ev, col.key, col.benignable ? normalizeBenign(val) : val);
        }
      });

      if (isExampleRow(ev)) { skipped++; continue; }

      // تحقق المعرّف
      if (ev.event_id && !/^EV-\d{3,}$/.test(ev.event_id)) {
        rowErrors.push(where + ': المعرّف «' + ev.event_id + '» يجب أن يكون بصيغة EV-XXX.');
      }
      if (ev.event_id && seen[ev.event_id]) {
        rowErrors.push(where + ': المعرّف «' + ev.event_id + '» مكرر داخل الملف.');
      }
      seen[ev.event_id] = true;
      if (ev.event_id && opts.existingIds && opts.existingIds.indexOf(ev.event_id) !== -1) {
        rowErrors.push(where + ': المعرّف «' + ev.event_id + '» موجود لديك بالفعل — سيُحدَّث عند الدمج.');
      }

      var fk = ev.food_kg || {};
      if (fk.wasted > fk.delivered) {
        rowErrors.push(where + ': المتلف (' + fk.wasted + ') أكبر من المورَّد (' + fk.delivered + ').');
      }
      if (fk.consumed + fk.wasted > fk.delivered + 0.001) {
        rowErrors.push(where + ': مجموع المستهلك والمتلف يتجاوز المورَّد.');
      }
      if ((ev.meals || {}).served > (ev.meals || {}).ordered) {
        rowErrors.push(where + ': الوجبات المقدَّمة تتجاوز المطلوبة.');
      }

      // الحقول المشتقة — تُحسب ولا تُطلب من المستخدم
      var delivered = fk.delivered || 0;
      ev.food_kg.waste_pct = delivered ? Math.round((fk.wasted / delivered) * 1000) / 10 : 0;
      ev.waste_cost_aed = Math.round((fk.wasted || 0) * (ev.avg_cost_aed_per_kg || 0));

      var att = ev.attendance || {};
      att.variance_pct = att.expected
        ? Math.round(((att.actual - att.expected) / att.expected) * 1000) / 10 : 0;

      ev.incidents = issuesById[ev.event_id] || [];
      if (!ev.incidents.length) {
        // بلا مشكلات فرعية مصرّحة، يصنّف المحرك من النصوص وحدها
        ev.incidents = [];
      } else {
        ev.incidents.forEach(function (inc) {
          if (inc.category && !L.CATEGORY_BY_NAME[inc.category]) {
            rowErrors.push('المشكلات الفرعية لـ ' + ev.event_id + ': الفئة «' + inc.category +
                           '» ليست من الفئات الست. راجع ورقة التعليمات.');
          }
        });
      }

      ev.portal_recommendation_required = true;
      ev.golden_solution = null;
      if (!ev.narrative_ar) ev.narrative_ar = ev.impact || ev.root_cause || '';

      // الخطورة: احسبها إن تركها المستخدم فارغة
      if (!ev.severity || L.SEVERITY_LEVELS.indexOf(ev.severity) === -1) {
        if (ev.severity) {
          rowErrors.push(where + ': «' + ev.severity + '» ليست درجة خطورة معروفة — حُسبت آلياً بدلاً منها.');
        }
        ev.severity = global.RuleEngine.assessSeverity(ev).level;
      }

      errors = errors.concat(rowErrors);
      events.push(ev);
    }

    return { events: events, errors: errors, skipped: skipped };
  }

  /** يقرأ ملفاً مرفوعاً بأي صيغة مدعومة ويعيد نتيجة موحّدة */
  async function readFile(file, opts) {
    var name = (file.name || '').toLowerCase();

    if (name.endsWith('.json')) {
      var text = await file.text();
      return { kind: 'json', json: JSON.parse(text) };
    }

    if (name.endsWith('.csv')) {
      var csv = await file.text();
      var rows = X.fromCsv(csv);
      var obj = {};
      obj[SHEET_EVENTS] = rows;
      return Object.assign({ kind: 'sheet' }, parseSheets(obj, opts));
    }

    if (name.endsWith('.xlsx')) {
      var buf = new Uint8Array(await file.arrayBuffer());
      var sheets = await X.read(buf);
      return Object.assign({ kind: 'sheet' }, parseSheets(sheets, opts));
    }

    throw new Error('صيغة غير مدعومة. المقبول: ‎.xlsx‎ أو ‎.csv‎ أو ‎.json');
  }

  global.Workbook = {
    SHEET_EVENTS: SHEET_EVENTS,
    SHEET_ISSUES: SHEET_ISSUES,
    SHEET_GUIDE: SHEET_GUIDE,
    EVENT_COLUMNS: EVENT_COLUMNS,
    ISSUE_COLUMNS: ISSUE_COLUMNS,
    buildTemplate: buildTemplate,
    buildCsvTemplate: buildCsvTemplate,
    parseSheets: parseSheets,
    readFile: readFile
  };
})(typeof window !== 'undefined' ? window : globalThis);
