import { Stage } from "./three-setup.js";
import { ParticleSim } from "./particles/simulator.js";
import { PRESETS, defaultConfig, TEXTURES } from "./particles/presets.js";
import { toLuauSnippet, toLuauModule } from "./particles/luau-export.js";
import { defaultWeapon, WEAPON_STYLES, applyStyle, buildWeaponGroup, toLuauWeapon } from "./weapon/forge.js";
import { parseRbxmx, flatten } from "./scene/rbxmx.js";
import { buildSceneGroup, exportSceneLuau } from "./scene/scene-build.js";
import { parsePrompt, makeVariations } from "./generate/prompt-forge.js";
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
  scene: { instances: null, info: null, fileName: "" },
  gen: { prompt: "", enhanced: "", detected: null, base: null, variations: [], active: -1 },
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

// ---------- prompt forge (point 3) ----------
function swatch(spec) {
  const [r, g, b] = spec.glowColor || spec.bladeColor;
  return UI.el("span", { class: "swatch", style: `background: rgb(${r},${g},${b})` });
}

function loadGenSpec(spec, activeIdx) {
  state.gen.active = activeIdx;
  state.weapon = clone(spec);
  stage.setWeapon(buildWeaponGroup(state.weapon));
  buildGenerateControls();
  refreshExport();
}

function buildGenerateControls() {
  const g = state.gen;
  controlsEl.innerHTML = "";

  const box = UI.el("textarea", {
    class: "prompt-box",
    placeholder: 'e.g. "huge glowing cyberpunk katana, neon cyan and purple"',
  });
  box.value = g.prompt;

  const generate = () => {
    g.prompt = box.value.trim();
    if (!g.prompt) return;
    const { spec, enhancedPrompt, detected } = parsePrompt(g.prompt);
    g.base = spec;
    g.enhanced = enhancedPrompt;
    g.detected = detected;
    g.variations = makeVariations(spec, g.prompt, 6);
    loadGenSpec(spec, -1);
  };

  controlsEl.append(
    UI.section("Describe your item", [
      box,
      UI.el("div", { class: "gen-row" }, [
        UI.el("button", { onclick: generate }, "Generate"),
        UI.el("button", { class: "ghost", onclick: () => { box.value = ""; } }, "Clear"),
      ]),
      UI.el("p", { class: "tip" }, "Trend-informed original generation — no copying of creator assets. Try words like neon, frost, golden, anime, shadow, huge, tiny."),
    ])
  );

  if (g.enhanced) {
    const tags = [];
    if (g.detected.trend) tags.push(g.detected.trend);
    if (g.detected.type) tags.push(g.detected.type);
    if (g.detected.material) tags.push(g.detected.material);
    g.detected.colors.forEach((c) => tags.push(c));

    controlsEl.append(
      UI.section("Enhanced prompt", [
        UI.el("div", { class: "enhanced" }, [
          UI.el("span", { class: "lbl" }, "expanded internally, then generated"),
          g.enhanced,
          tags.length ? UI.el("div", { class: "chips" }, tags.map((t) => UI.el("span", { class: "tag" }, t))) : null,
        ]),
      ])
    );

    const grid = UI.el("div", { class: "variations" });
    grid.append(
      UI.el("button", { class: g.active === -1 ? "active" : "", onclick: () => loadGenSpec(g.base, -1) },
        [swatch(g.base), "Base"])
    );
    g.variations.forEach((v, i) => {
      grid.append(
        UI.el("button", { class: g.active === i ? "active" : "", onclick: () => loadGenSpec(v, i) },
          [swatch(v), "V" + (i + 1)])
      );
    });
    controlsEl.append(UI.section("Variations", [grid]));

    controlsEl.append(
      UI.section("Refine", [
        UI.el("div", { class: "gen-row" }, [
          UI.el("button", {
            onclick: () => { g.variations = makeVariations(g.base, g.prompt + "#" + Date.now(), 6); buildGenerateControls(); },
          }, "Recreate variations"),
          UI.el("button", {
            class: "ghost",
            onclick: () => { state.mode = "weapon"; setActiveTab("weapon"); render(); },
          }, "Edit in Forge"),
        ]),
      ])
    );
  }
}

