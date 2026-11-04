// Yantra · the pendulum stand in 3D (three.js; the core owns the renderer and the frame loop). A lab stand on the bench
// (a heavy base, an upright rod, an arm out to the pivot), the thread and the bob (one of four: wood, aluminium, brass,
// iron, each the size its mass gives), a faint ghost of the bob held at its start side, a scale beside the swing (fade 1-2),
// and the target rhythm: the mela drum (a stick strikes it every beat) or the clock-tower bell (it rings every beat), a
// ring running out over the table on each beat. On the oscillation goal a counting rack of n beads stands there instead.
// The scene decides nothing: the period it swings with is the law's periodOf(), and the engine tells it where the bob is.
import {
  AdditiveBlending, BoxGeometry, BufferAttribute, BufferGeometry, CylinderGeometry, Group, InstancedMesh, LatheGeometry, Matrix4, Mesh, MeshBasicMaterial,
  MeshLambertMaterial, MeshPhongMaterial, PlaneGeometry, Points, PointsMaterial, RingGeometry, SphereGeometry, Vector2, Vector3, type Scene, type Texture,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { LEN, type PendulumParams } from "../../families/yantra/pendulum.logic.ts";
import { BOB_LOOK, shade, type ThemePack } from "./palette.ts";
import { Rig, type Reserve, type Rnd } from "./rig.ts";
import { rulerTexture, spotTexture } from "./textures.ts";

export const K = 0.04;                       // world units per cm of thread
const LMAX = LEN.max * K;
export const PIV_Y = LMAX + 1.05;            // the pivot's height above the table
const ROD_X = -3.45, RULER_X = -2.98, TARGET_X = 3.55;
const RAD = Math.PI / 180;

const box = (w: number, h: number, d: number, x = 0, y = 0, z = 0) => new BoxGeometry(w, h, d).translate(x, y, z);
function merged(list: BufferGeometry[]): BufferGeometry {
  const g = mergeGeometries(list.map((x) => (x.index ? x.toNonIndexed() : x)), false) as BufferGeometry;
  for (const x of list) x.dispose();
  return g;
}

export class StandScene {
  readonly rig: Rig;
  private swing = new Group(); private thread: Mesh; private bob: Mesh; private bobMat: MeshPhongMaterial;
  private ghost = new Group(); private gThread: Mesh; private gBob: Mesh; private gMat: MeshBasicMaterial; private gThreadMat: MeshBasicMaterial;
  private m: { stand: MeshPhongMaterial; rod: MeshPhongMaterial; thread: MeshBasicMaterial; ruler: MeshLambertMaterial; drum: MeshPhongMaterial; skin: MeshLambertMaterial; bell: MeshPhongMaterial; wood: MeshLambertMaterial; bead: MeshPhongMaterial; beadOn: MeshBasicMaterial };
  private ruler: Mesh | null = null; private rulerTex: Texture | null = null;
  private target = new Group(); private striker: Group | null = null; private bell: Group | null = null;
  private ring: Mesh; private ringMat: MeshBasicMaterial;
  private beads: InstancedMesh | null = null; private beadsOn: InstancedMesh | null = null;
  private sparks: Points; private sparkV: Float32Array; private sparkLife = 0;
  private texs: Texture[] = [];
  private len = 0; private tmpM = new Matrix4();
  readonly hasTarget: boolean;

  constructor(scene: Scene, private p: PendulumParams, T: ThemePack, private rnd: Rnd, private particles: number, private reduced: boolean) {
    this.hasTarget = p.goal === "match";
    this.rig = new Rig(scene, T, rnd, { bw: 13, bd: 6.5, bz: 0.6, yaw: 0.16, pitch: 0.2, center: new Vector3(0.2, PIV_Y * 0.48, 0), swing: 0.28, pool: [11, 5] });
    const R = this.rig.root;
    this.m = {
      stand: new MeshPhongMaterial({ shininess: 50, specular: 0x444444 }), rod: new MeshPhongMaterial({ shininess: 120, specular: 0xffffff }), thread: new MeshBasicMaterial(),
      ruler: new MeshLambertMaterial(), drum: new MeshPhongMaterial({ shininess: 50 }), skin: new MeshLambertMaterial(), bell: new MeshPhongMaterial({ shininess: 120, specular: 0xffffff }),
      wood: new MeshLambertMaterial(), bead: new MeshPhongMaterial({ shininess: 80 }), beadOn: new MeshBasicMaterial({ toneMapped: false }),
    };
    // ── the stand: a heavy base, the rod, a boss, the arm out to the pivot and its clamp
    const base = new Mesh(merged([box(1.5, 0.14, 1.1, ROD_X + 0.2, 0.07, 0), box(0.4, 0.14, 0.4, 0, PIV_Y + 0.05, 0), box(0.36, 0.3, 0.36, ROD_X, PIV_Y + 0.05, 0)]), this.m.stand);
    const rods = new Mesh(merged([new CylinderGeometry(0.065, 0.065, PIV_Y + 0.6, 14).translate(ROD_X, (PIV_Y + 0.6) / 2, 0), new CylinderGeometry(0.05, 0.05, -ROD_X, 12).rotateZ(Math.PI / 2).translate(ROD_X / 2, PIV_Y + 0.05, 0)]), this.m.rod);
    R.add(base, rods);
    // ── the scale (fade 1-2): its top is the pivot's height, so it reads the thread's length against it
    if (p.marks !== 3) {
      this.ruler = new Mesh(box(0.42, LMAX + 0.08, 0.05, RULER_X, PIV_Y - LMAX / 2 - 0.04 + 0.04, -0.05), this.m.ruler);
      R.add(this.ruler);
    }
    // ── the pendulum: a group at the pivot, turned by the swing; the thread a unit cylinder scaled to the length
    this.thread = new Mesh(new CylinderGeometry(0.022, 0.022, 1, 6).translate(0, -0.5, 0), this.m.thread);
    this.bobMat = new MeshPhongMaterial();
    this.bob = new Mesh(new SphereGeometry(1, 32, 22), this.bobMat);
    const hook = new Mesh(new CylinderGeometry(0.04, 0.04, 0.12, 8).translate(0, 0.06, 0), this.m.rod); this.bob.add(hook);
    this.swing.position.set(0, PIV_Y, 0); this.swing.add(this.thread, this.bob); R.add(this.swing);
    this.gThreadMat = new MeshBasicMaterial({ transparent: true, opacity: 0.25, depthWrite: false });
    this.gMat = new MeshBasicMaterial({ transparent: true, opacity: 0.22, depthWrite: false });
    this.gThread = new Mesh(new CylinderGeometry(0.014, 0.014, 1, 5).translate(0, -0.5, 0), this.gThreadMat);
    this.gBob = new Mesh(new SphereGeometry(1, 24, 16), this.gMat);
    this.ghost.position.set(0, PIV_Y, -0.02); this.ghost.add(this.gThread, this.gBob); this.ghost.renderOrder = 3; R.add(this.ghost);
    // ── the target rhythm (match) or the counting rack (oscillation)
    this.target.position.set(TARGET_X, 0, 0.1); R.add(this.target);
    this.ringMat = new MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0 });
    this.ring = new Mesh(new RingGeometry(0.9, 1, 48).rotateX(-Math.PI / 2), this.ringMat); this.ring.position.y = 0.01; this.ring.renderOrder = 2;
    if (p.goal === "match") {
      this.target.add(this.ring);
      if (p.ctx === "drum") {
        // a mela nagara: a shell, its laced skin, and a stick that falls on the skin on the beat
        const shell = new Mesh(merged([new CylinderGeometry(0.62, 0.48, 0.78, 28).translate(0, 0.39, 0), new CylinderGeometry(0.66, 0.66, 0.06, 28).translate(0, 0.8, 0)]), this.m.drum);
        const skin = new Mesh(new CylinderGeometry(0.6, 0.6, 0.02, 28).translate(0, 0.84, 0), this.m.skin);
        const laces = new Mesh(merged(Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return box(0.03, 0.74, 0.03).rotateZ(0).translate(Math.cos(a) * 0.57, 0.42, Math.sin(a) * 0.57); })), this.m.wood);
        this.striker = new Group(); this.striker.position.set(0.95, 1.05, 0.15);
        this.striker.add(new Mesh(merged([box(0.07, 0.07, 0.07), new CylinderGeometry(0.03, 0.035, 0.9, 8).rotateZ(Math.PI / 2).translate(-0.45, 0, 0), new SphereGeometry(0.07, 10, 8).translate(-0.9, 0, 0)]), this.m.wood));
        const post = new Mesh(box(0.08, 1.05, 0.08, 0.95, 0.52, 0.15), this.m.wood);
        this.target.add(shell, skin, laces, this.striker, post);
      } else {
        // the clock tower's bell in its frame: it rings (swings) on the beat
        const frame = new Mesh(merged([box(0.12, 2.4, 0.12, -0.7, 1.2, 0), box(0.12, 2.4, 0.12, 0.7, 1.2, 0), box(1.6, 0.14, 0.2, 0, 2.42, 0), box(1.7, 0.1, 0.6, 0, 0.05, 0)]), this.m.wood);
        const prof = [[0, -0.02], [0.5, 0], [0.46, 0.08], [0.36, 0.3], [0.3, 0.6], [0.22, 0.74], [0.08, 0.8], [0, 0.8]].map(([x, y]) => new Vector2(x, y));
        this.bell = new Group(); this.bell.position.set(0, 2.36, 0);
        this.bell.add(new Mesh(new LatheGeometry(prof, 28).translate(0, -0.84, 0), this.m.bell), new Mesh(new SphereGeometry(0.08, 10, 8).translate(0, -0.84, 0), this.m.rod));
        this.target.add(frame, this.bell);
      }
    } else {
      // the counting rack: n beads on a wire between two posts; a counted bead slides to the right and lights
      const n = p.n ?? 5;
      const rack = new Mesh(merged([box(2.2, 0.1, 0.5, 0, 0.05, 0), box(0.1, 0.7, 0.1, -1.0, 0.4, 0), box(0.1, 0.7, 0.1, 1.0, 0.4, 0), new CylinderGeometry(0.025, 0.025, 2.0, 8).rotateZ(Math.PI / 2).translate(0, 0.62, 0)]), this.m.wood);
      this.beads = new InstancedMesh(new SphereGeometry(0.11, 14, 10), this.m.bead, n); this.beadsOn = new InstancedMesh(new SphereGeometry(0.12, 14, 10), this.m.beadOn, n);
      this.beadsOn.count = 0;
      this.target.add(rack, this.beads, this.beadsOn);
      this.counted(0);
    }
    // ── the sparks of a match (cosmetic)
    const N = 30; this.sparkV = new Float32Array(N * 3);
    const sg = new BufferGeometry(); sg.setAttribute("position", new BufferAttribute(new Float32Array(N * 3), 3));
    this.sparks = new Points(sg, new PointsMaterial({ size: 0.1, transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false }));
    this.sparks.visible = false; this.sparks.frustumCulled = false; this.sparks.renderOrder = 9; R.add(this.sparks);
    // a soft shadow under the stand's base and the target
    const shTex = spotTexture("rgba(0,0,0,0.45)", "rgba(0,0,0,0)"); this.texs.push(shTex);
    const sh = new Mesh(new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }));
    sh.scale.set(2.6, 1, 1.8); sh.position.set(ROD_X + 0.2, 0.004, 0.1); sh.renderOrder = 1;
    const sh2 = sh.clone(); sh2.scale.set(2.4, 1, 1.8); sh2.position.set(TARGET_X, 0.004, 0.2);
    R.add(sh, sh2);
    this.setTheme(T);
  }

  // ───────────────────────────── theme ─────────────────────────────
  setTheme(T: ThemePack): void {
    this.rig.setTheme(T);
    const k = T.kit, m = this.m;
    m.stand.color.set(k.stand); m.rod.color.set(k.rod); m.thread.color.set(k.thread); m.drum.color.set(k.drum); m.skin.color.set(k.skin); m.bell.color.set(k.bell);
    m.wood.color.set(shade(T.table.base, 0.8)); m.bead.color.set(shade(k.ruler, 0.9)); m.beadOn.color.set(k.flash);
    this.gMat.color.set(k.flash); this.gThreadMat.color.set(k.thread); this.ringMat.color.set(k.flash);
    (this.sparks.material as PointsMaterial).color.set(T.good);
    this.rulerTex?.dispose();
    if (this.ruler) { this.rulerTex = rulerTexture(T, LEN.max, this.p.marks === 1 || this.p.marks === 2); const mm = this.m.ruler; mm.map = this.rulerTex; mm.color.set(0xffffff); mm.needsUpdate = true; }
  }

  // ───────────────────────────── framing ─────────────────────────────
  keyPoints(): Vector3[] {
    const out = [new Vector3(ROD_X - 0.6, 0, 0.6), new Vector3(ROD_X - 0.6, 0, -0.6), new Vector3(ROD_X, PIV_Y + 0.65, 0), new Vector3(0.3, PIV_Y + 0.3, 0)];
    // the widest swing of the longest thread, either side, and the scale's words beside it
    const sx = Math.sin(20 * RAD) * LMAX + 0.5;
    out.push(new Vector3(-sx, PIV_Y - LMAX * Math.cos(20 * RAD) - 0.5, 0), new Vector3(sx, PIV_Y - LMAX * Math.cos(20 * RAD) - 0.5, 0), new Vector3(0, 0, 0.9));
    if (this.ruler) out.push(new Vector3(RULER_X - 0.75, PIV_Y, 0));
    // the target (or the rack) and its word under it
    out.push(new Vector3(TARGET_X + 1.2, 0, 0.9), new Vector3(TARGET_X + 1.2, this.p.goal === "match" ? (this.p.ctx === "drum" ? 1.9 : 3.2) : 1.7, 0));
    return out;
  }
  layout(w: number, h: number, reserve: Reserve): void { this.rig.frame(w, h, this.keyPoints(), reserve); }

  // ───────────────────────────── what the engine drives ─────────────────────────────
  /** the pendulum: thread `cm` long, at `deg` from straight down (+ = to the right), the bob of `mass` g */
  pose(cm: number, deg: number, mass: number): void {
    const L = cm * K, look = BOB_LOOK[mass] ?? BOB_LOOK[50];
    this.len = L;
    this.swing.rotation.z = deg * RAD;
    this.thread.scale.set(1, Math.max(0.01, L - look.r * 0.9), 1);
    this.bob.position.set(0, -L, 0); this.bob.scale.setScalar(look.r);
    (this.bob.children[0] as Mesh).scale.setScalar(1 / look.r);
    (this.bob.children[0] as Mesh).position.set(0, 0.9, 0);
    if (this.bobMat.userData.mass !== mass) { this.bobMat.color.set(look.color); this.bobMat.shininess = look.shine; this.bobMat.specular.set(mass === 20 ? 0x222222 : 0xffffff); this.bobMat.userData.mass = mass; }
  }
  /** the start side's ghost; `flash` 0..1 when the bob has just come back to it */
  ghostAt(cm: number, deg: number, mass: number, flash: number): void {
    const L = cm * K, r = (BOB_LOOK[mass] ?? BOB_LOOK[50]).r;
    this.ghost.rotation.z = deg * RAD;
    this.gThread.scale.set(1, Math.max(0.01, L - r), 1);
    this.gBob.position.set(0, -L, 0); this.gBob.scale.setScalar(r * (1.08 + 0.12 * flash));
    this.gMat.opacity = 0.2 + 0.55 * flash;
  }
  /** the bob's centre (world) and radius */
  bobAt(): { at: Vector3; r: number } {
    const a = this.swing.rotation.z;
    return { at: new Vector3(Math.sin(a) * this.len, PIV_Y - Math.cos(a) * this.len, 0), r: this.bob.scale.x };
  }
  /** the scale's words: where each 50 cm mark sits (world) */
  marksAt(): { cm: number; at: Vector3 }[] {
    if (!this.ruler || this.p.marks !== 1) return [];
    return [50, 100, 150].map((cm) => ({ cm, at: new Vector3(RULER_X - 0.24, PIV_Y - cm * K, 0) }));
  }
  /** the target's word anchor (over the drum / the bell's frame / the rack) */
  targetWordAt(): Vector3 { return new Vector3(TARGET_X, this.p.goal !== "match" ? 0.95 : this.p.ctx === "drum" ? 1.3 : 2.62, 0); }
  /** the target on a beat: `since` s after the last beat (large = at rest) */
  beat(since: number): void {
    const pulse = Math.exp(-since / 0.14);
    // the stick rests raised and falls onto the skin on the beat
    if (this.striker) this.striker.rotation.z = since < 0.06 ? 0.24 : 0.24 - 0.6 * Math.min(1, (since - 0.06) / 0.25);
    if (this.bell) this.bell.rotation.z = this.reduced ? 0 : 0.16 * Math.exp(-since / 0.35) * Math.sin(since * 18);
    const r = 0.9 + 1.4 * (1 - pulse);
    this.ring.scale.set(r, 1, r); this.ringMat.opacity = this.reduced ? 0 : 0.7 * pulse;
  }
  /** the rack: `k` beads counted (slid right, lit) */
  counted(k: number): void {
    if (!this.beads || !this.beadsOn) return;
    const n = this.beads.count, gap = 0.26;
    for (let i = 0; i < n; i++) {
      const on = i < k, x = on ? 0.85 - (k - 1 - i) * gap : -0.85 + i * gap;
      this.tmpM.makeTranslation(x, 0.62, 0); this.beads.setMatrixAt(i, this.tmpM);
      if (on) this.beadsOn.setMatrixAt(i, this.tmpM);
    }
    this.beadsOn.count = Math.min(n, k);
    this.beads.instanceMatrix.needsUpdate = true; this.beadsOn.instanceMatrix.needsUpdate = true;
  }
  burst(at: Vector3, color: number): void {
    if (this.reduced || this.particles <= 0) return;
    const pa = this.sparks.geometry.getAttribute("position") as BufferAttribute, N = Math.min(pa.count, Math.max(6, Math.round(28 * this.particles)));
    for (let i = 0; i < pa.count; i++) {
      if (i >= N) { pa.setXYZ(i, 0, -50, 0); this.sparkV.fill(0, i * 3, i * 3 + 3); continue; }
      const a = this.rnd() * Math.PI * 2, s = 0.8 + this.rnd() * 1.6;
      pa.setXYZ(i, at.x, at.y, at.z);
      this.sparkV[i * 3] = Math.cos(a) * s; this.sparkV[i * 3 + 1] = Math.sin(a) * s + 1; this.sparkV[i * 3 + 2] = (this.rnd() - 0.5) * 0.6;
    }
    pa.needsUpdate = true; (this.sparks.material as PointsMaterial).color.set(color); this.sparks.visible = true; this.sparkLife = 0.7;
  }
  step(dt: number): boolean {
    let busy = this.rig.step(dt);
    if (this.sparkLife > 0) {
      this.sparkLife -= dt; busy = true;
      const pa = this.sparks.geometry.getAttribute("position") as BufferAttribute;
      for (let i = 0; i < pa.count; i++) { this.sparkV[i * 3 + 1] -= 5 * dt; pa.setXYZ(i, pa.getX(i) + this.sparkV[i * 3] * dt, pa.getY(i) + this.sparkV[i * 3 + 1] * dt, pa.getZ(i) + this.sparkV[i * 3 + 2] * dt); }
      pa.needsUpdate = true; (this.sparks.material as PointsMaterial).opacity = Math.max(0, this.sparkLife / 0.7);
      if (this.sparkLife <= 0) this.sparks.visible = false;
    }
    return busy;
  }
  dispose(): void {
    for (const t of this.texs) t.dispose();
    this.rulerTex?.dispose();
    Object.values(this.m).forEach((x) => x.dispose());
    this.bobMat.dispose(); this.gMat.dispose(); this.gThreadMat.dispose(); this.ringMat.dispose();
    this.rig.dispose();
  }
}
