// Yantra · the optics bench in 3D (three.js directly; the core owns the renderer, the scene and the frame loop).
//
// What is drawn: the theme's sky with its horizon (a screen-space canvas); the bench top and its lip; the board's tiles
// (ONE instanced mesh); the walls as blocks (one instanced mesh); soft contact shadows (one instanced mesh); the lamp (a
// laser pointer / torch on its stand at the board's edge); the target (a photocell drum with a fan on a mast; its ring on
// the tiles is the law's target disc); the child's mirrors (framed glass plates standing upright on their tiles); the
// selected mirror's turn ring; and, only after a RUN, the beam: the law's own trace() points drawn out segment by segment
// (two dynamic meshes: a hot core and an additive glow), a flare at each bounce, the panel lit and the fan spinning on a
// hit, a spark where a miss ends. The scene never decides anything: points, hit and end all come from beam.logic.ts.
import {
  AdditiveBlending, BoxGeometry, BufferAttribute, BufferGeometry, Color, CylinderGeometry, DirectionalLight, DoubleSide, Group,
  HemisphereLight, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, PerspectiveCamera,
  NormalBlending, Plane, PlaneGeometry, Points, PointsMaterial, Quaternion, Raycaster, RingGeometry, Scene, Sprite, SpriteMaterial,
  Vector2, Vector3, type Texture,
} from "three";
import type { BeamParams, BeamTrace } from "../../families/yantra/beam.logic.ts";
import { BEAM_Y, beamTimeline, headAt, rad, timeAt, toWorld, type BeamTimeline } from "./geom.ts";
import { shade, type ThemePack } from "./palette.ts";
import { backdropTexture, blockTexture, cellTexture, flareTexture, glassTexture, spotTexture, tableTexture, tileTexture, turnRingTexture } from "./textures.ts";

const TILE_H = 0.05;                 // a tile's thickness: its top is the board's floor
const WALL_H = 0.56;                 // under a mirror's top: a block never hides the glass behind it
const MARGIN = 3.4;                  // bench beyond the board, at the sides and the back (cells)
const FRONT = 7;                     // and toward the child: the bench fills the bottom of a tall phone box
const YAW0 = 0.2;                    // the 3/4 view: a little round from straight-on (the child may orbit ±0.32 from here)
const MAX_SEG = 18;                  // the law traces at most 16 bounces (+1)
type Rnd = () => number;

/** Boxes merged into one non-indexed geometry (one draw call for a frame, a stand, a fan's blades). */
function boxes(list: { w: number; h: number; d: number; x?: number; y?: number; z?: number }[]): BufferGeometry {
  const pos: number[] = [], nor: number[] = [], uv: number[] = [];
  for (const b of list) {
    const g = new BoxGeometry(b.w, b.h, b.d).translate(b.x ?? 0, b.y ?? 0, b.z ?? 0).toNonIndexed();
    pos.push(...(g.getAttribute("position").array as Float32Array)); nor.push(...(g.getAttribute("normal").array as Float32Array)); uv.push(...(g.getAttribute("uv").array as Float32Array));
    g.dispose();
  }
  const out = new BufferGeometry();
  out.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3)); out.setAttribute("normal", new BufferAttribute(new Float32Array(nor), 3)); out.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
  return out;
}

/** A beam layer: up to MAX_SEG square-section boxes along the drawn part of the trace, rebuilt while it draws out. */
class BeamLayer {
  readonly geo = new BufferGeometry();
  readonly mesh: Mesh;
  private pos = new Float32Array(MAX_SEG * 8 * 3);
  constructor(mat: MeshBasicMaterial, private half: number) {
    const idx = new Uint16Array(MAX_SEG * 36), F = [0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0];
    for (let s = 0; s < MAX_SEG; s++) for (let k = 0; k < 36; k++) idx[s * 36 + k] = s * 8 + F[k];
    this.geo.setAttribute("position", new BufferAttribute(this.pos, 3)); this.geo.setIndex(new BufferAttribute(idx, 1));
    this.geo.setDrawRange(0, 0);
    this.mesh = new Mesh(this.geo, mat); this.mesh.frustumCulled = false;
  }
  set(segs: [Vector3, Vector3][]): void {
    const h = this.half;
    segs.slice(0, MAX_SEG).forEach(([a, b], s) => {
      const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = (-dz / l) * h, nz = (dx / l) * h;
      // overlap a hair at the joints so a bounce has no gap
      const ex = (dx / l) * h * 0.6, ez = (dz / l) * h * 0.6;
      const c = [[a.x - ex, a.z - ez], [b.x + ex, b.z + ez]];
      const v = [
        [c[0][0] + nx, a.y - h, c[0][1] + nz], [c[1][0] + nx, a.y - h, c[1][1] + nz], [c[1][0] - nx, a.y - h, c[1][1] - nz], [c[0][0] - nx, a.y - h, c[0][1] - nz],
        [c[0][0] + nx, a.y + h, c[0][1] + nz], [c[1][0] + nx, a.y + h, c[1][1] + nz], [c[1][0] - nx, a.y + h, c[1][1] - nz], [c[0][0] - nx, a.y + h, c[0][1] - nz],
      ];
      v.forEach((p, k) => this.pos.set(p, (s * 8 + k) * 3));
    });
    (this.geo.getAttribute("position") as BufferAttribute).needsUpdate = true;
    this.geo.setDrawRange(0, Math.min(MAX_SEG, segs.length) * 36);
  }
}

