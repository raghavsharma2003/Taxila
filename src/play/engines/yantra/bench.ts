// Yantra · the bench every law stands on (r7): the theme's lights, the table top and its lip, the pool of the key light,
// the screen-space backdrop, and a camera framed for THIS box (the largest world that keeps every key point inside the box
// less its margins, then a view offset that centres it). The beam bench (scene.ts) grew this inline; the circuit kit and
// the pendulum stand share it here. Nothing here reads a law.
import { BoxGeometry, DirectionalLight, Group, HemisphereLight, Mesh, MeshBasicMaterial, MeshLambertMaterial, PerspectiveCamera, Plane, PlaneGeometry, Raycaster, Vector2, Vector3, type Scene, type Texture } from "three";
import type { ThemePack } from "./palette.ts";
import { backdropTexture, spotTexture, tableTexture } from "./textures.ts";

export type Rnd = () => number;
export interface RigOpts {
  /** the table top: width (x), depth (z) and its centre's z */
  bw: number; bd: number; bz: number;
  /** the camera: yaw (round y from +z), pitch (up from the table), the point it looks at; the child may orbit ±swing */
  yaw: number; pitch: number; center: Vector3; swing: number;
  /** the light pool on the table (w, d) round the origin */
  pool: [number, number];
}
export interface Reserve { top: number; bottom: number; side: number }

export class Rig {
  readonly cam = new PerspectiveCamera(32, 1, 0.1, 200);
  readonly root = new Group();
  T: ThemePack;
  w = 1; h = 1;
  private dist = 14; private yaw: number; private tYaw: number;
  private offset = { x: 0, y: 0 };
  private hemi: HemisphereLight; private key: DirectionalLight;
  private table: MeshLambertMaterial; private lip: MeshLambertMaterial; private poolMat: MeshBasicMaterial;
  private tableTex: Texture | null = null; private poolTex: Texture; private bgTex: Texture | null = null;
  private ray = new Raycaster(); private tmp = new Vector3();

  constructor(private scene: Scene, T: ThemePack, private rnd: Rnd, private o: RigOpts) {
    this.T = T; this.yaw = o.yaw; this.tYaw = o.yaw;
    scene.add(this.root);
    this.hemi = new HemisphereLight(T.light.hemiSky, T.light.hemiGround, T.light.hemiI);
    this.key = new DirectionalLight(T.light.key, T.light.keyI);
    scene.add(this.hemi, this.key);
    this.table = new MeshLambertMaterial(); this.lip = new MeshLambertMaterial();
    const top = new PlaneGeometry(o.bw, o.bd); top.rotateX(-Math.PI / 2); top.translate(0, 0, o.bz);
    const lip = new Mesh(new BoxGeometry(o.bw + 0.02, 0.5, o.bd + 0.02), this.lip); lip.position.set(0, -0.27, o.bz);
    this.root.add(new Mesh(top, this.table), lip);
    this.poolTex = spotTexture("rgba(255,255,255,0.5)", "rgba(255,255,255,0)");
    this.poolMat = new MeshBasicMaterial({ map: this.poolTex, transparent: true, depthWrite: false, opacity: 0.4 });
    const pool = new Mesh(new PlaneGeometry(o.pool[0], o.pool[1]).rotateX(-Math.PI / 2), this.poolMat);
    pool.position.y = 0.001; pool.renderOrder = 1; this.root.add(pool);
    this.setTheme(T);
  }

  setTheme(T: ThemePack): void {
    this.T = T;
    this.tableTex?.dispose();
    const tt = tableTexture(T, this.rnd); tt.repeat.set(this.o.bw / 3, this.o.bd / 3); this.tableTex = tt;
    this.table.map = tt; this.table.color.set(0xffffff); this.table.needsUpdate = true;
    this.lip.color.set(T.table.edge);
    this.poolMat.color.set(T.light.key); this.poolMat.opacity = T.light.pool;
    this.hemi.color.set(T.light.hemiSky); this.hemi.groundColor.set(T.light.hemiGround); this.hemi.intensity = T.light.hemiI;
    this.key.color.set(T.light.key); this.key.intensity = T.light.keyI; this.key.position.set(...T.light.keyDir);
    if (this.w > 1) this.backdrop();
  }
  private backdrop(): void {
    // the horizon sits just above the table's far edge as this camera sees it
    const far = this.project(new Vector3(0, 0, this.o.bz - this.o.bd / 2));
    this.bgTex?.dispose();
    this.bgTex = backdropTexture(this.T, this.w, this.h, far.y / this.h, this.rnd);
    this.scene.background = this.bgTex;
  }

