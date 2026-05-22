import { Stage } from "./three-setup.js";
import { ParticleSim } from "./particles/simulator.js";
import { PRESETS, defaultConfig, TEXTURES } from "./particles/presets.js";
import { toLuauSnippet, toLuauModule } from "./particles/luau-export.js";
import { defaultWeapon, WEAPON_STYLES, applyStyle, buildWeaponGroup, toLuauWeapon } from "./weapon/forge.js";
import * as UI from "./ui.js";

const clone = (o) => JSON.parse(JSON.stringify(o));

const stage = new Stage(document.getElementById("stage"));
const sim = new ParticleSim();
sim.addTo(stage.scene);

const state = {
  mode: "particles",
  cfg: { ...defaultConfig(), ...clone(PRESETS.fire) },
  weapon: defaultWeapon(),
  exportFormat: "snippet",
};

const controlsEl = document.getElementById("controls");
const exportEl = document.getElementById("exportCode");
const exportTabs = document.getElementById("exportTabs");

// ---------- particle controls ----------
function buildParticleControls() {
  const c = state.cfg;
  const refresh = () => { sim.setConfig(c); refreshExport(); };

  const presetSel = UI.selectControl("Preset", "—", ["—", ...Object.keys(PRESETS)], (key) => {
    if (key === "—") return;
    state.cfg = { ...defaultConfig(), ...clone(PRESETS[key]) };
    sim.setConfig(state.cfg);
    sim.reset();
    render();
  });

  const texOptions = Object.values(TEXTURES);
  controlsEl.innerHTML = "";
  controlsEl.append(
    UI.section("Preset", [presetSel]),
    UI.section("Emission", [
      UI.slider("Rate (particles/s)", c.rate, 0, 300, 1, (v) => { c.rate = v; refresh(); }),
      UI.rangeControl("Lifetime (s)", c.lifetime, 0, 5, 0.05, refresh),
      UI.rangeControl("Speed (studs/s)", c.speed, 0, 40, 0.1, refresh),
      UI.vectorControl("Spread Angle (°)", c.spreadAngle, 0, 180, 1, refresh),
      UI.selectControl("Emission Direction", c.emissionDirection,
        ["Top", "Bottom", "Front", "Back", "Left", "Right"], (v) => { c.emissionDirection = v; refresh(); }),
      UI.checkbox("Enabled", c.enabled, (v) => { c.enabled = v; refresh(); }),
    ]),
    UI.section("Motion", [
      UI.vectorControl("Acceleration (studs/s²)", c.acceleration, -50, 50, 0.5, refresh),
      UI.slider("Drag", c.drag, 0, 10, 0.1, (v) => { c.drag = v; refresh(); }),
      UI.rangeControl("Rotation (°)", c.rotation, 0, 360, 1, refresh),
      UI.rangeControl("Rot Speed (°/s)", c.rotSpeed, -360, 360, 1, refresh),
    ]),
    UI.section("Appearance", [
      UI.selectControl("Texture", c.texture, texOptions, (v) => { c.texture = v; refresh(); }),
      UI.selectControl("Blend (preview)", c.blend, ["additive", "normal"], (v) => { c.blend = v; refresh(); }),
      UI.slider("Light Emission", c.lightEmission, 0, 1, 0.01, (v) => { c.lightEmission = v; refresh(); }),
      UI.slider("Light Influence", c.lightInfluence, 0, 1, 0.01, (v) => { c.lightInfluence = v; refresh(); }),
      UI.slider("Brightness", c.brightness, 0, 5, 0.05, (v) => { c.brightness = v; refresh(); }),
      UI.slider("Z Offset", c.zOffset, -5, 5, 0.1, (v) => { c.zOffset = v; refresh(); }),
      UI.slider("Time Scale", c.timeScale, 0, 3, 0.05, (v) => { c.timeScale = v; refresh(); }),
    ]),
    UI.section("Color over life", [UI.colorSequenceEditor("ColorSequence", c.color, refresh)]),
    UI.section("Size over life", [UI.numberSequenceEditor("Size (studs)", c.size, 10, refresh)]),
    UI.section("Transparency over life", [UI.numberSequenceEditor("Transparency (0=opaque)", c.transparency, 1, refresh)]),
  );
}

