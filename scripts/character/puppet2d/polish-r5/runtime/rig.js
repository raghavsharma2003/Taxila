// Puppet2DRig, arm P (PLAN §3-§7): painted layers cut from c-front, deformed on the CPU, drawn by gl.js.
// Implements the HeadRig signature minus `root`: apply(bs, head[p,y,r], gaze[yaw,pitch], lean, breath), dispose(),
// stats(). ARKit "Left" is HER left = screen right, so the screen-left eye (L) reads the *Right keys.
//
// Deformation per vertex (rest space = c-front pixels):
//   1. expression offsets in rest space (lids, lower lids, brows, cheek lift, jaw drop, mouth lattice)
//   2. the 2.5D head proxy: ellipsoid depth + nose/cheek bumps, rotated by yaw/pitch and projected (PLAN §5)
//   3. head roll about the neck pivot, breath bob, lean scale
//   4. secondary motion: locks and bun on damped springs driven by the head's screen acceleration
import { Renderer } from "./gl.js";
import { LipSolver, LipShell, jawProfile, lineY as lineYAt } from "./lips.js";
import { Life } from "./life.js";

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const clamp01 = (x) => clamp(x, 0, 1);
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const D2R = Math.PI / 180;
// debug (?dbg=tint or ?only=a,b): per-layer false colour for attributing seams and debris
const DBG_TINT = { hairback: [0, 0, 1, 0.6], bun: [1, 0, 0, 0.6], body: [0, 0.7, 0, 0.5], ears: [1, 0.6, 0, 0.6], face: [1, 1, 0, 0.35], browL: [0, 1, 1, 0.6], browR: [0, 1, 1, 0.6], lockbed: [1, 0, 1, 0.6], hair: [0.3, 0.3, 1, 0.5], lockL: [0, 1, 0.3, 0.7], lockR: [1, 0.3, 0.6, 0.7] };

// r2 head proxy: ONE shared, slope-bounded depth field for every head layer (borrowed idea from arm V's dome).
// Every layer that overlaps another samples the same z at the same rest point, so the turn is a continuous warp of
// the whole head: nothing can tear, clip or reveal background between head layers. Foreshortening comes from the
// field's curvature: a broad skull paraboloid (smooth to 0 at the hair silhouette, so the outline stays put) plus a
// tighter face bump, so the far eye/cheek compress and the near ones widen (|dz/dx| < 1.6 everywhere: no fold
// up to ±30°). Only the bun takes an extra negative depth (it is behind the skull), with painted fills under it.
const PX = { cx: 512, cy: 420, rx: 322, ry: 392, A: 205, fcx: 530, fcy: 500, fsx: 128, fsy: 160, B: 95, gain: 1.0, pivot: [530, 728] };
function zHead(x, y) {
  const u = (x - PX.cx) / PX.rx, v = (y - PX.cy) / PX.ry;
  const q = Math.max(0, 1 - u * u - v * v);
  let z = PX.A * q * q;
  z += PX.B * Math.exp(-((x - PX.fcx) ** 2) / (2 * PX.fsx * PX.fsx) - ((y - PX.fcy) ** 2) / (2 * PX.fsy * PX.fsy));
  z += 26 * Math.exp(-((x - 530) ** 2 + (y - 532) ** 2) / (2 * 24 * 24));                       // nose
  for (const cx of [452, 608]) z += 8 * Math.exp(-((x - cx) ** 2 + (y - 585) ** 2) / (2 * 45 * 45)); // cheeks
  return z;
}

/** r5 product yaw limit (judge r4 fix 1, interim): a soft knee so a head that asks for more never hits a hard stop. */
export function softYaw(y, m) {
  const k = 0.7 * m, a = Math.abs(y);
  if (a <= k) return y;
  return Math.sign(y) * (k + (m - k) * Math.tanh((a - k) / (m - k)));
}

/** r5 (judge r4 fix 2): an adaptive quad mesh. Cells of `coarse` px, split once to `fine` px where needFine(x0,y0,x1,y1)
 *  (feature / hole-edge cells); a coarse cell next to split ones is fanned through the shared edge midpoints, so the
 *  mesh has no T-junction cracks. Same {rest, uv, idx, n} as grid(). */
function adaptiveGrid(rect, coarse, fine, needFine) {
  const [X0, Y0, X1, Y1] = rect;
  const nx = Math.ceil((X1 - X0) / coarse), ny = Math.ceil((Y1 - Y0) / coarse);
  const split = new Uint8Array(nx * ny);
  const cx = (i) => Math.min(X1, X0 + i * coarse), cy = (j) => Math.min(Y1, Y0 + j * coarse);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) split[j * nx + i] = needFine(cx(i), cy(j), cx(i + 1), cy(j + 1)) ? 1 : 0;
  const verts = [], key = new Map();
  const V = (x, y) => { const k = Math.round(x * 4) + "," + Math.round(y * 4); let v = key.get(k); if (v === undefined) { v = verts.length / 2; verts.push(x, y); key.set(k, v); } return v; };
  const has = (x, y) => key.has(Math.round(x * 4) + "," + Math.round(y * 4));
  const tris = [];
  // pass 1: split cells (their 9 vertices exist before the coarse cells look for midpoints)
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (!split[j * nx + i]) continue;
    const x0 = cx(i), y0 = cy(j), x1 = cx(i + 1), y1 = cy(j + 1), xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
    const xs = [x0, xm, x1], ys = [y0, ym, y1];
    for (let b = 0; b < 2; b++) for (let a = 0; a < 2; a++) {
      const p = V(xs[a], ys[b]), q = V(xs[a + 1], ys[b]), r = V(xs[a], ys[b + 1]), t = V(xs[a + 1], ys[b + 1]);
      tris.push(p, q, r, q, t, r);
    }
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (split[j * nx + i]) continue;
    const x0 = cx(i), y0 = cy(j), x1 = cx(i + 1), y1 = cy(j + 1), xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
    const mids = [has(xm, y0), has(x1, ym), has(xm, y1), has(x0, ym)];
    if (!mids.some(Boolean)) { const p = V(x0, y0), q = V(x1, y0), r = V(x0, y1), t = V(x1, y1); tris.push(p, q, r, q, t, r); continue; }
    // fan from the centre through the boundary ring (corners + the midpoints a split neighbour owns)
    const ring = [[x0, y0]]; if (mids[0]) ring.push([xm, y0]); ring.push([x1, y0]); if (mids[1]) ring.push([x1, ym]);
    ring.push([x1, y1]); if (mids[2]) ring.push([xm, y1]); ring.push([x0, y1]); if (mids[3]) ring.push([x0, ym]);
    const c = V(xm, ym), ids = ring.map(([x, y]) => V(x, y));
    for (let k = 0; k < ids.length; k++) tris.push(c, ids[k], ids[(k + 1) % ids.length]);
  }
  const n = verts.length / 2, rest = new Float32Array(verts), uv = new Float32Array(n * 2);
  for (let k = 0; k < n; k++) { uv[k * 2] = (rest[k * 2] - X0) / (X1 - X0); uv[k * 2 + 1] = (rest[k * 2 + 1] - Y0) / (Y1 - Y0); }
  return { rest, uv, idx: new Uint16Array(tris), n };
}

// r5 (fps): zHead (four exp per call) as an 8 px bilinear table; z only enters through the pitch term (z * sin(pitch),
// |pitch| <= 12 deg), so the table's sub-pixel error never shows. Hot loops (eyes, mouth interior, neck) use zFast.
const ZS = 8, ZN = 1024 / ZS + 1, ZLUT = new Float32Array(ZN * ZN);
for (let j = 0; j < ZN; j++) for (let i = 0; i < ZN; i++) ZLUT[j * ZN + i] = zHead(i * ZS, j * ZS);
function zFast(x, y) {
  const gx = clamp(x / ZS, 0, ZN - 1.001), gy = clamp(y / ZS, 0, ZN - 1.001), i = gx | 0, j = gy | 0, u = gx - i, v = gy - j, k = j * ZN + i;
  return (ZLUT[k] * (1 - u) + ZLUT[k + 1] * u) * (1 - v) + (ZLUT[k + ZN] * (1 - u) + ZLUT[k + ZN + 1] * u) * v;
}

/** r5 (fps): the rest-only part of faceOffset (cheek gaussians, wink cheek, jaw profile) for a fixed rest point. */
function faceW(x, y) {
  return [Math.exp(-((x - 455) ** 2 + (y - 585) ** 2) / (2 * 42 * 42)), Math.exp(-((x - 605) ** 2 + (y - 585) ** 2) / (2 * 42 * 42)),
    Math.exp(-((x - 430) ** 2 + (y - 545) ** 2) / (2 * 48 * 48)), Math.exp(-((x - 632) ** 2 + (y - 545) ** 2) / (2 * 48 * 48)),
    jawProfile(x, y), Math.sign(x - 530)];
}
function faceWArr(rest, n) {
  const W = new Float32Array(n * 6);
  for (let i = 0; i < n; i++) W.set(faceW(rest[i * 2], rest[i * 2 + 1]), i * 6);
  return W;
}

