/* eslint-disable */
/**
 * assets/rule-engine.js — المحرك الحتمي (القسم 8 من portal_logic.md)
 * ===================================================================
 * لا نموذج لغوي، لا API، لا عشوائية: نفس المدخل ⇒ نفس المخرَج دائماً.
 *
 * التسلسل:
 *   1) classify()      ← الكلمات المفتاحية (القسم 2)              ⇒ فئة رئيسية + ثانوية
 *   2) detectPattern() ← المؤشرات النصية (القسم 4)                ⇒ نمط الفشل
 *   3) assessSeverity()← مصفوفة المحاور الثلاثة (القسم 3)         ⇒ الأعلى لا المتوسط
 *   4) pickTemplates() ← أقرب مثال ذهبي (نفس الفئة ثم نفس النمط)  ⇒ قالب (+ قالب مزج)
 *   5) generate()      ← تخصيص القالب بحقائق الفعالية             ⇒ golden_solution
 *
 * المخرَج يلتزم حرفياً بمخطط golden_solution (القسم 5) — بلا حقول إضافية.
 * أثر التنفيذ (لماذا اختار المحرك ما اختار) يُحسب حياً عبر explain() ولا يُحفظ داخل الحل.
 */
(function (global) {
  'use strict';

  var L = global.PortalLogic;

  /* ================================================================== *
   * أدوات مساعدة
   * ================================================================== */

  function num(v) {
    if (v === null || v === undefined || isNaN(v)) return '—';
    return Number(v).toLocaleString('en-US');
  }

  function round(v, d) {
    var f = Math.pow(10, d || 0);
    return Math.round(Number(v) * f) / f;
  }

  /** كل النصوص الحرة للفعالية مع أوزانها (القسم 8/1: التركيز على حقلي المشكلة) */
  function textFields(ev) {
    var out = [
      { w: 3, t: ev.supply_chain_issue || '' },
      { w: 3, t: ev.receiving_intake_issue || '' },
      { w: 2, t: ev.root_cause || '' },
      { w: 1, t: ev.narrative_ar || '' },
      { w: 1, t: ev.impact || '' }
    ];
    (ev.incidents || []).forEach(function (inc) {
      out.push({ w: 1, t: (inc.description || '') + ' ' + (inc.direct_effect || '') + ' ' + (inc.stage || '') });
    });
    return out;
  }

  function allText(ev) {
    return textFields(ev).map(function (f) { return f.t; }).join(' ');
  }

  function countOccurrences(haystack, needle) {
    if (!needle) return 0;
    var c = 0, i = 0;
    while ((i = haystack.indexOf(needle, i)) !== -1) { c++; i += needle.length; }
    return c;
  }

  /* ================================================================== *
   * 1) التصنيف — الفئات الست بالكلمات المفتاحية
   * ================================================================== */
  function classify(ev) {
    var fields = textFields(ev);
    var scores = {}, hits = {};

    L.CATEGORIES.forEach(function (cat) {
      scores[cat.key] = 0;
      hits[cat.key] = [];
      var terms = cat.core.concat(cat.extra);
      fields.forEach(function (f) {
        terms.forEach(function (term) {
          var n = countOccurrences(f.t, term);
          if (n > 0) {
            // الكلمات الأساسية من portal_logic.md لها وزن مضاعف
            var isCore = cat.core.indexOf(term) !== -1;
            scores[cat.key] += n * f.w * (isCore ? 2 : 1);
            if (hits[cat.key].indexOf(term) === -1) hits[cat.key].push(term);
          }
        });
      });
    });

    // إشارة مباشرة: فئات المشكلات الفرعية المصرّح بها في السجل
    (ev.incidents || []).forEach(function (inc, idx) {
      var cat = L.CATEGORY_BY_NAME[inc.category];
      if (cat) scores[cat.key] += idx === 0 ? 8 : 5;
    });

    var ranked = L.CATEGORIES.map(function (c) {
      return { key: c.key, name: c.name, color: c.color, score: scores[c.key], keywords: hits[c.key] };
    }).sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.key.localeCompare(b.key); // فاصل حتمي عند التعادل
    });

    var primary = ranked[0];
    var secondary = ranked.slice(1).filter(function (r) { return r.score >= 5; });

    return { primary: primary, secondary: secondary, ranked: ranked };
  }

  /* ================================================================== *
   * 2) نمط الفشل — المؤشرات النصية
   * ================================================================== */
  function detectPattern(ev, cls) {
    var fields = textFields(ev);
    var scores = {}, evidence = {};

    L.FAILURE_PATTERNS.forEach(function (p) {
      scores[p.key] = 0;
      evidence[p.key] = [];
      fields.forEach(function (f) {
        p.indicators.forEach(function (ind) {
          var n = countOccurrences(f.t, ind.t);
          if (n > 0) {
            scores[p.key] += n * f.w * (ind.w || 1);
            if (evidence[p.key].indexOf(ind.t) === -1) evidence[p.key].push(ind.t);
          }
        });
      });
    });

    var ranked = L.FAILURE_PATTERNS.map(function (p) {
      return { key: p.key, name: p.name, definition: p.definition, score: scores[p.key], evidence: evidence[p.key] };
    }).sort(function (a, b) { return b.score - a.score || a.key.localeCompare(b.key); });

    var best = ranked[0];
    var fallbackUsed = false;

    // عند غياب أي مؤشر أو تعادل تام: النمط الافتراضي للفئة (fallback حتمي)
    if (best.score === 0 || (ranked[1] && ranked[1].score === best.score)) {
      var defKey = L.CATEGORY_DEFAULT_PATTERN[cls.primary.key];
      var def = ranked.filter(function (r) { return r.key === defKey; })[0];
      if (def && def.key !== best.key) { best = def; fallbackUsed = true; }
      else if (best.score === 0) fallbackUsed = true;
    }

    return {
      key: best.key, name: best.name, definition: best.definition,
      score: best.score, evidence: best.evidence, fallbackUsed: fallbackUsed, ranked: ranked
    };
  }

  /* ================================================================== *
   * 3) الخطورة — أعلى المحاور الثلاثة، لا متوسطها
   * ================================================================== */
  function axisFromSignals(text, signals, fallbackLabel) {
    for (var i = 0; i < signals.length; i++) {
      var s = signals[i];
      for (var j = 0; j < s.terms.length; j++) {
        if (text.indexOf(s.terms[j]) !== -1) {
          return { level: s.level, label: s.label, evidence: s.terms[j] };
        }
      }
    }
    return { level: 'منخفضة', label: fallbackLabel, evidence: null };
  }

  function assessSeverity(ev) {
    var text = allText(ev);
    var cost = Number((ev && ev.waste_cost_aed) || 0);

    var finLevel = 'حرجة';
    for (var i = 0; i < L.FINANCIAL_THRESHOLDS.length; i++) {
      if (cost < L.FINANCIAL_THRESHOLDS[i].max) { finLevel = L.FINANCIAL_THRESHOLDS[i].level; break; }
    }

    var axes = {
      financial: {
        name: 'مالي (كلفة الهدر)', level: finLevel,
        label: num(cost) + ' د.إ', evidence: 'كلفة الهدر المسجلة'
      },
      safety: (function () {
        var a = axisFromSignals(text, L.SAFETY_SIGNALS, 'لا خطر');
        a.name = 'سلامة غذائية';
        return a;
      })(),
      reputation: (function () {
        var a = axisFromSignals(text, L.REPUTATION_SIGNALS, 'داخلي فقط');
        a.name = 'سمعة/تعاقد';
        return a;
      })()
    };

    var order = ['financial', 'safety', 'reputation'];
    var top = order[0];
    order.forEach(function (k) {
      if (L.SEVERITY_RANK[axes[k].level] > L.SEVERITY_RANK[axes[top].level]) top = k;
    });

    return { level: axes[top].level, drivingAxis: top, drivingAxisName: axes[top].name, axes: axes };
  }

  /* ================================================================== *
   * 4) اختيار القالب — أقرب مثال ذهبي (نفس الفئة أولاً، ثم نفس النمط)
   * ================================================================== */
  function pickTemplates(ev, cls, pattern, goldenEvents) {
    var scored = goldenEvents.map(function (g) {
      var profile = L.GOLDEN_PROFILE[g.event_id] || {};
      var score = 0, reasons = [];

      if (profile.category === cls.primary.key) { score += 10; reasons.push('نفس الفئة الرئيسية (' + cls.primary.name + ')'); }
      if (profile.pattern === pattern.key) { score += 6; reasons.push('نفس نمط الفشل (' + pattern.name + ')'); }

      var mod = L.MODULE_FOR_CATEGORY[cls.primary.key];
      if (profile.module === mod) { score += 3; reasons.push('نفس وحدة المنصة (' + mod + ')'); }

      cls.secondary.forEach(function (s) {
        if (profile.category === s.key) { score += 2; reasons.push('يغطي الفئة الثانوية (' + s.name + ')'); }
      });

      return { id: g.event_id, name: g.event_name, event: g, score: score, reasons: reasons, profile: profile };
    }).sort(function (a, b) { return b.score - a.score || a.id.localeCompare(b.id); });

    var primary = scored[0];

    /* قالب مزج: مثال ذهبي يغطي طبقة ثانية مصرَّحاً بها في مشكلات الفعالية الفرعية
       (incidents) ولا يغطيها القالب الأساسي — هذا ما يجعل حل EV-002 يمزج EV-010 وEV-020. */
    var declared = (ev.incidents || []).map(function (inc) {
      var c = L.CATEGORY_BY_NAME[inc.category];
      return c ? c.key : null;
    }).filter(Boolean);

    if (!declared.length) {
      declared = cls.secondary.filter(function (s) { return s.score >= 8; })
                              .map(function (s) { return s.key; });
    }

    var blend = null;
    for (var i = 1; i < scored.length; i++) {
      var c = scored[i];
      if (c.profile.category &&
          c.profile.category !== cls.primary.key &&
          c.profile.category !== primary.profile.category &&
          declared.indexOf(c.profile.category) !== -1) { blend = c; break; }
    }

    return { primary: primary, blend: blend, ranked: scored };
  }

  /* ================================================================== *
   * حقائق الفعالية — تُحقن في كل نص مولَّد (منع النسخ الحرفي للقالب)
   * ================================================================== */
  function facts(ev) {
    var fk = ev.food_kg || {};
    var att = ev.attendance || {};
    var meals = ev.meals || {};
    var perKg = Number(ev.avg_cost_aed_per_kg) || 0;
    var delivered = Number(fk.delivered) || 0;
    var wasted = Number(fk.wasted) || 0;
    var target = Math.round(delivered * (L.WASTE_TARGET_PCT / 100));
    var recoverable = Math.max(0, wasted - target);

    return {
      id: ev.event_id,
      name: ev.event_name,
      nameQ: '«' + ev.event_name + '»',
      date: ev.date,
      emirate: ev.emirate,
      venue: ev.venue,
      type: ev.event_type,
      nameType: '«' + ev.event_type + '»',
      provider: ev.catering_provider,
      delivered: delivered,
      deliveredT: num(delivered),
      consumed: Number(fk.consumed) || 0,
      wasted: wasted,
      wastedT: num(wasted),
      wastePct: Number(fk.waste_pct) || (delivered ? round((wasted / delivered) * 100, 1) : 0),
      cost: Number(ev.waste_cost_aed) || 0,
      costT: num(ev.waste_cost_aed),
      perKg: perKg,
      expected: Number(att.expected) || 0,
      expectedT: num(att.expected),
      actual: Number(att.actual) || 0,
      actualT: num(att.actual),
      variancePct: Number(att.variance_pct) || 0,
      ordered: Number(meals.ordered) || 0,
      served: Number(meals.served) || 0,
      targetKg: target,
      targetKgT: num(target),
      recoverableKg: recoverable,
      recoverableKgT: num(recoverable),
      recoverableAed: num(Math.round(recoverable * perKg)),
      wastePerGuest: att.actual ? Math.round((wasted * 1000) / att.actual) : null
    };
  }

  /* ================================================================== *
   * تشخيص مميِّز: ما نجح (يُثبَّت) مقابل ما فشل (يُصلَح)
   * ================================================================== */
  var WORKED_SIGNALS = [
    { re: /فحص الاستلام (سجّل|كشف)|رفض مشرف|رُفضت دفعة|رُفضت جزئياً/, text: 'فحص الاستلام واعتراضه على الدفعة المخالفة' },
    { re: /الاستلام سليم/, text: 'إجراء الاستلام والتوثيق عند المنصة' },
    { re: /لا مشكلات نقل|نقل سليم|النقل الأفقي سليم|سلسلة الإمداد سليمة/, text: 'النقل وسلسلة الإمداد حتى باب الموقع' },
    { re: /سليمة تشغيلياً/, text: 'التشغيل الميداني وخدمة الضيوف' }
  ];

  function whatWorked(ev) {
    var t = allText(ev);
    for (var i = 0; i < WORKED_SIGNALS.length; i++) {
      if (WORKED_SIGNALS[i].re.test(t)) return WORKED_SIGNALS[i].text;
    }
    return 'باقي طبقات دورة حياة الطعام لم تُسجَّل بها مخالفة في هذه الفعالية';
  }

  function trimSentence(s, max) {
    if (!s) return '';
    s = String(s).trim().replace(/\s+/g, ' ');
    if (s.length <= max) return s;
    return s.slice(0, max).replace(/[،؛,\s]\S*$/, '') + '…';
  }

  /* صياغة نمط الفشل بوقائع الحادثة بدل تعريفه العام (منع النسخ الحرفي) */
  var PATTERN_PHRASE = {
    spof: function (f, target) {
      return 'نمط الفشل نقطة فشل واحدة: ' + target + ' بلا بديل جاهز، فتحوّل عطل واحد إلى خسارة كاملة';
    },
    early_decision: function (f) {
      return 'نمط الفشل قرار مبكر غير قابل للتصحيح: دخلت الكمية (' + f.deliveredT +
             ' كغ) الإنتاج قبل معرفة الواقع، ولم تبقَ نقطة قطع تسمح بالتراجع';
    },
    data_blind: function () {
      return 'نمط الفشل منطقة عمى بيانات: المعلومة كانت موجودة لكنها لم تصل لمن يملك القرار في وقتها';
    },
    no_default_path: function (f) {
      return 'نمط الفشل غياب المسار الافتراضي: لا خطة جاهزة لسيناريو متوقع في فعاليات ' + f.type +
             '، فحلّ الارتجال محل الإجراء';
    }
  };

  function buildDiagnosis(ctx) {
    var f = ctx.f, ev = ctx.ev;
    var s1 = 'الطبقة الفاشلة هي «' + ctx.cls.primary.name + '» في ' + f.nameQ +
             ' (' + f.venue + ' — ' + f.emirate + '): ' + trimSentence(ev.root_cause, 150) + '.';
    var s2 = 'ما نجح: ' + ctx.worked + ' — يُثبَّت كما هو ولا يُمس. ما فشل: ' +
             trimSentence(ctx.failedShort, 120) + ' — وهو هدف الإصلاح.';
    var s3 = PATTERN_PHRASE[ctx.pattern.key](f, ctx.spofTarget) + '؛ والأثر المقيس ' +
             f.wastedT + ' كغ متلفة من ' + f.deliveredT + ' كغ مورّدة (' + f.wastePct + '%) بكلفة ' +
             f.costT + ' د.إ.';
    return s1 + ' ' + s2 + ' ' + s3;
  }

  /* ================================================================== *
   * قواعد الموضوع — تنتج توصية وأتمتة شديدة التخصيص حسب وقائع النص
   * (تُفحص بالترتيب؛ أول تطابق يملأ خانة الأولوية 1)
   * ================================================================== */
  var TOPIC_RULES = [
    {
      key: 'dock',
      theme: 'dock_slots',
      cats: ['supply', 'intake'],
      re: /منصة الاستلام الوحيدة|تجمّع تسليم|فتحات زمنية|Dock|ازدحام منصة|جدولة زمنية للمنصات/,
      rec: function (f) {
        return {
          type: 'تشغيلي',
          action_ar: 'نظام حجز فتحات تسليم (Dock Slots) إلزامي في ' + f.venue + ': فتحة 20 دقيقة لكل شاحنة، ' +
                     'وحد أقصى شاحنتان في النافذة الواحدة، مع منع أي تسليم غير محجوز في ساعة الذروة',
          owner_ar: 'مدير اللوجستيات + إدارة الموقع',
          timeline_ar: 'قبل الفعالية القادمة من نفس النمط (' + f.type + ')',
          expected_impact_ar: 'إنهاء انتظار الشاحنات في الشمس وإنقاذ ما يقارب ' + f.recoverableKgT +
                              ' كغ من أصل ' + f.wastedT + ' كغ متلفة'
        };
      },
      automation: function (f) {
        return {
          name_ar: 'موزّع فتحات التسليم',
          trigger_ar: 'إنشاء أمر تسليم لفعالية في المنصة',
          condition_ar: 'أكثر من شاحنتين في نافذة 30 دقيقة على منصة واحدة',
          action_ar: 'إعادة توزيع تلقائية للفتحات وإشعار السائقين بالموعد الجديد قبل التحرك',
          portal_module: 'مراقبة سلسلة التبريد'
        };
      }
    },
    {
      key: 'customs',
      theme: 'redundancy',
      cats: ['supply'],
      re: /جمارك|التخليص|مستوردة|الاستيراد|شهادة/,
      rec: function (f) {
        return {
          type: 'وقائي',
          action_ar: 'لكل صنف مستورد في قوائم ' + f.provider + ': مخزون أمان محلي يغطي 100% من الكمية ' +
                     'المطلوبة (' + f.deliveredT + ' كغ في هذه الفعالية) + مورد محلي بديل مؤهل مسبقاً، ' +
                     'مع إقفال ملف الشهادات قبل 10 أيام من الشحن',
          owner_ar: 'المشتريات + إدارة الجودة',
          timeline_ar: '30 يوماً',
          expected_impact_ar: 'إنهاء الاعتماد على مصدر استيراد وحيد ومنع تكرار القبول المتعجل لجودة أدنى'
        };
      },
      automation: function () {
        return {
          name_ar: 'مراقب التخليص الجمركي',
          trigger_ar: 'تحديث حالة الشحنة المستوردة',
          condition_ar: 'بقاء الشحنة في التخليص > 48 ساعة أو نقص مستند',
          action_ar: 'تصعيد فوري للمشتريات + تفعيل أمر شراء احتياطي من المورد المحلي المؤهل',
          portal_module: 'الاستلام الرقمي'
        };
      }
    },
    {
      key: 'security',
      theme: 'access_coordination',
      cats: ['supply', 'compliance'],
      re: /التفتيش الأمني|البوابة|دبلوماسي|بروتوكولات الدخول|الدخول الأمني/,
      rec: function (f) {
        return {
          type: 'تشغيلي',
          action_ar: 'تصريح دخول مسبق ونافذة تفتيش مخصصة مع أمن ' + f.venue + ': تسليم قوائم المركبات ' +
                     'والأفراد قبل 72 ساعة، وتفتيش الشاحنة المبردة بأولوية دون إطفاء وحدة التبريد',
          owner_ar: 'مدير الفعالية + مسؤول التنسيق الأمني',
          timeline_ar: 'قبل 72 ساعة من كل فعالية في موقع حساس',
          expected_impact_ar: 'تقليص زمن الانتظار على البوابة من 2.5 ساعة إلى أقل من 30 دقيقة وإبقاء ' +
                              'الطعام داخل نطاق الحرارة الآمن'
        };
      },
      automation: function () {
        return {
          name_ar: 'عدّاد الانتظار على البوابة',
          trigger_ar: 'تسجيل وصول الشاحنة إلى نقطة التفتيش',
          condition_ar: 'انتظار > 30 دقيقة والحمولة ساخنة أو مبردة',
          action_ar: 'تنبيه غرفة العمليات + إشعار المطبخ بإعادة جدولة الخدمة ومنع إعادة التسخين غير الموثقة',
          portal_module: 'مراقبة سلسلة التبريد'
        };
      }
    },
    {
      key: 'elevator',
      theme: 'site_survey',
      cats: ['supply'],
      re: /مصعد|النقل الرأسي|مصاعد الضيوف/,
      rec: function (f) {
        return {
          type: 'وقائي',
          action_ar: 'مسح لوجستي مسبق (Site Survey) إلزامي لـ ' + f.venue + ' يشمل عدد مصاعد الخدمة ' +
                     'وحمولتها وحالة صيانتها، مع خطة نقل رأسي بديلة موثقة قبل توقيع أمر الخدمة',
          owner_ar: 'التخطيط اللوجستي + إدارة المبنى',
          timeline_ar: 'قبل 14 يوماً من كل فعالية داخل مبنى متعدد الطوابق',
          expected_impact_ar: 'إزالة نقطة الفشل الواحدة في النقل الرأسي التي أتلفت ' + f.wastedT + ' كغ هنا'
        };
      },
      automation: function () {
        return {
          name_ar: 'تنبيه تعطل النقل الرأسي',
          trigger_ar: 'تسجيل تعطل مصعد خدمة أثناء نافذة الخدمة',
          condition_ar: 'لا مصعد خدمة بديل متاح خلال 15 دقيقة',
          action_ar: 'تفعيل خطة النقل البديلة + تجميد إخراج الدفعات الساخنة من المطبخ حتى تأكيد المسار',
          portal_module: 'مراقبة سلسلة التبريد'
        };
      }
    },
    {
      key: 'power',
      theme: 'redundancy',
      cats: ['storage', 'supply'],
      re: /مولد|وحدة التبريد الميدانية|طاقة ميدانية|Redundancy/,
      rec: function (f) {
        return {
          type: 'وقائي',
          action_ar: 'ازدواجية طاقة إلزامية لكل وحدة تبريد ميدانية في الفعاليات الخارجية مثل ' + f.nameQ +
                     ': مولد احتياطي يعمل تلقائياً خلال 60 ثانية + اختبار تحميل موثق قبل 6 ساعات من الخدمة',
          owner_ar: 'مدير العمليات الميدانية + ' + f.provider,
          timeline_ar: 'فوري — سياسة قياسية لكل فعالية خارجية صيفية',
          expected_impact_ar: 'إنهاء انقطاع التبريد الميداني الذي أتلف ' + f.wastedT + ' كغ (' +
                              f.wastePct + '%) بكلفة ' + f.costT + ' د.إ'
        };
      },
      automation: function () {
        return {
          name_ar: 'حارس الطاقة الميدانية',
          trigger_ar: 'قراءة حساس التيار/الحرارة لوحدة التبريد الميدانية',
          condition_ar: 'انقطاع تيار أو ارتفاع الحرارة > 5° لمدة تتجاوز 10 دقائق',
          action_ar: 'تشغيل المولد الاحتياطي آلياً + إنذار غرفة العمليات + بدء عدّاد صلاحية للأصناف الحساسة',
          portal_module: 'مراقبة سلسلة التبريد'
        };
      }
    },
    {
      key: 'coldchain',
      theme: 'coldchain_tracking',
      cats: ['supply', 'storage'],
      re: /سلسلة التبريد|شاحنة مبردة|تجاوز حرارة|انكسار سلسلة/,
      rec: function (f) {
        return {
          type: 'تعاقدي',
          action_ar: 'إلزام ' + f.provider + ' تعاقدياً بتتبع حراري وGPS لحظي على كل شاحنة مبردة تخدم ' +
                     f.venue + '، مع بث مشترك مع غرفة عمليات الفعالية وشاحنة احتياطية جاهزة خلال 60 دقيقة',
          owner_ar: 'إدارة العقود + مدير اللوجستيات',
          timeline_ar: 'ملحق تعاقدي فوري قبل الفعالية القادمة',
          expected_impact_ar: 'اكتشاف أي انحراف حراري خلال دقائق بدل ساعات ومنع تكرار إتلاف ' + f.wastedT + ' كغ'
        };
      },
      automation: function () {
        return {
          name_ar: 'إنذار انحراف حراري',
          trigger_ar: 'قراءة حساس الشاحنة المبردة',
          condition_ar: 'الحرارة > 5° لمدة تتجاوز 15 دقيقة',
          action_ar: 'تنبيه فوري لغرفة العمليات + فتح تذكرة طوارئ + اقتراح تفعيل الشاحنة الاحتياطية',
          portal_module: 'مراقبة سلسلة التبريد'
        };
      }
    },
    {
      key: 'supplier',
      theme: 'redundancy',
      cats: ['supply', 'intake'],
      re: /اعتذر|مورد بديل|غير مؤهل|موردين بدلاء|بطاقات الموردين/,
      rec: function (f) {
        return {
          type: 'وقائي',
          action_ar: 'قائمة موردين بدلاء مؤهلين مسبقاً لكل فئة صنف تخدم فعاليات ' + f.emirate +
                     '، بتدقيق جودة سنوي وأسعار طوارئ متفق عليها، ومنع أي إدخال من مورد خارج القائمة',
          owner_ar: 'المشتريات + إدارة الجودة',
          timeline_ar: '30 يوماً',
          expected_impact_ar: 'إنهاء الاستبدال المتعجل بمورد غير مؤهل والشراء الطارئ بأسعار مضاعفة'
        };
      },
      automation: function () {
        return {
          name_ar: 'بوابة تأهيل المورد',
          trigger_ar: 'إنشاء أمر شراء أو إدخال دفعة عند الاستلام',
          condition_ar: 'المورد غير مدرج في قائمة المؤهلين أو انتهت صلاحية تأهيله',
          action_ar: 'حجب الإدخال + إشعار المشتريات باقتراح البديل المؤهل الأقرب لنفس الصنف',
          portal_module: 'الاستلام الرقمي'
        };
      }
    },
    {
      key: 'shelflife',
      theme: 'intake_checklist',
      cats: ['intake'],
      re: /صلاحية|تنتهي صلاحيتها|تدقيق التواريخ|قائمة فحص ناقصة/,
      rec: function (f) {
        return {
          type: 'تشغيلي',
          action_ar: 'حد أدنى إلزامي للصلاحية المتبقية عند القبول (≥ 60% من العمر الافتراضي، ولا يقل عن ' +
                     '72 ساعة للعبوات الفردية)، مضافاً كبند حاجب في قائمة فحص الاستلام الرقمية بـ ' + f.venue,
          owner_ar: 'مشرف السلامة الغذائية',
          timeline_ar: 'فوري',
          expected_impact_ar: 'منع دخول ' + f.wastedT + ' كغ قصيرة الصلاحية إلى المخزون بدل معالجتها بعد التلف'
        };
      },
      automation: function () {
        return {
          name_ar: 'بوابة الصلاحية المتبقية',
          trigger_ar: 'مسح باركود الدفعة عند منصة الاستلام',
          condition_ar: 'الصلاحية المتبقية < الحد الأدنى المعتمد للصنف',
          action_ar: 'رفض آلي للدفعة + توليد محضر مصور + إشعار المورد والمشتريات',
          portal_module: 'الاستلام الرقمي'
        };
      }
    },
    {
      key: 'invoice',
      theme: 'digital_intake',
      cats: ['intake', 'compliance'],
      re: /فواتير|الفاتورة|مطابقة|فاقد إداري|تسريب|Shrinkage|دفاتر ورقية|وزن إلكتروني/,
      rec: function (f) {
        return {
          type: 'تشغيلي',
          action_ar: 'استلام رقمي إلزامي في ' + f.venue + ': ميزان إلكتروني عند المنصة + صورة لكل دفعة + ' +
                     'توقيع رقمي، ومطابقة ثلاثية يومية (أمر شراء × إشعار تسليم × وزن مستلم) مع تجميد أي ' +
                     'فاتورة يتجاوز فرقها 2%',
          owner_ar: 'مدير العمليات + المالية',
          timeline_ar: 'قبل الفعالية القادمة',
          expected_impact_ar: 'إغلاق الفجوة بين الفاتورة والواقع وتحويل الفروقات من اكتشاف بأثر رجعي إلى منع قبل الدفع'
        };
      },
      automation: function () {
        return {
          name_ar: 'المطابقة الثلاثية الآلية',
          trigger_ar: 'إقفال يوم الاستلام',
          condition_ar: 'فرق (فاتورة − وزن مستلم) > 2%',
          action_ar: 'تجميد الفاتورة تلقائياً + فتح ملف تحقيق + إشعار المالية والعمليات',
          portal_module: 'الاستلام الرقمي'
        };
      }
    },
    {
      key: 'nostation',
      theme: 'intake_protocol',
      cats: ['intake'],
      re: /لا موظف استلام|الطابق التنفيذي|عربة خارج التبريد|تسليم مبكر/,
      rec: function (f) {
        return {
          type: 'تشغيلي',
          action_ar: 'بروتوكول استلام للتسليمات الصغيرة خارج المواقع المجهزة: مستلم مُسمّى بالاسم لكل ' +
                     'تسليم في ' + f.venue + '، نافذة تسليم لا تتجاوز 45 دقيقة قبل الخدمة، ونقطة تبريد ' +
                     'محمولة إلزامية لأي انتظار يتجاوز ذلك',
          owner_ar: 'مدير الضيافة التنفيذية',
          timeline_ar: 'فوري',
          expected_impact_ar: 'إنهاء ترك الطعام خارج التبريد وخفض هدر الضيافة التنفيذية عن ' + f.wastePct + '%'
        };
      },
      automation: function () {
        return {
          name_ar: 'مؤقّت التسليم الصغير',
          trigger_ar: 'تسجيل وصول تسليم خارج منصة مجهزة',
          condition_ar: 'مرور 30 دقيقة دون توقيع مستلم',
          action_ar: 'إشعار المستلم المُسمّى ومديره + تسجيل انحراف حراري محتمل في ملف الفعالية',
          portal_module: 'الاستلام الرقمي'
        };
      }
    },
    {
      key: 'hybrid',
      theme: 'forecast_factor',
      cats: ['planning'],
      re: /هجين|المسجلين|معامل تحويل|RSVP|قائمة دعوات|تأكيد الحضور|عن بعد/,
      rec: function (f) {
        return {
          type: 'وقائي',
          action_ar: 'معامل تحويل التسجيل→الحضور إلزامي لكل فعالية من نمط ' + f.type + ': يُبنى على السجل ' +
                     'التاريخي (هنا حضر ' + f.actualT + ' من ' + f.expectedT + ' متوقع) ويُقفل أمر الشراء ' +
                     'على العدد المؤكد لا المسجَّل، مع تحديث إلزامي قبل 48 ساعة',
          owner_ar: 'التخطيط + مدير الفعالية',
          timeline_ar: 'فوري — سياسة قياسية',
          expected_impact_ar: 'خفض خطأ التنبؤ من ' + Math.abs(round(f.variancePct, 1)) + '% إلى ≤ 10% ومنع ' +
                              'تكرار طلب ' + f.deliveredT + ' كغ لحضور فعلي أقل'
        };
      },
      automation: function () {
        return {
          name_ar: 'مصحّح التسجيل إلى الحضور',
          trigger_ar: 'نقاط مراجعة 72/48/24 ساعة قبل الفعالية',
          condition_ar: 'انحراف بين المسجلين وتأكيدات الحضور > 15%',
          action_ar: 'اقتراح نسبة تعديل الكميات آلياً مع إشعار قرار ملزم لمدير الفعالية قبل إقفال الإنتاج',
          portal_module: 'التنبؤ والتخطيط'
        };
      }
    },
    {
      key: 'weather',
      theme: 'staged_production',
      cats: ['planning'],
      re: /طقس|عاصفة|مطر|إقبال تاريخي/,
      rec: function (f) {
        return {
          type: 'تشغيلي',
          action_ar: 'إنتاج مرحلي للفعاليات المفتوحة: ' + Math.round(f.delivered * 0.6) + ' كغ كمية أساس ' +
                     '(60%) + ' + Math.round(f.delivered * 0.4) + ' كغ دفعات عند الطلب تُطلق حسب الإقبال ' +
                     'الفعلي في أول ساعتين، مع معامل طقس في نموذج التنبؤ',
          owner_ar: 'مدير الإنتاج + التخطيط',
          timeline_ar: 'فوري — سياسة قياسية للفعاليات المفتوحة',
          expected_impact_ar: 'سقف الهدر في أسوأ سيناريو ينخفض من ' + f.wastePct + '% إلى ما دون 20%'
        };
      },
      automation: function () {
        return {
          name_ar: 'مصحح التنبؤ بالطقس',
          trigger_ar: 'نقاط 72/48/24 ساعة قبل الفعالية',
          condition_ar: 'توقع طقس سيئ أو انحراف تسجيل > 15%',
          action_ar: 'اقتراح نسبة تعديل الكميات تلقائياً مع إشعار قرار ملزم لمدير الفعالية',
          portal_module: 'التنبؤ والتخطيط'
        };
      }
    },
    {
      key: 'cutoff',
      theme: 'cutoff',
      cats: ['planning', 'compliance'],
      re: /إلغاء|الإلغاءات|قطع زمني|Cut-off|بعد انتهاء الطهي|اللاعودة/,
      rec: function (f) {
        return {
          type: 'تعاقدي',
          action_ar: 'نقطة قطع (Cut-off) ملزمة قبل 4 ساعات من بدء الطهي لكل تعديل أو إلغاء في خدمة ' +
                     f.type + '، مربوطة تقنياً بتقويم العميل، وبند يحمّل كلفة الإلغاء المتأخر للجهة الطالبة',
          owner_ar: 'إدارة العقود + مدير الحساب',
          timeline_ar: 'ملحق تعاقدي خلال 30 يوماً',
          expected_impact_ar: 'إنهاء وصول الإلغاءات بعد نقطة اللاعودة الإنتاجية التي أنتجت ' + f.wastedT +
                              ' كغ هدراً بكلفة ' + f.costT + ' د.إ'
        };
      },
      automation: function () {
        return {
          name_ar: 'حارس نقطة القطع',
          trigger_ar: 'أي تعديل على عدد الوجبات في المنصة',
          condition_ar: 'التعديل بعد نقطة القطع المعتمدة',
          action_ar: 'رفض التعديل تلقائياً + تسجيل الكلفة على الجهة الطالبة + إشعار المطبخ بالكمية المثبتة',
          portal_module: 'التنبؤ والتخطيط'
        };
      }
    },
    {
      key: 'allocation',
      theme: 'dynamic_allocation',
      cats: ['planning'],
      re: /التوزيع بالتساوي|كثافة|نقاط التغذية|إعادة التوزيع|Static Allocation|أثناء السباق/,
      rec: function (f) {
        return {
          type: 'تشغيلي',
          action_ar: 'توزيع ديناميكي بدل الثابت: 70% من الـ' + f.deliveredT + ' كغ تُوزَّع مسبقاً بأوزان ' +
                     'مبنية على كثافة كل نقطة، و30% تبقى في مخزون متحرك يُدفع للنقاط حسب الاستهلاك اللحظي',
          owner_ar: 'مدير العمليات الميدانية',
          timeline_ar: 'قبل النسخة القادمة من الفعالية',
          expected_impact_ar: 'خفض الهدر من ' + f.wastePct + '% إلى ما دون 8% مع إنهاء نفاد بعض النقاط'
        };
      },
      automation: function () {
        return {
          name_ar: 'موازن نقاط التوزيع',
          trigger_ar: 'تحديث الاستهلاك اللحظي لكل نقطة',
          condition_ar: 'فرق الاستهلاك بين نقطتين > 25% من المخصص',
          action_ar: 'أمر نقل آلي من النقطة الفائضة إلى النقطة العاجزة مع تتبع التنفيذ',
          portal_module: 'التنبؤ والتخطيط'
        };
      }
    },
    {
      key: 'dietdata',
      theme: 'data_link',
      cats: ['planning'],
      re: /حساسية|نباتي|القيود الغذائية|وجبات خاصة|تدفق بيانات|ازدواج إنتاج/,
      rec: function (f) {
        return {
          type: 'وقائي',
          action_ar: 'ربط حقل القيود الغذائية في نظام التسجيل مباشرة بأمر الإنتاج في ' + f.venue +
                     '، وإقفاله ضمن نقطة مراجعة الـ48 ساعة، مع منع أي طلب طارئ للوجبات الخاصة يوم الخدمة',
          owner_ar: 'تقنية المعلومات + مدير الإنتاج',
          timeline_ar: '45 يوماً',
          expected_impact_ar: 'إنهاء ازدواج إنتاج نفس الأصناف والدفعات الطارئة غير المجدولة أثناء الخدمة'
        };
      },
      automation: function () {
        return {
          name_ar: 'ناقل القيود الغذائية',
          trigger_ar: 'إقفال باب التسجيل عند نقطة الـ48 ساعة',
          condition_ar: 'وجود قيود غذائية مسجلة لم تُدرج في أمر الإنتاج',
          action_ar: 'توليد بند إنتاج منفصل تلقائياً + إشعار المطبخ بالعدد النهائي لكل قيد',
          portal_module: 'التنبؤ والتخطيط'
        };
      }
    },
    {
      key: 'capacity',
      theme: 'field_capacity',
      cats: ['storage'],
      re: /تجاوزت سعتها|تخزين ليلي|رُصّت|رطوبة|مخزن مؤقت|سعة تبريد/,
      rec: function (f) {
        return {
          type: 'تشغيلي',
          action_ar: 'حساب حِمل تبريد ميداني موثق قبل كل فعالية متعددة الأيام: سعة تكفي ' + f.deliveredT +
                     ' كغ + هامش 25%، مع منع التكديس وقياس رطوبة، أو إعادة إلزامية للمستودع المركزي عند العجز',
          owner_ar: 'مدير المستودعات + مدير الموقع',
          timeline_ar: 'قبل الفعالية متعددة الأيام القادمة',
          expected_impact_ar: 'منع تكرار إتلاف ' + f.wastedT + ' كغ بسبب تخزين ليلي فوق السعة'
        };
      },
      automation: function () {
        return {
          name_ar: 'عدّاد سعة التخزين الميداني',
          trigger_ar: 'تسجيل إدخال دفعة إلى مخزن الموقع',
          condition_ar: 'الإشغال > 85% من السعة المعتمدة أو الرطوبة خارج النطاق',
          action_ar: 'حجب الإدخال + توليد أمر إعادة للمستودع المركزي + إشعار مدير الموقع',
          portal_module: 'مراقبة سلسلة التبريد'
        };
      }
    },
    {
      key: 'menuchange',
      theme: 'change_control',
      cats: ['compliance', 'intake'],
      re: /تغيير القائمة|اللحظة الأخيرة|البروتوكول|إدارة التغيير|قائمتان/,
      rec: function (f) {
        return {
          type: 'تعاقدي',
          action_ar: 'بند «إدارة التغيير» يحكم تعديلات اللحظة الأخيرة في خدمات ' + f.type + ': نافذة تغيير ' +
                     'لا تقل عن 48 ساعة، وتحمّل الجهة الطالبة كلفة المواد المشتراة بعد ذلك، مع مسار موافقة موثق',
          owner_ar: 'الإدارة القانونية + إدارة العقود',
          timeline_ar: 'الدورة التعاقدية القادمة (أو ملحق فوري)',
          expected_impact_ar: 'إنهاء الاستلام المزدوج وإرباك التخزين، وتوزيع كلفة الـ' + f.costT + ' د.إ على مصدر القرار'
        };
      },
      automation: function () {
        return {
          name_ar: 'بوابة تغيير القائمة',
          trigger_ar: 'طلب تغيير قائمة في المنصة',
          condition_ar: 'الطلب خلال أقل من 48 ساعة من الخدمة ومواد أولية مشتراة',
          action_ar: 'توليد تقدير كلفة تلقائي + طلب موافقة موقّعة من الجهة الطالبة قبل التنفيذ',
          portal_module: 'الاستلام الرقمي'
        };
      }
    },
    {
      key: 'segregation',
      theme: 'segregation',
      cats: ['compliance', 'surplus'],
      re: /فرز|المخلفات العضوية|نقاط التجميع|الاستدامة|التغليف/,
      rec: function (f) {
        return {
          type: 'تشغيلي',
          action_ar: 'فرز عند المصدر في كل نقطة تجميع بـ ' + f.venue + ' (عضوي / تغليف / صالح للتبرع) ' +
                     'مع تدريب موثق لفرق الموقع قبل الخدمة وتوثيق مصير 100% من الفائض بالوزن والصور',
          owner_ar: 'مدير الاستدامة + مشرف الموقع',
          timeline_ar: 'قبل الفعالية القادمة',
          expected_impact_ar: 'إثبات الالتزام ببنود الاستدامة التعاقدية وتحويل ' + f.wastedT +
                              ' كغ من مجهولة المصير إلى موثقة'
        };
      },
      automation: function () {
        return {
          name_ar: 'سجل مصير الفائض',
          trigger_ar: 'إقفال نقطة تجميع في نهاية الخدمة',
          condition_ar: 'وزن مسجَّل بلا تصنيف مصير (تبرع/سماد/إتلاف)',
          action_ar: 'حجب إقفال الفعالية + مطالبة المشرف بتصنيف موثق بالصور قبل الاعتماد',
          portal_module: 'إدارة الفائض'
        };
      }
    },
    {
      key: 'donation',
      theme: 'donation_mou',
      cats: ['surplus', 'compliance'],
      re: /جمعية|بنك طعام|حفظ نعمة|نافذة أمان|التبرع|إعادة توجيه|Redeploy|فائض خام/,
      rec: function (f) {
        return {
          type: 'تعاقدي',
          action_ar: 'مذكرة تفاهم دائمة مع جهة تبرع معتمدة تغطي فعاليات ' + f.emirate + ' تحدد الأصناف ' +
                     'المقبولة ونافذة الاستلام والمسؤولية القانونية، مع مسار إعادة توجيه للخام غير المطبوخ ' +
                     'خلال 48 ساعة قبل اللجوء للإتلاف',
          owner_ar: 'الإدارة القانونية + اللوجستيات',
          timeline_ar: '45 يوماً',
          expected_impact_ar: 'تحويل ما يقارب ' + f.recoverableKgT + ' كغ (نحو ' + f.recoverableAed +
                              ' د.إ) من الإتلاف إلى استرداد قيمة أو أثر مجتمعي موثق'
        };
      },
      automation: function () {
        return {
          name_ar: 'مُشغّل إعلان الفائض',
          trigger_ar: 'تسجيل إغلاق الخدمة في المنصة',
          condition_ar: 'فائض متوقع > 20 كغ',
          action_ar: 'توليد نموذج إعلان فائض + إشعار جهة التبرع المتعاقدة بموعد استلام مقترح',
          portal_module: 'إدارة الفائض'
        };
      }
    }
  ];

  /**
   * قواعد الموضوع تُفلتر بالفئة: لا تُطبَّق قاعدة موضوع خارج الطبقة الفاشلة.
   * (مثال: ذكر «سلسلة التبريد» في سرد فعالية تخطيطية لا يجعل الحل حلَّ تبريد.)
   * الترتيب: مواضيع الفئة الرئيسية أولاً، ثم مواضيع فئة قالب المزج.
   */
  function matchTopics(ev, primaryKey, blendKey) {
    var t = allText(ev);
    var hit = TOPIC_RULES.filter(function (r) { return r.re.test(t); });
    var main = hit.filter(function (r) { return r.cats.indexOf(primaryKey) !== -1; });
    var blended = blendKey
      ? hit.filter(function (r) {
          return r.cats.indexOf(blendKey) !== -1 && main.indexOf(r) === -1;
        })
      : [];
    return main.concat(blended);
  }

  /* ================================================================== *
   * كتالوج القوالب حسب الفئة — مشتق من الأمثلة الذهبية الأربعة
   * كل عنصر دالة تأخذ الحقائق وتُرجع نصاً مخصصاً (لا نسخ حرفي)
   * ================================================================== */
  var PLAYBOOKS = {
    supply: {
      anchor: 'EV-001',
      recs: [
        function (f) { return {
          theme: 'redundancy',
          type: 'تشغيلي',
          action_ar: 'اشتراط بديل جاهز خلال 60 دقيقة (شاحنة مبردة أو مسار نقل احتياطي) لأي فعالية تتجاوز ' +
                     Math.max(300, Math.round(f.expected / 100) * 100) + ' ضيفاً، موثقاً كـ SLA على ' + f.provider,
          owner_ar: f.provider + ' + مدير اللوجستيات',
          timeline_ar: 'قبل الفعالية القادمة',
          expected_impact_ar: 'تقليص نافذة الانكشاف عند تعطل أو تأخر المسار الأساسي' }; },
        function (f) { return {
          theme: 'coldchain_tracking',
          type: 'تعاقدي',
          action_ar: 'ملحق تعاقدي مع ' + f.provider + ' يلزم بتتبع لحظي (حرارة + ETA) لكل شحنة إلى ' + f.venue +
                     ' وبثّ مشترك مع غرفة عمليات الفعالية، مع غرامة على كل انحراف غير مُبلَّغ',
          owner_ar: 'إدارة العقود',
          timeline_ar: 'عند التجديد أو بملحق فوري',
          expected_impact_ar: 'تحويل الاكتشاف من «عند منصة الاستلام» إلى «أثناء الرحلة»' }; },
        function (f) { return {
          theme: 'source_redundancy',
          type: 'وقائي',
          action_ar: 'قائمة موردين ومسارات بدائل مؤهلة مسبقاً لكل فئة صنف بأسعار طوارئ متفق عليها في ' + f.emirate,
          owner_ar: 'المشتريات',
          timeline_ar: '30 يوماً',
          expected_impact_ar: 'إنهاء الشراء الطارئ بأسعار مضاعفة عند أي انقطاع' }; }
      ],
      autos: [
        function () { return {
          name_ar: 'مراقبة موعد الوصول',
          trigger_ar: 'مقارنة ETA بجدول التسليم',
          condition_ar: 'تأخر متوقع > 45 دقيقة',
          action_ar: 'تصعيد تلقائي لمدير الفعالية + إشعار المطبخ لإعادة ترتيب خط الإنتاج',
          portal_module: 'مراقبة سلسلة التبريد' }; },
        function () { return {
          name_ar: 'محضر رفض آلي',
          trigger_ar: 'تسجيل رفض دفعة عند الاستلام',
          condition_ar: 'سبب الرفض = انحراف حراري أو صلاحية',
          action_ar: 'توليد محضر رفض موثق بالصور + مسودة أمر شراء طارئ من قائمة البدلاء المؤهلين',
          portal_module: 'الاستلام الرقمي' }; }
      ],
      kpis: function (f) { return [
        { name_ar: 'نسبة الشحنات المتصلة بالتتبع الحراري واللحظي', target_ar: '100%' },
        { name_ar: 'حوادث انكسار سلسلة الإمداد لكل ربع سنة', target_ar: '0' },
        { name_ar: 'زمن تفعيل البديل عند التعطل', target_ar: '≤ 60 دقيقة' }
      ]; }
    },

    storage: {
      anchor: 'EV-001',
      recs: [
        function (f) { return {
          theme: 'site_readiness',
          type: 'تشغيلي',
          action_ar: 'شهادة جاهزية موقع قبل 24 ساعة من ' + f.nameQ + ' تغطي سعة التبريد الفعلية مقابل ' +
                     f.deliveredT + ' كغ مورّدة، ومصدر الطاقة، وقياس حرارة/رطوبة كل وحدة',
          owner_ar: 'مدير الموقع + مشرف السلامة الغذائية',
          timeline_ar: 'قبل الفعالية القادمة',
          expected_impact_ar: 'منع بدء الخدمة بموقع لا تكفي بنيته التبريدية' }; },
        function (f) { return {
          theme: 'redundancy',
          type: 'وقائي',
          action_ar: 'ازدواجية إلزامية في التبريد والطاقة الميدانية (وحدة + مولد احتياطي) لكل فعالية من نمط ' +
                     f.type + ' في ' + f.emirate,
          owner_ar: 'مدير العمليات الميدانية',
          timeline_ar: 'فوري',
          expected_impact_ar: 'إزالة نقطة الفشل الواحدة في البنية الميدانية' }; },
        function (f) { return {
          theme: 'capacity_contract',
          type: 'تعاقدي',
          action_ar: 'بند يحمّل ' + f.provider + ' مسؤولية توفير سعة تبريد موثقة واختبار تحميل قبل الخدمة، ' +
                     'مع تحمّل كلفة الفاقد الناتج عن عجز السعة',
          owner_ar: 'إدارة العقود',
          timeline_ar: 'الدورة التعاقدية القادمة',
          expected_impact_ar: 'نقل مخاطرة السعة إلى الطرف القادر على إدارتها' }; }
      ],
      autos: [
        function () { return {
          name_ar: 'مراقب حرارة المخزن الميداني',
          trigger_ar: 'قراءة حساس وحدة التخزين بالموقع كل 5 دقائق',
          condition_ar: 'الحرارة خارج النطاق المعتمد > 15 دقيقة',
          action_ar: 'إنذار غرفة العمليات + بدء عدّاد صلاحية للأصناف الحساسة + اقتراح نقل للمستودع المركزي',
          portal_module: 'مراقبة سلسلة التبريد' }; },
        function () { return {
          name_ar: 'قائمة جاهزية الموقع',
          trigger_ar: 'نقطة T-24 ساعة قبل الفعالية',
          condition_ar: 'بند جاهزية واحد غير موقّع (سعة/طاقة/حرارة)',
          action_ar: 'حجب اعتماد خطة التموين + إشعار مدير الفعالية والمزود',
          portal_module: 'مراقبة سلسلة التبريد' }; }
      ],
      kpis: function () { return [
        { name_ar: 'نسبة الفعاليات ببنية تبريد وطاقة مزدوجة', target_ar: '100%' },
        { name_ar: 'دقائق خروج المخزن الميداني عن النطاق الحراري', target_ar: '0 دقيقة لكل فعالية' },
        { name_ar: 'نسبة الفعاليات بشهادة جاهزية موقّعة قبل 24 ساعة', target_ar: '100%' }
      ]; }
    },

    planning: {
      anchor: 'EV-010',
      recs: [
        function (f) { return {
          theme: 'staged_production',
          type: 'تشغيلي',
          action_ar: 'إنتاج مرحلي بدل الدفعة الواحدة: ' + Math.round(f.delivered * 0.6) + ' كغ كمية أساس ' +
                     'ثم ' + Math.round(f.delivered * 0.4) + ' كغ دفعات تُطلق حسب الحضور الفعلي المسجَّل عند البوابة',
          owner_ar: 'مدير الإنتاج',
          timeline_ar: 'فوري — سياسة قياسية',
          expected_impact_ar: 'تحويل قرار الكمية من رهان واحد إلى قرارات متدرجة قابلة للتصحيح' }; },
        function (f) { return {
          theme: 'review_points',
          type: 'وقائي',
          action_ar: 'نقاط مراجعة تنبؤ ملزمة عند 72 و48 و24 ساعة تُعدّل الكميات وفق التأكيدات الفعلية ' +
                     '(في ' + f.nameQ + ' كان الفارق ' + round(f.variancePct, 1) + '% بين المتوقع والفعلي)',
          owner_ar: 'التخطيط + مدير الفعالية',
          timeline_ar: 'فوري',
          expected_impact_ar: 'كشف انحراف الحضور قبل نقطة اللاعودة الإنتاجية لا بعدها' }; },
        function (f) { return {
          theme: 'reduction_right',
          type: 'تعاقدي',
          action_ar: 'حق تعاقدي بتقليص الكمية حتى 30% عند نقطة الـ24 ساعة دون غرامة، مضافاً لعقد ' + f.provider,
          owner_ar: 'إدارة العقود',
          timeline_ar: 'ملحق تعاقدي خلال 30 يوماً',
          expected_impact_ar: 'استرداد مرونة الكمية التي كلّف غيابها ' + f.costT + ' د.إ هنا' }; }
      ],
      autos: [
        function () { return {
          name_ar: 'بوابة الإنتاج المرحلي',
          trigger_ar: 'عدّاد الحضور الفعلي في أول 120 دقيقة',
          condition_ar: 'الحضور < 70% من المتوقع',
          action_ar: 'تجميد الدفعات المتبقية تلقائياً وإشعار المطبخ بالكمية المعدّلة',
          portal_module: 'التنبؤ والتخطيط' }; },
        function () { return {
          name_ar: 'موجّه الفائض الخام',
          trigger_ar: 'إعلان فائض خام غير مطبوخ',
          condition_ar: 'توجد فعالية متوافقة خلال 48 ساعة',
          action_ar: 'مطابقة تلقائية واقتراح أمر نقل مع تحديث المخزون',
          portal_module: 'إدارة الفائض' }; }
      ],
      kpis: function (f) { return [
        { name_ar: 'متوسط خطأ التنبؤ بالحضور', target_ar: '≤ 10%' },
        { name_ar: 'نسبة الفعاليات المطبِّقة للإنتاج المرحلي', target_ar: '100%' },
        { name_ar: 'الهدر لكل حاضر فعلي (غم)', target_ar: f.wastePerGuest ? '≤ 120 غم (الحالي ' + f.wastePerGuest + ' غم)' : '≤ 120 غم' }
      ]; }
    },

    intake: {
      anchor: 'EV-015',
      recs: [
        function (f) { return {
          theme: 'digital_intake',
          type: 'تشغيلي',
          action_ar: 'استلام رقمي إلزامي في ' + f.venue + ': ميزان إلكتروني + صورة لكل دفعة + توقيع رقمي، ' +
                     'ولا يُقبل أي إدخال بدون سجل وزن مرتبط بأمر الشراء',
          owner_ar: 'مدير العمليات',
          timeline_ar: 'قبل الفعالية القادمة',
          expected_impact_ar: 'إغلاق منطقة العمى بين المستند والواقع عند باب الموقع' }; },
        function (f) { return {
          theme: 'intake_checklist',
          type: 'وقائي',
          action_ar: 'قائمة فحص استلام موحّدة وحاجبة (حرارة + صلاحية متبقية + مطابقة كمية + سلامة تغليف) ' +
                     'تُطبّق على كل دفعة من ' + f.provider,
          owner_ar: 'مشرف السلامة الغذائية',
          timeline_ar: 'فوري',
          expected_impact_ar: 'منع مرور الدفعات المخالفة بدل اكتشافها بعد التخزين' }; },
        function (f) { return {
          theme: 'supplier_scorecard',
          type: 'تعاقدي',
          action_ar: 'بطاقة أداء شهرية لكل مورد تشمل معدل الفروقات والرفض، مع بند تدقيق مفاجئ وإنهاء ' +
                     'تعاقد عند نمط متكرر',
          owner_ar: 'إدارة العقود',
          timeline_ar: 'الدورة التعاقدية القادمة',
          expected_impact_ar: 'رادع بنيوي ضد تكرار الفروقات ونقص الجودة' }; }
      ],
      autos: [
        function () { return {
          name_ar: 'كاشف الأنماط',
          trigger_ar: 'تحديث سجل الفروقات والرفض',
          condition_ar: '3 فروقات متتالية لنفس المورد بنفس الاتجاه',
          action_ar: 'رفع تنبيه اشتباه فاقد إداري إلى الإدارة العليا مع تقرير تاريخي',
          portal_module: 'الاستلام الرقمي' }; },
        function () { return {
          name_ar: 'بطاقة أداء المورد',
          trigger_ar: 'نهاية كل شهر',
          condition_ar: 'دائماً',
          action_ar: 'توليد تقرير فروقات والتزام لكل مورد وإرساله لإدارة العقود',
          portal_module: 'الاستلام الرقمي' }; }
      ],
      kpis: function () { return [
        { name_ar: 'نسبة الدفعات الموزونة إلكترونياً عند الاستلام', target_ar: '100%' },
        { name_ar: 'متوسط فرق المستند عن المستلَم', target_ar: '≤ 1%' },
        { name_ar: 'زمن إغلاق ملفات الفروقات', target_ar: '≤ 5 أيام عمل' }
      ]; }
    },

    compliance: {
      anchor: 'EV-015',
      recs: [
        function (f) { return {
          theme: 'contract_clause',
          type: 'تعاقدي',
          action_ar: 'مراجعة بنود عقد ' + f.provider + ' لسد الثغرة التي ظهرت في ' + f.nameQ +
                     ': تعريف صريح للالتزام، ومقياس تحقّقه، والجهة المسؤولة، وأثر الإخلال',
          owner_ar: 'الإدارة القانونية + إدارة العقود',
          timeline_ar: 'الدورة التعاقدية القادمة (أو ملحق فوري)',
          expected_impact_ar: 'تحويل الالتزام من نص عام إلى بند قابل للقياس والمساءلة' }; },
        function (f) { return {
          theme: 'sop_training',
          type: 'تشغيلي',
          action_ar: 'إجراء تشغيلي موثق + تدريب إلزامي لفرق الموقع في ' + f.venue + ' قبل الخدمة، ' +
                     'مع قائمة تحقق موقّعة تُرفع للمنصة',
          owner_ar: 'مشرف الموقع + إدارة التدريب',
          timeline_ar: '30 يوماً',
          expected_impact_ar: 'إنهاء الفجوة بين ما يلزم به العقد وما تعرفه الفرق فعلياً' }; },
        function (f) { return {
          theme: 'closing_checklist',
          type: 'وقائي',
          action_ar: 'قائمة إغلاق إلزامية قبل انعقاد كل فعالية تشمل بنود الامتثال المطبّقة عليها ' +
                     '(نمط ' + f.type + ') ولا تُعتمد الفعالية دون استيفائها',
          owner_ar: 'مدير الفعالية',
          timeline_ar: 'فوري',
          expected_impact_ar: 'لا فعالية تبدأ ببند امتثال مفتوح' }; }
      ],
      autos: [
        function () { return {
          name_ar: 'بوابة الالتزام التعاقدي',
          trigger_ar: 'طلب اعتماد خطة تموين لفعالية',
          condition_ar: 'بند امتثال واحد أو أكثر غير موثق',
          action_ar: 'حجب الاعتماد + إشعار مدير الفعالية وإدارة العقود بالبند الناقص',
          portal_module: 'الاستلام الرقمي' }; },
        function () { return {
          name_ar: 'سجل الامتثال والتدريب',
          trigger_ar: 'إسناد فريق موقع لفعالية',
          condition_ar: 'انتهاء صلاحية تدريب أحد الأفراد على البند المطبّق',
          action_ar: 'حجب الإسناد + جدولة جلسة تدريب قصيرة قبل الخدمة',
          portal_module: 'الاستلام الرقمي' }; }
      ],
      kpis: function () { return [
        { name_ar: 'نسبة بنود الامتثال الموثقة قبل الفعالية', target_ar: '100%' },
        { name_ar: 'ملاحظات أو غرامات رسمية لكل ربع سنة', target_ar: '0' },
        { name_ar: 'نسبة فرق الموقع المدرَّبة على البنود المطبّقة', target_ar: '≥ 95%' }
      ]; }
    },

    surplus: {
      anchor: 'EV-020',
      recs: [
        function (f) { return {
          theme: 'donation_mou',
          type: 'تعاقدي',
          action_ar: 'مذكرة تفاهم دائمة مع جمعية أو بنك طعام معتمد يغطي فعاليات ' + f.emirate +
                     '، تحدد الأصناف المقبولة ونافذة الاستلام والمسؤولية القانونية',
          owner_ar: 'الإدارة القانونية',
          timeline_ar: '45 يوماً',
          expected_impact_ar: 'تحويل التصرف بالفائض من محاولة ارتجالية إلى مسار افتراضي جاهز' }; },
        function (f) { return {
          theme: 'surplus_sop',
          type: 'تشغيلي',
          action_ar: 'إجراء فائض موحّد: تبريد سريع وتوسيم وتوثيق خلال 90 دقيقة من نهاية الخدمة كشرط ' +
                     'لصلاحية التبرع — تطبيقاً على ' + f.wastedT + ' كغ من نوع ما تُلف في ' + f.nameQ,
          owner_ar: 'مشرف السلامة الغذائية',
          timeline_ar: 'فوري',
          expected_impact_ar: 'إبقاء الفائض داخل نافذة الأمان حتى لحظة الاستلام' }; },
        function (f) { return {
          theme: 'closing_surplus',
          type: 'وقائي',
          action_ar: 'إدراج قرار مصير الفائض (تبرع / إعادة توجيه / سماد / إتلاف موثق) كبند إلزامي في ' +
                     'قائمة إغلاق كل فعالية قبل انعقادها',
          owner_ar: 'مدير الفعالية',
          timeline_ar: 'فوري',
          expected_impact_ar: 'لا فعالية تبدأ دون خطة فائض موثقة ومسؤول مُسمّى' }; }
      ],
      autos: [
        function () { return {
          name_ar: 'عدّاد نافذة الأمان',
          trigger_ar: 'إعلان الفائض في المنصة',
          condition_ar: 'لا تأكيد استلام خلال 60 دقيقة',
          action_ar: 'تحويل تلقائي للمسار البديل (سماد عضوي / إتلاف موثق) مع تسجيل السبب',
          portal_module: 'إدارة الفائض' }; },
        function () { return {
          name_ar: 'سجل الأثر',
          trigger_ar: 'إتمام أي تبرع أو إعادة توجيه',
          condition_ar: 'دائماً',
          action_ar: 'توثيق الكمية والوجبات المكافئة وإصدار شهادة أثر تُستخدم في تقارير الاستدامة',
          portal_module: 'إدارة الفائض' }; }
      ],
      kpis: function (f) { return [
        { name_ar: 'نسبة الفائض الصالح المتبرَّع به أو المُعاد توجيهه', target_ar: '≥ 80%' },
        { name_ar: 'كغ محوَّلة بعيداً عن الإتلاف', target_ar: '≥ ' + f.recoverableKgT + ' كغ لفعالية بهذا الحجم' },
        { name_ar: 'زمن الاستجابة من الإعلان إلى الاستلام', target_ar: '≤ 90 دقيقة' }
      ]; }
    }
  };

  /* طبقة نمط الفشل: توصية إضافية تخاطب النمط نفسه لا العَرَض */
  var PATTERN_OVERLAY = {
    spof: function (f, target) { return {
      theme: 'redundancy',
      type: 'وقائي',
      action_ar: 'إزالة نقطة الفشل الواحدة (' + target + '): بديل مُعرَّف بالاسم وجاهز خلال 60 دقيقة، ' +
                 'يُختبر دورياً ويُدرج في خطة كل فعالية تتجاوز ' + Math.max(200, Math.round(f.expected / 100) * 100) + ' ضيفاً',
      owner_ar: 'مدير العمليات + ' + f.provider,
      timeline_ar: '30 يوماً',
      expected_impact_ar: 'ما تعطّل هنا أتلف ' + f.wastedT + ' كغ بكلفة ' + f.costT + ' د.إ؛ البديل الجاهز يحصر الأثر في دقائق' }; },
    early_decision: function (f) { return {
      theme: 'staged_decision',
      type: 'تشغيلي',
      action_ar: 'إدخال نقطة قطع (Cut-off) ونقاط مراجعة متدرجة قبل إقفال الإنتاج، بحيث لا تدخل الكمية ' +
                 'كاملة (' + f.deliveredT + ' كغ) الإنتاج قبل معرفة الواقع',
      owner_ar: 'مدير الإنتاج + التخطيط',
      timeline_ar: 'فوري',
      expected_impact_ar: 'استعادة القدرة على التصحيح بدل رهان واحد غير قابل للعكس' }; },
    data_blind: function (f) { return {
      theme: 'data_link',
      type: 'تشغيلي',
      action_ar: 'إغلاق منطقة العمى: ربط المعلومة بمن يقرر عبر حقل إلزامي في المنصة يمنع اعتماد الخطة ' +
                 'قبل وصول البيانات الحرجة لفعالية ' + f.nameQ + ' وأمثالها',
      owner_ar: 'تقنية المعلومات + مدير العمليات',
      timeline_ar: '45 يوماً',
      expected_impact_ar: 'لا يمكن إدارة ما لا يُقاس — القياس أولاً ثم التفسير' }; },
    no_default_path: function (f) { return {
      theme: 'default_path',
      type: 'وقائي',
      action_ar: 'بناء المسار الافتراضي قبل الحاجة إليه: إجراء مكتوب ومالك مُسمّى وجهة بديلة معتمدة ' +
                 'للسيناريو المتوقع في فعاليات ' + f.type,
      owner_ar: 'مدير الفعالية',
      timeline_ar: '45 يوماً',
      expected_impact_ar: 'الارتجال وقت الأزمة يُستبدل بخطوة أولى معروفة سلفاً' }; }
  };

  var SPOF_TARGETS = [
    { re: /مصعد|النقل الرأسي/, label: 'مصعد الخدمة الوحيد' },
    { re: /مولد|وحدة التبريد الميدانية/, label: 'مولد التبريد الميداني' },
    { re: /منصة الاستلام الوحيدة|ازدحام منصة/, label: 'منصة الاستلام الوحيدة' },
    { re: /شاحنة|النقل المبرد|مبردة/, label: 'الشاحنة المبردة الوحيدة' },
    { re: /مصدر استيراد وحيد|جمارك|مستوردة/, label: 'مصدر الاستيراد الوحيد' },
    { re: /مورّد|مورد|اعتذر/, label: 'المورد الأساسي' }
  ];

  function spofTarget(ev) {
    var t = allText(ev);
    for (var i = 0; i < SPOF_TARGETS.length; i++) {
      if (SPOF_TARGETS[i].re.test(t)) return SPOF_TARGETS[i].label;
    }
    return 'المورد الوحيد في هذه الطبقة';
  }

  /* ================================================================== *
   * أدوات تجميع: منع التكرار وضمان مزيج الأنواع
   * ================================================================== */
  function pushUnique(list, item, keyFn) {
    if (!item) return;
    var k = keyFn(item);
    for (var i = 0; i < list.length; i++) if (keyFn(list[i]) === k) return;
    list.push(item);
  }

  function recKey(r) { return r.theme || (r.action_ar || '').slice(0, 45); }
  function autoKey(a) { return a.name_ar; }

  /** ضمان القاعدة 4: مزيج الأنواع (وقائي/تشغيلي/تعاقدي) قدر الإمكان */
  function ensureTypeMix(recs, pool) {
    if (recs.length < 3) return recs;
    var types = recs.map(function (r) { return r.type; });
    var unique = types.filter(function (t, i) { return types.indexOf(t) === i; });
    if (unique.length >= 2) return recs;
    // كل التوصيات من نوع واحد: استبدل الثالثة بأول بديل مختلف النوع
    for (var i = 0; i < pool.length; i++) {
      if (pool[i].type !== recs[0].type && recKey(pool[i]) !== recKey(recs[0]) && recKey(pool[i]) !== recKey(recs[1])) {
        recs[2] = pool[i];
        break;
      }
    }
    return recs;
  }

  /* ================================================================== *
   * 5) توليد الحل
   * ================================================================== */
  function generate(ev, goldenEvents) {
    var cls = classify(ev);
    var pattern = detectPattern(ev, cls);
    var severity = assessSeverity(ev);
    var templates = pickTemplates(ev, cls, pattern, goldenEvents || []);
    var f = facts(ev);

    var moduleName = L.MODULE_FOR_CATEGORY[cls.primary.key] || 'التنبؤ والتخطيط';
    var book = PLAYBOOKS[cls.primary.key] || PLAYBOOKS.planning;
    var blendKey = templates.blend ? templates.blend.profile.category : null;
    var blendBook = blendKey ? PLAYBOOKS[blendKey] : null;
    var topics = matchTopics(ev, cls.primary.key, blendKey);

    /* ---- التوصيات: موضوع (1) ← نمط الفشل (2) ← قالب الفئة ← قالب المزج ---- */
    var pool = [];
    topics.forEach(function (t) {
      var r = t.rec(f);
      r.theme = t.theme;
      pushUnique(pool, r, recKey);
    });
    pushUnique(pool, PATTERN_OVERLAY[pattern.key](f, spofTarget(ev)), recKey);
    book.recs.forEach(function (fn) { pushUnique(pool, fn(f), recKey); });
    if (blendBook) blendBook.recs.forEach(function (fn) { pushUnique(pool, fn(f), recKey); });

    var recs = pool.slice(0, 3);
    if (blendBook && recs.length === 3) {
      // ضمان حضور منطق المزج: آخر توصية تأتي من طبقة القالب الثاني
      var blendRec = blendBook.recs[0](f);
      var already = recs.some(function (r) { return recKey(r) === recKey(blendRec); });
      if (!already) recs[2] = blendRec;
    }
    recs = ensureTypeMix(recs, pool);
    recs = recs.map(function (r, i) {
      return {
        priority: i + 1, type: r.type, action_ar: r.action_ar,
        owner_ar: r.owner_ar, timeline_ar: r.timeline_ar, expected_impact_ar: r.expected_impact_ar
      };
    });

    /* ---- الأتمتة: موضوع ← قالب الفئة ← قالب المزج ---- */
    var autos = [];
    topics.forEach(function (t) { pushUnique(autos, t.automation(f), autoKey); });
    book.autos.forEach(function (fn) { pushUnique(autos, fn(f), autoKey); });
    if (blendBook) blendBook.autos.forEach(function (fn) { pushUnique(autos, fn(f), autoKey); });
    autos = autos.slice(0, 3);

    /* ---- المؤشرات: مؤشرات الوحدة + مؤشر أثر خاص بالفعالية ---- */
    var kpis = book.kpis(f).slice(0, 2);
    kpis.push({
      name_ar: 'نسبة الهدر في الفعاليات من نمط ' + f.nameType,
      target_ar: '≤ ' + L.WASTE_TARGET_PCT + '% (المسجَّل في ' + f.nameQ + ': ' + f.wastePct + '%)'
    });

    var diagnosis = buildDiagnosis({
      ev: ev, f: f, cls: cls, pattern: pattern,
      spofTarget: spofTarget(ev),
      worked: whatWorked(ev),
      failedShort: ev.receiving_intake_issue && !/سليم/.test(ev.receiving_intake_issue)
        ? ev.receiving_intake_issue
        : (ev.supply_chain_issue && !/سليم/.test(ev.supply_chain_issue) ? ev.supply_chain_issue : ev.root_cause)
    });

    return {
      status: 'generated',
      portal_module: moduleName,
      diagnosis_ar: diagnosis,
      recommendations: recs,
      automations: autos,
      kpis: kpis
    };
  }

  /* ================================================================== *
   * أثر التنفيذ — يُحسب حياً للعرض، ولا يُحفظ داخل الحل (حفاظاً على المخطط)
   * ================================================================== */
  function explain(ev, goldenEvents) {
    var cls = classify(ev);
    var pattern = detectPattern(ev, cls);
    var severity = assessSeverity(ev);
    var templates = pickTemplates(ev, cls, pattern, goldenEvents || []);
    var blendKey = templates.blend ? templates.blend.profile.category : null;
    var topics = matchTopics(ev, cls.primary.key, blendKey);
    return {
      classification: cls,
      pattern: pattern,
      severity: severity,
      templates: templates,
      topics: topics.map(function (t) { return t.key; }),
      module: L.MODULE_FOR_CATEGORY[cls.primary.key],
      facts: facts(ev)
    };
  }

  global.RuleEngine = {
    classify: classify,
    detectPattern: detectPattern,
    assessSeverity: assessSeverity,
    pickTemplates: pickTemplates,
    facts: facts,
    generate: generate,
    explain: explain,
    TOPIC_RULES: TOPIC_RULES,
    PLAYBOOKS: PLAYBOOKS
  };
})(typeof window !== 'undefined' ? window : globalThis);
