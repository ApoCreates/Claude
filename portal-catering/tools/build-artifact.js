/**
 * tools/build-artifact.js — يبني نسخة بملف واحد مكتفٍ ذاتياً من البروتوتايب.
 * التشغيل: node tools/build-artifact.js [outPath]
 *
 * لماذا: بيئات النشر المضمّنة (Artifacts) تستضيف صفحة واحدة بلا ملفات مجاورة،
 * وتغلّفها داخل هيكل <html><head></head><body> جاهز — لذا يُكتب محتوى الصفحة
 * مباشرة بلا وسوم html/head/body، ويُضبط اتجاه RTL على عنصر الجذر برمجياً.
 *
 * المصدر يبقى واحداً: هذا الملف يجمع assets/*.css و assets/*.js كما هي،
 * فأي تعديل على البروتوتايب ينعكس بإعادة التشغيل.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = process.argv[2] || path.join(root, 'dist', 'portal-artifact.html');

const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const css = read('assets/styles.css');
const scripts = ['data', 'logic', 'rule-engine', 'store', 'charts', 'app']
  .map((n) => read(`assets/${n}.js`));

/* الهيكل نفسه الموجود في index.html، منزوعاً منه وسوم المستند الخارجية */
const markup = `
<div class="app">
  <header class="topbar">
    <div class="brand">
      <div class="brand-mark" aria-hidden="true">P</div>
      <div class="brand-text">
        <b>Portal</b>
        <span>منصة إدارة هدر التموين وسلاسل الإمداد</span>
      </div>
    </div>

    <nav class="nav" id="nav" aria-label="التنقل الرئيسي"></nav>

    <div class="toolbar">
      <span class="chip" id="data-badge" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18);color:#c3d3e6">—</span>
      <button class="btn btn-sm" id="btn-export" title="تصدير كل البيانات بنفس المخطط الأصلي">⬇ تصدير</button>
      <button class="btn btn-sm" id="btn-import" title="استيراد ملف JSON (دمج أو استبدال)">⬆ استيراد</button>
      <button class="btn btn-sm" id="btn-reset" title="العودة إلى البيانات الأصلية العشرين">↺ إعادة تعيين</button>
    </div>
  </header>

  <div id="storage-warn"></div>
  <main class="main" id="view" role="main"></main>

  <footer class="footer">
    <span><b>Portal</b> — بروتوتايب تشغيلي يعمل بالكامل داخل المتصفح.</span>
    <span class="muted">بلا باك-إند · بلا مفاتيح · بلا اتصال خارجي — مصدر الحقيقة هو <code>localStorage</code>.</span>
    <span class="push muted">المنطق مطبَّق من <code>portal_logic.md</code> كوحدة قواعد حتمية.</span>
  </footer>
</div>

<input type="file" id="file-input" accept="application/json,.json" hidden>
<div id="modal-host"></div>
<div class="toast-host" id="toasts" aria-live="polite"></div>
`;

/* التصميم أحادي السمة عمداً (هوية مؤسسية فاتحة لعميل حكومي): الخلفية وكل لون
   مطليان صراحةً من الرموز، فتصمد الصفحة فوق أي أرضية يرسمها المضيف. */
const themeGuard = `
:root { color-scheme: light; }
html[dir="rtl"] body { direction: rtl; }
`;

const doc = `<title>منصة Portal لهدر التموين</title>
<meta name="description" content="بروتوتايب تشغيلي لإدارة هدر التموين وسلاسل الإمداد في الفعاليات: تصنيف سداسي، مصفوفة خطورة، ومحرك حتمي لتوليد الحلول.">
<style>
${css}
${themeGuard}</style>

<script>
/* اتجاه الصفحة يُضبط على عنصر الجذر لأن المستضيف يملك وسم <html> */
document.documentElement.setAttribute('lang', 'ar');
document.documentElement.setAttribute('dir', 'rtl');
</script>
${markup}
${scripts.map((src) => `<script>\n${src}\n</script>`).join('\n')}
`;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, doc, 'utf8');

const kb = (Buffer.byteLength(doc, 'utf8') / 1024).toFixed(0);
console.log(`تم بناء ${path.relative(root, out)} — ${kb} KB، ملف واحد بلا أي مورد خارجي.`);
