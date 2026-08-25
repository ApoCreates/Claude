/**
 * tools/sync-public.js — ينسخ البروتوتايب إلى public/portal-app/ في تطبيق Next.js
 * التشغيل: node tools/sync-public.js   (أو npm run build:public)
 *
 * لماذا: Vercel يخدم ما في public/ كملفات ثابتة، فيصير البروتوتايب متاحاً على
 * الرابط المنشور عبر مسار /portal دون أن يلمس كود التطبيق أو يحتاج أي API.
 * المصدر يبقى portal-catering/ — هذا النسخ مشتق، وأي تعديل ينعكس بإعادة التشغيل.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');          // portal-catering/
const repo = path.resolve(root, '..');               // جذر المستودع
const dest = path.join(repo, 'public', 'portal-app');

/** ما يُنشر فعلاً: صفحة الدخول + الأصول + المراجع. لا أدوات بناء ولا dist. */
const FILES = ['index.html'];
const DIRS = ['assets', 'data'];

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  let n = 0;
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const out = path.join(to, entry.name);
    if (entry.isDirectory()) n += copyDir(src, out);
    else { fs.copyFileSync(src, out); n++; }
  }
  return n;
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });

let count = 0;
for (const f of FILES) {
  fs.copyFileSync(path.join(root, f), path.join(dest, f));
  count++;
}
for (const d of DIRS) {
  count += copyDir(path.join(root, d), path.join(dest, d));
}

console.log(`نُسخ ${count} ملفاً إلى ${path.relative(repo, dest)} — متاح على /portal بعد النشر.`);
