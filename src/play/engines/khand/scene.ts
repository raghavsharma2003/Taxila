// Khand · the 3D world (three.js directly, behind this file and mount.ts: the thin adapter until G1's core lands).
//
// What is drawn, back to front:
//   the sky dome (a gradient) and fog; voxel hills, trees and a ground plane round the plot (meshed once, scenery only);
//   the plot's build pad (one tile per cell: the grid the child builds on);
//   the build itself, greedy-meshed in the worker (mesher.ts), in pooled GPU buffers (no new geometry per edit);
//   learning overlays ON TOP (depthTest off, reserved art hues): the cursor, a drag's rectangle, mismatch glow, targets,
//   the projection walls (views), the glass (mirror), the fence (floor).
// The scene never decides anything: heights, views, mismatches and the fence all come from the law (src/play/families/nazariya).
import {
  BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, Color, DoubleSide, EdgesGeometry, Group, LineBasicMaterial, LineSegments, Mesh,
  MeshBasicMaterial, NearestFilter, OrthographicCamera, PerspectiveCamera, PlaneGeometry, Points, PointsMaterial, Raycaster, Scene, ShaderMaterial,
  SphereGeometry, BackSide, Vector2, Vector3, type WebGLRenderer, type Camera, type Texture,
} from "three";
import type { ArtTokens } from "../../../../shared/play.ts";
import { meshVolume, volumeOf, type MeshOut } from "./mesher.ts";
import { MAT, tileOf } from "./tiles.ts";
import { SKY, type SkyPalette } from "./palette.ts";

