import * as THREE from "three";
import { isBasePart, tokenToMaterial, partTypeToShape } from "./rbxmx.js";

// Read a property by any of several possible names (rbxmx casing varies).
function P(props, ...names) {
  for (const n of names) if (props[n] !== undefined) return props[n];
  return undefined;
}
const v3 = (p, d = 1) => (p && p.__t === "v3" ? [p.x, p.y, p.z] : [d, d, d]);
const rgbOf = (p, d = [160, 160, 165]) => (p && p.__t === "color" ? p.rgb : d);

function materialFor(matName, rgb, transparency) {
  const color = new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
  let m;
  if (matName === "Neon") {
    m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2, roughness: 0.4 });
  } else if (["Metal", "DiamondPlate", "Foil", "CorrodedMetal"].includes(matName)) {
    m = new THREE.MeshStandardMaterial({ color, metalness: 0.9, roughness: 0.32 });
  } else if (["Glass", "ForceField", "Ice"].includes(matName)) {
    m = new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.1, transparent: true, opacity: 0.4 });
  } else if (["Wood", "WoodPlanks"].includes(matName)) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05 });
  } else {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05 });
  }
  if (transparency && transparency > 0) {
    m.transparent = true;
    m.opacity = Math.max(0, 1 - transparency);
  }
  return m;
}

function wedgeGeometry(sx, sy, sz) {
  const hx = sx / 2, hy = sy / 2, hz = sz / 2;
  // ramp rising toward -Z; triangular cross-section in Y-Z, extruded along X
  const v = [
    [-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz], // bottom 0-3
    [-hx, hy, -hz], [hx, hy, -hz],                                   // top edge 4-5 (at -z)
  ];
  const faces = [
    [0, 1, 2], [0, 2, 3],       // bottom
    [0, 4, 5], [0, 5, 1],       // back (-z)
    [3, 2, 5], [3, 5, 4],       // slope
    [0, 3, 4],                  // left cap
    [1, 5, 2],                  // right cap
  ];
  const pos = [];
  for (const f of faces) for (const i of f) pos.push(...v[i]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

function geometryFor(inst, size) {
  const [sx, sy, sz] = size;
  if (inst.className === "WedgePart" || inst.className === "CornerWedgePart") {
    return wedgeGeometry(sx, sy, sz);
  }
  if (inst.className === "Part") {
    const shapeTok = P(inst.props, "Shape", "shape");
    const shape = typeof shapeTok === "number" ? partTypeToShape(shapeTok) : "Block";
    if (shape === "Ball") return new THREE.SphereGeometry(Math.min(sx, sy, sz) / 2, 24, 18);
    if (shape === "Cylinder") {
      const r = sy / 2;
      const g = new THREE.CylinderGeometry(r, r, sx, 24);
      g.rotateZ(Math.PI / 2); // Roblox cylinder axis is X
      return g;
    }
  }
  // MeshPart / Union / TrussPart / default -> bounding box placeholder
  return new THREE.BoxGeometry(sx, sy, sz);
}

function applyCFrame(obj, cf) {
  if (!cf || cf.__t !== "cf") return;
  const [px, py, pz] = cf.pos;
  const r = cf.rot;
  const m = new THREE.Matrix4();
  m.set(
    r[0], r[1], r[2], px,
    r[3], r[4], r[5], py,
    r[6], r[7], r[8], pz,
    0, 0, 0, 1
  );
  const pos = new THREE.Vector3(), quat = new THREE.Quaternion(), scl = new THREE.Vector3();
  m.decompose(pos, quat, scl);
  obj.position.copy(pos);
  obj.quaternion.copy(quat);
}

/**
 * Build a THREE.Group from a parsed instance tree.
 * Returns { group, partCount, emitters:[{name, parentName, pos:[x,y,z]}] }.
 * BaseParts store WORLD CFrames in Roblox, so nesting needs no transform stacking.
 */
export function buildSceneGroup(instances) {
  const group = new THREE.Group();
  const emitters = [];
  let partCount = 0;

  function walk(list, nearestPartPos) {
    for (const inst of list) {
      let partPos = nearestPartPos;
      if (isBasePart(inst.className)) {
        const size = v3(P(inst.props, "size", "Size"), 1);
        const rgb = rgbOf(P(inst.props, "Color3uint8", "Color", "Color3"));
        const matName = tokenToMaterial(P(inst.props, "Material"));
        const transp = P(inst.props, "Transparency") || 0;
        const mesh = new THREE.Mesh(geometryFor(inst, size), materialFor(matName, rgb, transp));
        applyCFrame(mesh, P(inst.props, "CFrame", "cframe"));
        mesh.userData.robloxName = inst.name;
        group.add(mesh);
        partCount++;
        partPos = mesh.position.clone();
      } else if (inst.className === "ParticleEmitter" && nearestPartPos) {
        emitters.push({ name: inst.name, parentName: "", pos: nearestPartPos.toArray() });
        // visual marker so VFX presence is visible in the scene
        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 10, 8),
          new THREE.MeshStandardMaterial({ color: 0x66ccff, emissive: 0x3399ff, emissiveIntensity: 1.5 })
        );
        marker.position.copy(nearestPartPos);
        marker.userData.isEmitterMarker = true;
        group.add(marker);
      }
      if (inst.children.length) walk(inst.children, partPos);
    }
  }
  walk(instances, null);

  // recenter group on its bounding box so imports frame nicely
  const box = new THREE.Box3().setFromObject(group);
  if (!box.isEmpty()) {
    const center = box.getCenter(new THREE.Vector3());
    group.position.sub(center);
  }
  return { group, partCount, emitters };
}

