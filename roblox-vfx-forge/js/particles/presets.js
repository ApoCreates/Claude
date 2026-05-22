// Particle preset library. Every field maps 1:1 to a Roblox ParticleEmitter
// property, so a preset IS the source of truth for both the live preview and
// the generated Luau. See README for the property map.
//
// Sequence formats:
//   color: [{t, c:[r,g,b]}]            -> ColorSequence
//   size / transparency / squash: [{t, v, e?}] -> NumberSequence (e = envelope)
//   lifetime/speed/rotation/rotSpeed: [min, max] -> NumberRange
//   spreadAngle: [x, y]                -> Vector2 (degrees)
//   acceleration: [x, y, z]            -> Vector3 (studs/s^2)

// Built-in Roblox particle textures (no upload needed). 'blank' = solid sprite.
export const TEXTURES = {
  blank:    "rbxasset://textures/particles/sparkles_main.dds",
  sparkle:  "rbxassetid://6880496307",
  smoke:    "rbxasset://textures/particles/smoke_main.dds",
  fire:     "rbxasset://textures/particles/fire_main.dds",
  glow:     "rbxassetid://243660364",
  circle:   "rbxassetid://241650934",
  star:     "rbxassetid://6333823","slash": "rbxassetid://5860390988",
};

export function defaultConfig() {
  return {
    name: "Custom",
    texture: TEXTURES.glow,
    blend: "additive",                 // preview hint: additive | normal
    rate: 40,
    lifetime: [0.6, 1.0],
    speed: [4, 7],
    spreadAngle: [12, 12],
    rotation: [0, 360],
    rotSpeed: [-45, 45],
    acceleration: [0, 0, 0],
    drag: 0,
    lightEmission: 0.5,
    lightInfluence: 0,
    brightness: 1,
    zOffset: 0,
    timeScale: 1,
    emissionDirection: "Top",          // Enum.NormalId
    orientation: "FacingCamera",       // Enum.ParticleOrientation
    enabled: true,
    color: [
      { t: 0, c: [255, 255, 255] },
      { t: 1, c: [180, 180, 255] },
    ],
    size: [
      { t: 0, v: 0.0 },
      { t: 0.3, v: 1.0 },
      { t: 1, v: 0.0 },
    ],
    transparency: [
      { t: 0, v: 1 },
      { t: 0.2, v: 0 },
      { t: 1, v: 1 },
    ],
  };
}

