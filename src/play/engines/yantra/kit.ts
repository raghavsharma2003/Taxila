// Yantra · the circuit kit in 3D (three.js; the core owns the renderer and the frame loop). A workbench with the law's
// parts each on a base board in its slot (2 × 3, or 3 × 2 in a wide box, as the 2D twin lays them): a cell lying in its
// holder (+ cap, − flat end), a torch bulb in a socket, a knife switch, sometimes a steel paper clip or a rubber eraser.
// Every part has two brass screw posts (the law's terminals). Wires are copper leads arcing from post to post (tubes), a
// knot at the middle of each (the cut target). After a RUN that glowed, beads of current move one way round the law's
// own loop (currentLoop), all at one speed and one spacing, and the bulb lights; a dark run gives a short spark and fade
// where the law's answer points (the cell on a short; a bare post, the eraser or the switch otherwise). The scene decides
// nothing: what glows, and why not, come from circuit.logic.ts.
import {
  AdditiveBlending, BoxGeometry, BufferGeometry, CatmullRomCurve3, CubicBezierCurve3, CylinderGeometry, DoubleSide, Group, InstancedMesh, Matrix4,
  Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, PlaneGeometry, Quaternion, SphereGeometry, Sprite, SpriteMaterial, TorusGeometry,
  TubeGeometry, Vector3, type Scene, type Texture,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { TERMS, wireEnds, wireKey, type CircuitParams, type CircuitPart, type PartKind } from "../../families/yantra/circuit.logic.ts";
import { shade, type ThemePack } from "./palette.ts";
import { Rig, type Reserve, type Rnd } from "./rig.ts";
import { flareTexture, spotTexture } from "./textures.ts";

const SX = 3.3, SZ = 2.55;            // slot spacing (world units); rows spread up to SZ_MAX where the box has height to spare
const SZ_MAX = 4.0;
const DX = 1.0;                       // a part's posts sit this far either side of its centre
const PLATE_H = 0.12;
export const POST_TOP = 0.36;         // a wire meets a post here
const BEADS = 90;
const SPACE = 0.42, SPEED = 1.5;      // the current's beads: spacing and speed, the same everywhere on the loop
const SHOW_S = 10;                    // s of moving beads after a glowing run, then they hold still

interface PartObj { part: CircuitPart; g: Group; c: Vector3 }
interface WireObj { key: string; mesh: Mesh; curve: CubicBezierCurve3; mid: Vector3 }
export type KitEvent = { kind: "lit" } | { kind: "dark" };

/** a geometry that is several boxes / cylinders, merged (one draw call) */
function merged(list: BufferGeometry[]): BufferGeometry {
  const g = mergeGeometries(list.map((x) => (x.index ? x.toNonIndexed() : x)), false) as BufferGeometry;
  for (const x of list) x.dispose();
  return g;
}
const box = (w: number, h: number, d: number, x = 0, y = 0, z = 0) => new BoxGeometry(w, h, d).translate(x, y, z);

export class KitScene {
  readonly rig: Rig;
  private T: ThemePack;
  private cols = 2; private sz = SZ;
  private parts: PartObj[] = [];
  private posts = new Map<string, Vector3>();
  private postMesh: InstancedMesh;
  private plates: InstancedMesh;
  private shadows: InstancedMesh;
  private wires = new Map<string, WireObj>();
  private knots: InstancedMesh;
  private band: Mesh;
  private rings: Mesh[] = [];
  private beads: InstancedMesh;
  private halo: Sprite; private flares: Sprite[] = [];
  private lever: Group | null = null; private leverAng = 0.62; private leverTo = 0.62;
  private glassMat: MeshPhongMaterial; private filMat: MeshBasicMaterial;
  private m: Record<"plate" | "brass" | "wire" | "short" | "knot" | "cell" | "band" | "metal" | "lever" | "knob" | "steel" | "rubber" | "sleeve" | "socket" | "base" | "you", MeshLambertMaterial | MeshPhongMaterial | MeshBasicMaterial>;
  private texs: Texture[] = [];
  private loop: Vector3[] | null = null; private loopLen: number[] = []; private loopTotal = 0;
  private lit = 0; private litTo = 0; private ranAt = -1;
  private flareT = 0;
  private tmpM = new Matrix4(); private tmpQ = new Quaternion(); private tmpS = new Vector3(); private tmpV = new Vector3();

  constructor(scene: Scene, private p: CircuitParams, T: ThemePack, rnd: Rnd, private reduced: boolean) {
    this.T = T;
    this.rig = new Rig(scene, T, rnd, { bw: 3 * SX + 6, bd: 3 * SZ + 8, bz: 1.2, yaw: 0.1, pitch: 0.98, center: new Vector3(0, 0.3, 0), swing: 0.26, pool: [3 * SX + 2, 3 * SZ + 2] });
    const R = this.rig.root;
    this.m = {
      plate: new MeshLambertMaterial(), brass: new MeshPhongMaterial({ shininess: 90, specular: 0x886633 }), wire: new MeshPhongMaterial({ shininess: 50, specular: 0x444444 }),
      short: new MeshPhongMaterial({ shininess: 50 }), knot: new MeshPhongMaterial({ shininess: 60 }), cell: new MeshPhongMaterial({ shininess: 70, specular: 0x555555 }),
      band: new MeshPhongMaterial({ shininess: 70 }), metal: new MeshPhongMaterial({ shininess: 120, specular: 0xffffff }), lever: new MeshPhongMaterial({ shininess: 110, specular: 0xffffff }),
      knob: new MeshPhongMaterial({ shininess: 60 }), steel: new MeshPhongMaterial({ shininess: 140, specular: 0xffffff }), rubber: new MeshLambertMaterial(),
      sleeve: new MeshLambertMaterial(), socket: new MeshPhongMaterial({ shininess: 40 }), base: new MeshLambertMaterial(), you: new MeshBasicMaterial({ transparent: true, opacity: 0.95, depthTest: false }),
    };
    this.glassMat = new MeshPhongMaterial({ transparent: true, opacity: 0.55, shininess: 160, specular: 0xffffff, depthWrite: false, side: DoubleSide });
    this.filMat = new MeshBasicMaterial({ toneMapped: false });

    // ── the base boards, their contact shadows, the posts (one instanced mesh each)
    const n = p.parts.length;
    this.plates = new InstancedMesh(box(2.7, PLATE_H, 1.35, 0, PLATE_H / 2), this.m.plate, n);
    const shTex = spotTexture("rgba(0,0,0,0.5)", "rgba(0,0,0,0)"); this.texs.push(shTex);
    this.shadows = new InstancedMesh(new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), n);
    this.shadows.renderOrder = 2;
    const postG = merged([new CylinderGeometry(0.1, 0.12, 0.2, 14).translate(0, PLATE_H + 0.1, 0), new CylinderGeometry(0.16, 0.16, 0.05, 6).translate(0, PLATE_H + 0.16, 0), new CylinderGeometry(0.075, 0.075, 0.1, 12).translate(0, PLATE_H + 0.22, 0)]);
    this.postMesh = new InstancedMesh(postG, this.m.brass, n * 2);
    R.add(this.shadows, this.plates, this.postMesh);

    // ── the parts
    for (const part of p.parts) {
      const g = new Group(); R.add(g);
      this.parts.push({ part, g, c: new Vector3() });
      this.build(part, g);
    }
    // ── wires' knots, the rubber band of a wire being drawn, the post rings, the current's beads, the bulb's halo, flares
    this.knots = new InstancedMesh(new SphereGeometry(0.11, 14, 10), this.m.knot, 16); this.knots.count = 0; R.add(this.knots);
    this.band = new Mesh(new BufferGeometry(), this.m.you); this.band.visible = false; this.band.renderOrder = 7; R.add(this.band);
    for (let i = 0; i < 2; i++) { const r = new Mesh(new TorusGeometry(0.26, 0.035, 8, 28).rotateX(Math.PI / 2), this.m.you); r.visible = false; r.renderOrder = 8; this.rings.push(r); R.add(r); }
    this.beads = new InstancedMesh(new SphereGeometry(0.075, 10, 8), new MeshBasicMaterial({ toneMapped: false }), BEADS); this.beads.count = 0; this.beads.renderOrder = 6; this.beads.frustumCulled = false; R.add(this.beads);
    const haloTex = spotTexture("rgba(255,255,255,0.95)", "rgba(255,255,255,0)"), flareTex = flareTexture(); this.texs.push(haloTex, flareTex);
    this.halo = new Sprite(new SpriteMaterial({ map: haloTex, blending: AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false })); this.halo.visible = false; this.halo.renderOrder = 9; R.add(this.halo);
    for (let i = 0; i < 4; i++) { const s = new Sprite(new SpriteMaterial({ map: flareTex, blending: AdditiveBlending, depthTest: false, depthWrite: false, transparent: true, toneMapped: false })); s.visible = false; s.renderOrder = 9; this.flares.push(s); R.add(s); }
    this.setTheme(T);
  }

  // ───────────────────────────── the parts ─────────────────────────────
  private build(part: CircuitPart, g: Group): void {
    const m = this.m, top = PLATE_H;
    // which side each terminal sits on: the law's flip swaps them (the 2D twin draws the same)
    const leftT = part.flip ? TERMS[part.kind][1] : TERMS[part.kind][0];
    const strip = (x0: number, x1: number, y: number) => box(Math.abs(x1 - x0), 0.03, 0.12, (x0 + x1) / 2, y);
    if (part.kind === "cell") {
      const plusLeft = leftT === "c+", s = plusLeft ? -1 : 1, cy = top + 0.3;
      const body = new Mesh(new CylinderGeometry(0.27, 0.27, 1.25, 28).rotateZ(Math.PI / 2).translate(0, cy, 0), m.cell);
      const band = new Mesh(new CylinderGeometry(0.275, 0.275, 0.34, 28).rotateZ(Math.PI / 2).translate(s * 0.44, cy, 0), m.band);
      // the + cap: a small metal nub on the + end; the − end a flat disc
      const ends = new Mesh(merged([new CylinderGeometry(0.1, 0.1, 0.1, 16).rotateZ(Math.PI / 2).translate(s * 0.67, cy, 0), new CylinderGeometry(0.22, 0.22, 0.02, 20).rotateZ(Math.PI / 2).translate(-s * 0.63, cy, 0),
        strip(-DX, -0.7, top + 0.02), strip(0.7, DX, top + 0.02), box(0.05, 0.36, 0.14, -0.74, top + 0.18), box(0.05, 0.36, 0.14, 0.74, top + 0.18)]), m.metal);
      const cradle = new Mesh(merged([box(0.16, 0.12, 0.5, -0.35, top + 0.06), box(0.16, 0.12, 0.5, 0.35, top + 0.06)]), m.base);
      g.add(body, band, ends, cradle);
    } else if (part.kind === "bulb") {
      const socket = new Mesh(merged([new CylinderGeometry(0.24, 0.28, 0.16, 20).translate(0, top + 0.08, 0), new CylinderGeometry(0.16, 0.18, 0.2, 18).translate(0, top + 0.26, 0)]), m.socket);
      const thread = new Mesh(merged([new CylinderGeometry(0.15, 0.15, 0.16, 18).translate(0, top + 0.43, 0), strip(-DX, -0.22, top + 0.02), strip(0.22, DX, top + 0.02)]), m.metal);
      const glass = new Mesh(new SphereGeometry(0.36, 28, 20).translate(0, top + 0.82, 0), this.glassMat);
      glass.renderOrder = 5;
      const fil = new Mesh(merged([box(0.02, 0.3, 0.02, -0.09, top + 0.66), box(0.02, 0.3, 0.02, 0.09, top + 0.66), new TorusGeometry(0.09, 0.016, 6, 16, Math.PI).translate(0, top + 0.8, 0)]), this.filMat);
      g.add(socket, thread, fil, glass);
      g.userData.glass = new Vector3(0, top + 0.82, 0);
    } else if (part.kind === "switch") {
      const base = new Mesh(box(1.55, 0.1, 0.6, 0, top + 0.05), m.base);
      // the knife: hinged on the left post's side, it drops into the contact on the right when closed
      const hinge = new Mesh(merged([box(0.1, 0.24, 0.26, -0.62, top + 0.22), box(0.1, 0.24, 0.26, 0.62, top + 0.22), strip(-DX, -0.62, top + 0.02), strip(0.62, DX, top + 0.02)]), m.metal);
      const lever = new Group(); lever.position.set(-0.62, top + 0.3, 0);
      lever.add(new Mesh(merged([box(1.3, 0.05, 0.1, 0.65, 0), box(0.06, 0.32, 0.06, 1.12, 0.16)]), m.lever), new Mesh(new SphereGeometry(0.11, 16, 12).translate(1.12, 0.34, 0), m.knob));
      g.add(base, hinge, lever);
      this.lever = lever; lever.userData.sw = true;
      for (const c of [base, ...lever.children]) c.userData.sw = true;
    } else if (part.kind === "clip") {
      const pts = [[-0.62, -0.17], [0.5, -0.17], [0.62, -0.1], [0.64, 0.04], [0.56, 0.16], [0.45, 0.18], [-0.48, 0.18], [-0.56, 0.1], [-0.56, -0.02], [-0.48, -0.08], [0.38, -0.08], [0.46, -0.03], [0.46, 0.04], [0.38, 0.09], [-0.32, 0.09]]
        .map(([x, z]) => new Vector3(x, top + 0.04, z));
      const clip = new Mesh(new TubeGeometry(new CatmullRomCurve3(pts), 90, 0.026, 6), m.steel);
      const leads = new Mesh(merged([strip(-DX, -0.62, top + 0.02), strip(0.46, DX, top + 0.02)]), m.metal);
      g.add(clip, leads);
    } else {
      const er = new Mesh(box(0.92, 0.26, 0.48, 0, top + 0.13), m.rubber);
      const sleeve = new Mesh(box(0.42, 0.28, 0.5, 0.2, top + 0.14), m.sleeve);
      const leads = new Mesh(merged([strip(-DX, -0.46, top + 0.02), strip(0.46, DX, top + 0.02)]), m.metal);
      g.add(er, sleeve, leads);
    }
  }

  /** where each slot sits for `cols` columns (2 × 3 on a phone, 3 × 2 when wide) */
  arrange(cols: number, sz = this.sz): void {
    this.cols = cols; this.sz = sz;
    const rows = 6 / cols;
    this.posts.clear();
    this.parts.forEach((o, i) => {
      const col = o.part.slot % cols, row = Math.floor(o.part.slot / cols);
      o.c.set((col - (cols - 1) / 2) * SX, 0, (row - (rows - 1) / 2) * sz);
      o.g.position.copy(o.c);
      const [t0, t1] = TERMS[o.part.kind], [l, r] = o.part.flip ? [t1, t0] : [t0, t1];
      this.posts.set(l, new Vector3(o.c.x - DX, POST_TOP, o.c.z)); this.posts.set(r, new Vector3(o.c.x + DX, POST_TOP, o.c.z));
      this.tmpM.makeTranslation(o.c.x, 0, o.c.z); this.plates.setMatrixAt(i, this.tmpM);
      this.tmpM.compose(this.tmpV.set(o.c.x + 0.1, 0.003, o.c.z + 0.12), this.tmpQ.identity(), this.tmpS.set(3.6, 1, 2.1)); this.shadows.setMatrixAt(i, this.tmpM);
      this.tmpM.makeTranslation(o.c.x - DX, 0, o.c.z); this.postMesh.setMatrixAt(2 * i, this.tmpM);
      this.tmpM.makeTranslation(o.c.x + DX, 0, o.c.z); this.postMesh.setMatrixAt(2 * i + 1, this.tmpM);
    });
    this.plates.instanceMatrix.needsUpdate = true; this.shadows.instanceMatrix.needsUpdate = true; this.postMesh.instanceMatrix.needsUpdate = true;
    // the wires follow their posts
    const keys = [...this.wires.keys()];
    for (const k of keys) this.dropWire(k);
    this.syncWires(keys, null);
  }
  get columns(): number { return this.cols; }
  /** the points the framing keeps in view: every board, a wire's arc over it, the words under it */
  keyPoints(): Vector3[] {
    const out: Vector3[] = [];
    for (const o of this.parts) for (const dx of [-1.4, 1.4]) { out.push(new Vector3(o.c.x + dx, 0, o.c.z - 0.75), new Vector3(o.c.x + dx, 0, o.c.z + 1.2), new Vector3(o.c.x + dx, 1.25, o.c.z - 0.3)); }
    return out;
  }
  layout(w: number, h: number, reserve: Reserve): void {
    const cols = w > h * 0.9 ? 3 : 2;
    // the rows spread apart while the parts keep their size (a width-bound phone box has height to spare): the widest
    // spacing whose framing draws a part no smaller than the tightest spacing does
    const scale = () => { const a = this.rig.project(new Vector3(0, 0, 0)), b = this.rig.project(new Vector3(1, 0, 0)); return Math.hypot(b.x - a.x, b.y - a.y); };
    this.arrange(cols, SZ); this.rig.frame(w, h, this.keyPoints(), reserve, false);
    const s0 = scale();
    let best = SZ;
    for (let sz = SZ + 0.15; sz <= SZ_MAX + 1e-6; sz += 0.15) {
      this.arrange(cols, sz); this.rig.frame(w, h, this.keyPoints(), reserve, false);
      if (scale() >= s0 * 0.985) best = sz; else break;
    }
    this.arrange(cols, best); this.rig.frame(w, h, this.keyPoints(), reserve);
  }

  // ───────────────────────────── theme ─────────────────────────────
  setTheme(T: ThemePack): void {
    this.T = T; this.rig.setTheme(T);
    const k = T.kit, m = this.m;
    const col = (x: MeshLambertMaterial | MeshPhongMaterial | MeshBasicMaterial, c: number) => x.color.set(c);
    col(m.plate, k.plate); col(m.brass, k.brass); col(m.wire, k.wire); col(m.short, T.look); col(m.knot, shade(k.wire, 0.72));
    col(m.cell, k.cell); col(m.band, k.band); col(m.metal, 0xc8ccd2); col(m.lever, k.lever); col(m.knob, k.knob); col(m.steel, k.steel);
    col(m.rubber, k.rubber); col(m.sleeve, shade(k.plate, 0.82)); col(m.socket, 0x2b2b2b); col(m.base, shade(k.plate, 0.72)); col(m.you, T.you);
    (m.short as MeshPhongMaterial).emissive.set(T.look); (m.short as MeshPhongMaterial).emissiveIntensity = 0.5;
    this.glassMat.color.set(k.glass);
    (this.beads.material as MeshBasicMaterial).color.set(k.current);
    this.halo.material.color.set(k.glow);
    for (const f of this.flares) f.material.color.set(T.look);
    this.paintLit();
  }
  private paintLit(): void {
    const k = this.lit, T = this.T;
    this.glassMat.emissive.set(T.kit.glow); this.glassMat.emissiveIntensity = 0.95 * k; this.glassMat.opacity = 0.55 + 0.35 * k;
    this.filMat.color.set(k > 0.05 ? shade(T.kit.glow, 1 + 0.5 * k) : 0x3a3a3a);
    const b = this.parts.find((o) => o.part.kind === "bulb");
    this.halo.visible = k > 0.02 && !!b;
    if (b) { this.halo.position.copy(b.c).add(b.g.userData.glass as Vector3); this.halo.scale.setScalar(0.4 + 2.2 * k); this.halo.material.opacity = 0.9 * k; }
  }

  // ───────────────────────────── wires ─────────────────────────────
  post(t: string): Vector3 | null { return this.posts.get(t) ?? null; }
  terminals(): [string, Vector3][] { return [...this.posts.entries()]; }
  private curveOf(k: string, i: number): CubicBezierCurve3 {
    const [a, b] = wireEnds(k), A = this.posts.get(a) as Vector3, B = this.posts.get(b) as Vector3;
    const d = A.distanceTo(B), lift = 0.45 + 0.16 * d;
    // a little sideways bow per wire, so two leads between the same parts never lie on one line
    const dx = B.x - A.x, dz = B.z - A.z, l = Math.hypot(dx, dz) || 1, bow = ((i % 3) - 1) * 0.28 + (i % 3 === 1 ? 0.12 : 0);
    const nx = (-dz / l) * bow, nz = (dx / l) * bow;
    return new CubicBezierCurve3(A.clone(), new Vector3(A.x + dx * 0.15 + nx, A.y + lift, A.z + dz * 0.15 + nz), new Vector3(B.x - dx * 0.15 + nx, B.y + lift, B.z - dz * 0.15 + nz), B.clone());
  }
  private dropWire(k: string): void { const o = this.wires.get(k); if (!o) return; this.rig.root.remove(o.mesh); o.mesh.geometry.dispose(); this.wires.delete(k); }
  /** match the leads on the bench to the law's wires; `short` = the leads the law's short runs through (tinted) */
  syncWires(keys: string[], short: Set<string> | null): void {
    for (const k of [...this.wires.keys()]) if (!keys.includes(k)) this.dropWire(k);
    keys.forEach((k, i) => {
      if (!this.wires.has(k)) {
        const curve = this.curveOf(k, i);
        const mesh = new Mesh(new TubeGeometry(curve, 30, 0.055, 7), this.m.wire);
        this.rig.root.add(mesh);
        this.wires.set(k, { key: k, mesh, curve, mid: curve.getPoint(0.5) });
      }
      const o = this.wires.get(k) as WireObj;
      o.mesh.material = short?.has(k) ? this.m.short : this.m.wire;
    });
    this.knots.count = Math.min(16, keys.length);
    keys.slice(0, 16).forEach((k, i) => { const o = this.wires.get(k) as WireObj; this.tmpM.makeTranslation(o.mid.x, o.mid.y, o.mid.z); this.knots.setMatrixAt(i, this.tmpM); });
    this.knots.instanceMatrix.needsUpdate = true;
  }
  /** the knots (cut targets) in world space */
  knotsAt(): [string, Vector3][] { return [...this.wires.values()].map((o) => [o.key, o.mid]); }
  /** the rubber band of a wire being drawn, from post `from` to a point; null hides it */
  rubber(from: string | null, to: Vector3 | null): void {
    const A = from ? this.posts.get(from) : null;
    if (!A || !to) { this.band.visible = false; return; }
    const d = A.distanceTo(to), mid = A.clone().lerp(to, 0.5); mid.y += 0.3 + 0.1 * d;
    this.band.geometry.dispose();
    this.band.geometry = new TubeGeometry(new CubicBezierCurve3(A.clone(), A.clone().lerp(mid, 0.6), to.clone().lerp(mid, 0.6), to.clone()), 16, 0.035, 5);
    this.band.visible = true;
  }
  /** rings round the post a wire starts from and the one under the finger */
  ringsAt(ts: (string | null)[]): void {
    this.rings.forEach((r, i) => { const q = ts[i] ? this.posts.get(ts[i] as string) : null; r.visible = !!q; if (q) r.position.set(q.x, PLATE_H + 0.02, q.z); });
  }
  /** is a screen point on the switch (its lever or its base)? */
  onSwitch(x: number, y: number): boolean {
    const s = this.parts.find((o) => o.part.kind === "switch");
    if (!s) return false;
    const hits = this.rig.rayAt(x, y).intersectObject(s.g, true);
    if (hits.length) return true;
    const c = this.rig.project(this.tmpV.set(s.c.x, PLATE_H + 0.3, s.c.z));
    return Math.abs(c.x - x) < 36 && Math.abs(c.y - y) < 30;
  }
  setSwitch(closed: boolean): void { this.leverTo = closed ? 0 : 0.62; if (this.reduced) this.leverAng = this.leverTo; }
  centreOf(kind: PartKind): Vector3 | null { const o = this.parts.find((x) => x.part.kind === kind); return o ? o.c.clone() : null; }

  // ───────────────────────────── the law's answer ─────────────────────────────
  /** the loop the current runs round (the law's currentLoop: terminals + → bulb → −), as a polyline on the bench */
  private polyline(loop: string[], wires: string[]): Vector3[] {
    const pts: Vector3[] = [], partOf = (t: string) => this.p.parts.find((x) => TERMS[x.kind].includes(t));
    const push = (seg: Vector3[]) => { for (const q of pts.length ? seg.slice(1) : seg) pts.push(q); };
    for (let i = 0; i + 1 < loop.length; i++) {
      const u = loop[i], v = loop[i + 1], k = wireKey(u, v), pu = partOf(u), pv = partOf(v);
      const U = this.posts.get(u) as Vector3, V = this.posts.get(v) as Vector3;
      if (pu === pv && (!wires.includes(k) || pu?.kind === "bulb")) {
        // inside a part: through the filament of the bulb, along the knife, the clip
        const o = this.parts.find((x) => x.part === pu);
        if (pu?.kind === "bulb" && o) { const gq = (o.g.userData.glass as Vector3).clone().add(o.c); push([U, new Vector3(U.x + (V.x - U.x) * 0.38, PLATE_H + 0.45, U.z), new Vector3(gq.x, gq.y - 0.05, gq.z), new Vector3(V.x - (V.x - U.x) * 0.38, PLATE_H + 0.45, V.z), V]); }
        else push([U, V]);
      } else {
        const w = this.wires.get(k);
        const q = w ? w.curve.getPoints(24) : [U, V];
        push(wireEnds(k)[0] === u ? q : [...q].reverse());
      }
    }
    // back through the cell, − to +
    const cm = this.posts.get("c-") as Vector3, cp = this.posts.get("c+") as Vector3, cy = PLATE_H + 0.3;
    push([cm, new Vector3(cm.x, cy, cm.z), new Vector3(cp.x, cy, cp.z), cp]);
    return pts;
  }
  /** show the law's answer for the board on screen: a loop that glows, or the spots a dark run points to */
  show(ans: { loop: string[] | null; wires: string[]; dark: Vector3[] } | null, t: number): KitEvent | null {
    for (const f of this.flares) f.visible = false;
    this.loop = null; this.beads.count = 0; this.litTo = 0;
    if (!ans) { this.lit = 0; this.paintLit(); return null; }
    this.ranAt = t;
    if (ans.loop) {
      this.loop = this.polyline(ans.loop, ans.wires);
      this.loopLen = []; this.loopTotal = 0;
      for (let i = 0; i + 1 < this.loop.length; i++) { const d = this.loop[i].distanceTo(this.loop[i + 1]); this.loopLen.push(d); this.loopTotal += d; }
      this.litTo = 1; if (this.reduced) { this.lit = 1; this.paintLit(); }
      this.placeBeads(0);
      return { kind: "lit" };
    }
    ans.dark.slice(0, this.flares.length).forEach((q, i) => { const f = this.flares[i]; f.position.copy(q); f.visible = true; f.userData.t = 0; });
    this.flareT = 0;
    return { kind: "dark" };
  }
  private placeBeads(tt: number): void {
    const L = this.loop;
    if (!L || this.loopTotal < SPACE) { this.beads.count = 0; return; }
    const off = ((tt * SPEED) % SPACE + SPACE) % SPACE;
    let i = 0, acc = 0, n = 0;
    for (let s = off; s < this.loopTotal && n < BEADS; s += SPACE) {
      while (i < this.loopLen.length - 1 && acc + this.loopLen[i] < s) { acc += this.loopLen[i]; i++; }
      const u = this.loopLen[i] ? (s - acc) / this.loopLen[i] : 0;
      this.tmpV.copy(L[i]).lerp(L[i + 1], Math.min(1, u));
      this.tmpM.makeTranslation(this.tmpV.x, this.tmpV.y, this.tmpV.z); this.beads.setMatrixAt(n++, this.tmpM);
    }
    this.beads.count = n; this.beads.instanceMatrix.needsUpdate = true;
  }

  /** advance animations → whether anything still moves */
  step(dt: number, t: number): boolean {
    let busy = this.rig.step(dt);
    if (this.lever) {
      const d = this.leverTo - this.leverAng;
      if (Math.abs(d) > 1e-3 && !this.reduced) { this.leverAng += d * (1 - Math.exp(-dt * 14)); busy = true; } else this.leverAng = this.leverTo;
      this.lever.rotation.z = this.leverAng;
    }
    if (this.lit !== this.litTo) { this.lit = this.litTo > this.lit ? Math.min(this.litTo, this.lit + dt * 4) : Math.max(this.litTo, this.lit - dt * 6); this.paintLit(); busy = true; }
    if (this.loop) {
      const tt = this.reduced ? 0 : Math.min(t - this.ranAt, SHOW_S);
      this.placeBeads(tt);
      if (!this.reduced && t - this.ranAt < SHOW_S) {
        busy = true;
        this.halo.scale.setScalar((0.4 + 2.2 * this.lit) * (1 + 0.04 * Math.sin(t * 9)));
      }
    }
    if (this.flares.some((f) => f.visible)) {
      this.flareT += dt;
      const ft = this.flareT, sc = this.reduced ? 0.55 : 0.35 + 0.9 * Math.exp(-ft * 5) + 0.08 * Math.sin(ft * 30) * Math.exp(-ft * 2);
      for (const f of this.flares) if (f.visible) { f.scale.setScalar(sc); f.material.opacity = this.reduced ? 0.8 : Math.max(0.55, Math.exp(-ft * 1.5)); }
      if (ft < 1.2) busy = true;
    }
    return busy;
  }

  dispose(): void {
    for (const t of this.texs) t.dispose();
    for (const o of this.wires.values()) o.mesh.geometry.dispose();
    Object.values(this.m).forEach((x) => x.dispose());
    this.glassMat.dispose(); this.filMat.dispose();
    this.rig.dispose();
  }
}
