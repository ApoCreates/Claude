import * as THREE from "three";

// Parametric weapon generator. A weapon is a pure function of these params, so
// it can be generated, mutated, and randomized. Preview is built from Three.js
// meshes; export builds a NATIVE Roblox Model out of welded BaseParts (no asset
// upload required), which is exactly how many sellable Roblox weapons ship.

export function defaultWeapon() {
  return {
    style: "Longsword",
    bladeLength: 4.5,
    bladeWidth: 0.55,
    bladeThickness: 0.14,
    bladeTaper: 0.5,        // tip width as fraction of base (0..1)
    fuller: true,           // center groove
    guardWidth: 1.4,
    guardDepth: 0.4,
    guardThickness: 0.22,
    gripLength: 1.1,
    gripRadius: 0.16,
    pommelSize: 0.35,
    bladeColor: [220, 226, 235],
    bladeMaterial: "Metal",
    guardColor: [196, 160, 60],
    gripColor: [70, 45, 30],
    pommelColor: [196, 160, 60],
    glowColor: [120, 180, 255],
  };
}

export const WEAPON_STYLES = {
  Longsword: {},
  Dagger: { bladeLength: 1.8, bladeWidth: 0.42, guardWidth: 0.9, gripLength: 0.7 },
  Greatsword: {
    bladeLength: 7.0, bladeWidth: 0.85, bladeThickness: 0.2,
    guardWidth: 2.2, guardThickness: 0.3, gripLength: 1.8, pommelSize: 0.5,
  },
  Katana: {
    bladeLength: 5.2, bladeWidth: 0.5, bladeThickness: 0.12, bladeTaper: 0.8,
    guardWidth: 0.8, guardDepth: 0.8, guardThickness: 0.12, gripLength: 1.4,
    bladeColor: [235, 240, 245], guardColor: [40, 40, 45], gripColor: [120, 20, 30],
    pommelColor: [40, 40, 45],
  },
  "Neon Blade": {
    bladeMaterial: "Neon", bladeColor: [120, 200, 255],
    guardColor: [30, 40, 60], gripColor: [20, 25, 40], pommelColor: [120, 200, 255],
  },
};

export function applyStyle(params, styleName) {
  return { ...defaultWeapon(), ...WEAPON_STYLES[styleName], style: styleName, ...params };
}

// --- preview geometry --------------------------------------------------------
function pbrMaterial(rgb, materialType) {
  const color = new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
  if (materialType === "Neon") {
    return new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 1.4, roughness: 0.4, metalness: 0,
    });
  }
  if (materialType === "Metal") {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0.95 });
  }
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.05 });
}

// tapered blade body: a box whose top face is narrower (BufferGeometry).
function taperedBladeGeo(w, len, thick, tipFrac) {
  const hw = w / 2, ht = thick / 2, tw = (w * tipFrac) / 2, tt = (thick * tipFrac) / 2;
  // 8 corners: bottom (y=0) full, top (y=len) tapered
  const v = [
    [-hw, 0, -ht], [hw, 0, -ht], [hw, 0, ht], [-hw, 0, ht],        // bottom 0-3
    [-tw, len, -tt], [tw, len, -tt], [tw, len, tt], [-tw, len, tt], // top 4-7
  ];
  const faces = [
    [0, 1, 2], [0, 2, 3],   // bottom
    [4, 6, 5], [4, 7, 6],   // top
    [0, 4, 5], [0, 5, 1],   // -z
    [1, 5, 6], [1, 6, 2],   // +x
    [2, 6, 7], [2, 7, 3],   // +z
    [3, 7, 4], [3, 4, 0],   // -x
  ];
  const pos = [];
  for (const f of faces) for (const idx of f) pos.push(...v[idx]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

export function buildWeaponGroup(params) {
  const p = params;
  const group = new THREE.Group();

  const bodyLen = p.bladeLength * 0.82;
  const tipLen = p.bladeLength * 0.18;
  const gripTop = p.gripLength;
  const guardY = gripTop + p.guardThickness / 2;
  const bladeBaseY = gripTop + p.guardThickness;

  // grip
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(p.gripRadius, p.gripRadius * 1.05, p.gripLength, 16),
    pbrMaterial(p.gripColor, "Wood")
  );
  grip.position.y = p.gripLength / 2;
  group.add(grip);

  // pommel
  const pommel = new THREE.Mesh(
    new THREE.SphereGeometry(p.pommelSize / 2, 18, 14),
    pbrMaterial(p.pommelColor, "Metal")
  );
  pommel.position.y = -p.pommelSize / 4;
  group.add(pommel);

  // guard
  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(p.guardWidth, p.guardThickness, p.guardDepth),
    pbrMaterial(p.guardColor, "Metal")
  );
  guard.position.y = guardY;
  group.add(guard);

  // blade body (tapered) + tip
  const blade = new THREE.Mesh(
    taperedBladeGeo(p.bladeWidth, bodyLen, p.bladeThickness, 1),
    pbrMaterial(p.bladeColor, p.bladeMaterial)
  );
  blade.position.y = bladeBaseY;
  group.add(blade);

  const tip = new THREE.Mesh(
    taperedBladeGeo(p.bladeWidth, tipLen, p.bladeThickness, p.bladeTaper * 0.15),
    pbrMaterial(p.bladeColor, p.bladeMaterial)
  );
  tip.position.y = bladeBaseY + bodyLen;
  group.add(tip);

  if (p.fuller) {
    const fuller = new THREE.Mesh(
      new THREE.BoxGeometry(p.bladeWidth * 0.18, bodyLen * 0.85, p.bladeThickness * 1.05),
      pbrMaterial(p.glowColor, p.bladeMaterial === "Neon" ? "Neon" : "Metal")
    );
    fuller.position.y = bladeBaseY + bodyLen * 0.45;
    group.add(fuller);
  }

  // center the whole weapon vertically for nicer framing
  group.position.y = -(bladeBaseY + bodyLen) / 2;
  return group;
}