  // ── camera
  private place(): void {
    const c = this.o.center, cp = Math.cos(this.o.pitch);
    this.cam.position.set(c.x + this.dist * Math.sin(this.yaw) * cp, c.y + this.dist * Math.sin(this.o.pitch), c.z + this.dist * Math.cos(this.yaw) * cp);
    this.cam.lookAt(c);
    this.cam.updateMatrixWorld();
  }
  project(v: Vector3): { x: number; y: number } {
    const q = this.tmp.copy(v).project(this.cam);
    return { x: ((q.x + 1) / 2) * this.w, y: ((1 - q.y) / 2) * this.h };
  }
  /** Frame `pts` in this box less `reserve` (never a fixed world scaled down). */
  frame(w: number, h: number, pts: Vector3[], reserve: Reserve, bg = true): void {
    this.w = Math.max(1, w); this.h = Math.max(1, h);
    this.cam.aspect = this.w / this.h; this.cam.fov = this.w / this.h < 0.8 ? 34 : 30;
    this.cam.clearViewOffset(); this.cam.updateProjectionMatrix();
    const availW = this.w - 2 * reserve.side, availH = this.h - reserve.top - reserve.bottom;
    const bbox = () => { let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (const v of pts) { const q = this.project(v); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); } return { x0, x1, y0, y1 }; };
    const yaw = this.yaw; this.yaw = this.o.yaw;
    let lo = 2, hi = 160;
    for (let k = 0; k < 32; k++) {
      this.dist = (lo + hi) / 2; this.place();
      const b = bbox();
      if ((b.x1 - b.x0) * 1.06 <= availW && (b.y1 - b.y0) * 1.03 <= availH) hi = this.dist; else lo = this.dist;
    }
    this.dist = hi; this.place();
    const b = bbox();
    this.offset = { x: (b.x0 + b.x1) / 2 - this.w / 2, y: (b.y0 + b.y1) / 2 - (reserve.top + availH / 2) };
    this.cam.setViewOffset(this.w, this.h, this.offset.x, this.offset.y, this.w, this.h);
    this.yaw = yaw; this.place();
    if (bg) this.backdrop();
  }
  /** the screen rect of `pts` (CSS px, clamped to the box): the touch region */
  rectOf(pts: Vector3[]): { x: number; y: number; w: number; h: number } {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const v of pts) { const q = this.project(v); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(this.w, x1); y1 = Math.min(this.h, y1);
    return { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
  }
  orbit(dx: number): void { this.tYaw = Math.max(this.o.yaw - this.o.swing, Math.min(this.o.yaw + this.o.swing, this.tYaw + dx * 0.004)); }
  /** the camera's spring toward the child's orbit → still moving */
  step(dt: number): boolean {
    if (Math.abs(this.tYaw - this.yaw) <= 1e-4) return false;
    this.yaw += (this.tYaw - this.yaw) * (1 - Math.exp(-dt * 10)); this.place();
    return true;
  }

  // ── picking
  rayAt(x: number, y: number): Raycaster { this.ray.setFromCamera(new Vector2((x / this.w) * 2 - 1, -(y / this.h) * 2 + 1), this.cam); return this.ray; }
  /** where a screen point meets the horizontal plane at height `at` */
  onPlane(x: number, y: number, at = 0): Vector3 | null { return this.rayAt(x, y).ray.intersectPlane(new Plane(new Vector3(0, 1, 0), -at), new Vector3()); }
  /** where a screen point meets the upright plane z = `z` (facing the child) */
  onWall(x: number, y: number, z = 0): Vector3 | null { return this.rayAt(x, y).ray.intersectPlane(new Plane(new Vector3(0, 0, 1), -z), new Vector3()); }

  dispose(): void {
    this.tableTex?.dispose(); this.poolTex.dispose(); this.bgTex?.dispose();
    this.scene.background = null;
    this.scene.remove(this.root, this.hemi, this.key);
    this.root.traverse((o) => { const m = o as Mesh; m.geometry?.dispose?.(); const mm = m.material as { dispose?: () => void } | undefined; mm?.dispose?.(); });
  }
}

/** the screen distance from a point to the nearest of `pts` (CSS px) → its index, or −1 beyond `r` */
export function nearest(pts: { x: number; y: number }[], x: number, y: number, r: number): number {
  let best = -1, bd = r;
  pts.forEach((p, i) => { const d = Math.hypot(p.x - x, p.y - y); if (d <= bd) { bd = d; best = i; } });
  return best;
}