// ---------- weapon controls ----------
function buildWeaponControls() {
  const w = state.weapon;
  const refresh = () => { stage.setWeapon(buildWeaponGroup(w)); refreshExport(); };

  const styleSel = UI.selectControl("Style", w.style, Object.keys(WEAPON_STYLES), (v) => {
    state.weapon = applyStyle({}, v);
    render();
  });

  controlsEl.innerHTML = "";
  controlsEl.append(
    UI.section("Style", [styleSel,
      UI.el("button", { class: "mini add", onclick: randomizeWeapon }, "🎲 Randomize")]),
    UI.section("Blade", [
      UI.slider("Length", w.bladeLength, 0.5, 10, 0.1, (v) => { w.bladeLength = v; refresh(); }),
      UI.slider("Width", w.bladeWidth, 0.1, 2, 0.01, (v) => { w.bladeWidth = v; refresh(); }),
      UI.slider("Thickness", w.bladeThickness, 0.05, 0.6, 0.01, (v) => { w.bladeThickness = v; refresh(); }),
      UI.slider("Tip Taper", w.bladeTaper, 0.05, 1, 0.01, (v) => { w.bladeTaper = v; refresh(); }),
      UI.checkbox("Fuller (groove)", w.fuller, (v) => { w.fuller = v; refresh(); }),
      UI.selectControl("Blade Material", w.bladeMaterial, ["Metal", "Neon", "Glass", "Marble", "SmoothPlastic"], (v) => { w.bladeMaterial = v; refresh(); }),
      UI.colorField("Blade Color", w.bladeColor, refresh),
      UI.colorField("Glow / Fuller Color", w.glowColor, refresh),
    ]),
    UI.section("Guard", [
      UI.slider("Guard Width", w.guardWidth, 0.3, 3, 0.05, (v) => { w.guardWidth = v; refresh(); }),
      UI.slider("Guard Depth", w.guardDepth, 0.1, 1.5, 0.05, (v) => { w.guardDepth = v; refresh(); }),
      UI.slider("Guard Thickness", w.guardThickness, 0.05, 0.6, 0.01, (v) => { w.guardThickness = v; refresh(); }),
      UI.colorField("Guard Color", w.guardColor, refresh),
    ]),
    UI.section("Grip & Pommel", [
      UI.slider("Grip Length", w.gripLength, 0.4, 3, 0.05, (v) => { w.gripLength = v; refresh(); }),
      UI.slider("Grip Radius", w.gripRadius, 0.05, 0.4, 0.01, (v) => { w.gripRadius = v; refresh(); }),
      UI.slider("Pommel Size", w.pommelSize, 0.1, 1, 0.01, (v) => { w.pommelSize = v; refresh(); }),
      UI.colorField("Grip Color", w.gripColor, refresh),
      UI.colorField("Pommel Color", w.pommelColor, refresh),
    ]),
  );
}

function randomizeWeapon() {
  const styles = Object.keys(WEAPON_STYLES);
  const base = applyStyle({}, styles[Math.floor(Math.random() * styles.length)]);
  const j = (v, amt) => Math.max(0.05, v * (1 + (Math.random() * 2 - 1) * amt));
  base.bladeLength = j(base.bladeLength, 0.3);
  base.bladeWidth = j(base.bladeWidth, 0.3);
  base.bladeTaper = Math.random() * 0.9 + 0.1;
  base.fuller = Math.random() > 0.4;
  const rndColor = () => [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)];
  base.glowColor = rndColor();
  if (Math.random() > 0.6) { base.bladeMaterial = "Neon"; base.bladeColor = rndColor(); }
  state.weapon = base;
  render();
}

// ---------- export ----------
function refreshExport() {
  let code = "";
  if (state.mode === "particles") {
    if (state.exportFormat === "snippet") code = toLuauSnippet(state.cfg);
    else if (state.exportFormat === "module") code = toLuauModule(state.cfg);
    else code = JSON.stringify(state.cfg, null, 2);
  } else {
    if (state.exportFormat === "json") code = JSON.stringify(state.weapon, null, 2);
    else code = toLuauWeapon(state.weapon);
  }
  exportEl.textContent = code;
}

function buildExportTabs() {
  exportTabs.innerHTML = "";
  const formats = state.mode === "particles"
    ? [["snippet", "Luau (paste & run)"], ["module", "ModuleScript"], ["json", "JSON config"]]
    : [["luau", "Luau (welded Model)"], ["json", "JSON config"]];
  if (!formats.find((f) => f[0] === state.exportFormat)) state.exportFormat = formats[0][0];
  for (const [key, label] of formats) {
    exportTabs.appendChild(UI.el("button", {
      class: "etab" + (key === state.exportFormat ? " active" : ""),
      onclick: () => { state.exportFormat = key; buildExportTabs(); refreshExport(); },
    }, label));
  }
}

// ---------- mode / render ----------
function render() {
  stage.setMode(state.mode);
  if (state.mode === "particles") {
    sim.setConfig(state.cfg);
    buildParticleControls();
  } else {
    stage.setWeapon(buildWeaponGroup(state.weapon));
    buildWeaponControls();
  }
  buildExportTabs();
  refreshExport();
}

document.querySelectorAll("[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.mode = btn.dataset.tab;
    document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });
});

document.getElementById("copyBtn").addEventListener("click", async () => {
  await navigator.clipboard.writeText(exportEl.textContent);
  flash(document.getElementById("copyBtn"), "Copied!");
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  const isJson = state.exportFormat === "json";
  const ext = isJson ? "json" : "lua";
  const name = (state.mode === "particles" ? state.cfg.name : state.weapon.style).replace(/\s+/g, "_");
  download(`${name}.${ext}`, exportEl.textContent);
});

document.getElementById("loadFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(reader.result);
      if (state.mode === "particles") state.cfg = { ...defaultConfig(), ...obj };
      else state.weapon = { ...defaultWeapon(), ...obj };
      sim.reset();
      render();
    } catch (err) { alert("Invalid JSON config: " + err.message); }
  };
  reader.readAsText(file);
});

function flash(btn, text) {
  const old = btn.textContent;
  btn.textContent = text;
  setTimeout(() => (btn.textContent = old), 1200);
}
function download(filename, text) {
  const a = UI.el("a", { href: "data:text/plain;charset=utf-8," + encodeURIComponent(text), download: filename });
  document.body.appendChild(a); a.click(); a.remove();
}

// ---------- loop ----------
let last = performance.now();
function loop(now) {
  const dt = (now - last) / 1000;
  last = now;
  sim.setFocal(stage.focalPx());
  if (state.mode === "particles") sim.update(dt);
  stage.render();
  requestAnimationFrame(loop);
}

render();
requestAnimationFrame(loop);
