/* eslint-disable */
/**
 * assets/xlsx.js — قراءة وكتابة ملفات Excel داخل المتصفح، بلا أي مكتبة وبلا API
 * =============================================================================
 * ملف .xlsx هو أرشيف ZIP يحوي ملفات XML. لذلك نحتاج شيئين فقط:
 *
 *   الكتابة  → ZIP بلا ضغط (طريقة "store")، وهي صيغة يفتحها Excel وNumbers
 *              وGoogle Sheets بلا مشكلة. نحسب CRC32 يدوياً ونركّب الترويسات.
 *   القراءة  → فك ضغط DEFLATE عبر DecompressionStream('deflate-raw') المدمج
 *              في المتصفح (وNode 18+)، فلا نحتاج مكتبة inflate إطلاقاً.
 *
 * المدى المدعوم مقصود ومحدود: أوراق عمل بخلايا نصية ورقمية وتواريخ — وهو
 * كل ما يلزم لنموذج تعبئة بشري.
 */
(function (global) {
  'use strict';

  /* ================================================================== *
   * أدوات بايت
   * ================================================================== */
  var enc = new TextEncoder();

  function u8(str) { return enc.encode(str); }

  function concat(parts) {
    var len = parts.reduce(function (a, p) { return a + p.length; }, 0);
    var out = new Uint8Array(len), at = 0;
    parts.forEach(function (p) { out.set(p, at); at += p.length; });
    return out;
  }

  function le16(n) { return new Uint8Array([n & 255, (n >>> 8) & 255]); }
  function le32(n) {
    return new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);
  }

  /* جدول CRC32 يُبنى مرة واحدة */
  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var i = 0; i < 256; i++) {
      var c = i;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  /* ================================================================== *
   * ZIP — كتابة بطريقة store (بلا ضغط)
   * ================================================================== */
  /* تاريخ DOS ثابت (1980-01-01، منتصف الليل) ليكون البناء حتمياً ويبقى التاريخ صالحاً:
     الشهر 0 الذي ينتج عن ترك الحقل صفراً تاريخ غير قانوني تعترض عليه بعض الأدوات. */
  var DOS_TIME = 0;
  var DOS_DATE = (0 << 9) | (1 << 5) | 1;

  function zipStore(files) {
    var locals = [], centrals = [], offset = 0;

    files.forEach(function (f) {
      var name = u8(f.name);
      var data = typeof f.data === 'string' ? u8(f.data) : f.data;
      var crc = crc32(data);

      var localHeader = concat([
        le32(0x04034b50), le16(20), le16(0x0800), le16(0),   // 0x0800 = أسماء UTF-8
        le16(DOS_TIME), le16(DOS_DATE),                       // وقت/تاريخ ثابتان (بناء حتمي)
        le32(crc), le32(data.length), le32(data.length),
        le16(name.length), le16(0), name
      ]);
      locals.push(localHeader, data);

      centrals.push(concat([
        le32(0x02014b50), le16(20), le16(20), le16(0x0800), le16(0),
        le16(DOS_TIME), le16(DOS_DATE),
        le32(crc), le32(data.length), le32(data.length),
        le16(name.length), le16(0), le16(0), le16(0), le16(0), le32(0),
        le32(offset), name
      ]));

      offset += localHeader.length + data.length;
    });

    var central = concat(centrals);
    var end = concat([
      le32(0x06054b50), le16(0), le16(0),
      le16(files.length), le16(files.length),
      le32(central.length), le32(offset), le16(0)
    ]);

    return concat([concat(locals), central, end]);
  }

  /* ================================================================== *
   * ZIP — قراءة (store + deflate عبر DecompressionStream)
   * ================================================================== */
  async function unzip(bytes) {
    var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    // ابحث عن سجل نهاية الدليل المركزي من آخر الملف
    var eocd = -1;
    for (var i = bytes.length - 22; i >= 0 && i >= bytes.length - 66000; i--) {
      if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd === -1) throw new Error('الملف ليس أرشيف ZIP صالحاً (لم يُعثر على دليله).');

    var count = view.getUint16(eocd + 10, true);
    var dirOffset = view.getUint32(eocd + 16, true);
    var out = {};
    var p = dirOffset;

    for (var n = 0; n < count; n++) {
      if (view.getUint32(p, true) !== 0x02014b50) break;
      var method = view.getUint16(p + 10, true);
      var compSize = view.getUint32(p + 20, true);
      var nameLen = view.getUint16(p + 28, true);
      var extraLen = view.getUint16(p + 30, true);
      var commentLen = view.getUint16(p + 32, true);
      var localOff = view.getUint32(p + 42, true);
      var name = new TextDecoder('utf-8').decode(bytes.subarray(p + 46, p + 46 + nameLen));

      // ترويسة الملف المحلي: الطول الفعلي للاسم/الإضافات قد يختلف عن المركزي
      var lNameLen = view.getUint16(localOff + 26, true);
      var lExtraLen = view.getUint16(localOff + 28, true);
      var dataStart = localOff + 30 + lNameLen + lExtraLen;
      var raw = bytes.subarray(dataStart, dataStart + compSize);

      if (method === 0) {
        out[name] = raw;
      } else if (method === 8) {
        out[name] = await inflateRaw(raw);
      } else {
        throw new Error('طريقة ضغط غير مدعومة داخل الملف: ' + method);
      }

      p += 46 + nameLen + extraLen + commentLen;
    }
    return out;
  }

  async function inflateRaw(bytes) {
    if (typeof DecompressionStream !== 'function') {
      throw new Error('هذا المتصفح لا يدعم فك ضغط الملفات — حدّثه أو استخدم صيغة CSV.');
    }
    var ds = new DecompressionStream('deflate-raw');
    var writer = ds.writable.getWriter();
    writer.write(bytes);
    writer.close();

    // نقرأ التدفّق يدوياً بدل Blob/Response ليعمل الكود في المتصفح وNode معاً
    var reader = ds.readable.getReader();
    var chunks = [], total = 0;
    for (;;) {
      var step = await reader.read();
      if (step.done) break;
      chunks.push(step.value);
      total += step.value.length;
    }
    var out = new Uint8Array(total), at = 0;
    chunks.forEach(function (c) { out.set(c, at); at += c.length; });
    return out;
  }

  /* ================================================================== *
   * XML
   * ================================================================== */
  function xmlEsc(v) {
    return String(v === null || v === undefined ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
      // Excel يرفض محارف التحكم
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  }

  /** رقم العمود → حرفه (1 → A، 27 → AA) */
  function colName(n) {
    var s = '';
    while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; }
    return s;
  }

  /* ================================================================== *
   * الكتابة: مصنّف من أوراق بسيطة
   * sheets = [{ name, rows: [[cell, ...], ...], widths: [n, ...], freeze: 1 }]
   * الخلية إما قيمة مباشرة أو { v, style }
   * ================================================================== */
  var STYLE = { normal: 0, header: 1, title: 2, note: 3, example: 4 };

  function buildSheetXml(sheet) {
    var rows = sheet.rows.map(function (cells, r) {
      var rowNum = r + 1;
      var xml = cells.map(function (cell, c) {
        var value = cell && typeof cell === 'object' && 'v' in cell ? cell.v : cell;
        var style = cell && typeof cell === 'object' && cell.style ? cell.style : 0;
        if (value === null || value === undefined || value === '') {
          return style ? '<c r="' + colName(c + 1) + rowNum + '" s="' + style + '"/>' : '';
        }
        var ref = colName(c + 1) + rowNum;
        var sAttr = style ? ' s="' + style + '"' : '';
        if (typeof value === 'number' && isFinite(value)) {
          return '<c r="' + ref + '"' + sAttr + '><v>' + value + '</v></c>';
        }
        // نص مضمّن (inlineStr) — يتجنّب جدول السلاسل المشتركة ويبقى الملف بسيطاً
        return '<c r="' + ref + '" t="inlineStr"' + sAttr + '><is><t xml:space="preserve">' +
               xmlEsc(value) + '</t></is></c>';
      }).join('');
      return '<row r="' + rowNum + '">' + xml + '</row>';
    }).join('');

    var cols = (sheet.widths || []).map(function (w, i) {
      return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>';
    }).join('');

    var freeze = sheet.freeze
      ? '<sheetViews><sheetView rightToLeft="1" workbookViewId="0">' +
        '<pane ySplit="' + sheet.freeze + '" topLeftCell="A' + (sheet.freeze + 1) +
        '" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
      : '<sheetViews><sheetView rightToLeft="1" workbookViewId="0"/></sheetViews>';

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      freeze +
      (cols ? '<cols>' + cols + '</cols>' : '') +
      '<sheetData>' + rows + '</sheetData></worksheet>';
  }

  /* أنماط: عادي، ترويسة، عنوان، ملاحظة، مثال */
  var STYLES_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="5">' +
      '<font><sz val="11"/><name val="Calibri"/></font>' +
      '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>' +
      '<font><b/><sz val="14"/><color rgb="FF0D1B2E"/><name val="Calibri"/></font>' +
      '<font><i/><sz val="10"/><color rgb="FF64748B"/><name val="Calibri"/></font>' +
      '<font><sz val="11"/><color rgb="FF4D5F76"/><name val="Calibri"/></font>' +
    '</fonts>' +
    '<fills count="4">' +
      '<fill><patternFill patternType="none"/></fill>' +
      '<fill><patternFill patternType="gray125"/></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FF1C3557"/><bgColor indexed="64"/></patternFill></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FFF1F5FA"/><bgColor indexed="64"/></patternFill></fill>' +
    '</fills>' +
    '<borders count="2">' +
      '<border><left/><right/><top/><bottom/><diagonal/></border>' +
      '<border><left style="thin"><color rgb="FFD3DBE5"/></left><right style="thin"><color rgb="FFD3DBE5"/></right>' +
      '<top style="thin"><color rgb="FFD3DBE5"/></top><bottom style="thin"><color rgb="FFD3DBE5"/></bottom><diagonal/></border>' +
    '</borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="5">' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1" readingOrder="2"/></xf>' +
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1" readingOrder="2"/></xf>' +
      '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center" readingOrder="2"/></xf>' +
      '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center" wrapText="1" readingOrder="2"/></xf>' +
      '<xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1" readingOrder="2"/></xf>' +
    '</cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>';

  function write(sheets) {
    var sheetEntries = sheets.map(function (s, i) {
      return { name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: buildSheetXml(s) };
    });

    var workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets>' + sheets.map(function (s, i) {
        return '<sheet name="' + xmlEsc(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>';
      }).join('') + '</sheets></workbook>';

    var wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheets.map(function (s, i) {
        return '<Relationship Id="rId' + (i + 1) +
               '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"' +
               ' Target="worksheets/sheet' + (i + 1) + '.xml"/>';
      }).join('') +
      '<Relationship Id="rId' + (sheets.length + 1) +
      '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '</Relationships>';

    var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      sheets.map(function (s, i) {
        return '<Override PartName="/xl/worksheets/sheet' + (i + 1) +
               '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
      }).join('') +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      '</Types>';

    var rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>';

    return zipStore([
      { name: '[Content_Types].xml', data: contentTypes },
      { name: '_rels/.rels', data: rootRels },
      { name: 'xl/workbook.xml', data: workbook },
      { name: 'xl/_rels/workbook.xml.rels', data: wbRels },
      { name: 'xl/styles.xml', data: STYLES_XML }
    ].concat(sheetEntries));
  }

  /* ================================================================== *
   * القراءة: مصنّف → { اسم الورقة: [[نص, ...], ...] }
   * ================================================================== */
  /**
   * محلّل XML صغير مكتفٍ بذاته.
   * السبب: DOMParser متاح في المتصفح فقط، ونريد للمحرك أن يُختبر في Node أيضاً.
   * لا يدعم إلا ما يحتاجه مصنّف xlsx: عناصر، سمات، ونص.
   */
  var XML_ENTITIES = {
    'lt': '<', 'gt': '>', 'amp': '&', 'quot': '"', 'apos': "'"
  };

  function xmlUnescape(s) {
    return String(s).replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, function (m, ent) {
      if (ent.charAt(0) === '#') {
        var code = ent.charAt(1) === 'x' || ent.charAt(1) === 'X'
          ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
        return isFinite(code) ? String.fromCodePoint(code) : m;
      }
      return XML_ENTITIES[ent] !== undefined ? XML_ENTITIES[ent] : m;
    });
  }

  function XmlNode(tag, attrs) {
    this.tag = tag;
    this.attrs = attrs || {};
    this.children = [];
    this.text = '';
  }

  XmlNode.prototype.getAttribute = function (name) {
    return this.attrs[name] !== undefined ? this.attrs[name] : null;
  };

  XmlNode.prototype.getElementsByTagName = function (name) {
    var out = [];
    (function walk(node) {
      node.children.forEach(function (child) {
        if (child.tag === name) out.push(child);
        walk(child);
      });
    })(this);
    return out;
  };

  Object.defineProperty(XmlNode.prototype, 'textContent', {
    get: function () {
      var s = this.text;
      this.children.forEach(function (c) { s += c.textContent; });
      return s;
    }
  });

  var ATTR_RE = /([\w:.-]+)\s*=\s*"([^"]*)"|([\w:.-]+)\s*=\s*'([^']*)'/g;

  function parseAttrs(src) {
    var attrs = {}, m;
    ATTR_RE.lastIndex = 0;
    while ((m = ATTR_RE.exec(src))) {
      if (m[1] !== undefined) attrs[m[1]] = xmlUnescape(m[2]);
      else attrs[m[3]] = xmlUnescape(m[4]);
    }
    return attrs;
  }

  function parseXmlText(text) {
    var root = new XmlNode('#document');
    var stack = [root];
    // <?…?> و<!--…--> و<![CDATA[…]]> والعناصر العادية
    var re = /<!\[CDATA\[([\s\S]*?)\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<\/\s*([\w:.-]+)\s*>|<\s*([\w:.-]+)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
    var last = 0, m;

    function addText(chunk, raw) {
      if (!chunk) return;
      stack[stack.length - 1].text += raw ? chunk : xmlUnescape(chunk);
    }

    while ((m = re.exec(text))) {
      addText(text.slice(last, m.index));
      last = re.lastIndex;

      if (m[1] !== undefined) { addText(m[1], true); continue; }   // CDATA
      if (m[2] !== undefined) {                                     // إغلاق
        for (var i = stack.length - 1; i > 0; i--) {
          if (stack[i].tag === m[2]) { stack.length = i; break; }
        }
        continue;
      }
      if (m[3] !== undefined) {                                     // فتح
        var node = new XmlNode(m[3], parseAttrs(m[4] || ''));
        stack[stack.length - 1].children.push(node);
        if (!m[5]) stack.push(node);
        continue;
      }
      // تعليق أو تعليمة معالجة — تُتجاهل
    }
    addText(text.slice(last));
    return root;
  }

  function parseXml(text) {
    if (typeof global.DOMParser === 'function') {
      return new global.DOMParser().parseFromString(text, 'application/xml');
    }
    return parseXmlText(text);
  }

  function decode(bytes) { return new TextDecoder('utf-8').decode(bytes); }

  /** مرجع الخلية → فهرس العمود (A1 → 0) */
  function colIndex(ref) {
    var m = /^([A-Z]+)/.exec(ref || '');
    if (!m) return 0;
    var n = 0;
    for (var i = 0; i < m[1].length; i++) n = n * 26 + (m[1].charCodeAt(i) - 64);
    return n - 1;
  }

  async function read(bytes) {
    var files = await unzip(bytes);

    // السلاسل المشتركة (Excel يستعملها افتراضياً)
    var shared = [];
    if (files['xl/sharedStrings.xml']) {
      var sdoc = parseXml(decode(files['xl/sharedStrings.xml']));
      var sis = sdoc.getElementsByTagName('si');
      for (var i = 0; i < sis.length; i++) {
        // اجمع كل عقد <t> داخل العنصر (النص قد يكون مجزّأً على تنسيقات)
        var ts = sis[i].getElementsByTagName('t');
        var s = '';
        for (var j = 0; j < ts.length; j++) s += ts[j].textContent;
        shared.push(s);
      }
    }

    // أسماء الأوراق بترتيبها
    var names = [];
    if (files['xl/workbook.xml']) {
      var wdoc = parseXml(decode(files['xl/workbook.xml']));
      var ns = wdoc.getElementsByTagName('sheet');
      for (var k = 0; k < ns.length; k++) names.push(ns[k].getAttribute('name'));
    }

    var out = {};
    Object.keys(files)
      .filter(function (n) { return /^xl\/worksheets\/sheet\d+\.xml$/.test(n); })
      .sort(function (a, b) {
        return parseInt(/(\d+)/.exec(a)[1], 10) - parseInt(/(\d+)/.exec(b)[1], 10);
      })
      .forEach(function (path, idx) {
        var doc = parseXml(decode(files[path]));
        var rowsEl = doc.getElementsByTagName('row');
        var rows = [];
        for (var r = 0; r < rowsEl.length; r++) {
          var cells = rowsEl[r].getElementsByTagName('c');
          var row = [];
          for (var c = 0; c < cells.length; c++) {
            var cell = cells[c];
            var at = colIndex(cell.getAttribute('r'));
            var type = cell.getAttribute('t');
            var value = '';
            if (type === 'inlineStr') {
              var its = cell.getElementsByTagName('t');
              for (var q = 0; q < its.length; q++) value += its[q].textContent;
            } else {
              var vs = cell.getElementsByTagName('v');
              var raw = vs.length ? vs[0].textContent : '';
              if (type === 's') value = shared[parseInt(raw, 10)] || '';
              else if (type === 'str') value = raw;
              else value = raw;
            }
            while (row.length < at) row.push('');
            row[at] = String(value).trim();
          }
          rows.push(row);
        }
        out[names[idx] || ('Sheet' + (idx + 1))] = rows;
      });

    return out;
  }

  /* ================================================================== *
   * CSV — مسار احتياطي بسيط لمن يفضّله
   * ================================================================== */
  function toCsv(rows) {
    return '﻿' + rows.map(function (r) {
      return r.map(function (cell) {
        var v = cell && typeof cell === 'object' && 'v' in cell ? cell.v : cell;
        v = v === null || v === undefined ? '' : String(v);
        return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(',');
    }).join('\r\n');
  }

  function fromCsv(text) {
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    var rows = [], row = [], cell = '', inQ = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (inQ) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false;
        } else cell += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ',') { row.push(cell.trim()); cell = ''; }
      else if (ch === '\n') { row.push(cell.trim()); rows.push(row); row = []; cell = ''; }
      else if (ch !== '\r') cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell.trim()); rows.push(row); }
    return rows;
  }

  global.Xlsx = {
    write: write,
    read: read,
    toCsv: toCsv,
    fromCsv: fromCsv,
    STYLE: STYLE,
    _zipStore: zipStore,
    _unzip: unzip,
    _crc32: crc32
  };
})(typeof window !== 'undefined' ? window : globalThis);