// --- Roblox Luau export (native welded Model) --------------------------------
function n(x) { return Number.isInteger(x) ? String(x) : String(Math.round(x * 1000) / 1000); }
function c3(rgb) { return `Color3.fromRGB(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`; }

export function toLuauWeapon(params) {
  const p = params;
  const bodyLen = p.bladeLength * 0.82;
  const tipLen = p.bladeLength * 0.18;
  const gripTop = p.gripLength;
  const guardY = gripTop + p.guardThickness / 2;
  const bladeBaseY = gripTop + p.guardThickness;

  // each part: {name, size:[x,y,z], pos:[x,y,z], color, material, shape}
  const parts = [
    { name: "Grip", size: [p.gripRadius * 2, p.gripLength, p.gripRadius * 2], pos: [0, p.gripLength / 2, 0], color: p.gripColor, material: "Wood", shape: "Cylinder" },
    { name: "Pommel", size: [p.pommelSize, p.pommelSize, p.pommelSize], pos: [0, -p.pommelSize / 4, 0], color: p.pommelColor, material: "Metal", shape: "Ball" },
    { name: "Guard", size: [p.guardWidth, p.guardThickness, p.guardDepth], pos: [0, guardY, 0], color: p.guardColor, material: "Metal", shape: "Block" },
    { name: "BladeBody", size: [p.bladeWidth, bodyLen, p.bladeThickness], pos: [0, bladeBaseY + bodyLen / 2, 0], color: p.bladeColor, material: p.bladeMaterial, shape: "Block" },
    { name: "BladeTip", size: [p.bladeWidth, tipLen, p.bladeThickness], pos: [0, bladeBaseY + bodyLen + tipLen / 2, 0], color: p.bladeColor, material: p.bladeMaterial, shape: "Wedge" },
  ];
  if (p.fuller) {
    parts.push({ name: "Fuller", size: [p.bladeWidth * 0.18, bodyLen * 0.85, p.bladeThickness * 1.05], pos: [0, bladeBaseY + bodyLen * 0.45, 0], color: p.glowColor, material: p.bladeMaterial === "Neon" ? "Neon" : "Metal", shape: "Block" });
  }

  const lines = [];
  lines.push(`-- ${p.style} -- generated by Roblox VFX Forge (Weapon Forge)`);
  lines.push(`-- Paste into the Studio Command Bar to spawn a welded Model in Workspace.`);
  lines.push(`local model = Instance.new("Model")`);
  lines.push(`model.Name = "${p.style}"`);
  lines.push(``);
  lines.push(`local function makePart(name, shape, size, pos, color, material)`);
  lines.push(`\tlocal class = shape == "Wedge" and "WedgePart" or "Part"`);
  lines.push(`\tlocal part = Instance.new(class)`);
  lines.push(`\tpart.Name = name`);
  lines.push(`\tpart.Anchored = false`);
  lines.push(`\tpart.CanCollide = false`);
  lines.push(`\tpart.Size = size`);
  lines.push(`\tpart.CFrame = CFrame.new(pos)`);
  lines.push(`\tpart.Color = color`);
  lines.push(`\tpart.Material = material`);
  lines.push(`\tif shape == "Ball" then part.Shape = Enum.PartType.Ball end`);
  lines.push(`\tif shape == "Cylinder" then part.Shape = Enum.PartType.Cylinder; part.CFrame = part.CFrame * CFrame.Angles(0, 0, math.rad(90)) end`);
  lines.push(`\tpart.Parent = model`);
  lines.push(`\treturn part`);
  lines.push(`end`);
  lines.push(``);
  for (const pt of parts) {
    lines.push(
      `makePart("${pt.name}", "${pt.shape}", Vector3.new(${n(pt.size[0])}, ${n(pt.size[1])}, ${n(pt.size[2])}), Vector3.new(${n(pt.pos[0])}, ${n(pt.pos[1])}, ${n(pt.pos[2])}), ${c3(pt.color)}, Enum.Material.${pt.material})`
    );
  }
  lines.push(``);
  lines.push(`-- weld everything to the Grip so the model is one rigid object`);
  lines.push(`local primary = model:FindFirstChild("Grip")`);
  lines.push(`model.PrimaryPart = primary`);
  lines.push(`primary.Anchored = true -- keeps the spawned model in place; unanchor when welding into a Tool`);
  lines.push(`for _, part in ipairs(model:GetChildren()) do`);
  lines.push(`\tif part ~= primary and part:IsA("BasePart") then`);
  lines.push(`\t\tlocal weld = Instance.new("WeldConstraint")`);
  lines.push(`\t\tweld.Part0 = primary`);
  lines.push(`\t\tweld.Part1 = part`);
  lines.push(`\t\tweld.Parent = primary`);
  lines.push(`\tend`);
  lines.push(`end`);
  lines.push(``);
  lines.push(`model.Parent = workspace`);
  lines.push(`print("[VFX Forge] Spawned ${p.style} (" .. #model:GetChildren() .. " instances).")`);
  return lines.join("\n");
}