interface MirrorObj { g: Group; frame: Mesh; glass: Mesh; rot: number; shown: number; drop: number }
interface Shot { pts: Vector3[]; tl: BeamTimeline; t: number; hit: boolean; bounced: number; ended: boolean; end: BeamTrace["end"] }
export type SceneEvent = { kind: "bounce"; i: number } | { kind: "hit" } | { kind: "miss"; end: BeamTrace["end"] };

export class BenchScene {
  readonly cam = new PerspectiveCamera(32, 1, 0.1, 200);
  readonly root = new Group();
  private T: ThemePack;
  private ray = new Raycaster();
  private w = 1; h = 1;
  private dist = 14; yaw = YAW0; tYaw = YAW0; private pitch = 0.94;
  private center = new Vector3(0, 0.2, 0);
  private offset = { x: 0, y: 0 };
  private hemi: HemisphereLight; private key: DirectionalLight;
  private tableTop: Mesh; private tableLip: Mesh;
  private tiles: InstancedMesh; private pool: Mesh; private walls: InstancedMesh | null = null; private shadows: InstancedMesh;
  private lamp = new Group(); private lens: Mesh;
  private target = new Group(); private drum: Mesh; private cap: Mesh; private ring: Mesh; private fan = new Group(); private fanMat: MeshLambertMaterial; private mastMat: MeshLambertMaterial;
  private mirrors = new Map<string, MirrorObj>();
  private turnRing: Mesh;
  private core: BeamLayer; private glow: BeamLayer;
  private head: Sprite; private flares: Sprite[] = []; private endSpot: Sprite;
  private sparks: Points; private sparkV: Float32Array; private sparkLife = 0;
  private shot: Shot | null = null;
  private lit = 0; private fanW = 0;
  private mats: { tile: MeshLambertMaterial; wall: MeshLambertMaterial; mFrame: MeshPhongMaterial; mFrameSel: MeshPhongMaterial; glass: MeshPhongMaterial; body: MeshPhongMaterial; trim: MeshPhongMaterial; drum: MeshLambertMaterial; capM: MeshLambertMaterial; ringM: MeshBasicMaterial; table: MeshLambertMaterial; lip: MeshLambertMaterial; lensM: MeshBasicMaterial };
  private texs: Texture[] = [];
  private bgTex: Texture | null = null;
  private tmpM = new Matrix4(); private tmpQ = new Quaternion(); private tmpV = new Vector3(); private tmpS = new Vector3();

