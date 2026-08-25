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

/* المصدر الوحيد للهيكل وترتيب السكربتات هو index.html — نستخرجهما منه بدل
   الاحتفاظ بنسخة ثانية تتأخر عن الأصل عند كل تعديل. */
const indexHtml = read('index.html');

const bodyMatch = /<body[^>]*>([\s\S]*)<\/body>/i.exec(indexHtml);
if (!bodyMatch) throw new Error('تعذّر العثور على <body> في index.html');

const scriptNames = [...indexHtml.matchAll(/<script src="assets\/([\w-]+)\.js"><\/script>/g)]
  .map((m) => m[1]);
if (!scriptNames.length) throw new Error('لم يُعثر على أي <script src="assets/…"> في index.html');

const scripts = scriptNames.map((n) => read(`assets/${n}.js`));

/* الهيكل نفسه، منزوعاً منه وسوم <script> الخارجية (تُدمج مضمّنة أدناه) */
const markup = bodyMatch[1]
  .replace(/<script src="assets\/[\w-]+\.js"><\/script>\s*/g, '')
  .trim();

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
