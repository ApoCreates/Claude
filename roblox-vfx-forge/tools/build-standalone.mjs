// Bundles the ES-module app into a single double-clickable standalone.html.
// Strips import/export, swaps the module Three.js + OrbitControls for the
// global (UMD) Three.js build loaded via a classic <script> (which, unlike ES
// modules, loads cross-origin from file:// — so the file works on double-click).
//
//   node tools/build-standalone.mjs
//
// Output: roblox-vfx-forge/standalone.html

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// concatenation order respects definition dependencies
const FILES = [
  "js/particles/sequences.js",
  "js/particles/presets.js",
  "js/particles/luau-export.js",
  "js/ui.js",
  "__ORBIT__",
  "js/three-setup.js",
  "js/particles/simulator.js",
  "js/weapon/forge.js",
  "__UINS__",
  "js/app.js",
];

const ORBIT = `
// minimal orbit controls (replaces three/addons OrbitControls for standalone)
class OrbitControls {
  constructor(camera, dom) {
    this.camera = camera; this.dom = dom;
    this.target = new THREE.Vector3();
    this.enableDamping = false; this.dampingFactor = 0.08;
    this._s = new THREE.Spherical(); this._t = new THREE.Spherical();
    const off = new THREE.Vector3().subVectors(camera.position, this.target);
    this._s.setFromVector3(off); this._t.copy(this._s);
    let drag = false, px = 0, py = 0;
    dom.addEventListener("pointerdown", (e) => { drag = true; px = e.clientX; py = e.clientY; });
    window.addEventListener("pointerup", () => { drag = false; });
    window.addEventListener("pointermove", (e) => {
      if (!drag) return;
      this._t.theta -= (e.clientX - px) * 0.005;
      this._t.phi -= (e.clientY - py) * 0.005;
      this._t.phi = Math.max(0.05, Math.min(Math.PI - 0.05, this._t.phi));
      px = e.clientX; py = e.clientY;
    });
    dom.addEventListener("wheel", (e) => {
      e.preventDefault();
      this._t.radius *= 1 + Math.sign(e.deltaY) * 0.1;
      this._t.radius = Math.max(1.5, Math.min(80, this._t.radius));
    }, { passive: false });
  }
  update() {
    const k = this.enableDamping ? this.dampingFactor : 1;
    this._s.theta += (this._t.theta - this._s.theta) * k;
    this._s.phi += (this._t.phi - this._s.phi) * k;
    this._s.radius += (this._t.radius - this._s.radius) * k;
    this.camera.position.copy(this.target).add(new THREE.Vector3().setFromSpherical(this._s));
    this.camera.lookAt(this.target);
  }
}
`;

const UINS = `
const UI = { el, row, slider, rangeControl, selectControl, checkbox,
  vectorControl, colorField, colorSequenceEditor, numberSequenceEditor, section };
`;

function strip(src) {
  return src
    .split("\n")
    .filter((line) => !/^\s*import\s.+;?\s*$/.test(line))
    .join("\n")
    .replace(/(^|\n)export\s+(function|const|class|let|var)\b/g, "$1$2");
}

let bundle = "";
for (const f of FILES) {
  if (f === "__ORBIT__") { bundle += ORBIT + "\n"; continue; }
  if (f === "__UINS__") { bundle += UINS + "\n"; continue; }
  bundle += "\n// ===== " + f + " =====\n" + strip(readFileSync(join(root, f), "utf8")) + "\n";
}

const guard = `if (typeof THREE === "undefined") {
  document.body.innerHTML = '<div style="color:#e6edf3;font-family:sans-serif;padding:40px;max-width:560px;margin:auto"><h2>Couldn\\'t load three.js</h2><p>This standalone file pulls three.js from a CDN, so it needs an internet connection the first time. Check your connection and reload — or use the local-server method from the README.</p></div>';
  throw new Error("three.js missing");
}`;

const wrapped = "(function(){\n" + guard + "\n" + bundle + "\n})();";

const css = readFileSync(join(root, "css/style.css"), "utf8");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Roblox VFX Forge — standalone</title>
  <style>
${css}
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
  <header class="topbar">
    <div class="brand">⚡ Roblox <b>VFX Forge</b></div>
    <nav class="tabs">
      <button data-tab="particles" class="active">Particle Studio</button>
      <button data-tab="weapon">Weapon Forge</button>
    </nav>
    <div class="topbar-right">
      <label class="loadbtn">Load JSON
        <input type="file" id="loadFile" accept="application/json" hidden />
      </label>
    </div>
  </header>
  <main class="layout">
    <aside class="panel" id="controls"></aside>
    <section class="viewport">
      <canvas id="stage"></canvas>
      <div class="hint">drag to orbit · scroll to zoom</div>
    </section>
    <aside class="export">
      <div class="export-head">
        <h3>Export to Roblox</h3>
        <div class="etabs" id="exportTabs"></div>
      </div>
      <pre id="exportCode" class="code"></pre>
      <div class="export-actions">
        <button id="copyBtn" class="primary">Copy</button>
        <button id="downloadBtn">Download</button>
      </div>
      <p class="tip">Paste <b>Luau (paste &amp; run)</b> into Studio's Command Bar with a Part selected — or load the JSON with the included plugin.</p>
    </aside>
  </main>
  <script>
${wrapped}
  </script>
</body>
</html>
`;

writeFileSync(join(root, "standalone.html"), html);
// also emit the raw bundle for syntax checking
writeFileSync(join(here, "_bundle.check.js"), wrapped);
console.log("Wrote standalone.html (" + html.length + " bytes)");
