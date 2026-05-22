import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export class Stage {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0d12);

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    this.camera.position.set(6, 4, 8);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, 1, 0);

    // lighting
    const hemi = new THREE.HemisphereLight(0x9bb8ff, 0x202028, 0.7);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(5, 8, 6);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x66aaff, 0.8);
    rim.position.set(-6, 3, -5);
    this.scene.add(rim);

    // grid floor
    this.grid = new THREE.GridHelper(20, 20, 0x2a3340, 0x161c24);
    this.grid.position.y = -2;
    this.scene.add(this.grid);

    // emitter reference part (for particle module)
    this.emitterPart = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.4, 1.4),
      new THREE.MeshStandardMaterial({
        color: 0x2b3a4a, roughness: 0.5, metalness: 0.2,
        transparent: true, opacity: 0.25,
      })
    );
    this.scene.add(this.emitterPart);

    this.weaponHolder = new THREE.Group();
    this.scene.add(this.weaponHolder);

    this.sceneHolder = new THREE.Group();
    this.scene.add(this.sceneHolder);

    // measure the container (not the canvas) so sizing never depends on the
    // canvas's own resolved height; canvas is absolutely positioned in CSS.
    this.viewport = canvas.parentElement || canvas;
    this._lastW = 0;
    this._lastH = 0;
    this.resize();
    window.addEventListener("resize", () => this.resize());
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(() => this.resize()).observe(this.viewport);
    }
  }

  focalPx() {
    const h = this.viewport.clientHeight || this.canvas.clientHeight || 1;
    return h / (2 * Math.tan((this.camera.fov * Math.PI) / 360));
  }

  // Called every frame; only does work when the container size actually changed.
  resize() {
    const w = this.viewport.clientWidth | 0;
    const h = this.viewport.clientHeight | 0;
    if (w === 0 || h === 0 || (w === this._lastW && h === this._lastH)) return;
    this._lastW = w;
    this._lastH = h;
    this.renderer.setSize(w, h, true);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setMode(mode) {
    this.emitterPart.visible = mode === "particles";
    this.weaponHolder.visible = mode === "weapon" || mode === "generate";
    this.sceneHolder.visible = mode === "scene";
    this.controls.target.set(0, mode === "particles" ? 1 : 0, 0);
  }

  setWeapon(group) {
    this.weaponHolder.clear();
    this.weaponHolder.add(group);
  }

  setScene(group) {
    this.sceneHolder.clear();
    if (group) this.sceneHolder.add(group);
  }

  render() {
    this.resize();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