// --- export the whole scene back to Roblox Luau (faithful CFrames) ----------
function fmtNum(x) { return Number.isInteger(x) ? String(x) : String(Math.round(x * 1000) / 1000); }

export function exportSceneLuau(instances) {
  const baseParts = [];
  (function collect(list) {
    for (const inst of list) {
      if (isBasePart(inst.className)) baseParts.push(inst);
      collect(inst.children);
    }
  })(instances);

  const lines = [];
  lines.push(`-- Scene rebuild -- generated by Roblox VFX Forge (Scene tab)`);
  lines.push(`-- Paste into the Studio Command Bar to recreate ${baseParts.length} part(s).`);
  lines.push(`local model = Instance.new("Model")`);
  lines.push(`model.Name = "ImportedScene"`);
  lines.push(``);
  lines.push(`local function makePart(class, name, size, cf, rgb, material, transparency)`);
  lines.push(`\tlocal ok, part = pcall(Instance.new, class)`);
  lines.push(`\tif not ok then part = Instance.new("Part") end`);
  lines.push(`\tpart.Name = name`);
  lines.push(`\tpart.Anchored = true`);
  lines.push(`\tpart.Size = size`);
  lines.push(`\tpart.CFrame = cf`);
  lines.push(`\tpart.Color = rgb`);
  lines.push(`\tpart.Transparency = transparency`);
  lines.push(`\tpcall(function() part.Material = material end)`);
  lines.push(`\tpart.Parent = model`);
  lines.push(`\treturn part`);
  lines.push(`end`);
  lines.push(``);

  for (const inst of baseParts) {
    const size = v3(P(inst.props, "size", "Size"), 1);
    const rgb = rgbOf(P(inst.props, "Color3uint8", "Color", "Color3"));
    const matName = tokenToMaterial(P(inst.props, "Material"));
    const transp = P(inst.props, "Transparency") || 0;
    const cf = P(inst.props, "CFrame", "cframe");
    const cls = inst.className === "WedgePart" ? "WedgePart" : "Part";
    let cfStr;
    if (cf && cf.__t === "cf") {
      const a = [...cf.pos, ...cf.rot].map(fmtNum).join(", ");
      cfStr = `CFrame.new(${a})`;
    } else {
      cfStr = `CFrame.new()`;
    }
    lines.push(
      `makePart("${cls}", ${JSON.stringify(inst.name)}, Vector3.new(${fmtNum(size[0])}, ${fmtNum(size[1])}, ${fmtNum(size[2])}), ${cfStr}, Color3.fromRGB(${rgb[0]}, ${rgb[1]}, ${rgb[2]}), Enum.Material.${matName}, ${fmtNum(transp)})`
    );
  }

  lines.push(``);
  lines.push(`model.Parent = workspace`);
  lines.push(`print("[VFX Forge] Rebuilt scene with " .. #model:GetChildren() .. " parts.")`);
  return lines.join("\n");
}