export const PRESETS = {
  fire: {
    name: "Fire",
    texture: TEXTURES.fire,
    blend: "additive",
    rate: 60,
    lifetime: [0.5, 0.9],
    speed: [3, 6],
    spreadAngle: [18, 18],
    rotation: [0, 360],
    rotSpeed: [-90, 90],
    acceleration: [0, 14, 0],
    drag: 1.5,
    lightEmission: 0.85,
    lightInfluence: 0,
    brightness: 2,
    zOffset: 0,
    timeScale: 1,
    emissionDirection: "Top",
    orientation: "FacingCamera",
    enabled: true,
    color: [
      { t: 0, c: [255, 232, 120] },
      { t: 0.4, c: [255, 130, 30] },
      { t: 1, c: [120, 20, 0] },
    ],
    size: [
      { t: 0, v: 0.3, e: 0.1 },
      { t: 0.35, v: 1.5 },
      { t: 1, v: 0.1 },
    ],
    transparency: [
      { t: 0, v: 0.6 },
      { t: 0.2, v: 0.1 },
      { t: 1, v: 1 },
    ],
  },

  ice: {
    name: "Ice / Frost",
    texture: TEXTURES.sparkle,
    blend: "additive",
    rate: 35,
    lifetime: [0.8, 1.4],
    speed: [2, 4],
    spreadAngle: [25, 25],
    rotation: [0, 360],
    rotSpeed: [-30, 30],
    acceleration: [0, -3, 0],
    drag: 2,
    lightEmission: 0.6,
    lightInfluence: 0.2,
    brightness: 1.4,
    zOffset: 0,
    timeScale: 1,
    emissionDirection: "Top",
    orientation: "FacingCamera",
    enabled: true,
    color: [
      { t: 0, c: [220, 245, 255] },
      { t: 0.5, c: [120, 200, 255] },
      { t: 1, c: [80, 130, 230] },
    ],
    size: [
      { t: 0, v: 0.0 },
      { t: 0.25, v: 0.8, e: 0.2 },
      { t: 1, v: 0.0 },
    ],
    transparency: [
      { t: 0, v: 1 },
      { t: 0.2, v: 0.15 },
      { t: 1, v: 1 },
    ],
  },

  magic: {
    name: "Magic Aura",
    texture: TEXTURES.glow,
    blend: "additive",
    rate: 50,
    lifetime: [0.9, 1.6],
    speed: [1, 3],
    spreadAngle: [40, 40],
    rotation: [0, 360],
    rotSpeed: [-120, 120],
    acceleration: [0, 4, 0],
    drag: 1,
    lightEmission: 0.9,
    lightInfluence: 0,
    brightness: 2.2,
    zOffset: 0,
    timeScale: 1,
    emissionDirection: "Top",
    orientation: "FacingCamera",
    enabled: true,
    color: [
      { t: 0, c: [200, 120, 255] },
      { t: 0.5, c: [120, 90, 255] },
      { t: 1, c: [60, 200, 255] },
    ],
    size: [
      { t: 0, v: 0.0 },
      { t: 0.4, v: 0.7, e: 0.25 },
      { t: 1, v: 0.0 },
    ],
    transparency: [
      { t: 0, v: 1 },
      { t: 0.25, v: 0.1 },
      { t: 1, v: 1 },
    ],
  },

  smoke: {
    name: "Smoke",
    texture: TEXTURES.smoke,
    blend: "normal",
    rate: 18,
    lifetime: [1.5, 2.6],
    speed: [1.5, 3],
    spreadAngle: [22, 22],
    rotation: [0, 360],
    rotSpeed: [-20, 20],
    acceleration: [0, 5, 0],
    drag: 2.5,
    lightEmission: 0,
    lightInfluence: 1,
    brightness: 1,
    zOffset: 0,
    timeScale: 1,
    emissionDirection: "Top",
    orientation: "FacingCamera",
    enabled: true,
    color: [
      { t: 0, c: [90, 90, 95] },
      { t: 1, c: [40, 40, 45] },
    ],
    size: [
      { t: 0, v: 0.4 },
      { t: 1, v: 3.0, e: 0.4 },
    ],
    transparency: [
      { t: 0, v: 1 },
      { t: 0.2, v: 0.45 },
      { t: 1, v: 1 },
    ],
  },

  electric: {
    name: "Electric",
    texture: TEXTURES.star,
    blend: "additive",
    rate: 80,
    lifetime: [0.2, 0.45],
    speed: [6, 12],
    spreadAngle: [60, 60],
    rotation: [0, 360],
    rotSpeed: [-200, 200],
    acceleration: [0, 0, 0],
    drag: 0,
    lightEmission: 1,
    lightInfluence: 0,
    brightness: 3,
    zOffset: 0,
    timeScale: 1,
    emissionDirection: "Top",
    orientation: "FacingCamera",
    enabled: true,
    color: [
      { t: 0, c: [180, 240, 255] },
      { t: 0.5, c: [90, 170, 255] },
      { t: 1, c: [40, 80, 255] },
    ],
    size: [
      { t: 0, v: 0.5 },
      { t: 0.5, v: 0.15 },
      { t: 1, v: 0.0 },
    ],
    transparency: [
      { t: 0, v: 0 },
      { t: 1, v: 1 },
    ],
  },

  heal: {
    name: "Healing",
    texture: TEXTURES.circle,
    blend: "additive",
    rate: 30,
    lifetime: [1.0, 1.6],
    speed: [3, 5],
    spreadAngle: [15, 15],
    rotation: [0, 360],
    rotSpeed: [-40, 40],
    acceleration: [0, 8, 0],
    drag: 1,
    lightEmission: 0.8,
    lightInfluence: 0,
    brightness: 1.8,
    zOffset: 0,
    timeScale: 1,
    emissionDirection: "Top",
    orientation: "FacingCamera",
    enabled: true,
    color: [
      { t: 0, c: [200, 255, 180] },
      { t: 0.5, c: [120, 255, 140] },
      { t: 1, c: [60, 220, 120] },
    ],
    size: [
      { t: 0, v: 0.0 },
      { t: 0.3, v: 0.6 },
      { t: 1, v: 0.0 },
    ],
    transparency: [
      { t: 0, v: 1 },
      { t: 0.2, v: 0.1 },
      { t: 1, v: 1 },
    ],
  },

  trail: {
    name: "Sword Trail",
    texture: TEXTURES.slash,
    blend: "additive",
    rate: 120,
    lifetime: [0.25, 0.4],
    speed: [0, 0],
    spreadAngle: [0, 0],
    rotation: [0, 0],
    rotSpeed: [0, 0],
    acceleration: [0, 0, 0],
    drag: 0,
    lightEmission: 0.9,
    lightInfluence: 0,
    brightness: 2.5,
    zOffset: 0,
    timeScale: 1,
    emissionDirection: "Front",
    orientation: "VelocityParallel",
    enabled: true,
    color: [
      { t: 0, c: [255, 255, 255] },
      { t: 1, c: [120, 180, 255] },
    ],
    size: [
      { t: 0, v: 2.5 },
      { t: 1, v: 0.0 },
    ],
    transparency: [
      { t: 0, v: 0.1 },
      { t: 1, v: 1 },
    ],
  },
};