  constructor(private scene: Scene, private p: BeamParams, T: ThemePack, private rnd: Rnd, private particles: number, private reduced: boolean) {
    this.T = T;
    scene.add(this.root);
    this.hemi = new HemisphereLight(T.light.hemiSky, T.light.hemiGround, T.light.hemiI);
    this.key = new DirectionalLight(T.light.key, T.light.keyI);
    this.key.position.set(...T.light.keyDir);
    scene.add(this.hemi, this.key);
    const bw = p.cols + 2 * MARGIN, bd = p.rows + MARGIN + FRONT, bz = (FRONT - MARGIN) / 2;

    this.mats = {
      table: new MeshLambertMaterial(), lip: new MeshLambertMaterial(), tile: new MeshLambertMaterial(), wall: new MeshLambertMaterial(),
      mFrame: new MeshPhongMaterial({ shininess: 40 }), mFrameSel: new MeshPhongMaterial({ shininess: 40 }),
      glass: new MeshPhongMaterial({ shininess: 140, specular: 0xffffff }), body: new MeshPhongMaterial({ shininess: 70, specular: 0x666666 }), trim: new MeshPhongMaterial({ shininess: 110, specular: 0xffffff }),
      drum: new MeshLambertMaterial(), capM: new MeshLambertMaterial(), ringM: new MeshBasicMaterial({ transparent: true, opacity: 0.9, depthWrite: false }), lensM: new MeshBasicMaterial({ toneMapped: false }),
    };
    // ── the bench: a top (one textured plane) and its lip
    const top = new PlaneGeometry(bw, bd); top.rotateX(-Math.PI / 2); top.translate(0, 0, bz);
    this.tableTop = new Mesh(top, this.mats.table);
    // the lip sits a little under the top (no shared plane: no z-fighting at a distance)
    this.tableLip = new Mesh(new BoxGeometry(bw + 0.02, 0.5, bd + 0.02), this.mats.lip); this.tableLip.position.set(0, -0.27, bz);
    this.root.add(this.tableTop, this.tableLip);

    // ── the tiles (one per cell), the walls (blocks) and the contact shadows
    const n = p.cols * p.rows;
    this.tiles = new InstancedMesh(new BoxGeometry(0.94, TILE_H, 0.94), this.mats.tile, n);
    for (let y = 0; y < p.rows; y++) for (let x = 0; x < p.cols; x++) {
      const w = toWorld(p, x + 0.5, y + 0.5), i = y * p.cols + x;
      this.tmpM.makeTranslation(w.x, TILE_H / 2, w.z); this.tiles.setMatrixAt(i, this.tmpM);
    }
    this.root.add(this.tiles);
    if (p.walls.length) {
      this.walls = new InstancedMesh(new BoxGeometry(0.96, WALL_H, 0.96), this.mats.wall, p.walls.length);
      p.walls.forEach((c, i) => { const w = toWorld(p, c.x + 0.5, c.y + 0.5); this.tmpM.makeTranslation(w.x, TILE_H + WALL_H / 2, w.z); this.walls!.setMatrixAt(i, this.tmpM); });
      this.root.add(this.walls);
    }
    const shTex = spotTexture("rgba(0,0,0,0.5)", "rgba(0,0,0,0)"); this.texs.push(shTex);
    const shGeo = new PlaneGeometry(1, 1); shGeo.rotateX(-Math.PI / 2);
    this.shadows = new InstancedMesh(shGeo, new MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), p.walls.length + 8);
    this.shadows.renderOrder = 2; this.root.add(this.shadows);
    // a pool of the key light on the bench round the board (the eye goes to the board; the bench falls off into shade)
    const poolTex = spotTexture("rgba(255,255,255,0.5)", "rgba(255,255,255,0)"); this.texs.push(poolTex);
    this.pool = new Mesh(new PlaneGeometry(p.cols + 5, p.rows + 5).rotateX(-Math.PI / 2), new MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, opacity: 0.4 }));
    this.pool.position.y = 0.001; this.pool.renderOrder = 1; this.root.add(this.pool);

    // ── the lamp: a pointer on a stand at the edge, its lens at the cell centre (where the law's trace starts)
    const lw = toWorld(p, p.lamp.x + 0.5, p.lamp.y + 0.5);
    this.lamp.position.set(lw.x, 0, lw.z); this.lamp.rotation.y = rad(p.lamp.dir);
    // (the lamp's parts are built round its lens at the cell centre, where the law's trace starts)
    const body = new Mesh(new CylinderGeometry(0.14, 0.155, 0.74, 20).rotateZ(Math.PI / 2).translate(-0.33, BEAM_Y, 0), this.mats.body);
    const trim = new Mesh(boxes([{ w: 0.36, h: BEAM_Y - 0.1, d: 0.12, x: -0.34, y: (BEAM_Y - 0.1) / 2 + TILE_H }, { w: 0.6, h: 0.06, d: 0.42, x: -0.34, y: TILE_H + 0.03 },
      { w: 0.1, h: 0.05, d: 0.06, x: -0.42, y: BEAM_Y + 0.15 }]), this.mats.trim);
    const ringG = new CylinderGeometry(0.165, 0.165, 0.08, 20).rotateZ(Math.PI / 2).translate(0.04, BEAM_Y, 0);
    const front = new Mesh(ringG, this.mats.trim);
    this.lens = new Mesh(new CylinderGeometry(0.1, 0.1, 0.02, 18).rotateZ(Math.PI / 2).translate(0.085, BEAM_Y, 0), this.mats.lensM);
    this.lamp.add(body, trim, front, this.lens);
    this.root.add(this.lamp);

    // ── the target: the law's disc as a ring on the tiles, a photocell drum on it, a fan on a mast
    const tw = toWorld(p, p.target.x, p.target.y), r = p.target.r;
    this.target.position.set(tw.x, 0, tw.z);
    this.ring = new Mesh(new RingGeometry(r - 0.03, r + 0.05, 40).rotateX(-Math.PI / 2).translate(0, TILE_H + 0.004, 0), this.mats.ringM);
    this.ring.renderOrder = 3;
    this.drum = new Mesh(new CylinderGeometry(r * 0.9, r * 0.94, 0.5, 32, 1, true).translate(0, TILE_H + 0.25, 0), this.mats.drum);
    this.cap = new Mesh(new CylinderGeometry(r * 0.92, r * 0.92, 0.04, 32).translate(0, TILE_H + 0.5, 0), this.mats.capM);
    this.mastMat = new MeshLambertMaterial(); this.fanMat = new MeshLambertMaterial({ side: DoubleSide });
    const mast = new Mesh(boxes([{ w: 0.05, h: 0.5, d: 0.05, y: TILE_H + 0.75 }, { w: 0.12, h: 0.12, d: 0.12, y: TILE_H + 1.02 }]), this.mastMat);
    const blades = new Mesh(boxes([0, 1, 2].map(() => ({ w: 0.1, h: 0.42, d: 0.014, y: 0.23 }))), this.fanMat);
    // three blades at 120°: rotate the merged copies (each box was built at 12 o'clock)
    { const pa = blades.geometry.getAttribute("position") as BufferAttribute, na = blades.geometry.getAttribute("normal") as BufferAttribute, per = pa.count / 3;
      for (let b = 0; b < 3; b++) { const a = (b * 2 * Math.PI) / 3, c = Math.cos(a), s = Math.sin(a);
        for (let k = b * per; k < (b + 1) * per; k++) { const x = pa.getX(k), y = pa.getY(k); pa.setXY(k, x * c - y * s, x * s + y * c); const nx = na.getX(k), ny = na.getY(k); na.setXY(k, nx * c - ny * s, nx * s + ny * c); } } }
    this.fan.position.set(0, TILE_H + 1.02, 0.08); this.fan.rotation.x = -0.35; this.fan.add(blades);
    this.target.add(this.ring, this.drum, this.cap, mast, this.fan);
    this.root.add(this.target);

    // ── the selected mirror's turn ring, the beam, its flares and sparks
    this.turnRing = new Mesh(new PlaneGeometry(1.36, 1.36).rotateX(-Math.PI / 2), new MeshBasicMaterial({ transparent: true, depthWrite: false }));
    this.turnRing.position.y = TILE_H + 0.006; this.turnRing.renderOrder = 4; this.turnRing.visible = false;
    this.root.add(this.turnRing);
    const coreM = new MeshBasicMaterial({ toneMapped: false }), glowM = new MeshBasicMaterial({ transparent: true, opacity: 0.42, depthWrite: false, toneMapped: false });
    this.core = new BeamLayer(coreM, 0.034); this.glow = new BeamLayer(glowM, 0.12);
    this.glow.mesh.renderOrder = 6; this.core.mesh.renderOrder = 5;
    this.root.add(this.core.mesh, this.glow.mesh);
    const flareTex = flareTexture(); this.texs.push(flareTex);
    const flareMat = () => new SpriteMaterial({ map: flareTex, blending: AdditiveBlending, depthTest: false, depthWrite: false, transparent: true, toneMapped: false });
    this.head = new Sprite(flareMat()); this.head.visible = false; this.head.renderOrder = 8; this.root.add(this.head);
    for (let i = 0; i < 6; i++) { const s = new Sprite(flareMat()); s.visible = false; s.renderOrder = 8; this.flares.push(s); this.root.add(s); }
    this.endSpot = new Sprite(flareMat()); this.endSpot.visible = false; this.endSpot.renderOrder = 9; this.root.add(this.endSpot);
    const N = 36; this.sparkV = new Float32Array(N * 3);
    const sg = new BufferGeometry(); sg.setAttribute("position", new BufferAttribute(new Float32Array(N * 3), 3));
    this.sparks = new Points(sg, new PointsMaterial({ size: 0.07, transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false }));
    this.sparks.visible = false; this.sparks.frustumCulled = false; this.sparks.renderOrder = 9; this.root.add(this.sparks);

    this.setTheme(T);
  }

  // ───────────────────────────── theme ─────────────────────────────
  setTheme(T: ThemePack): void {
    this.T = T;
    for (const t of this.texs.splice(3)) t.dispose();         // keep the shadow, flare and pool textures (theme-free)
    const m = this.mats, p = this.p;
    const tt = tableTexture(T, this.rnd); tt.repeat.set((p.cols + 2 * MARGIN) / 3, (p.rows + MARGIN + FRONT) / 3);
    m.table.map = tt; m.table.color.set(0xffffff); m.table.needsUpdate = true;
    m.lip.color.set(T.table.edge);
    (this.pool.material as MeshBasicMaterial).color.set(T.light.key); (this.pool.material as MeshBasicMaterial).opacity = T.light.pool;
    const tile = tileTexture(T, this.rnd); m.tile.map = tile; m.tile.needsUpdate = true;
    const wall = blockTexture(T, this.rnd); m.wall.map = wall; m.wall.needsUpdate = true;
    const cells = cellTexture(T); cells.repeat.set(2, 1); m.drum.map = cells; m.drum.needsUpdate = true;
    const glassTex = glassTexture(T.mirror.glass); m.glass.map = glassTex; m.glass.color.set(0xffffff); m.glass.needsUpdate = true;
    const ringTex = turnRingTexture(T.you); (this.turnRing.material as MeshBasicMaterial).map = ringTex; (this.turnRing.material as MeshBasicMaterial).needsUpdate = true;
    this.texs.push(tt, tile, wall, cells, ringTex, glassTex);
    const c = new Color();
    for (let i = 0; i < p.cols * p.rows; i++) { const j = 1 + (this.rnd() - 0.5) * 2 * T.tile.jitter; this.tiles.setColorAt(i, c.set(shade(T.tile.face, j))); }
    if (this.tiles.instanceColor) this.tiles.instanceColor.needsUpdate = true;
    m.mFrame.color.set(T.mirror.frame); m.mFrame.emissive.set(0x000000);
    m.mFrameSel.color.set(T.mirror.frame); m.mFrameSel.emissive.set(T.you); m.mFrameSel.emissiveIntensity = 0.45;
    m.glass.emissive.set(shade(T.mirror.glass, 0.3));
    m.body.color.set(T.lamp.body); m.trim.color.set(T.lamp.trim); m.lensM.color.set(T.lamp.lens);
    m.capM.color.set(T.panel.frame); this.mastMat.color.set(T.panel.frame); this.fanMat.color.set(T.panel.fan);
    m.ringM.color.set(T.panel.ring);
    (this.core.mesh.material as MeshBasicMaterial).color.set(T.beam.core);
    const gm = this.glow.mesh.material as MeshBasicMaterial;
    gm.color.set(T.beam.glow); gm.blending = T.beam.blend === "add" ? AdditiveBlending : NormalBlending; gm.opacity = T.beam.blend === "add" ? 0.55 : 0.3; gm.needsUpdate = true;
    for (const s of [this.head, ...this.flares]) s.material.color.set(T.beam.glow);
    this.hemi.color.set(T.light.hemiSky); this.hemi.groundColor.set(T.light.hemiGround); this.hemi.intensity = T.light.hemiI;
    this.key.color.set(T.light.key); this.key.intensity = T.light.keyI; this.key.position.set(...T.light.keyDir);
    this.paintLit();
    if (this.w > 1) this.backdrop();
  }
  private backdrop(): void {
    // the horizon sits just above the bench's far edge as this camera sees it
    const far = this.project(new Vector3(0, 0, -(this.p.rows / 2 + MARGIN)));
    this.bgTex?.dispose();
    this.bgTex = backdropTexture(this.T, this.w, this.h, far.y / this.h, this.rnd);
    this.scene.background = this.bgTex;
  }

  // ───────────────────────────── camera and layout ─────────────────────────────
  private placeCam(): void {
    const c = this.center, cp = Math.cos(this.pitch);
    this.cam.position.set(c.x + this.dist * Math.sin(this.yaw) * cp, c.y + this.dist * Math.sin(this.pitch), c.z + this.dist * Math.cos(this.yaw) * cp);
    this.cam.lookAt(c);
    this.cam.updateMatrixWorld();
  }
  private project(v: Vector3): { x: number; y: number } {
    const q = this.tmpV.copy(v).project(this.cam);
    return { x: ((q.x + 1) / 2) * this.w, y: ((1 - q.y) / 2) * this.h };
  }
  /** the points the framing must keep in view: the board's corners up to the block tops, the fan's top, the lamp */
  private keyPoints(): Vector3[] {
    const p = this.p, hx = p.cols / 2 + 0.15, hz = p.rows / 2 + 0.15, out: Vector3[] = [];
    for (const x of [-hx, hx]) for (const z of [-hz, hz]) for (const y of [0, WALL_H + TILE_H]) out.push(new Vector3(x, y, z));
    const t = toWorld(p, p.target.x, p.target.y); out.push(new Vector3(t.x, TILE_H + 1.5, t.z));
    return out;
  }
  /**
   * Frame the board for THIS box: the largest board that keeps every key point inside the box less its margins (the
   * bottom keeps room for the hint pill), then a view offset that centres it there. Never a fixed world scaled down.
   */
  layout(w: number, h: number, reserve: { top: number; bottom: number; side: number }): void {
    this.w = Math.max(1, w); this.h = Math.max(1, h);
    this.cam.aspect = this.w / this.h; this.cam.fov = this.w / this.h < 0.8 ? 34 : 30;
    this.cam.clearViewOffset(); this.cam.updateProjectionMatrix();
    const availW = this.w - 2 * reserve.side, availH = this.h - reserve.top - reserve.bottom, pts = this.keyPoints();
    const bbox = () => { let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (const v of pts) { const q = this.project(v); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); } return { x0, x1, y0, y1 }; };
    const yaw = this.yaw; this.yaw = YAW0;
    let lo = 3, hi = 120;
    for (let k = 0; k < 32; k++) {
      this.dist = (lo + hi) / 2; this.placeCam();
      const b = bbox();
      // a little slack for the slight orbit the child may give it
      if ((b.x1 - b.x0) * 1.06 <= availW && (b.y1 - b.y0) * 1.03 <= availH) hi = this.dist; else lo = this.dist;
    }
    this.dist = hi; this.placeCam();
    const b = bbox();
    this.offset = { x: (b.x0 + b.x1) / 2 - this.w / 2, y: (b.y0 + b.y1) / 2 - (reserve.top + availH / 2) };
    this.cam.setViewOffset(this.w, this.h, this.offset.x, this.offset.y, this.w, this.h);
    this.yaw = yaw; this.placeCam();
    this.backdrop();
  }
  /** the board's rect on screen (CSS px), for the touch region */
  boardRect(): { x: number; y: number; w: number; h: number } {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const v of this.keyPoints()) { const q = this.project(v); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(this.w, x1); y1 = Math.min(this.h, y1);
    return { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
  }
  orbit(dx: number): void { this.tYaw = Math.max(YAW0 - 0.32, Math.min(YAW0 + 0.32, this.tYaw + dx * 0.004)); }

  // ───────────────────────────── picking ─────────────────────────────
  private rayAt(x: number, y: number): void { this.ray.setFromCamera(new Vector2((x / this.w) * 2 - 1, -(y / this.h) * 2 + 1), this.cam); }
  /** the mirror under a screen point (its glass or frame), or null */
  pickMirror(x: number, y: number): string | null {
    this.rayAt(x, y);
    const objs = [...this.mirrors.values()].flatMap((m) => [m.glass, m.frame]);
    const hit = this.ray.intersectObjects(objs, false)[0];
    return (hit?.object.userData.id as string | undefined) ?? null;
  }
  /** where a screen point meets the horizontal plane at height `y` (bench x, z), or null */
  onPlane(x: number, y: number, at = TILE_H): { x: number; z: number } | null {
    this.rayAt(x, y);
    const v = this.ray.ray.intersectPlane(new Plane(new Vector3(0, 1, 0), -at), new Vector3());
    return v ? { x: v.x, z: v.z } : null;
  }

  // ───────────────────────────── the child's mirrors ─────────────────────────────
  /** Match the mirrors on the bench to the law's state (`placed`); `preview` turns one while a finger drags it. */
  sync(placed: { id: string; x: number; y: number; rot: number }[], sel: string | null, preview: { id: string; rot: number } | null): void {
    const keep = new Set(placed.map((m) => m.id));
    for (const [id, o] of this.mirrors) if (!keep.has(id)) { this.root.remove(o.g); o.frame.geometry.dispose(); o.glass.geometry.dispose(); this.mirrors.delete(id); }
    for (const m of placed) {
      let o = this.mirrors.get(m.id);
      if (!o) {
        const g = new Group();
        const frame = new Mesh(boxes([
          { w: 0.92, h: 0.045, d: 0.075, y: TILE_H + 0.66 }, { w: 0.92, h: 0.045, d: 0.075, y: TILE_H + 0.1 },
          { w: 0.045, h: 0.6, d: 0.075, x: -0.44, y: TILE_H + 0.38 }, { w: 0.045, h: 0.6, d: 0.075, x: 0.44, y: TILE_H + 0.38 },
          { w: 0.34, h: 0.06, d: 0.3, y: TILE_H + 0.03 },
        ]), this.mats.mFrame);
        const glass = new Mesh(new BoxGeometry(0.84, 0.52, 0.04).translate(0, TILE_H + 0.38, 0), this.mats.glass);
        frame.userData.id = m.id; glass.userData.id = m.id;
        g.add(frame, glass); this.root.add(g);
        o = { g, frame, glass, rot: m.rot, shown: m.rot, drop: this.reduced ? 1 : 0 };
        this.mirrors.set(m.id, o);
      }
      const w = toWorld(this.p, m.x + 0.5, m.y + 0.5);
      o.g.position.set(w.x, 0, w.z);
      o.rot = preview && preview.id === m.id ? preview.rot : m.rot;
      o.frame.material = m.id === sel ? this.mats.mFrameSel : this.mats.mFrame;
    }
    const s = sel ? this.mirrors.get(sel) : null;
    this.turnRing.visible = !!s;
    if (s) this.turnRing.position.set(s.g.position.x, TILE_H + 0.006, s.g.position.z);
    this.placeShadows();
  }
  private placeShadows(): void {
    let k = 0;
    const put = (x: number, z: number, sx: number, sz: number) => { this.tmpM.compose(this.tmpV.set(x, TILE_H + 0.002, z), this.tmpQ.identity(), this.tmpS.set(sx, 1, sz)); this.shadows.setMatrixAt(k++, this.tmpM); };
    for (const c of this.p.walls) { const w = toWorld(this.p, c.x + 0.5, c.y + 0.5); put(w.x + 0.12, w.z + 0.1, 1.55, 1.55); }
    const l = toWorld(this.p, this.p.lamp.x + 0.5, this.p.lamp.y + 0.5); put(l.x, l.z, 0.9, 0.9);
    const t = toWorld(this.p, this.p.target.x, this.p.target.y); put(t.x + 0.06, t.z + 0.05, this.p.target.r * 3.2, this.p.target.r * 3.2);
    for (const o of this.mirrors.values()) if (k < this.shadows.count) put(o.g.position.x + 0.05, o.g.position.z + 0.05, 1.05, 0.7);
    for (let i = k; i < this.shadows.count; i++) { this.tmpM.makeScale(0, 0, 0); this.shadows.setMatrixAt(i, this.tmpM); }
    this.shadows.instanceMatrix.needsUpdate = true;
  }
  /** where a mirror stands (bench x, z) */
  mirrorAt(id: string): { x: number; z: number } | null { const o = this.mirrors.get(id); return o ? { x: o.g.position.x, z: o.g.position.z } : null; }

  // ───────────────────────────── the beam (only after a run) ─────────────────────────────
  /** Draw out the law's trace. Its points are cell units; the scene only places and times them. */
  shoot(tr: BeamTrace): void {
    const pts = tr.points.map(([x, y]) => { const w = toWorld(this.p, x, y); return new Vector3(w.x, BEAM_Y, w.z); });
    this.shot = { pts, tl: beamTimeline(tr.points), t: 0, hit: tr.hit, bounced: 0, ended: false, end: tr.end };
    this.lit = 0; this.paintLit();
    for (const f of this.flares) f.visible = false;
    this.endSpot.visible = false;
  }
  clearShot(): void {
    this.shot = null; this.core.set([]); this.glow.set([]);
    this.head.visible = false; this.endSpot.visible = false; for (const f of this.flares) f.visible = false;
    this.lit = 0; this.paintLit();
  }
  get shooting(): boolean { return !!this.shot && !this.shot.ended; }
  private paintLit(): void {
    const k = this.lit;
    this.mats.drum.emissive.set(this.T.good); this.mats.drum.emissiveIntensity = 0.85 * k;
    this.mats.capM.emissive.set(this.T.good); this.mats.capM.emissiveIntensity = 0.5 * k;
    this.mats.ringM.color.set(k > 0.5 ? this.T.good : this.T.panel.ring);
    this.mats.lensM.color.set(this.shot ? this.T.beam.core : this.T.lamp.lens);
  }
  private burst(at: Vector3, color: number, n: number): void {
    if (this.reduced || this.particles <= 0) return;
    const pa = this.sparks.geometry.getAttribute("position") as BufferAttribute, N = Math.min(pa.count, Math.max(4, Math.round(n * this.particles)));
    for (let i = 0; i < pa.count; i++) {
      if (i >= N) { pa.setXYZ(i, 0, -50, 0); this.sparkV.fill(0, i * 3, i * 3 + 3); continue; }
      const a = this.rnd() * Math.PI * 2, s = 0.6 + this.rnd() * 1.6;
      pa.setXYZ(i, at.x, at.y, at.z);
      this.sparkV[i * 3] = Math.cos(a) * s; this.sparkV[i * 3 + 1] = 0.6 + this.rnd() * 1.8; this.sparkV[i * 3 + 2] = Math.sin(a) * s;
    }
    pa.needsUpdate = true; (this.sparks.material as PointsMaterial).color.set(color); this.sparks.visible = true; this.sparkLife = 0.7;
  }

  /** advance animations by dt; → events the engine answers with sound, and whether anything still moves */
  step(dt: number, t: number): { busy: boolean; events: SceneEvent[] } {
    const ev: SceneEvent[] = [];
    let busy = false;
    // camera: a spring toward the child's slight orbit
    if (Math.abs(this.tYaw - this.yaw) > 1e-4) { this.yaw += (this.tYaw - this.yaw) * (1 - Math.exp(-dt * 10)); this.placeCam(); busy = true; }
    // mirrors: drop in when placed, turn on a spring to their heading
    for (const o of this.mirrors.values()) {
      if (o.drop < 1) { o.drop = Math.min(1, o.drop + dt * 4.5); busy = true; }
      const e = 1 - Math.pow(1 - o.drop, 3);
      o.g.position.y = (1 - e) * 0.9;
      let d = o.rot - o.shown; while (d > 90) d -= 180; while (d < -90) d += 180;
      if (Math.abs(d) > 0.05 && !this.reduced) { o.shown += d * (1 - Math.exp(-dt * 16)); busy = true; } else o.shown = o.rot;
      o.g.rotation.y = rad(o.shown);
    }
    if (this.turnRing.visible && !this.reduced) { this.turnRing.rotation.y = Math.sin(t * 1.6) * 0.12; }
    const s = this.shot;
    if (s) {
      if (!s.ended) {
        s.t += dt; busy = true;
        const L = headAt(s.tl, s.t), segs: [Vector3, Vector3][] = [];
        let head = s.pts[0];
        for (let i = 1; i < s.pts.length; i++) {
          const a = s.pts[i - 1], b = s.pts[i], st = s.tl.starts[i - 1], l = s.tl.lens[i - 1];
          if (L <= st) break;
          const f = Math.min(1, (L - st) / (l || 1)); head = a.clone().lerp(b, f); segs.push([a, head]);
        }
        this.core.set(segs); this.glow.set(segs);
        this.head.visible = s.t < s.tl.dur; this.head.position.copy(head); this.head.scale.setScalar(0.5);
        // a flare as the head passes each bounce (every trace point but the first and the last)
        while (s.bounced < s.pts.length - 2 && s.t >= timeAt(s.tl, s.bounced + 1)) {
          const i = s.bounced + 1, f = this.flares[(i - 1) % this.flares.length];
          f.position.copy(s.pts[i]); f.visible = true; f.userData.t = 0; s.bounced++; ev.push({ kind: "bounce", i });
        }
        if (s.t >= s.tl.dur) {
          s.ended = true;
          const end = s.pts[s.pts.length - 1];
          this.endSpot.position.copy(end); this.endSpot.visible = true; this.endSpot.userData.t = 0;
          this.endSpot.material.color.set(s.hit ? this.T.good : this.T.look);
          if (s.hit) { this.fanW = this.reduced ? 3 : 0.1; this.burst(end, this.T.good, 30); ev.push({ kind: "hit" }); }
          else { this.burst(end, this.T.look, 18); ev.push({ kind: "miss", end: s.end }); }
        }
      }
      // flares: a quick bloom that settles to a small glow on the glass while the beam is shown
      for (const f of this.flares) if (f.visible) {
        const ft = (f.userData.t = (f.userData.t ?? 0) + dt), k = this.reduced ? 1 : Math.min(1, ft / 0.12);
        const sc = this.reduced ? 0.45 : ft < 0.12 ? 0.95 * k : 0.45 + 0.5 * Math.exp(-(ft - 0.12) * 7);
        f.scale.setScalar(sc); if (ft < 0.6) busy = true;
      }
      if (this.endSpot.visible) {
        const ft = (this.endSpot.userData.t = (this.endSpot.userData.t ?? 0) + dt);
        const sc = s.hit ? 0.9 + 0.5 * Math.exp(-ft * 4) : 0.35 + 0.6 * Math.exp(-ft * 5) + (this.reduced ? 0 : 0.06 * Math.sin(ft * 30) * Math.exp(-ft * 2));
        this.endSpot.scale.setScalar(sc); if (ft < 1) busy = true;
      }
      if (s.ended && s.hit && this.lit < 1) { this.lit = Math.min(1, this.lit + dt * 3); this.paintLit(); busy = true; }
    }
    // the fan: spins up on a hit (it keeps turning while the panel is lit)
    if (s?.ended && s.hit) { this.fanW = Math.min(16, this.fanW + dt * 22); }
    else this.fanW = Math.max(0, this.fanW - dt * 10);
    if (this.fanW > 0.01) { this.fan.rotation.z -= this.fanW * dt; busy = busy || !this.reduced; }
    if (this.sparkLife > 0) {
      this.sparkLife -= dt; busy = true;
      const pa = this.sparks.geometry.getAttribute("position") as BufferAttribute;
      for (let i = 0; i < pa.count; i++) { this.sparkV[i * 3 + 1] -= 7 * dt; pa.setXYZ(i, pa.getX(i) + this.sparkV[i * 3] * dt, Math.max(TILE_H, pa.getY(i) + this.sparkV[i * 3 + 1] * dt), pa.getZ(i) + this.sparkV[i * 3 + 2] * dt); }
      pa.needsUpdate = true; (this.sparks.material as PointsMaterial).opacity = Math.max(0, this.sparkLife / 0.7);
      if (this.sparkLife <= 0) this.sparks.visible = false;
    }
    return { busy, events: ev };
  }

  dispose(): void {
    for (const t of this.texs) t.dispose();
    this.bgTex?.dispose(); this.scene.background = null;
    this.scene.remove(this.root, this.hemi, this.key);
    this.root.traverse((o) => { const m = o as Mesh; m.geometry?.dispose?.(); const mm = m.material as { dispose?: () => void } | undefined; mm?.dispose?.(); });
    Object.values(this.mats).forEach((m) => m.dispose());
  }
}