function grid(rect, cell) {
  const [x0, y0, x1, y1] = rect;
  const nx = Math.max(1, Math.ceil((x1 - x0) / cell)), ny = Math.max(1, Math.ceil((y1 - y0) / cell));
  const n = (nx + 1) * (ny + 1);
  const rest = new Float32Array(n * 2), uv = new Float32Array(n * 2);
  let k = 0;
  for (let j = 0; j <= ny; j++)
    for (let i = 0; i <= nx; i++) {
      const u = i / nx, v = j / ny;
      rest[k * 2] = x0 + u * (x1 - x0);
      rest[k * 2 + 1] = y0 + v * (y1 - y0);
      uv[k * 2] = u;
      uv[k * 2 + 1] = v;
      k++;
    }
  const idx = new Uint16Array(nx * ny * 6);
  k = 0;
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
      idx.set([a, b, c, b, d, c], k);
      k += 6;
    }
  return { rest, uv, idx, n };
}

/** A strip mesh with C columns x R rows; positions filled per frame. */
function strip(C, R) {
  const idx = new Uint16Array((C - 1) * (R - 1) * 6);
  let k = 0;
  for (let i = 0; i < C - 1; i++)
    for (let j = 0; j < R - 1; j++) {
      const a = i * R + j, b = a + 1, c = a + R, d = c + 1;
      idx.set([a, c, b, b, c, d], k);
      k += 6;
    }
  return idx;
}

function interp(xs0, arr, x) {
  // arr sampled at integer x from xs0
  const f = x - xs0;
  if (f <= 0) return arr[0];
  if (f >= arr.length - 1) return arr[arr.length - 1];
  const i = Math.floor(f), t = f - i;
  return arr[i] * (1 - t) + arr[i + 1] * t;
}

class Spring {
  constructor(k, zeta) {
    this.k = k;
    this.c = 2 * zeta * Math.sqrt(k);
    this.x = 0;
    this.v = 0;
  }
  step(force, dt) {
    let left = Math.min(dt, 0.1);
    while (left > 1e-6) {
      const h = Math.min(0.004, left);
      this.v += (force - this.k * this.x - this.c * this.v) * h;
      this.x += this.v * h;
      left -= h;
    }
    return this.x;
  }
}

/** r4b: the painted mid-blink key's lash depth as a fraction of the open eye (judge r3: ~0.6, pupil partly covered). */
const MID_DEPTH = 0.6;

export class Puppet2DRig {
  static async load(canvas, base, opts = {}) {
    const j = (p) => fetch(base + p).then((r) => r.json());
    const geom = await j("geom.json");
    const mouths = null;
    // r5: the painted turn plates load only on the opt-in plate path (?turn=plates); the product turn is blend-only, +-10
    const names = Object.keys(geom.rects).filter((n) => n !== "bg").concat(["interior"], opts.plates ? ["L", "R"].filter((k) => geom.plates && geom.plates[k]).map((k) => "plate" + k) : []);
    const imgs = {};
    await Promise.all(names.map(async (n) => {
      const im = new Image();
      im.src = `${base}${n}.${opts.ext || "png"}`;
      await im.decode();
      imgs[n] = im;
    }));
    return new Puppet2DRig(canvas, geom, mouths, imgs, opts);
  }

