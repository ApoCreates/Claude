/* eslint-disable */
/**
 * assets/charts.js — رسوم SVG مرسومة يدوياً (بلا أي مكتبة أو شبكة)
 * ================================================================
 * كل رسم يُنتج نص SVG متجاوباً (viewBox) ويحترم اتجاه RTL.
 */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmt(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return Number(n).toLocaleString('en-US');
  }

  /** اختيار خطوة مقياس مريحة (1/2/5 × 10^n) */
  function niceStep(max, ticks) {
    var raw = max / (ticks || 4);
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var norm = raw / mag;
    var step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
    return step * mag;
  }

  /**
   * أعمدة أفقية — الأنسب للتسميات العربية الطويلة (فئات، إمارات، مزودون).
   * التخطيط (RTL): عمود التسميات على اليمين، الأعمدة تنمو من اليمين لليسار،
   * والقيمة الرقمية خارج طرف العمود. كل النصوص direction="rtl" فيكون
   * text-anchor="start" = الحافة اليمنى — وهو ما يمنع تداخل التسمية مع العمود.
   */
  function barsH(rows, opts) {
    opts = opts || {};
    var unit = opts.unit || '';
    var W = 100, rowH = 7, gap = 2.6, padTop = 1.5;
    var H = padTop + rows.length * (rowH + gap);
    var max = Math.max.apply(null, rows.map(function (r) { return r.value; }).concat([1]));

    var labelW = 39;         // عمود التسميات على اليمين
    var valueW = 8;          // مساحة محجوزة لأرقام القيم على اليسار
    var barRight = W - labelW;
    var barW = barRight - valueW;

    var parts = ['<svg class="chart" viewBox="0 0 ' + W + ' ' + H.toFixed(1) +
                 '" role="img" aria-label="' + esc(opts.title || 'رسم أعمدة') + '">'];

    rows.forEach(function (r, i) {
      var y = padTop + i * (rowH + gap);
      var baseline = y + rowH * 0.7;
      var w = max > 0 ? (r.value / max) * barW : 0;
      if (r.value > 0 && w < 0.7) w = 0.7;
      var tip = barRight - w;

      var label = r.sub ? r.label + ' • ' + r.sub : r.label;
      parts.push('<text class="ch-label" direction="rtl" text-anchor="start" x="' + (W - 0.6) +
                 '" y="' + baseline.toFixed(2) + '">' + esc(label) + '</text>');

      parts.push('<rect class="ch-track" x="' + valueW + '" y="' + y.toFixed(2) + '" width="' + barW +
                 '" height="' + rowH + '" rx="1.2"/>');
      parts.push('<rect x="' + tip.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + w.toFixed(2) +
                 '" height="' + rowH + '" rx="1.2" fill="' + (r.color || '#1e3a5f') + '"><title>' +
                 esc(r.label + ': ' + fmt(r.value) + ' ' + unit) + '</title></rect>');

      parts.push('<text class="ch-value" direction="rtl" text-anchor="start" x="' + (tip - 1).toFixed(2) +
                 '" y="' + baseline.toFixed(2) + '">' + esc(fmt(r.value)) + '</text>');
    });

    parts.push('</svg>');
    return parts.join('');
  }

  var MONTHS_SHORT = ['ينا', 'فبر', 'مار', 'أبر', 'مايو', 'يون',
                      'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس'];

  /**
   * أعمدة رأسية زمنية مع خط اتجاه — تُقرأ من اليمين (الأقدم) إلى اليسار.
   * points: [{ label, value, color }]
   */
  function timeSeries(points, opts) {
    opts = opts || {};
    var W = 100, H = 42, padB = 7, padT = 3, padR = 10, padL = 1.5;
    var n = Math.max(points.length, 1);
    var innerW = W - padL - padR;
    var slot = innerW / n;
    var barW = Math.min(slot * 0.5, 5);
    var max = Math.max.apply(null, points.map(function (p) { return p.value; }).concat([1]));
    var step = niceStep(max, 3);
    var top = Math.ceil(max / step) * step || 1;
    var plotH = H - padB - padT;

    var parts = ['<svg class="chart" viewBox="0 0 ' + W + ' ' + H +
                 '" role="img" aria-label="' + esc(opts.title || 'سلسلة زمنية') + '">'];

    for (var v = 0; v <= top; v += step) {
      var gy = padT + plotH - (v / top) * plotH;
      parts.push('<line class="ch-grid" x1="' + padL + '" y1="' + gy.toFixed(2) +
                 '" x2="' + (W - padR) + '" y2="' + gy.toFixed(2) + '"/>');
      parts.push('<text class="ch-axis" direction="rtl" text-anchor="start" x="' + (W - 0.6) +
                 '" y="' + (gy + 0.9).toFixed(2) + '">' + esc(fmt(v)) + '</text>');
    }

    // تخطي التسميات المزدحمة بدل تراكبها
    var labelStep = Math.max(1, Math.ceil(4.8 / slot));
    var line = [];

    points.forEach(function (p, i) {
      var cx = W - padR - (i + 0.5) * slot;   // الأقدم يميناً
      var h = (p.value / top) * plotH;
      var y = padT + plotH - h;
      parts.push('<rect x="' + (cx - barW / 2).toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + barW.toFixed(2) +
                 '" height="' + Math.max(h, 0.25).toFixed(2) + '" rx="0.7" fill="' + (p.color || '#1e3a5f') +
                 '"><title>' + esc(p.label + ': ' + fmt(p.value) + ' ' + (opts.unit || '')) + '</title></rect>');
      if (i % labelStep === 0) {
        parts.push('<text class="ch-axis" direction="rtl" text-anchor="middle" x="' + cx.toFixed(2) +
                   '" y="' + (H - 1.6) + '">' + esc(p.short || p.label) + '</text>');
      }
      line.push(cx.toFixed(2) + ',' + y.toFixed(2));
    });

    if (points.length > 1 && opts.trend !== false) {
      parts.push('<polyline class="ch-trend" points="' + line.join(' ') + '"/>');
      line.forEach(function (pt) {
        var xy = pt.split(',');
        parts.push('<circle class="ch-dot" cx="' + xy[0] + '" cy="' + xy[1] + '" r="0.7"/>');
      });
    }

    parts.push('</svg>');
    return parts.join('');
  }

  /** حلقة توزيع الخطورة */
  function donut(slices, opts) {
    opts = opts || {};
    var total = slices.reduce(function (a, s) { return a + s.value; }, 0);
    var R = 40, r = 25, cx = 50, cy = 50;
    var parts = ['<svg class="chart chart-donut" viewBox="0 0 100 100" role="img" aria-label="' +
                 esc(opts.title || 'توزيع') + '">'];

    if (total === 0) {
      parts.push('<circle cx="50" cy="50" r="' + ((R + r) / 2) + '" fill="none" stroke="#e2e8f0" stroke-width="' +
                 (R - r) + '"/></svg>');
      return parts.join('');
    }

    var angle = -Math.PI / 2;
    slices.forEach(function (s) {
      if (s.value <= 0) return;
      var sweep = (s.value / total) * Math.PI * 2;
      var a0 = angle, a1 = angle + sweep;
      angle = a1;
      var large = sweep > Math.PI ? 1 : 0;
      var p = [
        'M', (cx + R * Math.cos(a0)).toFixed(2), (cy + R * Math.sin(a0)).toFixed(2),
        'A', R, R, 0, large, 1, (cx + R * Math.cos(a1)).toFixed(2), (cy + R * Math.sin(a1)).toFixed(2),
        'L', (cx + r * Math.cos(a1)).toFixed(2), (cy + r * Math.sin(a1)).toFixed(2),
        'A', r, r, 0, large, 0, (cx + r * Math.cos(a0)).toFixed(2), (cy + r * Math.sin(a0)).toFixed(2),
        'Z'
      ].join(' ');
      parts.push('<path d="' + p + '" fill="' + s.color + '"><title>' +
                 esc(s.label + ': ' + fmt(s.value)) + '</title></path>');
    });

    parts.push('<text class="ch-center-num" x="50" y="49" text-anchor="middle">' + esc(fmt(total)) + '</text>');
    parts.push('<text class="ch-center-lbl" x="50" y="59" text-anchor="middle">' + esc(opts.centerLabel || 'حادثة') + '</text>');
    parts.push('</svg>');
    return parts.join('');
  }

  global.Charts = { barsH: barsH, timeSeries: timeSeries, donut: donut,
                    fmt: fmt, esc: esc, MONTHS_SHORT: MONTHS_SHORT };
})(typeof window !== 'undefined' ? window : globalThis);
