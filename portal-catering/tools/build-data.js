/**
 * tools/build-data.js — يولّد assets/data.js من data/catering_incidents_dataset.json
 * الهدف: أن يبقى الملفان متطابقين حرفياً. التشغيل: node tools/build-data.js
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcPath = path.join(root, 'data', 'catering_incidents_dataset.json');
const outPath = path.join(root, 'assets', 'data.js');

const json = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
const header = `/* eslint-disable */
/**
 * assets/data.js — بذرة البيانات المدمجة (Build-time import)
 * -----------------------------------------------------------
 * محتوى هذا الملف مطابق حرفياً لـ data/catering_incidents_dataset.json.
 * يُولَّد عبر: node tools/build-data.js  (لا تحرّره يدوياً).
 * يُنسخ عند أول تشغيل إلى localStorage ليصبح مصدر الحقيقة القابل للتعديل.
 */
window.PORTAL_SEED = `;

fs.writeFileSync(outPath, header + JSON.stringify(json, null, 2) + ';\n', 'utf8');
console.log(`تم توليد ${path.relative(root, outPath)} من ${json.events.length} فعالية.`);