export type Snap = "front" | "side" | "top" | null;
export interface Hit { kind: "block" | "ground"; x: number; z: number; y: number; nx: number; ny: number; nz: number }
const hexRaw = (n: number) => [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
const cssToNum = (c: string) => parseInt(c.replace(/[^0-9a-f]/gi, "").slice(0, 6), 16) || 0;

// ───────────────────────────── the block material (atlas, baked light, fog) ─────────────────────────────
function blockMaterial(atlas: Texture | null, sky: SkyPalette): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { atlas: { value: atlas }, fogColor: { value: new Vector3(...hexRaw(sky.fog)) }, fogNear: { value: 26 }, fogFar: { value: 70 }, lift: { value: 1 } },
    vertexShader: `attribute vec2 uvb; attribute float tile; attribute float shade;
      varying vec2 vUv; varying float vTile; varying float vShade; varying float vDepth;
      void main(){ vUv = uvb; vTile = tile; vShade = shade; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D atlas; uniform vec3 fogColor; uniform float fogNear; uniform float fogFar; uniform float lift;
      varying vec2 vUv; varying float vTile; varying float vShade; varying float vDepth;
      void main(){
        float t = floor(vTile + 0.5); vec2 cell = vec2(mod(t, 4.0), floor(t / 4.0));
        vec2 f = clamp(fract(vUv), 0.5 / 16.0, 15.5 / 16.0);
        vec3 c = texture2D(atlas, vec2((cell.x + f.x) / 4.0, 1.0 - (cell.y + 1.0 - f.y) / 4.0)).rgb * vShade * lift;
        gl_FragColor = vec4(mix(c, fogColor, smoothstep(fogNear, fogFar, vDepth)), 1.0);
      }`,
  });
}
function skyMaterial(sky: SkyPalette): ShaderMaterial {
  return new ShaderMaterial({
    side: BackSide, depthWrite: false,
    uniforms: { top: { value: new Vector3(...hexRaw(sky.top)) }, horizon: { value: new Vector3(...hexRaw(sky.horizon)) } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; varying vec3 vDir;
      void main(){ float k = clamp(vDir.y * 1.6, 0.0, 1.0); gl_FragColor = vec4(mix(horizon, top, pow(k, 0.7)), 1.0); }`,
  });
}

/** A pooled geometry: capacity grows by doubling, never shrinks; an upload sets the draw range. */
class PooledMesh {
  geo = new BufferGeometry();
  cap = 0;
  mesh: Mesh;
  constructor(mat: ShaderMaterial) { this.mesh = new Mesh(this.geo, mat); this.mesh.frustumCulled = false; }
  upload(m: MeshOut): void {
    const verts = m.positions.length / 3, idx = m.index.length;
    if (!verts) { this.geo.setDrawRange(0, 0); this.mesh.visible = false; return; }
    this.mesh.visible = true;
    if (verts > this.cap) {
      this.cap = Math.max(256, 1 << Math.ceil(Math.log2(verts)));
      this.geo.dispose();
      const g = new BufferGeometry();
      g.setAttribute("position", new BufferAttribute(new Float32Array(this.cap * 3), 3));
      g.setAttribute("uvb", new BufferAttribute(new Float32Array(this.cap * 2), 2));
      g.setAttribute("tile", new BufferAttribute(new Float32Array(this.cap), 1));
      g.setAttribute("shade", new BufferAttribute(new Float32Array(this.cap), 1));
      g.setIndex(new BufferAttribute(new Uint32Array(this.cap * 3 / 2), 1));
      this.geo = g; this.mesh.geometry = g;
    }
    const set = (name: string, src: Float32Array) => { const a = this.geo.getAttribute(name) as BufferAttribute; (a.array as Float32Array).set(src); a.needsUpdate = true; a.clearUpdateRanges(); a.addUpdateRange(0, src.length); };
    set("position", m.positions); set("uvb", m.uvb); set("tile", m.tile); set("shade", m.shade);
    const ia = this.geo.getIndex() as BufferAttribute;
    (ia.array as Uint32Array).set(m.index); ia.needsUpdate = true; ia.clearUpdateRanges(); ia.addUpdateRange(0, idx);
    this.geo.setDrawRange(0, idx);
  }
  dispose(): void { this.geo.dispose(); }
}

// ───────────────────────────── the camera rig ─────────────────────────────
export class Rig {
  yaw = 0.6; pitch = 0.62; dist = 14; tYaw = 0.6; tPitch = 0.62; tDist = 14;
  center = new Vector3();
  snap: Snap = null; snapT = 0;
  walk = false; wx = 0; wz = 0; wy = 1.6; wYaw = 0; wPitch = -0.1; move = new Vector2();
  minDist = 5; maxDist = 34;
  /** spring every value toward its target (critically damped feel); true while still moving */
  step(dt: number, floorAt: (x: number, z: number) => number): boolean {
    const k = 1 - Math.exp(-dt * 9);
    let moving = false;
    const go = (a: number, b: number) => { const n = a + (b - a) * k; if (Math.abs(b - n) > 1e-4) moving = true; return Math.abs(b - n) < 1e-4 ? b : n; };
    this.yaw = go(this.yaw, this.tYaw); this.pitch = go(this.pitch, this.tPitch); this.dist = go(this.dist, this.tDist);
    if (this.snap) { this.snapT = Math.min(1, this.snapT + dt * 3); if (this.snapT < 1) moving = true; }
    if (this.walk && (this.move.x || this.move.y)) {
      const sp = 3.2 * dt, fx = Math.sin(this.wYaw), fz = -Math.cos(this.wYaw);
      const nx = this.wx + (fx * this.move.y + -fz * this.move.x) * sp, nz = this.wz + (fz * this.move.y + fx * this.move.x) * sp;
      // walls: step up one block at most; never into a taller column
      const here = floorAt(this.wx, this.wz), there = floorAt(nx, nz);
      if (there - here <= 1.01) { this.wx = nx; this.wz = nz; }
      else if (floorAt(nx, this.wz) - here <= 1.01) this.wx = nx;
      else if (floorAt(this.wx, nz) - here <= 1.01) this.wz = nz;
      moving = true;
    }
    if (this.walk) { const want = floorAt(this.wx, this.wz) + 1.6; const ny = this.wy + (want - this.wy) * k; if (Math.abs(want - ny) > 1e-3) moving = true; this.wy = ny; }
    return moving;
  }
  setSnap(s: Snap): void {
    this.snap = s; this.snapT = 0; this.walk = false;
    if (s === "front") { this.tYaw = 0; this.tPitch = 0.02; }
    if (s === "side") { this.tYaw = Math.PI / 2; this.tPitch = 0.02; }
    if (s === "top") { this.tPitch = 1.5; }
  }
  orbitBy(dx: number, dy: number): void { this.snap = null; this.tYaw += dx * 0.0085; this.tPitch = Math.max(0.08, Math.min(1.45, this.tPitch + dy * 0.0065)); }
  zoomBy(f: number): void { this.tDist = Math.max(this.minDist, Math.min(this.maxDist, this.tDist * f)); }
}

// ───────────────────────────── the scene ─────────────────────────────
export interface PlotGeom { w: number; d: number; hmax: number; sy: number }
export class KhandScene {
  readonly renderer: WebGLRenderer;
  readonly cam = new PerspectiveCamera(48, 1, 0.1, 400);
  readonly ortho = new OrthographicCamera(-5, 5, 5, -5, 0.1, 400);
  readonly rig = new Rig();
  readonly root = new Group();          // plot-local space: cell (x, z) spans [x, x + 1] × [z, z + 1]
  readonly overlay = new Group();       // learning objects drawn on top
  private blockMat: ShaderMaterial;
  private build: PooledMesh;
  private terrain: PooledMesh;
  private art: ArtTokens;
  private sky: SkyPalette;
  private plot: PlotGeom = { w: 4, d: 4, hmax: 3, sy: 4 };
  heights: number[] = [];
  private raycaster = new Raycaster();
  private cursor: LineSegments;
  private dragBox: Mesh;
  private glow = new Group();
  private pulses: { m: Mesh; t: number }[] = [];
  private dust: Points;
  private dustV: Float32Array; private dustLife = 0;
  private terrainH = new Map<string, number>();
  readonly info = { draws: 0, tris: 0 };
  w = 1; h = 1;
  /** The renderer and scene are the core's (core3d@1): the scene only adds its world to them. */
  readonly scene: Scene;
  readonly theme: "mitti" | "barf" | "jungle";
  constructor(renderer: WebGLRenderer, scene: Scene, art: ArtTokens, atlas: Texture | null, timeOfDay: "day" | "dusk" | "night", theme: "mitti" | "barf" | "jungle" = "mitti") {
    this.renderer = renderer; this.scene = scene; this.theme = theme;
    this.art = art; this.sky = SKY[timeOfDay];
    this.blockMat = blockMaterial(atlas, this.sky);
    this.build = new PooledMesh(this.blockMat);
    this.terrain = new PooledMesh(this.blockMat);
    this.scene.background = new Color(this.sky.horizon);
    const dome = new Mesh(new SphereGeometry(180, 24, 12), skyMaterial(this.sky));
    // the sky draws AFTER the opaque world (depth-tested): pixels the world covers are never shaded twice
    dome.renderOrder = 5; this.scene.add(dome);
    this.scene.add(this.root);
    this.root.add(this.terrain.mesh, this.build.mesh);
    this.overlay.renderOrder = 10;
    this.root.add(this.overlay, this.glow);
    const you = new Color(cssToNum(art.you));
    this.cursor = new LineSegments(new EdgesGeometry(new BoxGeometry(1.04, 1.04, 1.04)), new LineBasicMaterial({ color: you, depthTest: false, transparent: true, opacity: 0.95 }));
    this.cursor.renderOrder = 20; this.cursor.visible = false; this.overlay.add(this.cursor);
    this.dragBox = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: you, transparent: true, opacity: 0.28, depthWrite: false }));
    this.dragBox.renderOrder = 19; this.dragBox.visible = false; this.overlay.add(this.dragBox);
    const n = 48; this.dustV = new Float32Array(n * 3);
    const dg = new BufferGeometry(); dg.setAttribute("position", new BufferAttribute(new Float32Array(n * 3), 3));
    this.dust = new Points(dg, new PointsMaterial({ color: new Color(0xf3ead8), size: 0.12, transparent: true, opacity: 0.9, depthWrite: false }));
    this.dust.visible = false; this.dust.frustumCulled = false; this.overlay.add(this.dust);
  }
  /** Lay out the plot: pad, terrain round it (seeded, deterministic), camera framing. */
  setPlot(p: PlotGeom, seed: number): void {
    this.plot = p;
    this.root.position.set(-p.w / 2, 0, -p.d / 2);
    // the build pad: one tile per cell (the grid the child builds on), a hair above the ground
    const pad = new PlaneGeometry(p.w, p.d); pad.rotateX(-Math.PI / 2); pad.translate(p.w / 2, 0.002, p.d / 2);
    const nv = pad.getAttribute("position").count, uvb = new Float32Array(nv * 2), tile = new Float32Array(nv).fill(13), shade = new Float32Array(nv).fill(1);
    const pa = pad.getAttribute("position");
    for (let i = 0; i < nv; i++) { uvb[i * 2] = pa.getX(i); uvb[i * 2 + 1] = pa.getZ(i); }
    pad.setAttribute("uvb", new BufferAttribute(uvb, 2)); pad.setAttribute("tile", new BufferAttribute(tile, 1)); pad.setAttribute("shade", new BufferAttribute(shade, 1));
    const padMesh = new Mesh(pad, this.blockMat); padMesh.name = "pad"; this.root.add(padMesh);
    // terrain: a 44 × 44 voxel world round the plot (flat near it, hills and trees further out)
    const R = 22, W = p.w + 2 * R, D = p.d + 2 * R, SY = 8, hs: number[] = [], mats = new Map<string, number>();
    const hsh = (x: number, z: number) => { let h = (x * 374761393 + z * 668265263 + seed * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const smooth = (x: number, z: number) => { let s = 0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) s += hsh(Math.floor((x + a * 3) / 4), Math.floor((z + b * 3) / 4)); return s / 9; };
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      const px = x - R, pz = z - R, dx = Math.max(0, -px - 6, px - p.w - 5), dz = Math.max(0, -pz - 6, pz - p.d - 5), far = Math.hypot(dx, dz);
      const h = far <= 0 ? 0 : Math.max(0, Math.min(SY - 3, Math.round(smooth(x, z) * (1.2 + far * 0.28) - 0.6 + far * 0.08)));
      hs.push(h); if (h) this.terrainH.set(`${px},${pz}`, h);
      // a tree here and there on flat-ish ground a little way out
      if (far > 3 && hsh(x * 7, z * 13) < (this.theme === "jungle" ? 0.09 : this.theme === "barf" ? 0.015 : 0.03) && h < SY - 4) mats.set(`${x},${z}`, h);
    }
    const vol = volumeOf(W, D, SY, hs.map((h, i) => { const k = `${i % W},${Math.floor(i / W)}`; return mats.has(k) ? h + 3 : h; }), (i, y) => {
      const x = i % W, z = Math.floor(i / W), base = hs[i];
      if (mats.has(`${x},${z}`) && y >= base) return y >= base + 2 ? MAT.leaf : MAT.wood;
      return y >= base - 1 ? (this.theme === "barf" ? MAT.snow : MAT.grass) : MAT.stone;
    });
    // tree crowns: a plus of leaves round the top trunk block
    for (const k of mats.keys()) {
      const [x, z] = k.split(",").map(Number), y = hs[z * W + x] + 2;
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + a, zz = z + b; if (xx >= 0 && zz >= 0 && xx < W && zz < D && y < SY) vol.data[(y * D + zz) * W + xx] = MAT.leaf; }
      if (y + 1 < SY) vol.data[((y + 1) * D + z) * W + x] = MAT.leaf;
    }
    this.terrain.upload(meshVolume(vol, tileOf));
    this.terrain.mesh.position.set(-R, 0, -R);
    // a wide grass ground under everything (the voxel ground stops at the terrain's edge)
    const g = new PlaneGeometry(400, 400); g.rotateX(-Math.PI / 2);
    const gv = g.getAttribute("position").count, guv = new Float32Array(gv * 2);
    for (let i = 0; i < gv; i++) { guv[i * 2] = g.getAttribute("position").getX(i); guv[i * 2 + 1] = g.getAttribute("position").getZ(i); }
    g.setAttribute("uvb", new BufferAttribute(guv, 2)); g.setAttribute("tile", new BufferAttribute(new Float32Array(gv).fill(this.theme === "barf" ? 15 : 0), 1)); g.setAttribute("shade", new BufferAttribute(new Float32Array(gv).fill(0.92), 1));
    const gm = new Mesh(g, this.blockMat); gm.position.set(p.w / 2, -0.001, p.d / 2); gm.renderOrder = 4; this.root.add(gm);
    // frame the plot
    const span = Math.max(p.w, p.d, p.hmax * 1.4);
    this.rig.center.set(0, Math.min(p.hmax, 3) * 0.35, 0);
    this.rig.tDist = this.rig.dist = 2 + span * 1.6; this.rig.minDist = span * 0.8; this.rig.maxDist = span * 4 + 10;
    this.rig.wx = p.w / 2; this.rig.wz = -2.5; this.rig.wYaw = 0;
  }
  /** The ground height at a plot-local point (the build where it stands, else the terrain). */
  floorAt = (x: number, z: number): number => {
    const cx = Math.floor(x), cz = Math.floor(z), p = this.plot;
    if (cx >= 0 && cz >= 0 && cx < p.w && cz < p.d) return this.heights[cz * p.w + cx] ?? 0;
    return this.terrainH.get(`${cx},${cz}`) ?? 0;
  };
  uploadBuild(m: MeshOut): void { this.build.upload(m); }

  // ── the camera
  activeCamera(): Camera { return this.rig.snap && this.rig.snapT >= 1 ? this.ortho : this.cam; }
  private placeCameras(): void {
    const r = this.rig, p = this.plot;
    if (r.walk) {
      this.cam.position.set(r.wx - p.w / 2, r.wy, r.wz - p.d / 2);
      const dir = new Vector3(Math.sin(r.wYaw) * Math.cos(r.wPitch), Math.sin(r.wPitch), -Math.cos(r.wYaw) * Math.cos(r.wPitch));
      this.cam.lookAt(this.cam.position.clone().add(dir));
      return;
    }
    const c = r.center, cp = Math.cos(r.pitch);
    this.cam.position.set(c.x + r.dist * Math.sin(r.yaw) * cp, c.y + r.dist * Math.sin(r.pitch), c.z - r.dist * Math.cos(r.yaw) * cp);
    this.cam.lookAt(c);
    if (r.snap) {
      // a true orthographic view along the axis: what the law's projection means
      const half = Math.max(p.w, p.d, p.hmax + 1) * 0.5 + 1.2, a = this.w / Math.max(1, this.h);
      const hh = a >= 1 ? half : half / a, ww = hh * a;
      this.ortho.left = -ww; this.ortho.right = ww; this.ortho.top = hh; this.ortho.bottom = -hh;
      const mid = new Vector3(0, r.snap === "top" ? 0 : Math.max(1, p.hmax / 2), 0);
      const pos = r.snap === "front" ? new Vector3(0, mid.y, -60) : r.snap === "side" ? new Vector3(60, mid.y, 0) : new Vector3(0, 60, 0.001);
      this.ortho.position.copy(pos); this.ortho.up.set(0, 1, 0);
      if (r.snap === "top") this.ortho.up.set(0, 0, 1);
      this.ortho.lookAt(mid); this.ortho.updateProjectionMatrix();
    }
  }
  resize(w: number, h: number): void {
    this.w = w; this.h = h;
    this.cam.aspect = w / Math.max(1, h);
    // a narrow phone sees the plot whole: widen the vertical field for tall boxes
    this.cam.fov = w / Math.max(1, h) < 0.7 ? 58 : 46;
    this.cam.updateProjectionMatrix();
  }
  /** Before the core renders: place the cameras; returns the camera to render with. */
  frame(): Camera {
    this.placeCameras();
    this.info.draws = this.renderer.info.render.calls; this.info.tris = this.renderer.info.render.triangles;
    return this.activeCamera();
  }

  // ── picking: a voxel walk (DDA) through the plot's height map, then the ground
  pick(px: number, py: number): Hit | null {
    const ndc = new Vector2((px / this.w) * 2 - 1, -(py / this.h) * 2 + 1);
    this.placeCameras();
    this.raycaster.setFromCamera(ndc, this.activeCamera());
    const o = this.raycaster.ray.origin.clone().sub(this.root.position), d = this.raycaster.ray.direction.clone();
    const p = this.plot, top = p.sy + 1;
    // clip the ray to the plot's box
    let t0 = 0, t1 = 400;
    for (const [oo, dd, lo, hi] of [[o.x, d.x, 0, p.w], [o.y, d.y, 0, top], [o.z, d.z, 0, p.d]] as const) {
      if (Math.abs(dd) < 1e-9) { if (oo < lo || oo > hi) return null; continue; }
      let a = (lo - oo) / dd, b = (hi - oo) / dd; if (a > b) [a, b] = [b, a];
      t0 = Math.max(t0, a); t1 = Math.min(t1, b);
    }
    if (t0 > t1) return null;
    const pt = o.clone().addScaledVector(d, t0 + 1e-5);
    let x = Math.min(p.w - 1, Math.max(0, Math.floor(pt.x))), y = Math.floor(pt.y), z = Math.min(p.d - 1, Math.max(0, Math.floor(pt.z)));
    const sx = Math.sign(d.x), sy = Math.sign(d.y), sz = Math.sign(d.z);
    const next = (c: number, s: number, oo: number, dd: number) => (dd === 0 ? Infinity : ((s > 0 ? c + 1 : c) - oo) / dd);
    let tx = next(x, sx, o.x, d.x), ty = next(y, sy, o.y, d.y), tz = next(z, sz, o.z, d.z);
    const dx = sx ? Math.abs(1 / d.x) : Infinity, dy = sy ? Math.abs(1 / d.y) : Infinity, dz = sz ? Math.abs(1 / d.z) : Infinity;
    let nx = 0, ny = 0, nz = 0;
    // the entry face
    const ent = t0; if (Math.abs(o.x + d.x * ent - Math.round(o.x + d.x * ent)) < 1e-4 && (Math.round(o.x + d.x * ent) === 0 || Math.round(o.x + d.x * ent) === p.w)) nx = -sx;
    else if (Math.abs(o.z + d.z * ent - Math.round(o.z + d.z * ent)) < 1e-4 && (Math.round(o.z + d.z * ent) === 0 || Math.round(o.z + d.z * ent) === p.d)) nz = -sz; else ny = -sy;
    for (let k = 0; k < 200; k++) {
      if (y < 0) return { kind: "ground", x, z, y: 0, nx: 0, ny: 1, nz: 0 };
      if (x < 0 || z < 0 || x >= p.w || z >= p.d || y > top) return null;
      if (y < (this.heights[z * p.w + x] ?? 0)) return { kind: "block", x, z, y, nx, ny, nz };
      if (tx <= ty && tx <= tz) { x += sx; tx += dx; nx = -sx; ny = 0; nz = 0; }
      else if (ty <= tz) { y += sy; ty += dy; nx = 0; ny = -sy; nz = 0; }
      else { z += sz; tz += dz; nx = 0; ny = 0; nz = -sz; }
    }
    return null;
  }
  /** Where a screen point meets the horizontal plane y = level (a drag's rectangle lives on one plane). */
  planeCell(px: number, py: number, level: number): { x: number; z: number } | null {
    const ndc = new Vector2((px / this.w) * 2 - 1, -(py / this.h) * 2 + 1);
    this.placeCameras();
    this.raycaster.setFromCamera(ndc, this.activeCamera());
    const o = this.raycaster.ray.origin.clone().sub(this.root.position), d = this.raycaster.ray.direction;
    if (Math.abs(d.y) < 1e-6) return null;
    const t = (level - o.y) / d.y; if (t < 0) return null;
    const x = Math.floor(o.x + d.x * t), z = Math.floor(o.z + d.z * t);
    return { x: Math.max(0, Math.min(this.plot.w - 1, x)), z: Math.max(0, Math.min(this.plot.d - 1, z)) };
  }
  /** Project a plot-local point to CSS px (labels); null when behind the camera. */
  toScreen(x: number, y: number, z: number): { x: number; y: number } | null {
    this.placeCameras();
    const v = new Vector3(x, y, z).add(this.root.position).project(this.activeCamera());
    if (v.z > 1 || v.z < -1) return null;
    return { x: (v.x + 1) / 2 * this.w, y: (1 - v.y) / 2 * this.h };
  }

  // ── overlays (learning objects: reserved hues, on top)
  showCursor(c: { x: number; y: number; z: number } | null): void {
    this.cursor.visible = !!c;
    if (c) this.cursor.position.set(c.x + 0.5, c.y + 0.5, c.z + 0.5);
  }
  showDrag(r: { x0: number; z0: number; x1: number; z1: number; y: number } | null, remove = false): void {
    this.dragBox.visible = !!r;
    if (!r) return;
    const ax = Math.min(r.x0, r.x1), bx = Math.max(r.x0, r.x1), az = Math.min(r.z0, r.z1), bz = Math.max(r.z0, r.z1);
    this.dragBox.scale.set(bx - ax + 1.02, 1.02, bz - az + 1.02);
    this.dragBox.position.set((ax + bx + 1) / 2, r.y + 0.5, (az + bz + 1) / 2);
    (this.dragBox.material as MeshBasicMaterial).color.set(cssToNum(remove ? this.art.look : this.art.you));
  }
  /** Columns that differ from the goal glow in the "look again" hue (never red, never a cross). */
  setGlow(cells: { x: number; z: number; h: number }[]): void {
    for (const m of [...this.glow.children]) { this.glow.remove(m); ((m as Mesh).geometry as BufferGeometry).dispose(); }
    if (!cells.length) return;
    const mat = new MeshBasicMaterial({ color: new Color(cssToNum(this.art.look)), transparent: true, opacity: 0.5, depthTest: false, depthWrite: false });
    for (const c of cells) {
      const hgt = Math.max(0.12, c.h);
      const m = new Mesh(new BoxGeometry(0.96, hgt, 0.96), mat); m.position.set(c.x + 0.5, hgt / 2, c.z + 0.5); m.renderOrder = 18;
      this.glow.add(m);
    }
  }
  /** A target ghost: outlines of the blocks a goal names (the given heights), in the structure hue. */
  ghost(name: string, heights: number[] | null, w: number, offset: { x: number; z: number } = { x: 0, z: 0 }): void {
    const old = this.overlay.getObjectByName(name);
    if (old) { this.overlay.remove(old); old.traverse((o) => { const g = (o as Mesh).geometry as BufferGeometry | undefined; g?.dispose?.(); }); }
    if (!heights) return;
    const g = new Group(); g.name = name;
    const pos: number[] = [];
    const box = new EdgesGeometry(new BoxGeometry(1, 1, 1)), bp = box.getAttribute("position");
    heights.forEach((h, i) => { for (let y = 0; y < h; y++) for (let k = 0; k < bp.count; k++) pos.push(bp.getX(k) + (i % w) + 0.5 + offset.x, bp.getY(k) + y + 0.5, bp.getZ(k) + Math.floor(i / w) + 0.5 + offset.z); });
    box.dispose();
    const geo = new BufferGeometry(); geo.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
    const ls = new LineSegments(geo, new LineBasicMaterial({ color: new Color(cssToNum(this.art.q3)), transparent: true, opacity: 0.85 }));
    ls.renderOrder = 12; g.add(ls); this.overlay.add(g);
  }
  /** A flat picture in the world (a projection wall, a label-free card): a canvas texture on a plane. */
  wall(name: string, canvas: HTMLCanvasElement | null, place: { x: number; y: number; z: number; ry: number; rx?: number; w: number; h: number }): void {
    const old = this.overlay.getObjectByName(name) as Mesh | undefined;
    if (old) { this.overlay.remove(old); old.geometry.dispose(); ((old.material as MeshBasicMaterial).map as Texture | null)?.dispose(); }
    if (!canvas) return;
    const tex = new CanvasTexture(canvas); tex.magFilter = NearestFilter; tex.minFilter = NearestFilter; tex.generateMipmaps = false;
    const m = new Mesh(new PlaneGeometry(place.w, place.h), new MeshBasicMaterial({ map: tex, transparent: true, side: DoubleSide, depthWrite: false }));
    m.name = name; m.position.set(place.x, place.y, place.z); m.rotation.set(place.rx ?? 0, place.ry, 0); m.renderOrder = 11;
    this.overlay.add(m);
  }
  /** The fence round the floor: a post at every corner and a rail along every edge the law counts. */
  fence(edges: { x0: number; z0: number; x1: number; z1: number }[]): void {
    const old = this.overlay.getObjectByName("fence") as Mesh | undefined;
    if (old) { this.overlay.remove(old); old.geometry.dispose(); }
    if (!edges.length) return;
    const pos: number[] = [], idx: number[] = [];
    const quadBox = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number) => {
      const b = new BoxGeometry(sx, sy, sz); const p = b.getAttribute("position"), ix = b.getIndex()!; const base = pos.length / 3;
      for (let i = 0; i < p.count; i++) pos.push(p.getX(i) + cx, p.getY(i) + cy, p.getZ(i) + cz);
      for (let i = 0; i < ix.count; i++) idx.push(ix.getX(i) + base);
      b.dispose();
    };
    const posts = new Set<string>();
    for (const e of edges) {
      const horiz = e.z0 === e.z1;
      quadBox((e.x0 + e.x1) / 2, 0.55, (e.z0 + e.z1) / 2, horiz ? 1 : 0.08, 0.08, horiz ? 0.08 : 1);
      quadBox((e.x0 + e.x1) / 2, 0.85, (e.z0 + e.z1) / 2, horiz ? 1 : 0.08, 0.08, horiz ? 0.08 : 1);
      posts.add(`${e.x0},${e.z0}`); posts.add(`${e.x1},${e.z1}`);
    }
    for (const k of posts) { const [x, z] = k.split(",").map(Number); quadBox(x, 0.5, z, 0.14, 1, 0.14); }
    const geo = new BufferGeometry(); geo.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3)); geo.setIndex(idx);
    const m = new Mesh(geo, new MeshBasicMaterial({ color: new Color(cssToNum(this.art.q4)) })); m.name = "fence"; m.renderOrder = 13;
    this.overlay.add(m);
  }
  /** The mirror's glass: a tall translucent pane on the axis. */
  glass(axis: "x" | "z" | null, m: number, len: number, hgt: number): void {
    const old = this.overlay.getObjectByName("glass") as Mesh | undefined;
    if (old) { this.overlay.remove(old); old.geometry.dispose(); }
    if (!axis) return;
    const g = new Mesh(new PlaneGeometry(len + 0.6, hgt + 0.6), new MeshBasicMaterial({ color: new Color(cssToNum(this.art.q2)), transparent: true, opacity: 0.22, side: DoubleSide, depthWrite: false }));
    g.name = "glass";
    if (axis === "x") { g.position.set(m, (hgt + 0.6) / 2, len / 2); g.rotation.y = Math.PI / 2; } else g.position.set(len / 2, (hgt + 0.6) / 2, m);
    g.renderOrder = 14; this.overlay.add(g);
  }
  /** Juice: a flash where blocks landed, and a puff of dust (scaled to the act, capped). */
  pulse(cells: { x: number; y: number; z: number }[], good = false): void {
    if (!cells.length) return;
    const mat = new MeshBasicMaterial({ color: new Color(cssToNum(good ? this.art.good : this.art.you)), transparent: true, opacity: 0.55, depthWrite: false });
    for (const c of cells.slice(0, 40)) {
      const m = new Mesh(new BoxGeometry(1.08, 1.08, 1.08), mat); m.position.set(c.x + 0.5, c.y + 0.5, c.z + 0.5); m.renderOrder = 17;
      this.overlay.add(m); this.pulses.push({ m, t: 0 });
    }
    const pa = this.dust.geometry.getAttribute("position") as BufferAttribute, n = pa.count;
    for (let i = 0; i < n; i++) {
      const c = cells[i % cells.length], a = i * 2.39996;
      pa.setXYZ(i, c.x + 0.5 + Math.cos(a) * 0.4, c.y + 0.05, c.z + 0.5 + Math.sin(a) * 0.4);
      this.dustV[i * 3] = Math.cos(a) * 1.4; this.dustV[i * 3 + 1] = 1.2 + (i % 5) * 0.25; this.dustV[i * 3 + 2] = Math.sin(a) * 1.4;
    }
    pa.needsUpdate = true; this.dust.visible = true; this.dustLife = 0.45;
  }
  /** Advance juice; true while anything is still moving. */
  stepJuice(dt: number): boolean {
    let busy = false;
    for (const p of this.pulses) { p.t += dt; const k = p.t / 0.28; (p.m.material as MeshBasicMaterial).opacity = Math.max(0, 0.55 * (1 - k)); p.m.scale.setScalar(1 + 0.15 * k); }
    const done = this.pulses.filter((p) => p.t >= 0.28);
    for (const p of done) { this.overlay.remove(p.m); p.m.geometry.dispose(); }
    this.pulses = this.pulses.filter((p) => p.t < 0.28);
    if (this.pulses.length) busy = true;
    if (this.dustLife > 0) {
      this.dustLife -= dt; busy = true;
      const pa = this.dust.geometry.getAttribute("position") as BufferAttribute;
      for (let i = 0; i < pa.count; i++) { this.dustV[i * 3 + 1] -= 6 * dt; pa.setXYZ(i, pa.getX(i) + this.dustV[i * 3] * dt, Math.max(0, pa.getY(i) + this.dustV[i * 3 + 1] * dt), pa.getZ(i) + this.dustV[i * 3 + 2] * dt); }
      pa.needsUpdate = true; (this.dust.material as PointsMaterial).opacity = Math.max(0, this.dustLife / 0.45);
      if (this.dustLife <= 0) this.dust.visible = false;
    }
    return busy;
  }
  setArt(art: ArtTokens): void { this.art = art; }
  dispose(): void {
    this.build.dispose(); this.terrain.dispose();
    this.scene.traverse((o) => { const m = o as Mesh; m.geometry?.dispose?.(); const mm = m.material as { dispose?: () => void } | undefined; mm?.dispose?.(); });
  }
}
export { volumeOf };
