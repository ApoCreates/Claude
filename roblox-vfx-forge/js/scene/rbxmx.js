// Parser for Roblox .rbxmx (XML) model files.
// Produces a plain instance tree: { className, name, props, children }.
// Binary .rbxm is intentionally out of scope here (LZ4 + chunked binary).
//
// Pure helpers (decodeColor3uint8 / tokenToMaterial / partTypeToShape) are
// exported separately so they can be unit-tested without a DOM.

// Enum.Material numeric tokens -> name (common subset; default Plastic).
export const MATERIAL_TOKENS = {
  256: "Plastic", 272: "SmoothPlastic", 288: "Neon",
  512: "Wood", 528: "WoodPlanks",
  784: "Marble", 800: "Slate", 816: "Concrete", 832: "Granite",
  848: "Brick", 864: "Pebble", 880: "Cobblestone",
  1040: "CorrodedMetal", 1056: "DiamondPlate", 1072: "Foil", 1088: "Metal",
  1280: "Grass", 1296: "Sand", 1312: "Fabric",
  1536: "Ice", 1568: "Glass", 1584: "ForceField",
};

export function tokenToMaterial(token) {
  return MATERIAL_TOKENS[token] || "Plastic";
}

// Enum.PartType: Ball=0, Block=1, Cylinder=2.
export function partTypeToShape(token) {
  return token === 0 ? "Ball" : token === 2 ? "Cylinder" : "Block";
}

// Color3uint8 is a 32-bit uint (0xAARRGGBB). Return [r,g,b] 0-255.
export function decodeColor3uint8(v) {
  v = Number(v) >>> 0;
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

const BASEPART_CLASSES = new Set([
  "Part", "WedgePart", "CornerWedgePart", "TrussPart", "MeshPart",
  "SpawnLocation", "Seat", "VehicleSeat", "UnionOperation",
]);

export function isBasePart(className) {
  return BASEPART_CLASSES.has(className);
}

function childText(el, tag) {
  for (const c of el.children) if (c.tagName === tag) return c.textContent;
  return null;
}
function readNum(el, tag) {
  const t = childText(el, tag);
  return t == null ? 0 : parseFloat(t);
}

function parseValue(propEl) {
  const tag = propEl.tagName;
  switch (tag) {
    case "Vector3":
      return { __t: "v3", x: readNum(propEl, "X"), y: readNum(propEl, "Y"), z: readNum(propEl, "Z") };
    case "CoordinateFrame":
      return {
        __t: "cf",
        pos: [readNum(propEl, "X"), readNum(propEl, "Y"), readNum(propEl, "Z")],
        rot: [
          readNum(propEl, "R00"), readNum(propEl, "R01"), readNum(propEl, "R02"),
          readNum(propEl, "R10"), readNum(propEl, "R11"), readNum(propEl, "R12"),
          readNum(propEl, "R20"), readNum(propEl, "R21"), readNum(propEl, "R22"),
        ],
      };
    case "Color3uint8":
      return { __t: "color", rgb: decodeColor3uint8(propEl.textContent) };
    case "Color3": {
      // floats 0..1
      const r = readNum(propEl, "R"), g = readNum(propEl, "G"), b = readNum(propEl, "B");
      return { __t: "color", rgb: [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)] };
    }
    case "token":
    case "int":
    case "int64":
    case "float":
    case "double":
      return parseFloat(propEl.textContent);
    case "bool":
      return propEl.textContent.trim() === "true";
    default:
      return propEl.textContent;
  }
}

function readItem(itemEl) {
  const className = itemEl.getAttribute("class");
  const props = {};
  for (const c of itemEl.children) {
    if (c.tagName === "Properties") {
      for (const p of c.children) {
        const name = p.getAttribute("name");
        if (name) props[name] = parseValue(p);
      }
    }
  }
  const children = [];
  for (const c of itemEl.children) {
    if (c.tagName === "Item") children.push(readItem(c));
  }
  return { className, name: props.Name || className, props, children };
}

/** Parse an .rbxmx XML string into a flat array of top-level instances. */
export function parseRbxmx(xmlString) {
  if (typeof DOMParser === "undefined") throw new Error("parseRbxmx needs a browser DOM");
  const doc = new DOMParser().parseFromString(xmlString, "application/xml");
  const err = doc.querySelector("parsererror");
  if (err) throw new Error("Malformed XML: " + err.textContent.slice(0, 120));
  const root = doc.documentElement; // <roblox>
  if (!root || root.tagName !== "roblox") throw new Error("Not a Roblox .rbxmx file");
  const items = [];
  for (const c of root.children) if (c.tagName === "Item") items.push(readItem(c));
  return items;
}

/** Walk the tree, returning a flat list of {instance, parentName, depth}. */
export function flatten(instances, parentName = null, depth = 0, out = []) {
  for (const inst of instances) {
    out.push({ instance: inst, parentName, depth });
    flatten(inst.children, inst.name, depth + 1, out);
  }
  return out;
}