// ---------- scene (point 1) ----------
function buildSceneControls() {
  const s = state.scene;
  controlsEl.innerHTML = "";

  const fileInput = UI.el("input", { type: "file", accept: ".rbxmx,.xml", style: "display:none" });
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const instances = parseRbxmx(reader.result);
        const { group, partCount, emitters } = buildSceneGroup(instances);
        s.instances = instances;
        s.info = { partCount, emitters };
        s.fileName = file.name;
        stage.setScene(group);
        buildSceneControls();
        refreshExport();
      } catch (err) {
        alert("Couldn't read .rbxmx: " + err.message);
      }
    };
    reader.readAsText(file);
  });

  controlsEl.append(
    UI.section("Import Roblox model", [
      UI.el("div", { class: "gen-row" }, [
        UI.el("button", { onclick: () => fileInput.click() }, "Import .rbxmx file"),
      ]),
      fileInput,
      UI.el("p", { class: "tip" }, "In Studio: right-click a model → Save to File → choose .rbxmx (not binary .rbxm). The parts render here and round-trip back to Luau."),
    ])
  );

  if (s.info) {
    controlsEl.append(
      UI.section("Loaded: " + s.fileName, [
        UI.el("div", { class: "chips" }, [
          UI.el("span", { class: "tag" }, s.info.partCount + " parts"),
          UI.el("span", { class: "tag" }, s.info.emitters.length + " emitters"),
        ]),
      ])
    );

    const rows = flatten(s.instances).slice(0, 80).map(({ instance, depth }) =>
      UI.el("div", { class: "row" }, [
        UI.el("span", { class: "tip", style: "padding-left:" + depth * 12 + "px" }, instance.className + " · " + instance.name),
      ])
    );
    controlsEl.append(UI.section("Instances", rows));

    controlsEl.append(
      UI.section("Scene", [
        UI.el("div", { class: "gen-row" }, [
          UI.el("button", {
            class: "ghost",
            onclick: () => { s.instances = null; s.info = null; s.fileName = ""; stage.setScene(null); buildSceneControls(); refreshExport(); },
          }, "Clear scene"),
        ]),
      ])
    );
  }
}

// ---------- export ----------
function refreshExport() {
  let code = "";
  if (state.mode === "particles") {
    if (state.exportFormat === "snippet") code = toLuauSnippet(state.cfg);
    else if (state.exportFormat === "module") code = toLuauModule(state.cfg);
    else code = JSON.stringify(state.cfg, null, 2);
  } else if (state.mode === "scene") {
    if (!state.scene.instances) code = "-- Import a .rbxmx file to generate scene code.";
    else if (state.exportFormat === "json") code = JSON.stringify(state.scene.instances, null, 2);
    else code = exportSceneLuau(state.scene.instances);
  } else {
    // weapon + generate share the Weapon Forge spec
    if (state.exportFormat === "json") code = JSON.stringify(state.weapon, null, 2);
    else code = toLuauWeapon(state.weapon);
  }
  exportEl.textContent = code;
}

function buildExportTabs() {
  exportTabs.innerHTML = "";
  const formats = state.mode === "particles"
    ? [["snippet", "Luau (paste & run)"], ["module", "ModuleScript"], ["json", "JSON config"]]
    : state.mode === "scene"
    ? [["luau", "Luau (rebuild scene)"], ["json", "JSON tree"]]
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
  sim.points.visible = state.mode === "particles";
  if (state.mode === "particles") {
    sim.setConfig(state.cfg);
    buildParticleControls();
  } else if (state.mode === "weapon") {
    stage.setWeapon(buildWeaponGroup(state.weapon));
    buildWeaponControls();
  } else if (state.mode === "generate") {
    stage.setWeapon(buildWeaponGroup(state.weapon));
    buildGenerateControls();
  } else if (state.mode === "scene") {
    buildSceneControls();
  }
  buildExportTabs();
  refreshExport();
}

function setActiveTab(mode) {
  document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === mode));
}

document.querySelectorAll("[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.mode = btn.dataset.tab;
    setActiveTab(state.mode);
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
  const name = (state.mode === "particles" ? state.cfg.name
    : state.mode === "scene" ? "ImportedScene"
    : state.weapon.style).replace(/\s+/g, "_");
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
      else if (state.mode === "weapon" || state.mode === "generate") state.weapon = { ...defaultWeapon(), ...obj };
      else { alert("Switch to Particle/Weapon/Prompt tab to load a JSON config."); return; }
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