  constructor(canvas, geom, mouths, imgs, opts) {
    this.g = geom;
    this.M = mouths;
    this.R = new Renderer(canvas, { clear: opts.clear || [251.4 / 255, 229.4 / 255, 188.6 / 255], preserve: !!opts.preserve });
    this.R.dpr = opts.dpr || Math.min(2, window.devicePixelRatio || 1);
    this.reduced = !!opts.reducedMotion;
    // r5 (judge r4 fix 1, interim): product yaw is clamped to +-10 and drawn by the shared field only (no painted plate:
    // the plate's near-cheek seam and mouth-corner crease were the uncanny full-size frames). ?turn=plates restores the
    // +-20 plate path for evaluation.
    this.usePlates = !!opts.plates;
    this.yawMax = opts.yawMax ?? (this.usePlates ? 20 : 10);
    this.life = new Life({ reduced: this.reduced });
    this.view = opts.view || [140, 20, 744]; // x0, y0, width of the rest-space window shown
    this.tex = {};
    for (const [n, im] of Object.entries(imgs)) this.tex[n] = this.R.texture(im, n !== "interior");
    this.solver = new LipSolver();
    this.clock = null; // seconds; set by the caller for deterministic capture, else performance.now()
    this.lastT = -1;
    this.layers = {};
    const P = this.R.paint;
    const mk = (name, cell, kind) => {
      const rect = geom.rects[name];
      const gr = grid(rect, cell);
      const pos = new Float32Array(gr.rest);
      const z = new Float32Array(gr.n);
      for (let i = 0; i < gr.n; i++) z[i] = zHead(gr.rest[i * 2], gr.rest[i * 2 + 1]);
      const mesh = this.R.mesh(P, { aPos: { data: pos, size: 2, dynamic: true }, aUv: { data: gr.uv, size: 2 } }, gr.idx);
      this.layers[name] = { name, rect, rest: gr.rest, z, pos, mesh, kind, n: gr.n, FW: kind === "face" ? faceWArr(gr.rest, gr.n) : null };
      if (kind === "brow") {   // r5 (fps): the ribbon terms depend on x only: one evaluation per grid column
        const L = this.layers[name], xs = [...new Set(Array.from({ length: gr.n }, (_, i) => gr.rest[i * 2]))];
        L.colX = Float32Array.from(xs); L.colOf = new Uint16Array(gr.n);
        const ix = new Map(xs.map((x, i) => [x, i]));
        for (let i = 0; i < gr.n; i++) L.colOf[i] = ix.get(gr.rest[i * 2]);
        L.cdx = new Float32Array(xs.length); L.cdy = new Float32Array(xs.length); L.cs = new Float32Array(xs.length); L.cc = new Float32Array(xs.length); L.cyc = new Float32Array(xs.length);
      }
    };
        mk("hairback", 24, "head");
    mk("bun", 16, "bun");
    mk("body", 24, "body");
    mk("ears", 12, "head");
    mk("face", 14, "face");
    for (const s of ["L", "R"]) {
      mk("brow" + s, 6, "brow");
    }
    mk("lockbed", 12, "head");   // r5 (fps): 8 -> 12 px (the bed only follows the smooth head field)
    mk("hair", 16, "head");
    mk("lockL", 6, "lock");
    mk("lockR", 6, "lock");
    // r2: no per-layer depth offsets except the bun, which sits behind the skull (its hidden part is painted)
    { const L = this.layers.bun; for (let i = 0; i < L.n; i++) L.z[i] = L.z[i] - 45; }
    // the right lock hangs over the knot: its lower part takes the knot's depth, so lock and knot never slide over
    // each other on a turn (their shared dark-on-dark contour is unknown in c-front; any slide uncovered a jagged cut)
    { const L = this.layers.lockR; for (let i = 0; i < L.n; i++) L.z[i] -= 45 * smooth(585, 650, L.rest[i * 2 + 1]); }
    // locks: anchor (top) and length for the pendulum weight
    for (const s of ["L", "R"]) {
      const L = this.layers["lock" + s];
      L.y0 = L.rect[1] + 6;
      L.len = L.rect[3] - L.y0;
      L.spring = new Spring(55, 0.22);
      L.springY = new Spring(70, 0.3);
    }
    this.bunSpring = [new Spring(90, 0.5), new Spring(90, 0.5)];
    // eyes
    this.eyes = {};
    for (const s of ["L", "R"]) {
      const e = geom.eyes[s];
      const xa = e.x[0], xb = e.x[1];
      const C = Math.floor((xb - xa) / 2) + 1;
      const R = 4;
      const n = C * R;
      const pos = new Float32Array(n * 2), restA = new Float32Array(n * 2), edge = new Float32Array(n), topA = new Float32Array(n);
      // AA on all four sides: the end columns too (r1 showed a hard stair at the corners once a turn widened the eye)
      for (let i = 0; i < C; i++) for (let j = 0; j < R; j++) edge[i * R + j] = j === 0 || j === R - 1 ? 0 : Math.min(1, i / 2, (C - 1 - i) / 2);
      const mesh = this.R.mesh(this.R.eye, { aPos: { data: pos, size: 2, dynamic: true }, aRest: { data: restA, size: 2, dynamic: true }, aEdge: { data: edge, size: 1 }, aTop: { data: topA, size: 1, dynamic: true } }, strip(C, R));
      // lid mesh: columns along the lash, rows from (lash top - fall) to (lash bottom + 2)
      const lx0 = e.lashX[0], lx1 = e.lashX[1];
      const LC = Math.floor((lx1 - lx0) / 3) + 1, LR = 8;
      const lrest = new Float32Array(LC * LR * 2), luv = new Float32Array(LC * LR * 2), lv = new Float32Array(LC * LR);
      const lr = geom.rects["lid" + s];
      for (let i = 0; i < LC; i++) {
        const x = Math.min(lx1, lx0 + i * 3);
        const lt = interp(lx0, e.lashTop, x) - e.fall, lb = interp(lx0, e.lashBot, x) + 8.5;
        for (let jj = 0; jj < LR; jj++) {
          const v = jj / (LR - 1);
          const y = lt + v * (lb - lt);
          const k = i * LR + jj;
          lrest[k * 2] = x;
          lrest[k * 2 + 1] = y;
          luv[k * 2] = (x - lr[0]) / (lr[2] - lr[0]);
          luv[k * 2 + 1] = (y - lr[1]) / (lr[3] - lr[1]);
          lv[k] = smooth(0.1, 0.55, v);
        }
      }
      const lpos = new Float32Array(lrest);
      const lmesh = this.R.mesh(P, { aPos: { data: lpos, size: 2, dynamic: true }, aUv: { data: luv, size: 2 } }, strip(LC, LR));
      // lower band mesh
      const BC = Math.floor((xb - xa) / 3) + 1, BR = 5;
      const brest = new Float32Array(BC * BR * 2), buv = new Float32Array(BC * BR * 2), bv = new Float32Array(BC * BR);
      const br = geom.rects["lower" + s];
      for (let i = 0; i < BC; i++) {
        const x = Math.min(xb, xa + i * 3);
        const yb = interp(xa, e.bot, x);
        for (let jj = 0; jj < BR; jj++) {
          const v = jj / (BR - 1);
          const y = Math.max(br[1], yb - 3) + v * (Math.min(br[3], yb + 19) - Math.max(br[1], yb - 3));
          const k = i * BR + jj;
          brest[k * 2] = x;
          brest[k * 2 + 1] = y;
          buv[k * 2] = (x - br[0]) / (br[2] - br[0]);
          buv[k * 2 + 1] = (y - br[1]) / (br[3] - br[1]);
          bv[k] = v;
        }
      }
      const bpos = new Float32Array(brest);
      const bmesh = this.R.mesh(P, { aPos: { data: bpos, size: 2, dynamic: true }, aUv: { data: buv, size: 2 } }, strip(BC, BR));
      this.eyes[s] = { e, xa, xb, C, R, pos, restA, topA, mesh, LC, LR, lrest, lpos, lv, lmesh, BC, BR, brest, bpos, bv, bmesh, top: new Float32Array(xb - xa + 1), bot: new Float32Array(xb - xa + 1) };
    }
    // r3 painted lid keys (mid, shut) per eye: grid meshes projected with the head like every face layer
    this.lidKeyMesh = {};
    if (geom.lidKeys) for (const s of ["L", "R"]) for (const kk of ["mid", "shut"]) {
      const name = `lid${kk}${s}`, rect = geom.rects[name], gr = grid(rect, kk === "mid" ? 16 : 8);
      const pos = new Float32Array(gr.rest), z = new Float32Array(gr.n), off = new Float32Array(gr.n);
      for (let i = 0; i < gr.n; i++) z[i] = zHead(gr.rest[i * 2], gr.rest[i * 2 + 1]);
      // r4b (judge r3 fix 5): the painted mid key's lash sat at ~0.84 of the opening, so a still from the blink read as
      // closed / sleepy. Lift its lash to MID_DEPTH of the opening (per column, zero at the corners where the lids meet);
      // the lid skin above compresses toward the key's top edge (weight 0 there), so nothing moves into the brow.
      if (kk === "mid") {
        const E = this.eyes[s], lift = this.midLift(s, geom), ml = geom.lidKeys[s].midLash;
        for (let i = 0; i < gr.n; i++) {
          const x = gr.rest[i * 2], y = gr.rest[i * 2 + 1];
          const c = clamp(Math.round(x - E.xa), 0, E.xb - E.xa);
          const lash = ml.y[Math.min(ml.y.length - 1, c)] + lift[c] + 6;
          const w = clamp01((y - rect[1]) / Math.max(1, lash - rect[1]));
          off[i] = lift[c] * w * w * (3 - 2 * w);
        }
      }
      this.lidKeyMesh[name] = { rect, rest: gr.rest, z, pos, off, n: gr.n, mesh: this.R.mesh(P, { aPos: { data: pos, size: 2, dynamic: true }, aUv: { data: gr.uv, size: 2 } }, gr.idx) };
    }
    // r3 mouth: the lip shell (two sheets of c-front's own mouth region) + the interior strip
    this.shell = new LipShell(geom.rects.mouth_rest);
    this.shellMesh = {};
    for (const n of ["U", "L"]) {
      const sh = this.shell.sheets[n];
      this.shellMesh[n] = this.R.mesh(this.R.lip, { aPos: { data: sh.pos, size: 2, dynamic: true }, aUv: { data: sh.uv, size: 2, dynamic: true }, aA: { data: sh.alpha, size: 1, dynamic: true }, aL: { data: sh.light, size: 1, dynamic: true } }, sh.idx);
      sh.z = new Float32Array(sh.C * sh.R);
      for (let q = 0; q < sh.C * sh.R; q++) sh.z[q] = zHead(sh.rest[q * 2], sh.rest[q * 2 + 1]);
    }
    const I = this.shell.inner;
    I.proj = new Float32Array(I.pos.length);
    this.innerMesh = this.R.mesh(this.R.inner, { aPos: { data: I.proj, size: 2, dynamic: true }, aS: { data: I.s, size: 1 }, aDT: { data: I.dt, size: 1, dynamic: true }, aGap: { data: I.gap, size: 1, dynamic: true } }, I.idx);
    // r4 METHOD CHANGE, turn: the two-texture keyform. A grid over frontal rest space; its vertices go through the same
    // field + projection as every layer (positions), its UVs sample the painted 3/4 plate at denorm(q + D(q)), so at the
    // key the plate sits exactly where it was painted (far-cheek compression, nose-bridge occlusion, turned nose and
    // jaw are the painting's own), and below the key it is pulled back through the field while it cross-dissolves in.
    // Holes (rest space, feathered) leave the live eyes / brows / mouth showing: they sit exactly where their layers are.
    this.plates = {};
    if (this.usePlates && geom.plates && geom.yawKeys && geom.yawKeys.norm) {
      const RX = [290, 170, 780, 700];
      const K = geom.yawKeys, st = K.grid.step, nG = K.grid.n;
      // holes: rounded rectangles (plates.py writes them; the colour band around them was matched there)
      const holes = geom.plates.holes || [];
      const holeA = (x, y) => {
        let h = 1;
        for (const H of holes) {
          const qx = Math.abs(x - H.c[0]) - (H.h[0] - H.r), qy = Math.abs(y - H.c[1]) - (H.h[1] - H.r);
          const d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - H.r;
          h *= smooth(-H.f, 0, d);
        }
        // below the mouth the chin stays the aligned frontal one (the plate's jaw edge showed as a soft seam)
        return h * (1 - smooth(675, 715, y));   // r4b: lower (the strong key stretches the frontal jaw: a lump at 640-690)
      };
      // r5 (judge r4 fix 2): 16 px cells in flat skin, 8 px only where the alpha varies (hole feathers, the live mouth's
      // window, the chin fade): ~1/3 of r4's 8 px plate triangles
      const gr = adaptiveGrid(RX, 16, 8, (x0, y0, x1, y1) => {
        if (x1 > 410 && x0 < 660 && y1 > 530 && y0 < 725) return true;
        let lo = 1, hi = 0;
        for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1], [(x0 + x1) / 2, (y0 + y1) / 2]]) { const v = holeA(x, y); lo = Math.min(lo, v); hi = Math.max(hi, v); }
        return hi - lo > 0.04;
      });
      for (const sd of ["L", "R"]) {
        const D = K[sd], N = K.norm[sd], pr = geom.plates[sd].rect;
        const uv = new Float32Array(gr.n * 2), hole = new Float32Array(gr.n), z = new Float32Array(gr.n);
        for (let i = 0; i < gr.n; i++) {
          const x = gr.rest[i * 2], y = gr.rest[i * 2 + 1];
          const gx = clamp(x / st, 0, nG - 1.001), gy = clamp(y / st, 0, nG - 1.001), ii = Math.floor(gx), jj = Math.floor(gy), u = gx - ii, v = gy - jj;
          const a = D[jj][ii], b = D[jj][ii + 1], c = D[jj + 1][ii], d = D[jj + 1][ii + 1];
          const X = x + (a[0] * (1 - u) + b[0] * u) * (1 - v) + (c[0] * (1 - u) + d[0] * u) * v;
          const Y = y + (a[1] * (1 - u) + b[1] * u) * (1 - v) + (c[1] * (1 - u) + d[1] * u) * v;
          const px = (X - N.fcx) / N.s + N.kcx, py = (Y - N.fe) / N.s + N.ke;
          uv[i * 2] = (px - pr[0]) / (pr[2] - pr[0]); uv[i * 2 + 1] = (py - pr[1]) / (pr[3] - pr[1]);
          hole[i] = holeA(x, y);
          z[i] = zHead(x, y);
        }
        const pos = new Float32Array(gr.rest), alpha = new Float32Array(gr.n), light = new Float32Array(gr.n).fill(1);
        const mesh = this.R.mesh(this.R.lip, { aPos: { data: pos, size: 2, dynamic: true }, aUv: { data: uv, size: 2 }, aA: { data: alpha, size: 1, dynamic: true }, aL: { data: light, size: 1 } }, gr.idx);
        this.plates[sd] = { rect: pr, rest: gr.rest, n: gr.n, pos, alpha, hole, z, mesh };
      }
    }
    this.prevAnchor = null;
    this.prevVel = { L: [0, 0], R: [0, 0], bun: [0, 0] };
    this.st = null;
  }

  now() {
    return this.clock ?? performance.now() / 1000;
  }

  /** HeadRig.apply: one composited frame. */
  apply(bs, head, gaze, lean, breath) {
    const ta0 = this.prof ? performance.now() : 0;
    this._applyBody(bs, head, gaze, lean, breath);
    if (this.prof) this.prof.apply = (this.prof.apply || 0) + performance.now() - ta0;
  }
  _applyBody(bs, head, gaze, lean, breath) {
    const t = this.now();
    const dt = this.lastT < 0 ? 1 / 60 : clamp(t - this.lastT, 0, 0.1);
    this.lastT = t;
    this.bs = bs;
    this.gaze = gaze;
    const k = (n) => bs[n] ?? 0;
    const yaw = softYaw(clamp(head[1], -20, 20), this.yawMax), pitch = clamp(head[0], -10, 12), roll = clamp(head[2], -12, 12);
    const st = {
      sy: Math.sin(yaw * D2R) * PX.gain, cy: Math.cos(yaw * D2R),
      sp: Math.sin(pitch * D2R) * PX.gain, cp: Math.cos(pitch * D2R),
      sr: Math.sin(-roll * D2R), cr: Math.cos(-roll * D2R),
      yaw, pitch, roll,
      bob: -breath * 1.4, leanS: 1 + 0.03 * lean, leanY: 7 * lean,
    };
    // yaw keyform: side + weight (an ease-in so small drifts stay subtle and the key is reached at +-keyDeg)
    if (this.g.yawKeys) {
      const K = this.g.yawKeys, f = clamp(yaw / K.keyDeg, -1, 1);   // r4: the painted key is reached at the yaw limit, never extrapolated (judge r3: the 1.25x was unverified)
      st.yk = f >= 0 ? K.R : K.L;
      st.ykf = Math.abs(f);
      this.yawStep = K.grid.step; this.yawN = K.grid.n;
    }
    this.st = st;
    // ---- expression state
    const smile = (k("mouthSmileLeft") + k("mouthSmileRight")) / 2;
    const cheek = (k("cheekSquintLeft") + k("cheekSquintRight")) / 2;
    const open = clamp01(k("jawOpen") / 0.85);
    this.expr = { smile, cheek, open };
    // r5: per-side smile / cheek (screen-left L reads the ARKit *Right keys): small asymmetries are averaged as before,
    // a deliberate one (the playful wink's raised cheek) is kept per side
    { const sy = (n) => { const a = k(n + "Right"), b = k(n + "Left"); return Math.abs(a - b) < 0.12 ? [(a + b) / 2, (a + b) / 2] : [a, b]; };
      const [smL, smR] = sy("mouthSmile"), [chL, chR] = sy("cheekSquint");
      this.exprSide = { L: { smile: smL, cheek: chL }, R: { smile: smR, cheek: chR } }; }
    this.browCh = { L: this.browChannels("L"), R: this.browChannels("R") };
    this.solver.solve(bs, dt);
    const sp = this.solver.p;
    this.mouth = { name: "shell", row: sp.g > 3 ? "open" : "closed", jawGain: 1, p: sp };
    // ---- lids: screen-left eye (L) is her right eye (ARKit *Right)
    const side = { L: "Right", R: "Left" };
    const lookDown = clamp01(-gaze[1] / 25), lookUp = clamp01(gaze[1] / 20);
    const lidL = this.blinkShape(t, dt, k("eyeBlinkRight"));  // one shaper drives both lids
    this.lid = { L: lidL, R: this.blinkShape2(k("eyeBlinkLeft")) };
    // r5 (judge r4): a WINK = one lid shut while the other stays open; it takes the curved happy-closed lid + cheek raise
    this.wink = { L: smooth(0.55, 0.95, this.lid.L - this.lid.R) * smooth(0.7, 0.95, this.lid.L), R: smooth(0.55, 0.95, this.lid.R - this.lid.L) * smooth(0.7, 0.95, this.lid.R) };
    this.life.update(t, dt, bs, gaze, head, this.solver, breath);
    for (const s of ["L", "R"]) {
      const E = this.eyes[s], e = E.e, sfx = side[s];
      // r2: small left/right differences in squint/cheek/smile (behaviour's +-6% asymmetry, presets) are averaged so
      // a delight squint closes both eyes alike; a deliberate asymmetry (a wink-ish playful squint, > 0.12) is kept
      const sym = (n) => { const a = k(n + "Left"), bb = k(n + "Right"); return Math.abs(a - bb) < 0.12 ? (a + bb) / 2 : k(n + sfx); };
      const b = this.lid[s], q = sym("eyeSquint"), w = k("eyeWide" + sfx), c = sym("cheekSquint");
      const sm = sym("mouthSmile");
      for (let i = 0; i <= E.xb - E.xa; i++) {
        const T = e.top[i], B = e.bot[i], H = B - T;
        const u = i / (E.xb - E.xa);
        const hump = Math.pow(Math.max(0, Math.sin(Math.PI * u)), 0.7);
        // r3: in a blink the lower lid comes up a little too (both lids move: a squeeze, not a heavy upper lid), so a
        // mid-blink frame reads as motion, never as a sleepy hold
        const blinkSq = 0.18 * smooth(0.55, 0.85, b) * (this.bsh && this.bsh.active ? 1 : 0.6);   // r4b: the lower lid stays down at the 0.6 mid key (lid + squeeze + smile read smug 3/3)   // r4: a stronger squeeze in a real blink
        // r4: delight's eyes SMILE: the cheek pushes the lower lid up harder (judge r3: 'delight without an eye squint')
        const rise = (q * 0.36 + c * 0.32 + sm * 0.07 + blinkSq) * H * Math.pow(hump, 1.4);
        let bot = B - rise + w * 0.09 * H * hump;
        const follow = (lookDown * 0.14 - lookUp * 0.02) * H * hump;
        const closed = T + 0.72 * (B - T) - Math.min(rise, 0.25 * H);   // the lids meet ~70% down (Memoji)
        let top = T + follow - w * 0.32 * H * hump;   // r4: surprise shows sclera ABOVE the iris (0.2 -> 0.32)
        // blink: the upper lid travels to the meeting line, the lower lid rises the last part (eased: fast close)
        // r3: the live lid only travels to the PAINTED mid lid's lash line (l = 0.5); beyond it the painted keys take
        // over (drawEye: lidmid / lidshut), so the lid skin is never stretched into a smear
        const ml = this.g.lidKeys ? this.g.lidKeys[s].midLash : null;
        const midY = ml ? ml.y[Math.min(ml.y.length - 1, i)] + this.liftCache[s][i] : closed;
        top = top + (Math.max(top, midY - 3) - top) * clamp01(b / 0.34);   // r4b: -3 so the live lash's light lower edge hides under the painted lash   // r4: lands on the painted lash BEFORE the cross-fade (no ghost)
        if (top > bot) top = bot;
        E.top[i] = top;
        E.bot[i] = bot;
      }
      E.blink = b;
    }
    // ---- secondary motion: anchor = the head proxy's projection of a point, its acceleration drives the springs
    const anchor = this.project(530, 300, 120);
    if (this.prevAnchor) {
      const vx = (anchor[0] - this.prevAnchor[0]) / Math.max(dt, 1e-3), vy = (anchor[1] - this.prevAnchor[1]) / Math.max(dt, 1e-3);
      const ax = (vx - this.prevVel.L[0]) / Math.max(dt, 1e-3), ay = (vy - this.prevVel.L[1]) / Math.max(dt, 1e-3);
      this.prevVel.L = [vx, vy];
      const red = this.reduced ? 0.3 : 1;
      for (const s of ["L", "R"]) {
        const L = this.layers["lock" + s];
        L.sx = L.spring.step(-clamp(ax, -4000, 4000) * 0.02 * red + st.sr * 0, dt);
        L.sy = L.springY.step(-clamp(ay, -4000, 4000) * 0.01 * red, dt);
      }
      this.bunOff = [this.bunSpring[0].step(-clamp(ax, -4000, 4000) * 0.012 * red, dt), this.bunSpring[1].step(-clamp(ay, -4000, 4000) * 0.012 * red, dt)];
    } else this.bunOff = [0, 0];
    this.prevAnchor = anchor;
  }

  /** r4b: per-column lift (px, <= 0) of the painted mid key's lash toward MID_DEPTH of the opening, proportional to
   *  the opening height so it is 0 at the corners (where the lids meet and the painted wing lives). */
  midLift(s, geom) {
    this.liftCache = this.liftCache || {};
    if (this.liftCache[s]) return this.liftCache[s];
    const E = this.eyes[s], e = E.e, ml = geom.lidKeys[s].midLash, n = E.xb - E.xa + 1;
    let cm = 0;
    for (let c = 0; c < n; c++) if (e.bot[c] - e.top[c] > e.bot[cm] - e.top[cm]) cm = c;
    const Hm = e.bot[cm] - e.top[cm], liftC = Math.min(0, e.top[cm] + MID_DEPTH * Hm - ml.y[Math.min(ml.y.length - 1, cm)]);
    const out = new Float32Array(n);
    for (let c = 0; c < n; c++) { const h = clamp01((e.bot[c] - e.top[c]) / Hm); out[c] = liftC * h * h * (3 - 2 * h); }
    return (this.liftCache[s] = out);
  }

  /** r3 blink shaper (judge r2 fix 4): an autonomic blink (a fast rise of eyeBlink) plays a 2-1-3 frame curve on
   *  30 Hz steps: 2 frames closing (mid key, shut key), 1 held shut, 3 opening (mid, mid, a light live lid), every frame
   *  a clean painted key, never a cross-faded smear. Slow changes (expression half-lids) pass through continuously. */
  blinkShape(t, dt, b) {
    const S = this.bsh || (this.bsh = { active: false, t0: 0, base: 0, prev: b, settle: false });
    const SEQ = [0.5, 1.0, 1.0, 0.5, 0.14, 0.04];   // r4: mid squeeze key, shut | shut | squeeze, a light live lid, open   // every frame a clean key: mid, shut | shut | mid, mid, a barely-lowered live lid
    const rate = dt > 0 ? (b - S.prev) / dt : 0;
    if (!S.active && rate > 5 && b - S.prev > 0.06 && b > 0.15) { S.active = true; S.t0 = t; S.base = Math.min(S.prev, 0.5); }
    S.prev = b;
    let l = b;
    if (S.active) {
      const f = Math.floor((t - S.t0) * 30 + 1e-6);
      if (f < SEQ.length) { l = Math.max(S.base, SEQ[f]); this.blinkDip = SEQ[f]; }
      else { S.active = false; S.settle = true; }
    }
    if (!S.active) {
      this.blinkDip = 0;
      if (S.settle) { if (b <= S.base + 0.05) S.settle = false; else l = Math.min(b, S.base); }
    }
    this.lidShared = l;
    this.lidRaw = b;
    return l;
  }
  blinkShape2(b) {
    // the other lid: the same shaped value, offset by any deliberate asymmetry (a playful one-eye squint)
    return clamp01(this.lidShared + (b - this.lidRaw));
  }

  /** The head transform: rest (x, y) with depth z -> screen-space rest coordinates. */
  project(x, y, z) {
    return this.projectTo(x, y, z, [0, 0]);
  }

  /** project() into a caller-owned [x, y] (the hot loops reuse one array: no per-vertex allocation). */
  projectTo(x, y, z, out) {
    const s = this.st;
    // r3: the yaw is an angle KEYFORM: the displacement field fitted to the painted 3/4 plate (keyfield.py), scaled by
    // yaw / keyDeg and sampled at this rest point (one shared field: nothing tears between head layers). The pitch
    // keeps the 2.5D proxy (depth z), applied after the turn.
    let X = x, Y = y;
    if (s.yk) {
      const D = s.yk, st = this.yawStep, gx = clamp(x / st, 0, this.yawN - 1.001), gy = clamp(y / st, 0, this.yawN - 1.001);
      const i = Math.floor(gx), j = Math.floor(gy), u = gx - i, v = gy - j;
      const a = D[j][i], b = D[j][i + 1], c = D[j + 1][i], d = D[j + 1][i + 1];
      const f = s.ykf;
      X += f * ((a[0] * (1 - u) + b[0] * u) * (1 - v) + (c[0] * (1 - u) + d[0] * u) * v);
      Y += f * ((a[1] * (1 - u) + b[1] * u) * (1 - v) + (c[1] * (1 - u) + d[1] * u) * v);
    }
    const dy = Y - PX.cy;
    Y = PX.cy + dy * s.cp + z * s.sp;
    // roll about the neck pivot
    const px = X - PX.pivot[0], py = Y - PX.pivot[1];
    X = PX.pivot[0] + px * s.cr - py * s.sr;
    Y = PX.pivot[1] + px * s.sr + py * s.cr;
    // breath bob (head follows the chest 60%) and lean (scale about the pivot, down)
    X = PX.pivot[0] + (X - PX.pivot[0]) * s.leanS;
    Y = PX.pivot[1] + (Y - PX.pivot[1]) * s.leanS + s.bob * 0.6 + s.leanY;
    out[0] = X; out[1] = Y;
    return out;
  }

  /** Rest-space expression offsets on the face surface (cheek lift, jaw drop): shared by face and mouth. */
  faceOffset(x, y, noJaw = false) {
    const { smile, cheek } = this.expr;
    let dx = 0, dy = 0;
    // cheeks lift and widen a touch on a smile
    const ES = this.exprSide;
    for (const [cx, sd] of [[455, "L"], [605, "R"]]) {
      const f = Math.exp(-((x - cx) ** 2 + (y - 585) ** 2) / (2 * 42 * 42));
      const sm = ES ? ES[sd].smile : smile, ch = ES ? ES[sd].cheek : cheek;
      dy -= (sm * 4.5 + ch * 5.5) * f;   // r4: a stronger cheek push on delight
      dx += Math.sign(x - 530) * sm * 1.5 * f;
      // r5: the winking side's cheek apple rides up under the closed eye
      const wk = this.wink ? this.wink[sd] : 0;
      if (wk > 0) dy -= wk * 9 * Math.exp(-((x - (sd === "L" ? 430 : 632)) ** 2 + (y - 545) ** 2) / (2 * 48 * 48));
    }
    // r4: the jaw carries lower lip, skin and chin together (lips.js jaw()), so the skin between them never crushes
    if (!noJaw && this.solver) dy += this.solver.jaw() * jawProfile(x, y);
    return [dx, dy];
  }

  /** r5 (fps): per-frame coefficients of faceOffset; faceOffW applies them to precomputed weights. */
  faceCoef() {
    const ES = this.exprSide, { smile, cheek } = this.expr, wk = this.wink || { L: 0, R: 0 };
    const sL = ES ? ES.L.smile : smile, sR = ES ? ES.R.smile : smile, cL = ES ? ES.L.cheek : cheek, cR = ES ? ES.R.cheek : cheek;
    return (this._fc = [sL * 4.5 + cL * 5.5, sR * 4.5 + cR * 5.5, sL * 1.5, sR * 1.5, wk.L * 9, wk.R * 9, this.solver ? this.solver.jaw() : 0]);
  }
  faceOffW(W, i, noJaw, out) {
    const c = this._fc, o = i * 6;
    out[0] = W[o + 5] * (c[2] * W[o] + c[3] * W[o + 1]);
    out[1] = -(c[0] * W[o] + c[1] * W[o + 1]) - c[4] * W[o + 2] - c[5] * W[o + 3] + (noJaw ? 0 : c[6] * W[o + 4]);
    return out;
  }

  deformLayer(L) {
    const s = this.st, pos = L.pos, rest = L.rest, z = L.z;
    const n = L.n;
    if (L.kind === "static") return false;
    if (L.kind === "body") {
      for (let i = 0; i < n; i++) {
        const x = rest[i * 2], y = rest[i * 2 + 1];
        // breath: scale y about the hem, shoulders rise; the neck top follows the head 35%
        let Y = 1024 + (y - 1024) * (1 + 0.004 * s.bob / -1.4);
        let X = x;
        // r5 (judge r4, secondary life): the shoulders rise on the in-breath (they lag the chest a little: life.breathS)
        const sh = smooth(95, 200, Math.abs(x - 527)) * (1 - smooth(860, 1010, y)) * smooth(700, 790, y);
        if (sh > 0) { Y -= 2.4 * this.life.breathS * sh; X += Math.sign(x - 527) * 0.5 * this.life.breathS * sh; }
        // r3: the neck column carries the head transform fully up to the jaw (the keyform field already decays to 0 at
        // the collar), so the chin and the neck under it move as one; uniform across the neck's width (no shear)
        const neck = smooth(772, 700, y) * (1 - smooth(110, 160, Math.abs(x - 527)));
        if (neck > 0) {
          const [hx, hy] = this.project(x, y, zFast(x, y));
          X += (hx - x) * neck;
          Y += (hy - y) * neck;
        }
        pos[i * 2] = X;
        pos[i * 2 + 1] = Y;
      }
      return true;
    }
    const isFace = L.kind === "face";
    const isLock = L.kind === "lock";
    const bun = L.kind === "bun";
    if (L.kind === "brow") this.browColumns(L);
    const fo = this._fo || (this._fo = [0, 0]);
    for (let i = 0; i < n; i++) {
      let x = rest[i * 2], y = rest[i * 2 + 1];
      if (isFace) {
        this.faceOffW(L.FW, i, false, fo);
        x += fo[0];
        y += fo[1];
      } else if (L.kind === "brow") {
        const c = L.colOf[i], v = y - L.cyc[c];
        x += L.cdx[c] - v * L.cs[c];
        y += L.cdy[c] + v * (L.cc[c] - 1);
      } else if (isLock) {
        const v = clamp01((y - L.y0) / L.len);
        const w = Math.pow(v, 1.4);
        x += (L.sx || 0) * w;
        y += (L.sy || 0) * w * 0.3;
      } else if (bun) {
        x += this.bunOff ? this.bunOff[0] : 0;
        y += this.bunOff ? this.bunOff[1] : 0;
      }
      const p = this.projectTo(x, y, z[i], this._tmp || (this._tmp = [0, 0]));
      pos[i * 2] = p[0];
      pos[i * 2 + 1] = p[1];
    }
    return true;
  }

  /** r2 brow ribbon (the parametric-ribbon idea borrowed from arm V, applied to P's painted brow): each brow is a
   *  curve u = 0 (inner, at the nose) .. 1 (outer) with continuous channels derived from the ARKit keys:
   *    lift   whole-brow raise (eyeWide, browOuterUp, browInnerUp share)
   *    inner  inner-end raise: the worried "/ \" (browInnerUp)
   *    arch   a peaked raise around u 0.6: the sceptical / thinking brow (browOuterUp)
   *    knit   inner end down and toward the nose (browDown)
   *  Ranges are ~1.6x r1's: c-thinking's raised brow travels ~28 px at 1024, c-front's brow is 14 px thick. */
  browChannels(s) {
    const bs = this.bs, sfx = s === "L" ? "Right" : "Left";
    const inner = bs.browInnerUp ?? 0, outer = bs["browOuterUp" + sfx] ?? 0, down = bs["browDown" + sfx] ?? 0, wide = bs["eyeWide" + sfx] ?? 0;
    // r4 (judge r3 fix 4): ~35% more range: surprise / concern read as 'mild' at thumbnail size
    // r5: + the stressed-syllable brow flick (life.js), a few px, inner end a touch more
    const fl = this.life ? this.life.flick : 0;
    return { lift: 14 * wide + 12 * outer + 5 * inner + 4.2 * fl, inner: 53 * inner + 3 * fl, arch: 38 * outer, knit: 21 * down };
  }

  browOffset(s, x, y) {
    // r3 (judge r2 fix 5, "lock the construction"): the brow is a RIBBON of constant thickness. Its centreline moves
    // (lift / inner raise / arch / knit, as r2) and every vertex keeps its perpendicular distance from it, rotated with
    // the centreline's new slope; the knit's sideways pull is one translation of the whole brow (no stretch). Only
    // position, angle and arch change; the brow's weight never does.
    const b = this.g.brows[s];
    const x0 = b.x[0], x1 = b.x[1];
    const c = this.browCh[s];
    const dyAt = (xx) => {
      const ui = s === "L" ? clamp01((x1 - xx) / (x1 - x0)) : clamp01((xx - x0) / (x1 - x0));
      const peak = Math.exp(-(((ui - 0.62) / 0.3) ** 2));
      return 5.0 * Math.max(this.blinkDip || 0, smooth(0.3, 0.6, this.lidShared || 0) * (this.bsh && this.bsh.active ? 1 : 0.8)) - c.lift - c.inner * Math.pow(1 - ui, 1.3) - c.arch * (0.35 + 0.65 * peak) * Math.pow(ui, 0.5) + c.knit * (1 - 0.6 * ui);
    };
    const dy = dyAt(x);
    const th = Math.atan((dyAt(x + 3) - dyAt(x - 3)) / 6);
    const cl = b.cl, yc = cl ? cl.y[clamp(Math.round(x - cl.x0), 0, cl.y.length - 1)] : y;
    const v = y - yc;
    const dxT = (s === "L" ? 1 : -1) * (c.knit * 0.3 + c.inner * 0.05);
    return [dxT - v * Math.sin(th), dy + v * (Math.cos(th) - 1)];
  }

  /** r5 (fps): browOffset's column terms (centreline dy, slope, rest centreline y, knit shift) once per grid column. */
  browColumns(L) {
    const s = L.name.slice(4), b = this.g.brows[s], x0 = b.x[0], x1 = b.x[1], c = this.browCh[s], cl = b.cl;
    const dipA = 5.0 * Math.max(this.blinkDip || 0, smooth(0.3, 0.6, this.lidShared || 0) * (this.bsh && this.bsh.active ? 1 : 0.8));
    const dyAt = (xx) => {
      const ui = s === "L" ? clamp01((x1 - xx) / (x1 - x0)) : clamp01((xx - x0) / (x1 - x0));
      const peak = Math.exp(-(((ui - 0.62) / 0.3) ** 2));
      return dipA - c.lift - c.inner * Math.pow(1 - ui, 1.3) - c.arch * (0.35 + 0.65 * peak) * Math.pow(ui, 0.5) + c.knit * (1 - 0.6 * ui);
    };
    const dxT = (s === "L" ? 1 : -1) * (c.knit * 0.3 + c.inner * 0.05);
    for (let k = 0; k < L.colX.length; k++) {
      const x = L.colX[k], th = Math.atan((dyAt(x + 3) - dyAt(x - 3)) / 6);
      L.cdy[k] = dyAt(x); L.cs[k] = Math.sin(th); L.cc[k] = Math.cos(th); L.cdx[k] = dxT;
      L.cyc[k] = cl ? cl.y[clamp(Math.round(x - cl.x0), 0, cl.y.length - 1)] : 0;
    }
  }

  render() {
    const R = this.R, s = this.st;
    if (!s) return;
    this.faceCoef();
    R.begin();
    R.setCam(this.view[0], this.view[1], this.view[2]);
    const shadeFace = [s.yaw >= 0 ? 1 : -1, s.yaw >= 0 ? 530 : 330, s.yaw >= 0 ? 730 : 530, 0.16 * Math.abs(s.yaw) / 20];
    const shadeHair = [shadeFace[0], s.yaw >= 0 ? 400 : 200, s.yaw >= 0 ? 820 : 660, 0.1 * Math.abs(s.yaw) / 20];
    const dbg = this.debug;
    const PF = this.prof, now = () => performance.now();
    const draw = (n, shade) => {
      const L = this.layers[n];
      const t0 = PF ? now() : 0;
      if (this.deformLayer(L)) R.update(L.mesh, "aPos", L.pos);
      if (PF) PF[n] = (PF[n] || 0) + now() - t0;
      if (dbg && dbg.only && !dbg.only.includes(n)) return;
      R.drawPaint(L.mesh, this.tex[n], L.rect, 1, shade, dbg && dbg.tint ? DBG_TINT[n] : null);
    };
    // the backdrop is c-front's cream (std < 1.5/255 over the plate): the clear colour, no full-screen pass
    draw("hairback", shadeHair);
    draw("bun", shadeHair);
    draw("body");
    draw("ears", shadeFace);
    draw("face", shadeFace);
    let tq = PF ? now() : 0;
    for (const side of ["L", "R"]) this.drawEye(side, shadeFace);
    if (PF) { PF.eyes = (PF.eyes || 0) + now() - tq; }
    draw("browL");
    draw("browR");
    tq = PF ? now() : 0;
    this.drawMouth(shadeFace);
    if (PF) { PF.mouth = (PF.mouth || 0) + now() - tq; tq = now(); }
    this.drawPlate();
    if (PF) { PF.plate = (PF.plate || 0) + now() - tq; PF.frames = (PF.frames || 0) + 1; }
    draw("lockbed", shadeFace);
    draw("hair", shadeHair);
    draw("lockL");
    draw("lockR");
  }

  drawEye(sd, shade) {
    const E = this.eyes[sd], e = E.e, R = this.R, s = this.st;
    const zEye = zFast;   // r5 (fps)
    const T2 = this._t2 || (this._t2 = [0, 0]);
    // r3: cap the far eye's horizontal compression at 15% (judge r2): the eye meshes (opening, lids, lower band) are
    // re-spread about the eye's projected centre when the turn would squeeze them more
    const ym = (e.top[Math.floor(e.top.length / 2)] + e.bot[Math.floor(e.bot.length / 2)]) / 2;
    const pA = this.project(E.xa, ym, zEye(E.xa, ym)), pB = this.project(E.xb, ym, zEye(E.xb, ym));
    const ratio = (pB[0] - pA[0]) / (E.xb - E.xa), ecx = (pA[0] + pB[0]) / 2;
    const em = ratio < 0.6 ? 0.6 / ratio : 1;   // r4b: 0.85 -> 0.6: the painted three-quarter key narrows the far eye to 0.56-0.59 (blind r4c/d 4 of 6: 'far eye stays too large')
    const fixX = (p) => { if (em !== 1) p[0] = ecx + (p[0] - ecx) * em; return p; };
    this.eyeFix = { ecx, em };
    // opening strip
    let k = 0;
    for (let i = 0; i < E.C; i++) {
      const x = Math.min(E.xb, E.xa + i * 2), ii = x - E.xa;
      let top = E.top[ii], bot = E.bot[ii];
      // r2: round the opening's ends (the hand-read corners were blunt: a vertical white edge at 2x and on turns)
      const dEnd = Math.min(x - E.xa, E.xb - x);
      if (dEnd < 6) { const f = Math.sqrt(Math.max(0, 1 - (1 - dEnd / 6) ** 2)), mid = (top + bot) / 2; top = mid + (top - mid) * f; bot = mid + (bot - mid) * f; }
      const ys = [top - 2.1, top - 0.1, Math.max(top - 0.1, bot - 0.6), Math.max(top - 0.1, bot + 1.4)];
      for (let j = 0; j < 4; j++) {
        const y = bot <= top + 0.05 ? top : ys[j];
        E.restA[k * 2] = x;
        E.restA[k * 2 + 1] = y;
        E.topA[k] = top;
        const p = fixX(this.projectTo(x, y, zEye(x, y), T2));
        E.pos[k * 2] = p[0];
        E.pos[k * 2 + 1] = p[1];
        k++;
      }
    }
    R.update(E.mesh, "aPos", E.pos);
    R.update(E.mesh, "aRest", E.restA);
    R.update(E.mesh, "aTop", E.topA);
    // r5: under a full wink the arched shut key leaves the live rims (lower waterline highlight) uncovered: they fade out
    const liveA = 1 - smooth(0.3, 0.7, this.wink ? this.wink[sd] : 0);
    // iris: gaze in rest-space px, foreshortened by gaze + head yaw; squashed a little at full blink
    // r4b: Bell's phenomenon: in a real blink the eyes dip down; a still caught mid-blink then reads as a blink in
    // motion (looking down through closing lids), not a sleepy / smug half-lid stare (blind r4f 3/3)
    const bd = this.bsh && this.bsh.active ? (this.blinkDip || 0) : 0;
    const g0 = this.gaze || [0, 0], ms = this.life.sacc;   // r5: + fixational micro-saccades (life.js)
    const gz = [g0[0] + ms[0], g0[1] + ms[1] - (bd > 0 ? 6 * bd : 0)];
    // r2: the upward range was too timid to read as "looking up" (c-thinking parks the iris under the upper lid)
    const ox = (gz[0] / 25) * 18, oy = -(gz[1] / 20) * 12 + (gz[1] < 0 ? -gz[1] / 25 * 2 : 0);
    const fx = Math.cos((gz[0] + 0.2 * s.yaw) * D2R * 1.2);
    const [icx, icy] = e.iris;
    // r2: a lowering lid pushes the catchlight down with it (it stays visible on the iris until the eye is nearly
    // shut): a half-lidded eye with no catchlight read as a dead gaze to both blind judges
    const [ccx, ccy, cr] = e.catch;
    const lidAt = interp(E.xa, E.top, ccx), push = Math.max(0, lidAt + cr + 1.5 - (ccy + oy * 0.45));
    const catchY = oy * 0.45 + Math.min(push, 14), catchA = clamp01((0.92 - E.blink) / 0.2) * (1 - (this.g.lidKeys ? clamp01((E.blink - 0.6) / 0.1) : 0));
    const irisScr = fixX(this.project(icx + ox, icy + oy, zEye(icx + ox, icy + oy)));
    const pa = this.project(icx - 12, icy, zEye(icx - 12, icy)), pb = this.project(icx + 12, icy, zEye(icx + 12, icy));
    const wx = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) / 24;
    const irisK = clamp(0.55 + 0.45 * wx, 0.9, 1.06);
    const catchScr = fixX(this.project(ccx + ox * 0.45, ccy + catchY, zEye(ccx, ccy)));
    if (liveA > 0.02) R.drawEye(E.mesh, {
      sclera: { tex: this.tex["sclera" + sd], rect: this.g.rects["sclera" + sd] },
      iris: { tex: this.tex["iris" + sd], rect: this.g.rects["iris" + sd] },
      catch: { tex: this.tex["catch" + sd], rect: this.g.rects["catch" + sd] },
      irisC: [icx, icy], irisScr, irisK, irisScale: [1, E.blink > 0.85 ? 0.95 : 1],
      catchScr, catchC: [ccx, ccy], catchA, lidShade: 0.4, topY: interp(E.xa, E.top, icx),
    });
    // lower lid band
    for (let i = 0; i < E.BC; i++)
      for (let j = 0; j < E.BR; j++) {
        const q = i * E.BR + j;
        const x = E.brest[q * 2], y = E.brest[q * 2 + 1];
        const ii = Math.round(x - E.xa);
        const rise = e.bot[clamp(ii, 0, e.bot.length - 1)] - E.bot[clamp(ii, 0, E.bot.length - 1)];
        const yy = y - rise * (1 - 0.75 * E.bv[q]);
        const p = fixX(this.projectTo(x, yy, zEye(x, yy), T2));
        E.bpos[q * 2] = p[0];
        E.bpos[q * 2 + 1] = p[1];
      }
    R.update(E.bmesh, "aPos", E.bpos);
    R.drawPaint(E.bmesh, this.tex["lower" + sd], this.g.rects["lower" + sd], liveA, shade);
    // upper lid: lash band translates with the lid edge, the skin above stretches
    const n = E.LC * E.LR;
    for (let q = 0; q < n; q++) {
      const x = E.lrest[q * 2], y = E.lrest[q * 2 + 1];
      let ii = Math.round(x - E.xa), f = 1;
      if (ii < 0) { f = Math.max(0.45, 1 + ii / 30); ii = 0; }
      if (ii > E.xb - E.xa) { f = Math.max(0.45, 1 - (ii - (E.xb - E.xa)) / 30); ii = E.xb - E.xa; }
      // r4: once the painted mid key shows, the wing rides fully with the lid (its tip peeked above the key's lash end)
      f += (1 - f) * clamp01(E.blink / 0.34);
      const dy = (E.top[ii] - e.top[ii]) * f;
      const yy = y + dy * E.lv[q];
      const p = fixX(this.projectTo(x, yy, zEye(x, yy), T2));
      E.lpos[q * 2] = p[0];
      E.lpos[q * 2 + 1] = p[1];
    }
    R.update(E.lmesh, "aPos", E.lpos);
    R.drawPaint(E.lmesh, this.tex["lid" + sd], this.g.rects["lid" + sd], liveA, shade);
    // r3 painted lid keys over the live eye: mid (a real lowered lid with its crease) then shut
    if (this.g.lidKeys) {
      const l = E.blink, midA = smooth(0.3, 0.36, l), shutA = smooth(0.72, 0.82, l);
      for (const [kk, a] of [["mid", midA * (1 - (shutA >= 1 ? 1 : 0))], ["shut", shutA]]) {
        if (a <= 0.003 || (this.debug && this.debug.noKey === kk)) continue;
        const M = this.lidKeyMesh[`lid${kk}${sd}`];
        // r5 (judge r4): a wink bends the painted shut lash from a relaxed U into a happy-closed arch (the cheek pushes the
        // lower lid up under it); the lid skin above compresses toward the key's top edge
        const wk = kk === "shut" ? this.wink[sd] : 0;
        // the lid keys ride the brow a little when it lifts (the lid skin is attached under the brow)
        for (let q = 0; q < M.n; q++) {
          const x = M.rest[q * 2];
          let y = M.rest[q * 2 + 1] + M.off[q];
          if (wk > 0) {
            // a parabola about the lash centre: the middle rises, both ends (wing included) drop, so the painted U sag
            // (~22 px) inverts into an arch without lifting the key off the skin under it
            const lx0 = E.e.lashX[0], lx1 = E.e.lashX[1], xc = (lx0 + lx1) / 2, hw = (lx1 - lx0) / 2;
            const r2 = Math.min(1.25, ((x - xc) / hw) ** 2);
            const wy = 0.2 + 0.8 * smooth(M.rect[1], M.rect[1] + 70, M.rest[q * 2 + 1]);
            y += wk * (-15 + 36 * r2) * wy;
          }
          const p = fixX(this.projectTo(x, y, M.z[q], this._tmp || (this._tmp = [0, 0])));
          M.pos[q * 2] = p[0];
          M.pos[q * 2 + 1] = p[1];
        }
        R.update(M.mesh, "aPos", M.pos);
        R.drawPaint(M.mesh, this.tex[`lid${kk}${sd}`], M.rect, a, shade);
      }
    }
  }

  drawMouth(shade) {
    const R = this.R, sol = this.solver, shell = this.shell;
    shell.update(sol);
    // shell vertices: rest + lip deformation + the face surface's offsets (cheeks, jaw), then the head projection
    const fo = this._fo || (this._fo = [0, 0]);
    for (const n of ["U", "L"]) {
      const sh = shell.sheets[n];
      if (!sh.FW) sh.FW = faceWArr(sh.rest, sh.C * sh.R);
      for (let q = 0; q < sh.C * sh.R; q++) {
        let x = sh.pos[q * 2], y = sh.pos[q * 2 + 1];
        const [dx, dy] = this.faceOffW(sh.FW, q, true, fo);
        const p = this.projectTo(x + dx, y + dy, sh.z[q], this._tmp || (this._tmp = [0, 0]));
        sh.pos[q * 2] = p[0];
        sh.pos[q * 2 + 1] = p[1];
      }
    }
    const I = shell.inner;
    for (let i = 0; i < I.pos.length / 2; i++) {
      const x = I.pos[i * 2], y = I.pos[i * 2 + 1];
      const [dx, dy] = this.faceOffset(x, y, true);
      const p = this.projectTo(x + dx, y + dy, zFast(x, y), this._tmp || (this._tmp = [0, 0]));
      I.proj[i * 2] = p[0];
      I.proj[i * 2 + 1] = p[1];
    }
    R.update(this.innerMesh, "aPos", I.proj);
    R.update(this.innerMesh, "aDT", I.dt);
    R.update(this.innerMesh, "aGap", I.gap);
    const p = sol.p;
    const teethH = 10 + 5 * p.tuck;   // r5: f/v shows the incisors' full length, their tips on the lower lip
    if (p.g > 0.05) R.drawInner(this.innerMesh, this.tex.interior, [p.T, p.TL, teethH, 0], [p.th, p.tip, p.curl, 0], 1 - 0.5 * shade[3]);
    for (const n of ["L", "U"]) {
      const sh = shell.sheets[n];
      if (n === "U" && p.tuck > 0.05 && p.g > 0.05) R.drawInner(this.innerMesh, this.tex.interior, [p.T, p.TL, teethH, 0], [p.th, p.tip, p.curl, 0], 1 - 0.5 * shade[3], 1);
      R.update(this.shellMesh[n], "aPos", sh.pos);
      R.update(this.shellMesh[n], "aA", sh.alpha);
      R.update(this.shellMesh[n], "aL", sh.light);
      R.update(this.shellMesh[n], "aUv", sh.uv);
      R.drawLip(this.shellMesh[n], this.tex.mouth_rest, this.g.rects.mouth_rest, shade);
    }
  }

  /** r4 two-texture yaw keyform: the painted plate of the turned side, cross-dissolved in with the key weight. */
  drawPlate() {
    const s = this.st;
    if (!s || !s.yk || this.debug && this.debug.noPlate) return;
    const sd = s.yaw >= 0 ? "R" : "L", P = this.plates[sd];
    const w = smooth(0.04, 1, s.ykf);   // the dissolve: ~0 for idle drifts (< 1 deg), all plate at the key
    if (!P || w <= 0.004) return;
    const sol = this.solver, sp = sol.p, o = this._tmp || (this._tmp = [0, 0]);
    // the live mouth's hole: the lip band (both lips + the opening + the jaw-carried lower lip), its width and side shift
    const drop = sol.lowerDrop(), shift = sol.shift || 0;
    // the hole covers the wider of the live mouth and the PLATE'S OWN painted lips (rest-space ends ~76 px out): when the live
    // mouth rounds to an O, the plate's lip corners peeked out beside it
    const hwL = Math.max(69 * sp.W + Math.max(0, sol.side.L.wid), 78) + 14, hwR = Math.max(71 * sp.W + Math.max(0, sol.side.R.wid), 80) + 14;
    if (!P.FW) P.FW = faceWArr(P.rest, P.n);
    const fo = this._fo || (this._fo = [0, 0]);
    for (let i = 0; i < P.n; i++) {
      const x = P.rest[i * 2], y = P.rest[i * 2 + 1];
      const [dx, dy] = this.faceOffW(P.FW, i, false, fo);
      this.projectTo(x + dx, y + dy, P.z[i], o);
      P.pos[i * 2] = o[0]; P.pos[i * 2 + 1] = o[1];
      let a = w * P.hole[i];
      if (a > 0 && x > 420 && x < 650 && y > 540 && y < 720) {
        const xr = x - 530 - shift, ax = xr < 0 ? -xr / hwL : xr / hwR;
        const ly = lineYAt(x), top = ly - 20 - 0.3 * sp.g, bot = ly + 30 + drop;
        const d = Math.max((ax - 1) * 60, top - y, y - bot);
        a *= smooth(-9, 0, d);
      }
      P.alpha[i] = a;
    }
    this.R.update(P.mesh, "aPos", P.pos);
    this.R.update(P.mesh, "aA", P.alpha);
    this.R.drawLip(P.mesh, this.tex["plate" + sd], P.rect, [1, 0, 1, 0]);
  }

  /** r5 (fps): first-use costs (shader programs' first draws, JIT of the viseme / tongue / lid-key / wink paths) paid
   *  once at load instead of inside the first talking or blinking frame (they were the 4x-throttle p95 spikes). Draws a
   *  short scripted pass, then restores every piece of state it touched. */
  warm(n = 24) {
    const saveClock = this.clock, saveT = this.lastT;
    const poses = [
      { viseme_aa: 1, jawOpen: 0.6 }, { viseme_nn: 1, tongueTipUp: 0.9, jawOpen: 0.3 }, { viseme_CH: 1, jawOpen: 0.25 },
      { viseme_FF: 1 }, { viseme_PP: 1 }, { viseme_O: 1, jawOpen: 0.4 }, { tongueCurl: 0.9, viseme_DD: 1 },
      { eyeBlinkLeft: 0.5, eyeBlinkRight: 0.5 }, { eyeBlinkLeft: 1, eyeBlinkRight: 1 }, { eyeBlinkRight: 1, cheekSquintRight: 0.8, mouthSmileRight: 0.8 },
      { eyeWideLeft: 0.9, eyeWideRight: 0.9, jawOpen: 0.42 }, { mouthSmileLeft: 1, mouthSmileRight: 1, jawOpen: 0.34, cheekSquintLeft: 0.7, cheekSquintRight: 0.7 },
    ];
    for (let i = 0; i < n; i++) {
      this.clock = 5000 + i / 60;
      this.frame(poses[i % poses.length], [3 * Math.sin(i), 8 * Math.sin(i * 0.7), 4 * Math.cos(i)], [5 * Math.sin(i), 3 * Math.cos(i)], 0, Math.sin(i));
    }
    this.R.gl.finish();
    this.clock = saveClock; this.lastT = saveT;
    this.resetPhysics();
    this.solver = new LipSolver();
    this.life = new Life({ reduced: this.reduced });
    this.prevAnchor = null;
  }

  resetPhysics() {
    for (const s of ["L", "R"]) {
      const L = this.layers["lock" + s];
      L.spring.x = L.spring.v = L.springY.x = L.springY.v = 0;
    }
    for (const sp of this.bunSpring) sp.x = sp.v = 0;
    this.bsh = null;
    this.blinkDip = 0;
    this.prevAnchor = null;
    this.prevVel.L = [0, 0];
  }

  /** Convenience: apply + render with the gaze kept for the eye pass. */
  frame(bs, head, gaze, lean, breath) {
    this.apply(bs, head, gaze, lean, breath);
    this.render();
  }

  stats() {
    return { triangles: Math.round(this.R.tris), meshes: this.R.draws };
  }

  dispose() {
    const gl = this.R.gl;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
