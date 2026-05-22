import * as THREE from "three";
import { sampleNumber, sampleColor, pickRange, clamp } from "./sequences.js";

// Maps Enum.NormalId -> base emission direction (Roblox: Front = -Z).
const NORMAL_DIR = {
  Top: [0, 1, 0],
  Bottom: [0, -1, 0],
  Front: [0, 0, -1],
  Back: [0, 0, 1],
  Right: [1, 0, 0],
  Left: [-1, 0, 0],
};

const MAX_PARTICLES = 6000;

// --- procedural sprite textures (browser can't load rbxassetid://) -----------
function makeSprite(kind) {
  const s = 128;
  const cv = document.createElement("canvas");
  cv.width = cv.height = s;
  const ctx = cv.getContext("2d");
  const cx = s / 2;

  if (kind === "smoke") {
    const g = ctx.createRadialGradient(cx, cx, 4, cx, cx, cx);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.5, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  } else if (kind === "star") {
    const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 6;
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.translate(cx, cx);
      ctx.rotate((i * Math.PI) / 4);
      ctx.beginPath();
      ctx.moveTo(0, -cx);
      ctx.lineTo(0, cx);
      ctx.stroke();
      ctx.restore();
    }
  } else if (kind === "slash") {
    const g = ctx.createLinearGradient(0, 0, s, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, s * 0.35, s, s * 0.3);
  } else {
    // glow / circle / default soft disc
    const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.8)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function spriteKindFor(texture) {
  if (texture.includes("smoke")) return "smoke";
  if (texture.includes("5860390988")) return "slash";
  if (texture.includes("6333823")) return "star";
  return "glow";
}

const VERT = `
attribute float aSize;
attribute float aAlpha;
attribute float aRot;
attribute vec3 aColor;
varying float vAlpha;
varying float vRot;
varying vec3 vColor;
uniform float uFocal;
void main() {
  vColor = aColor;
  vAlpha = aAlpha;
  vRot = aRot;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = max(-mv.z, 0.001);
  gl_PointSize = aSize * uFocal / dist;
}`;

const FRAG = `
precision mediump float;
varying float vAlpha;
varying float vRot;
varying vec3 vColor;
uniform sampler2D uTex;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float c = cos(vRot), s = sin(vRot);
  uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y) + 0.5;
  vec4 t = texture2D(uTex, uv);
  gl_FragColor = vec4(vColor * t.rgb, t.a * vAlpha);
  if (gl_FragColor.a < 0.003) discard;
}`;

export class ParticleSim {
  constructor() {
    this.cfg = null;
    this.emitAccumulator = 0;
    this.t = 0;
    this.emitterSize = [1.4, 1.4, 1.4]; // preview emitter volume (studs)

    const geo = new THREE.BufferGeometry();
    const n = MAX_PARTICLES;
    this.pos = new Float32Array(n * 3);
    this.col = new Float32Array(n * 3);
    this.size = new Float32Array(n);
    this.alpha = new Float32Array(n);
    this.rot = new Float32Array(n);
    geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(this.col, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(this.size, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(this.alpha, 1));
    geo.setAttribute("aRot", new THREE.BufferAttribute(this.rot, 1));
    this.geo = geo;

    // per-particle CPU state
    this.life = new Float32Array(n);   // total lifetime
    this.age = new Float32Array(n);    // current age
    this.vel = new Float32Array(n * 3);
    this.rotSpeed = new Float32Array(n);
    this.seedSize = new Float32Array(n); // for size envelope jitter
    this.active = new Uint8Array(n);
    this.cursor = 0;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: makeSprite("glow") },
        uFocal: { value: 600 },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
  }

  addTo(scene) {
    scene.add(this.points);
  }

  setFocal(focalPx) {
    this.material.uniforms.uFocal.value = focalPx;
  }

  setConfig(cfg) {
    this.cfg = cfg;
    this.material.uniforms.uTex.value = makeSprite(spriteKindFor(cfg.texture));
    this.material.blending =
      cfg.blend === "normal" ? THREE.NormalBlending : THREE.AdditiveBlending;
    this.material.needsUpdate = true;
  }

  reset() {
    this.active.fill(0);
    this.size.fill(0);
    this.alpha.fill(0);
  }

