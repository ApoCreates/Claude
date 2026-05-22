# ⚡ Roblox VFX Forge

A web-based generator that **automates two of the most time-consuming jobs in Roblox item production**:

1. **Particle Studio** — design `ParticleEmitter` effects (fire, ice, magic, smoke, electric, heal, sword trails…) with a **live 3D preview**, then export **exact Roblox Luau** or a JSON config.
2. **Weapon Forge** — a **parametric** sword/item generator. Tweak sliders (or hit Randomize) and export a **native, welded Roblox Model** built from real `BaseParts` — no asset upload, fully editable in Studio.
3. **Prompt Forge** — type a description ("huge glowing cyberpunk katana, neon cyan and purple"); it interprets the prompt against a curated **trend library**, shows the **enhanced prompt**, generates the model, and lets you browse **variations**, **edit in the Forge**, and **recreate**. Trend-*informed* original generation — it does not copy creator assets or scrape any site.
4. **Scene** — import a Roblox `.rbxmx` model file; it parses the instance tree, renders every part (with exact CFrames/colors/materials) in the viewport, and round-trips the whole scene back to Luau. (Binary `.rbxm` is not supported yet — in Studio choose *Save to File → .rbxmx*.)

The whole thing is a static site (HTML + JS + Three.js). No build step, no server, no account.

---

## Why this settles the "it can't be automated" debate

A Roblox `ParticleEmitter` is **100% data** — every property is a number, a `NumberRange`, or a curve (`ColorSequence` / `NumberSequence`). Anything that is pure data is a pure function of its parameters, so it can be authored programmatically, previewed, randomized, and exported. That's what Particle Studio does, and the generated Luau is byte-for-byte what you'd hand-type in Studio.

Sellable weapons are the same story: a sword is a handful of solids (blade, guard, grip, pommel) positioned by parameters. "Generate any arbitrary mesh from a text prompt" is *not* reliably game-standard yet — so we don't pretend it is. Instead we do the thing that **is** production-grade: parametric part-based generation, which is exactly how a lot of Roblox weapon packs are actually made.

So the honest, winning claim is: **the repetitive 90% — VFX authoring and item variant generation — is fully automatable today, and here's the working tool.**

---

## Run it

Three ways, easiest first:

**1. No install — `standalone.html`**
Open `standalone.html` directly (double-click, or drag into a browser). It's a
single self-contained file; Three.js loads from a CDN, so it needs internet the
first time. Best for handing the tool to someone non-technical.

**2. Hosted link (share with anyone, incl. phone)**
It's a static site, so GitHub Pages / Netlify / itch.io serve it as-is. With
this repo's root redirect, the Pages URL opens the app directly.

**3. Local dev server** (uses the modular source, best for editing)
ES modules must be served over http (not `file://`):

```bash
cd roblox-vfx-forge
python3 -m http.server 8080      # open http://localhost:8080
```

### Rebuilding the standalone
`standalone.html` is generated from the modular source. After editing anything
in `js/`, regenerate it:

```bash
node tools/build-standalone.mjs
```

---

## The two ways to get effects into Studio

### A) Paste & run (fastest, zero install)
1. In Particle Studio, design an effect.
2. Export tab → **Luau (paste & run)** → **Copy**.
3. In Studio, select a Part/Attachment, open the **Command Bar**, paste, Enter.
   The emitter is attached to your selection.

### B) The plugin (best for repeated work / "load a config")
1. Export tab → **JSON config** → **Copy** (or **Download**).
2. Install the plugin (`plugin/VFXForgePlugin.server.lua`):
   - In Studio: paste it into a `Script`, right-click → **Save as Local Plugin**, **or**
   - Sync the `/plugin` folder with [Rojo](https://rojo.space/).
3. Open the **VFX Forge** widget, paste the JSON, select a Part, click **Apply**.
   Supports Studio Undo (Ctrl+Z).

### Weapons
Weapon Forge → Export → **Luau (welded Model)** → paste into the Command Bar.
A welded, ready-to-use Model spawns in `workspace`.

---

## Property map (web field → Roblox API)

| Web control | Roblox property | Type |
|---|---|---|
| Rate | `ParticleEmitter.Rate` | number |
| Lifetime | `.Lifetime` | `NumberRange` |
| Speed | `.Speed` | `NumberRange` |
| Spread Angle | `.SpreadAngle` | `Vector2` |
| Rotation / Rot Speed | `.Rotation` / `.RotSpeed` | `NumberRange` |
| Acceleration | `.Acceleration` | `Vector3` |
| Drag | `.Drag` | number |
| Light Emission / Influence | `.LightEmission` / `.LightInfluence` | number |
| Brightness | `.Brightness` | number |
| Emission Direction | `.EmissionDirection` | `Enum.NormalId` |
| Color over life | `.Color` | `ColorSequence` |
| Size over life | `.Size` | `NumberSequence` |
| Transparency over life | `.Transparency` | `NumberSequence` |

The preview's `blend` setting is preview-only (it mimics how additive textures read in-engine); it doesn't map to a single Roblox property.

---

## Layout

```
roblox-vfx-forge/
├─ index.html                   app shell + importmap (Three.js via CDN)
├─ css/style.css
├─ js/
│  ├─ app.js                    wiring: tabs, controls, export, file load
│  ├─ three-setup.js            scene / camera / orbit / lights / grid
│  ├─ ui.js                     framework-free DOM control factory
│  ├─ particles/
│  │  ├─ sequences.js           exact Roblox Number/Color sequence math
│  │  ├─ presets.js             effect library + config schema
│  │  ├─ simulator.js           Three.js live particle preview
│  │  └─ luau-export.js         config → Luau (snippet / module)
│  └─ weapon/forge.js           parametric weapon → preview + welded Luau Model
├─ plugin/VFXForgePlugin.server.lua   Studio plugin (JSON → emitter on selection)
└─ samples/                     ready-to-load JSON configs
```

## Prompt Forge — how the "AI" works (honestly)

There is no hidden neural mesh model. The pipeline is deterministic and runs
fully client-side (works on the static Pages site, no API key):

1. **Interpret** — the prompt is tokenized; item type, trend, colors, material,
   and size adjectives are matched against rule tables (`js/generate/prompt-forge.js`).
2. **Enhance** — the understood attributes are expanded into a richer prompt
   string, shown to the user.
3. **Generate** — attributes become a Weapon Forge spec, built by the existing
   parametric generator.
4. **Vary / edit / recreate** — variations are seeded (reproducible) jitters of
   the spec; "Edit in Forge" hands the spec to the slider UI; "Recreate" re-rolls.

This is the legitimate "steal like an artist" reading: generate *original*
models informed by current trends, never copies of a specific creator's asset.

## Roadmap (next, if useful)
- More item types in the Forge (shield, staff, axe, bow).
- `.rbxmx` export (XML model files you can drag into Studio).
- Beam / Trail object support alongside ParticleEmitter.
- Batch mode: generate N recolored variants for a shop in one click.