  _spawn() {
    const cfg = this.cfg;
    const i = this.cursor;
    this.cursor = (this.cursor + 1) % MAX_PARTICLES;

    // start position within emitter volume
    const [ex, ey, ez] = this.emitterSize;
    this.pos[i * 3] = (Math.random() - 0.5) * ex;
    this.pos[i * 3 + 1] = (Math.random() - 0.5) * ey;
    this.pos[i * 3 + 2] = (Math.random() - 0.5) * ez;

    // direction = emission normal, perturbed by spread cone
    const base = NORMAL_DIR[cfg.emissionDirection] || NORMAL_DIR.Top;
    const dir = new THREE.Vector3(base[0], base[1], base[2]);
    const ax = ((Math.random() * 2 - 1) * cfg.spreadAngle[0] * Math.PI) / 180;
    const ay = ((Math.random() * 2 - 1) * cfg.spreadAngle[1] * Math.PI) / 180;
    // build two perpendicular axes
    const up = Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(dir, up).normalize();
    const realUp = new THREE.Vector3().crossVectors(right, dir).normalize();
    dir.applyAxisAngle(realUp, ax).applyAxisAngle(right, ay).normalize();

    const speed = pickRange(cfg.speed);
    this.vel[i * 3] = dir.x * speed;
    this.vel[i * 3 + 1] = dir.y * speed;
    this.vel[i * 3 + 2] = dir.z * speed;

    this.life[i] = pickRange(cfg.lifetime);
    this.age[i] = 0;
    this.rot[i] = (pickRange(cfg.rotation) * Math.PI) / 180;
    this.rotSpeed[i] = (pickRange(cfg.rotSpeed) * Math.PI) / 180;
    this.seedSize[i] = Math.random() * 2 - 1;
    this.active[i] = 1;
  }

  update(dt) {
    const cfg = this.cfg;
    if (!cfg) return;
    dt = Math.min(dt, 0.05) * cfg.timeScale;
    this.t += dt;

    // emission
    if (cfg.enabled && cfg.rate > 0) {
      this.emitAccumulator += cfg.rate * dt;
      let toSpawn = Math.floor(this.emitAccumulator);
      this.emitAccumulator -= toSpawn;
      while (toSpawn-- > 0) this._spawn();
    }

    const acc = cfg.acceleration;
    const dragF = Math.max(0, 1 - cfg.drag * dt);
    const glowFactor =
      cfg.blend === "normal" ? 1 : 1 + cfg.brightness * 0.5 + cfg.lightEmission * 0.6;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (!this.active[i]) {
        this.size[i] = 0;
        this.alpha[i] = 0;
        continue;
      }
      this.age[i] += dt;
      const a01 = this.age[i] / this.life[i];
      if (a01 >= 1) {
        this.active[i] = 0;
        this.size[i] = 0;
        this.alpha[i] = 0;
        continue;
      }

      // integrate velocity
      this.vel[i * 3] = (this.vel[i * 3] + acc[0] * dt) * dragF;
      this.vel[i * 3 + 1] = (this.vel[i * 3 + 1] + acc[1] * dt) * dragF;
      this.vel[i * 3 + 2] = (this.vel[i * 3 + 2] + acc[2] * dt) * dragF;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;

      this.rot[i] += this.rotSpeed[i] * dt;

      // sample sequences
      let sz = sampleNumber(cfg.size, a01, false);
      // apply envelope deterministically per particle
      const szEnv = envelopeAt(cfg.size, a01);
      sz = Math.max(0, sz + this.seedSize[i] * szEnv);
      this.size[i] = sz;

      const transp = sampleNumber(cfg.transparency, a01, false);
      this.alpha[i] = clamp(1 - transp, 0, 1);

      const rgb = sampleColor(cfg.color, a01);
      this.col[i * 3] = (rgb[0] / 255) * glowFactor;
      this.col[i * 3 + 1] = (rgb[1] / 255) * glowFactor;
      this.col[i * 3 + 2] = (rgb[2] / 255) * glowFactor;
    }

    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aColor.needsUpdate = true;
    this.geo.attributes.aSize.needsUpdate = true;
    this.geo.attributes.aAlpha.needsUpdate = true;
    this.geo.attributes.aRot.needsUpdate = true;
  }
}

// envelope magnitude at normalized time (interpolated like the value).
function envelopeAt(kps, t) {
  t = clamp(t, 0, 1);
  for (let i = 0; i < kps.length - 1; i++) {
    const a = kps[i], b = kps[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t || 1e-6;
      const f = (t - a.t) / span;
      return (a.e ?? 0) + ((b.e ?? 0) - (a.e ?? 0)) * f;
    }
  }
  return kps[kps.length - 1].e ?? 0;
}
