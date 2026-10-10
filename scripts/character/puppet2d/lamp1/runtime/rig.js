// lamp1 (round 4, Asha option 4): derived from the r8 runtime by scripts/character/puppet2d/lamp1/make-runtime.py;
// every c-front pixel constant now reads F (face.js), whose defaults are those values (an r8 pack renders unchanged).
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
import { LipSolver, LipShell, jawProfile, lineY as lineYAt, MOUTH } from "./lips.js";
import { Life } from "./life.js";
import { F, setFace, onFace } from "./face.js";

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
// lamp1: the proxy is F.px (geom.face.px), c-front's values by default
function zHead(x, y) {
  const PX = F.px, u = (x - PX.cx) / PX.rx, v = (y - PX.cy) / PX.ry;
  const q = Math.max(0, 1 - u * u - v * v);
  let z = PX.A * q * q;
  z += PX.B * Math.exp(-((x - PX.fcx) ** 2) / (2 * PX.fsx * PX.fsx) - ((y - PX.fcy) ** 2) / (2 * PX.fsy * PX.fsy));
  { const N = F.noseZ; z += N.a * Math.exp(-((x - N.x) ** 2 + (y - N.y) ** 2) / (2 * N.s * N.s)); }   // nose
  { const C = F.cheekZ; for (const cx of C.xs) z += C.a * Math.exp(-((x - cx) ** 2 + (y - C.y) ** 2) / (2 * C.s * C.s)); } // cheeks
  return z;
}

/** r7 (judge r6 fix 4, METHOD CHANGE for the turn): the FAR-SIDE SILHOUETTE DEFORM, baked into the painted yaw keyform
 *  grids at load (zero per-frame cost: the same grid lookup every head layer already does). The fitted field slid the
 *  features inside a frontal outline (both blind models: 'about 10 degrees, a feature slide'). The painted 30-degree keys
 *  show what the outline does: the far cheek and jaw contour come in close to the far eye, the near cheek and jaw widen
 *  and the near ear opens, the chin swings toward the turn, the far ear tucks behind the cheek and the hair shell follows
 *  the contour at about a quarter of its travel (parallax). Each term is a band around the face contour (|u| = 1 at the
 *  rest cheek outline, u = (x - 530) / 208), so the eyes, nose and mouth (|u| < 0.6) are almost untouched and nothing
 *  tears: every layer samples one continuous field. Amplitudes in px at the key angle (20 deg), fitted by eye against
 *  keys/yawR30-0.png and yawL30-0.png at 2/3 of their travel; ?sil=0 turns it off for an A/B. */
// sideKeep < 1 lets the side-of-head layers lag the face (tried at 0.55: the lock bed, which carries painted ear and
// earring pixels ABOVE the face, then tore from the cheek as a dark seam; off until the bed is split)
// r8 (judge r7: 'the far eye sits right on the outline'): far 20 -> -8. Measured against the normalised 30-degree keys
// (skin extents per row, fitturn notes in r8-summary.json) the r7 far outline sat 18-35 px INSIDE the painted one at
// y 520-640, so the far eye met the outline and the far lock crossed it; the far cheek now keeps a band beyond the eye
export const SIL = { far: -8, near: 14, chin: 16, w: 0.4, sideKeep: 1 };
// r7: the brows' outer ends (rest), where the temple hairline meets them (hairline pin)
// lamp1: the pins are F.pins
const SIDE_LAYERS = new Set(["hair", "lockbed", "lockL", "lockR", "ears", "hairback"]);
/** The silhouette term alone at rest (x, y) for turn side sg (+1 = features move screen-right), px at the key angle. */
export function silDx(x, y, sg) {
  const u = (x - F.mid) / F.hw, au = Math.abs(u), S = F.sil;
  const yb = smooth(S.y[0], S.y[1], y) * (1 - smooth(S.y[2], S.y[3], y));         // temple to jaw (the neck and collar stay)
  const far = u * sg > 0;
  // asymmetric band: wide outside the outline, tighter inside it (the far eye narrows, it is not shoved)
  const band = Math.exp(-(((au - 1) / (au < 1 ? 0.3 : SIL.w)) ** 2));
  // far side: the outline comes IN (toward the features); near side: it goes OUT. Both are -sg.
  let dx = -sg * (far ? SIL.far : SIL.near) * F.k * band * yb;
  // the far ear tucks BEHIND the cheek (travels more than the outline), the hair shell beyond it less (parallax)
  if (far && au > 1) dx *= 1 + (smooth(1.0, 1.12, au) * (0.3 + 0.0)) - smooth(1.3, 1.55, au) * 0.8;
  // the chin and jaw swing toward the turn (the head rotates about the neck: the jaw point leads)
  dx += sg * SIL.chin * F.k * smooth(S.chin[0], S.chin[1], y) * (1 - smooth(S.chin[2], S.chin[3], y)) * Math.exp(-((u / S.chinW) ** 2));
  return dx;
}
/** r8 (judge r7 fix 4, METHOD CHANGE, turn): ROTATE THE INTERIOR FEATURES, not only the silhouette. The fitted field and
 *  silDx translate the frontal painting of the nose, bindi and mouth as rigid pieces, so both blind models read 'a glance
 *  with a frontal face'. Four rest-space terms at the key angle (px, scaled by the same yaw / keyDeg weight), evaluated in
 *  projectTo at each vertex's REST point so every layer that overlaps samples one continuous field (nothing tears):
 *    nose   the tip and the alae lead the turn (a nose that protrudes swings further than the face plane), the root stays;
 *           the far ala tucks toward the tip (foreshortened behind it), the near flank opens (its side plane is lit, gl.js)
 *    bindi  the forehead centre line leads the brows (cylindrical mapping: the brow heads stay where the field puts them)
 *    mouth  the philtrum / lip centre line leads the corners (~0.5x the nose): the near half of the mouth lengthens and
 *           the far half shortens, as on a cylinder
 *  Fitted against keys/yawR30-0 and yawL30-0 normalised into c-front's frame (fitturn.py), like silDx; ?feat=0 = off. */
export const FEAT = { nose: 16, wing: 4, bindi: 9, mouth: 8 };   // r8 i2: 12/3/7/6 read too timid beside the keys
export function featDx(x, y, sg) {
  const G = F.feat, bx = G.box;
  if (y < bx[1] || y > bx[3] || x < bx[0] || x > bx[2]) return 0;
  let dx = 0;
  const nx = x - G.nose[0];
  if (y > G.noseY[0] && y < G.noseY[1]) {
    dx += FEAT.nose * Math.exp(-((nx / G.nose[2]) ** 2) - (((y - G.nose[1]) / G.nose[3]) ** 2));
    dx -= FEAT.wing * Math.exp(-(((nx - sg * G.wing[0]) / G.wing[2]) ** 2) - (((y - G.wing[1]) / G.wing[3]) ** 2));
  }
  if (y < G.bindiY) dx += FEAT.bindi * Math.exp(-(((x - G.bindi[0]) / G.bindi[2]) ** 2) - (((y - G.bindi[1]) / G.bindi[3]) ** 2));
  if (y > G.mouthY[0]) dx += FEAT.mouth * Math.exp(-(((x - G.mouth[0]) / G.mouth[1]) ** 2)) * smooth(G.mouthY[0], G.mouthY[1], y) * (1 - smooth(G.mouthY[2], G.mouthY[3], y));
  return sg * dx * F.k;
}
// r8 (fps): featDx as a 4 px bilinear table per side (built at load, rebuilt if FEAT changes); projectTo runs for every
// vertex of every layer, and the direct form (up to 5 exp) doubled the unthrottled work p95 (2.4 -> 4.7 ms)
const FD = { s: 4, x0: 400, y0: 320, nx: 66, ny: 96, key: "", T: null };
function featTable() {
  const key = JSON.stringify(FEAT) + JSON.stringify(F.feat) + F.k;
  if (FD.key === key) return FD.T;
  { const bx = F.feat.box; FD.x0 = bx[0]; FD.y0 = bx[1]; FD.nx = Math.round((bx[2] - bx[0]) / FD.s) + 1; FD.ny = Math.round((bx[3] - bx[1]) / FD.s) + 1; }
  FD.key = key; FD.T = [1, -1].map((sg) => { const T = new Float32Array(FD.nx * FD.ny); for (let j = 0; j < FD.ny; j++) for (let i = 0; i < FD.nx; i++) T[j * FD.nx + i] = featDx(FD.x0 + i * FD.s, FD.y0 + j * FD.s, sg); return T; });
  return FD.T;
}
function featFast(x, y, T) {
  const gx = (x - FD.x0) / FD.s, gy = (y - FD.y0) / FD.s;
  if (gx <= 0 || gy <= 0 || gx >= FD.nx - 1.001 || gy >= FD.ny - 1.001) return 0;
  const i = gx | 0, j = gy | 0, u = gx - i, v = gy - j, k = j * FD.nx + i;
  return (T[k] * (1 - u) + T[k + 1] * u) * (1 - v) + (T[k + FD.nx] * (1 - u) + T[k + FD.nx + 1] * u) * v;
}
function silhouetteKey(K, gain) {
  if (K._sil) return;
  K._sil = gain;
  const st = K.grid.step, n = K.grid.n;
  for (const [side, sg] of [["R", 1], ["L", -1]]) {
    const D = K[side];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) D[j][i][0] += gain * silDx(i * st, j * st, sg);
  }
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
const buildZ = () => { for (let j = 0; j < ZN; j++) for (let i = 0; i < ZN; i++) ZLUT[j * ZN + i] = zHead(i * ZS, j * ZS); };
buildZ();
onFace(buildZ);   // lamp1: the depth table follows the face's proxy
function zFast(x, y) {
  const gx = clamp(x / ZS, 0, ZN - 1.001), gy = clamp(y / ZS, 0, ZN - 1.001), i = gx | 0, j = gy | 0, u = gx - i, v = gy - j, k = j * ZN + i;
  return (ZLUT[k] * (1 - u) + ZLUT[k + 1] * u) * (1 - v) + (ZLUT[k + ZN] * (1 - u) + ZLUT[k + ZN + 1] * u) * v;
}

/** r5 (fps): the rest-only part of faceOffset (cheek gaussians, wink cheek, jaw profile) for a fixed rest point. */
// r8 (judge r7 fix 3, surprise): two more rest weights. BROAD: a wider jaw profile minus the narrow one (on a big jaw drop
// the whole mandible swings down, so the jaw corners follow the chin and the lower face stays a U, not a V). NARROW: a
// signed band over the lower cheeks and the jaw outline that draws in as the jaw drops (the cheeks thin over the open jaw).
export function narrowW(x, y) {
  const ax = Math.abs(x - F.mid), N = F.narrow;
  return Math.sign(x - F.mid) * smooth(N.ax[0], N.ax[1], ax) * Math.exp(-(((y - N.y) / N.s) ** 2));
}
function faceW(x, y) {
  const C = F.cheeks, Wk = F.wink, J = F.jawBroad;
  return [Math.exp(-((x - C.L[0]) ** 2 + (y - C.L[1]) ** 2) / (2 * C.s * C.s)), Math.exp(-((x - C.R[0]) ** 2 + (y - C.R[1]) ** 2) / (2 * C.s * C.s)),
    Math.exp(-((x - Wk.L[0]) ** 2 + (y - Wk.L[1]) ** 2) / (2 * Wk.s * Wk.s)), Math.exp(-((x - Wk.R[0]) ** 2 + (y - Wk.R[1]) ** 2) / (2 * Wk.s * Wk.s)),
    jawProfile(x, y), Math.sign(x - F.mid),
    Math.max(0, smooth(J.y[0], J.y[1], y) * Math.exp(-(((x - F.mid) / J.s) ** 2)) - jawProfile(x, y)), narrowW(x, y)];
}
const FWN = 8;
function faceWArr(rest, n) {
  const W = new Float32Array(n * FWN);
  for (let i = 0; i < n; i++) W.set(faceW(rest[i * 2], rest[i * 2 + 1]), i * FWN);
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
    setFace(geom.face);   // lamp1: this pack's face constants (none = c-front, r8)
    this.g = geom;
    if (geom.yawKeys && opts.sil !== 0) silhouetteKey(geom.yawKeys, opts.sil ?? 1);
    this.M = mouths;
    this.R = new Renderer(canvas, { clear: opts.clear || geom.clear || [251.4 / 255, 229.4 / 255, 188.6 / 255], preserve: !!opts.preserve });
    this.R.dpr = opts.dpr || Math.min(2, window.devicePixelRatio || 1);
    this.R.face = { nose: F.noseShade, mk: F.mouth.k, tint: F.shade.tint, tongue: F.mouth.tongueMul || [1, 1, 1], teeth: F.mouth.teethMul || [1, 1, 1] };   // lamp1: per-face shader constants
    this.reduced = !!opts.reducedMotion;
    // r5 (judge r4 fix 1, interim): product yaw is clamped to +-10 and drawn by the shared field only (no painted plate:
    // the plate's near-cheek seam and mouth-corner crease were the uncanny full-size frames). ?turn=plates restores the
    // +-20 plate path for evaluation.
    this.usePlates = !!opts.plates;
    // r6 (judge r5 fix 4): the product turn is back to +-20 on the shared field ALONE (no plate), now with rest-y field
    // sampling, the far eye floored at 0.78x, the far mouth corner tucked in and nose side planes (the field fitted to the
    // painted 30-degree keys already carries the skull, hair parting, ears and bun)
    this.yawMax = opts.yawMax ?? 20;
    this.featOn = opts.feat !== 0;   // r8: the interior-feature rotation (featDx)
    this.life = new Life({ reduced: this.reduced });
    this.view = opts.view || (geom.views && geom.views.medium) || [140, 20, 744];   // lamp1: the pack's own framings // x0, y0, width of the rest-space window shown
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
      if (SIL.sideKeep < 1 && SIDE_LAYERS.has(name) && geom.yawKeys && geom.yawKeys._sil) {
        const g0 = geom.yawKeys._sil, mkK = (sg) => Float32Array.from({ length: gr.n }, (_, i) => { const x = gr.rest[i * 2], y = gr.rest[i * 2 + 1]; return (x - F.mid) * sg > 0 ? -(1 - SIL.sideKeep) * g0 * silDx(x, y, sg) : 0; });
        this.layers[name].silK = [mkK(1), mkK(-1)];
      }
      if (kind === "brow") {   // r5 (fps): the ribbon terms depend on x only: one evaluation per grid column
        const L = this.layers[name], xs = [...new Set(Array.from({ length: gr.n }, (_, i) => gr.rest[i * 2]))];
        L.colX = Float32Array.from(xs); L.colOf = new Uint16Array(gr.n);
        const ix = new Map(xs.map((x, i) => [x, i]));
        for (let i = 0; i < gr.n; i++) L.colOf[i] = ix.get(gr.rest[i * 2]);
        L.cdx = new Float32Array(xs.length); L.cdy = new Float32Array(xs.length); L.cs = new Float32Array(xs.length); L.cc = new Float32Array(xs.length); L.cyc = new Float32Array(xs.length);
      }
    };
        mk("hairback", 24, "head");
    if (geom.rects.nape) mk("nape", 24, "body");   // r6: the nape under the bun (bodyfill.py), behind the bun
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
    { const L = this.layers.bun; for (let i = 0; i < L.n; i++) L.z[i] = L.z[i] + F.bunZ; }
    // the right lock hangs over the knot: its lower part takes the knot's depth, so lock and knot never slide over
    // each other on a turn (their shared dark-on-dark contour is unknown in c-front; any slide uncovered a jagged cut)
    for (const [sd, b] of Object.entries(F.lockBun || {})) { if (!b) continue; const L = this.layers["lock" + sd]; for (let i = 0; i < L.n; i++) L.z[i] += F.bunZ * smooth(b[0], b[1], L.rest[i * 2 + 1]); }
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
      // r6 (judge r5: 'flat lids'): the lid band draws with the lip program so it can carry per-vertex light: a lit lid
      // bulge above the lash centre (LH) and a soft shadow where the lid rolls under to the lash (LS); weight 0 at rest
      const lA = new Float32Array(LC * LR).fill(1), lL = new Float32Array(LC * LR).fill(1), lT = new Float32Array(LC * LR), LH = new Float32Array(LC * LR), LS = new Float32Array(LC * LR);
      { const xc = (e.x[0] + e.x[1]) / 2, hw = (e.x[1] - e.x[0]) / 2;
        for (let i = 0; i < LC; i++) for (let jj = 0; jj < LR; jj++) {
          const k = i * LR + jj, x = lrest[k * 2], v = jj / (LR - 1), ux = (x - xc) / hw;
          LH[k] = Math.exp(-((ux / 0.55) ** 2)) * Math.exp(-(((v - 0.22) / 0.16) ** 2));
          LS[k] = Math.exp(-((ux / 0.8) ** 2)) * Math.exp(-(((v - 0.46) / 0.1) ** 2));
        } }
      const lmesh = this.R.mesh(this.R.lip, { aPos: { data: lpos, size: 2, dynamic: true }, aUv: { data: luv, size: 2 }, aA: { data: lA, size: 1, dynamic: true }, aL: { data: lL, size: 1, dynamic: true }, aT: { data: lT, size: 1 } }, strip(LC, LR));
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
      this.eyes[s] = { e, xa, xb, C, R, pos, restA, topA, mesh, LC, LR, lrest, lpos, lv, lmesh, lA, lL, LH, LS, BC, BR, brest, bpos, bv, bmesh, top: new Float32Array(xb - xa + 1), bot: new Float32Array(xb - xa + 1) };
    }
    // r3 painted lid keys (mid, shut) per eye: grid meshes projected with the head like every face layer
    this.lidKeyMesh = {};
    if (geom.lidKeys) for (const s of ["L", "R"]) for (const kk of ["mid", "shut"]) {
      const name = `lid${kk}${s}`, rect = geom.rects[name], gr = grid(rect, 8);   // r6: mid 16 -> 8 px (the lash bend + lid shading)
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
      // r6 (judge r5 fix 7): a VOLUMETRIC lid. Static per-vertex light: the lid is a sphere-cap over the eyeball, lit on
      // its upper middle and rolling into shadow toward the lash line and the corners (the painted key's skin is flat)
      const alpha = new Float32Array(gr.n).fill(1), light = new Float32Array(gr.n), tintZ = new Float32Array(gr.n);
      { const E = this.eyes[s], xc = (E.e.lashX[0] + E.e.lashX[1]) / 2, hw = (E.e.lashX[1] - E.e.lashX[0]) / 2;
        const lashY = (x) => { const ml = geom.lidKeys[s].midLash; const c = clamp(Math.round(x - E.xa), 0, ml.y.length - 1); return ml.y[c]; };
        for (let i = 0; i < gr.n; i++) {
          const x = gr.rest[i * 2], y = gr.rest[i * 2 + 1], ux = (x - xc) / hw;
          const ly = kk === "mid" ? lashY(x) : rect[3] - 22 * F.ke, top = rect[1] + 6, v = clamp01((y - top) / Math.max(8, ly - top));
          const hi = Math.exp(-((ux / 0.5) ** 2)) * Math.exp(-(((v - 0.38) / 0.24) ** 2));
          const roll = Math.exp(-(((v - 0.86) / 0.12) ** 2)) * Math.exp(-((ux / 0.9) ** 2));
          const side = smooth(0.55, 1.0, Math.abs(ux)) * (1 - smooth(0.9, 1.05, v));
          light[i] = (1 + 0.065 * hi - 0.1 * roll - 0.06 * side) * (kk === "mid" ? 1 : 0.4) + (kk === "mid" ? 0 : 0.6);
        } }
      this.lidKeyMesh[name] = { rect, rest: gr.rest, z, pos, off, n: gr.n, alpha, mesh: this.R.mesh(this.R.lip, { aPos: { data: pos, size: 2, dynamic: true }, aUv: { data: gr.uv, size: 2 }, aA: { data: alpha, size: 1, dynamic: true }, aL: { data: light, size: 1 }, aT: { data: tintZ, size: 1 } }, gr.idx) };
    }
    // r3 mouth: the lip shell (two sheets of c-front's own mouth region) + the interior strip
    this.shell = new LipShell(geom.rects.mouth_rest);
    this.shellMesh = {};
    for (const n of ["U", "L"]) {
      const sh = this.shell.sheets[n];
      this.shellMesh[n] = this.R.mesh(this.R.lip, { aPos: { data: sh.pos, size: 2, dynamic: true }, aUv: { data: sh.uv, size: 2, dynamic: true }, aA: { data: sh.alpha, size: 1, dynamic: true }, aL: { data: sh.light, size: 1, dynamic: true }, aT: { data: sh.tint, size: 1, dynamic: true }, aE: { data: sh.d, size: 1 } }, sh.idx);
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
    // r6 (judge r5 fix 7): the stud glint life.js computes, drawn. A soft specular dot on each gold stud's painted
    // highlight; it slides against head motion and flares while the head moves, then settles (a stud cannot swing).
    { const c = document.createElement("canvas"); c.width = c.height = 32; const x = c.getContext("2d");
      const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,252,236,1)"); gr.addColorStop(0.35, "rgba(255,246,214,0.55)"); gr.addColorStop(1, "rgba(255,240,200,0)");
      x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
      // a faint four-point flare
      x.globalCompositeOperation = "lighter"; x.fillStyle = "rgba(255,250,230,0.35)"; x.fillRect(15, 2, 2, 28); x.fillRect(2, 15, 28, 2);
      this.glintTex = this.R.texture(c, false);
      this.glints = F.glints.map(([gx, gy]) => {
        const pos = new Float32Array(8), uv = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
        return { gx, gy, pos, mesh: this.R.mesh(P, { aPos: { data: pos, size: 2, dynamic: true }, aUv: { data: uv, size: 2 } }, new Uint16Array([0, 1, 2, 1, 3, 2])) };
      }); }
    this.prevAnchor = null;
    this.prevVel = { L: [0, 0], R: [0, 0], bun: [0, 0] };
    this.st = null;
  }

  drawGlints() {
    if (!this.glints) return;
    const g = this.life.glint, m = Math.min(1, Math.hypot(g[0], g[1]) * 1.6);
    const tw = 0.5 + 0.5 * Math.sin(this.now() * 2.1);   // a slow shimmer while still
    for (const G of this.glints) {
      const ox = clamp(g[0] * 5, -3.5, 3.5), oy = clamp(g[1] * 5, -3.5, 3.5);
      const c = this.project(G.gx + ox, G.gy + oy, zFast(G.gx, G.gy));
      const r = (4.2 + 2.4 * m) * F.ke;
      G.pos.set([c[0] - r, c[1] - r, c[0] + r, c[1] - r, c[0] - r, c[1] + r, c[0] + r, c[1] + r]);
      this.R.update(G.mesh, "aPos", G.pos);
      this.R.drawPaint(G.mesh, this.glintTex, [0, 0, 1, 1], (0.22 + 0.1 * tw + 0.6 * m) * F.glintA);
    }
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
      sy: Math.sin(yaw * D2R) * F.px.gain, cy: Math.cos(yaw * D2R),
      sp: Math.sin(pitch * D2R) * F.px.gain, cp: Math.cos(pitch * D2R),
      sr: Math.sin(-roll * D2R), cr: Math.cos(-roll * D2R),
      yaw, pitch, roll,
      // r8 (judge r7 fix 5, feature-scale lock): the lean's head scale is capped at +-1% (r7: 1 + 0.03 * lean grew the head
      // 3.75% on concern B's 1.25 lean, and every feature with it: sol's 'eye and brow scale drift between cells'); the lean
      // still reads through the 7 px drop and the shoulders
      bob: -breath * 1.4 * F.k, leanS: 1 + 0.01 * Math.tanh(lean / 0.7), leanY: 7 * lean * F.k, lean,
    };
    // yaw keyform: side + weight (an ease-in so small drifts stay subtle and the key is reached at +-keyDeg)
    if (this.g.yawKeys) {
      const K = this.g.yawKeys, f = clamp(yaw / K.keyDeg, -1, 1);   // r4: the painted key is reached at the yaw limit, never extrapolated (judge r3: the 1.25x was unverified)
      st.yk = f >= 0 ? K.R : K.L;
      st.ykf = Math.abs(f);
      if (this.featOn && st.ykf > 0) st.featT = featTable()[f >= 0 ? 0 : 1];
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
      const [smL, smR] = sy("mouthSmile");
      let [chL, chR] = sy("cheekSquint");
      // r6 (judge r5 fix 5): the cheek BUNCHES on the side the mouth is pushed to (thinking 'hmm')
      const push = k("mouthLeft") - k("mouthRight");   // + = her left = screen right
      chR += 0.45 * Math.max(0, push); chL += 0.45 * Math.max(0, -push);
      this.exprSide = { L: { smile: smL, cheek: chL }, R: { smile: smR, cheek: chR } }; }
    this.browCh = { L: this.browChannels("L"), R: this.browChannels("R") };
    this.solver.solve(bs, dt);
    const sp = this.solver.p;
    // r6 (judge r5 fix 5, concern): mentalis. An expression lip press (not an m/b/p closure) pushes the chin skin up ~3 px,
    // the 'pressed, holding it in' chin of a worried or thinking face; it rides the jaw term, so face, lip shell and
    // interior all move together
    { const ep = clamp01((k("mouthPressLeft") + k("mouthPressRight")) / 2 * 2.2); this.solver.ment = 3.2 * F.k * ep * (1 - clamp01(sp.g / 6)); }
    this.mouth = { name: "shell", row: sp.g > 3 ? "open" : "closed", jawGain: 1, p: sp };
    // ---- lids: screen-left eye (L) is her right eye (ARKit *Right)
    const side = { L: "Right", R: "Left" };
    const lookDown = clamp01(-gaze[1] / 25), lookUp = clamp01(gaze[1] / 20);
    const bLk = k("eyeBlinkLeft"), bRk = k("eyeBlinkRight"), winkI = Math.max(bLk, bRk) > 0.08 && Math.abs(bLk - bRk) > 0.5 * Math.max(bLk, bRk);
    // r5: which eye is winking (screen-left L reads eyeBlinkRight): it skips the mid-blink key (drawEye)
    this.winkI = { L: winkI && bRk > bLk, R: winkI && bLk > bRk };
    const lidL = this.blinkShape(t, dt, bRk, winkI ? 1 : 0);  // one shaper drives both lids
    this.lid = { L: lidL, R: this.blinkShape2(k("eyeBlinkLeft")) };
    // r5 (judge r4): a WINK = one lid shut while the other stays open; it takes the curved happy-closed lid + cheek raise
    this.wink = { L: smooth(0.4, 0.9, this.lid.L - this.lid.R) * smooth(0.35, 0.85, this.lid.L), R: smooth(0.4, 0.9, this.lid.R - this.lid.L) * smooth(0.35, 0.85, this.lid.R) };
    this.life.update(t, dt, bs, gaze, head, this.solver, breath);
    // r6: 'happy eyes' weight (delight, warm): the upper lid arches a touch and shows its volume
    this.happy = clamp01((smile - 0.25) / 0.6) * clamp01((cheek + 0.15) / 0.6);
    for (const s of ["L", "R"]) {
      const E = this.eyes[s], e = E.e, sfx = side[s];
      // r2: small left/right differences in squint/cheek/smile (behaviour's +-6% asymmetry, presets) are averaged so
      // a delight squint closes both eyes alike; a deliberate asymmetry (a wink-ish playful squint, > 0.12) is kept
      const sym = (n) => { const a = k(n + "Left"), bb = k(n + "Right"); return Math.abs(a - bb) < 0.12 ? (a + bb) / 2 : k(n + sfx); };
      // r8 (judge r7 fix 5): the eye opening may not grow past ~1.03x of rest except on a surprise-level eyeWide: up to
      // 0.035 passes (0.41 * 0.035 = +1.4% opening, leaving room for the lean scale), the rest fades in only as eyeWide climbs from 0.3 to 0.6 (surprise is 0.9)
      const w0 = k("eyeWide" + sfx), w = w0 <= 0.035 ? w0 : 0.035 + (w0 - 0.035) * smooth(0.3, 0.6, w0);
      const b = this.lid[s], q = sym("eyeSquint"), c = sym("cheekSquint");
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
        let top = T + follow - w * 0.32 * H * hump - (this.happy || 0) * 0.07 * H * hump * hump;   // r4: surprise shows sclera ABOVE the iris (0.2 -> 0.32); r6: happy arch
        // blink: the upper lid travels to the meeting line, the lower lid rises the last part (eased: fast close)
        // r3: the live lid only travels to the PAINTED mid lid's lash line (l = 0.5); beyond it the painted keys take
        // over (drawEye: lidmid / lidshut), so the lid skin is never stretched into a smear
        const ml = this.g.lidKeys ? this.g.lidKeys[s].midLash : null;
        const midY = ml ? ml.y[Math.min(ml.y.length - 1, i)] + this.liftCache[s][i] : closed;
        // r6 (judge r5: 'the droopy half-lid on the way into the wink'): a winking eye's upper lid travels less and arches
        // (corners lead), while its lower lid rises to meet it: a squint into the wink, not a sleepy half-lid
        const wkE = this.winkI && this.winkI[s];
        const trav = wkE ? clamp01(b / 0.62) * (0.72 + 0.28 * (1 - hump)) : clamp01(b / 0.34);
        if (wkE) bot -= 0.3 * H * smooth(0.08, 0.45, b) * Math.pow(hump, 1.2);
        top = top + (Math.max(top, midY - 3) - top) * trav;   // r4b: -3 so the live lash's light lower edge hides under the painted lash   // r4: lands on the painted lash BEFORE the cross-fade (no ghost)
        if (top > bot) top = bot;
        E.top[i] = top;
        E.bot[i] = bot;
      }
      E.blink = b;
    }
    // ---- secondary motion: anchor = the head proxy's projection of a point, its acceleration drives the springs
    const anchor = this.project(F.anchor[0], F.anchor[1], F.anchor[2]);
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
  blinkShape(t, dt, b, asym = 0) {
    const S = this.bsh || (this.bsh = { active: false, t0: 0, base: 0, prev: b, settle: false });
    // r5: a WINK (one lid only) is a deliberate expression, not an autonomic blink: it never triggers the shaper (in r5's
    // first clip the wink's fast rise did, and the settle step then held the winking lid at its pre-blink height)
    if (asym > 0.5 && !S.active) { S.prev = b; S.settle = false; this.blinkDip = 0; this.lidShared = b; this.lidRaw = b; return b; }
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
  projectTo(x, y, z, out, rx, ry) {
    // r6 (turn): the yaw field is sampled at (rx, ry) when given. Face, lip shell and mouth interior pass their actual x
    // and their REST y: the jaw drop and lip opening are skin motion ON the turned surface. r5 sampled the displaced point,
    // so a dropped chin fell into the field's neck ramp and lagged (the 'delight + turn' jaw bulge). x stays the actual
    // one, so the lips and the interior that meet at one screen point always sample the same field column (a rest-x
    // sample exposed the cavity edge at the far corner).
    const s = this.st;
    // r3: the yaw is an angle KEYFORM: the displacement field fitted to the painted 3/4 plate (keyfield.py), scaled by
    // yaw / keyDeg and sampled at this rest point (one shared field: nothing tears between head layers). The pitch
    // keeps the 2.5D proxy (depth z), applied after the turn.
    let X = x, Y = y;
    if (s.yk && s.ykf > 0 && this.featOn) X += s.ykf * featFast(rx ?? x, ry ?? y, s.featT);
    if (s.yk) {
      const D = s.yk, st = this.yawStep, gx = clamp((rx ?? x) / st, 0, this.yawN - 1.001), gy = clamp((ry ?? y) / st, 0, this.yawN - 1.001);
      const i = Math.floor(gx), j = Math.floor(gy), u = gx - i, v = gy - j;
      const a = D[j][i], b = D[j][i + 1], c = D[j + 1][i], d = D[j + 1][i + 1];
      const f = s.ykf;
      X += f * ((a[0] * (1 - u) + b[0] * u) * (1 - v) + (c[0] * (1 - u) + d[0] * u) * v);
      Y += f * ((a[1] * (1 - u) + b[1] * u) * (1 - v) + (c[1] * (1 - u) + d[1] * u) * v);
    }
    const P = F.px, dy = Y - P.cy;
    Y = P.cy + dy * s.cp + z * s.sp;
    // roll about the neck pivot
    const pv = P.pivot, px = X - pv[0], py = Y - pv[1];
    X = pv[0] + px * s.cr - py * s.sr;
    Y = pv[1] + px * s.sr + py * s.cr;
    // breath bob (head follows the chest 60%) and lean (scale about the pivot, down)
    X = pv[0] + (X - pv[0]) * s.leanS;
    Y = pv[1] + (Y - pv[1]) * s.leanS + s.bob * 0.6 + s.leanY;
    out[0] = X; out[1] = Y;
    return out;
  }

  /** Rest-space expression offsets on the face surface (cheek lift, jaw drop): shared by face and mouth. */
  /** r6 (judge r5 fix 3): the cheeks ride UP as the jaw drops (a little on aa, more on an open smile), so a big opening
   *  never balloons the lower face; px of extra lift at the cheek apples. */
  openLift() {
    const sol = this.solver;
    if (!sol) return 0;
    const j = clamp01(sol.lowerDrop() / 34), sm = clamp01((this.expr.smile - 0.2) / 0.6);
    // r7 (judge r6): surprise drops the jaw without the cheek ride-up (it ballooned the lower face around the O)
    return j * (2.2 + 3.6 * sm) * F.k * (1 - 0.85 * (sol.surprised || 0));
  }
  faceOffset(x, y, noJaw = false) {
    const { smile, cheek } = this.expr;
    let dx = 0, dy = 0;
    const ol = this.openLift();
    // cheeks lift and widen a touch on a smile
    const ES = this.exprSide;
    const CK = F.cheeks, WK = F.wink;
    for (const [cx, cyk, sd] of [[CK.L[0], CK.L[1], "L"], [CK.R[0], CK.R[1], "R"]]) {
      const f = Math.exp(-((x - cx) ** 2 + (y - cyk) ** 2) / (2 * CK.s * CK.s));
      const sm = ES ? ES[sd].smile : smile, ch = ES ? ES[sd].cheek : cheek;
      dy -= ((sm * 4.5 + ch * 5.5) * F.k + ol) * f;   // r4: a stronger cheek push on delight
      dx += Math.sign(x - F.mid) * sm * 1.5 * F.k * f;
      // r5: the winking side's cheek apple rides up under the closed eye
      const wk = this.wink ? this.wink[sd] : 0;
      if (wk > 0) { const wc = WK[sd]; dy -= wk * 9 * F.k * Math.exp(-((x - wc[0]) ** 2 + (y - wc[1]) ** 2) / (2 * WK.s * WK.s)); }
    }
    // r4: the jaw carries lower lip, skin and chin together (lips.js jaw()), so the skin between them never crushes
    if (!noJaw && this.solver) dy += this.solver.jaw() * jawProfile(x, y);
    // r8: surprise lower face (broad jaw follow + cheek narrowing): the same terms faceOffW applies
    const c = this._fc;
    if (c) { const w = faceW(x, y); dy += c[7] * w[6]; dx -= c[8] * w[7]; }
    return [dx, dy];
  }
  /** r8 (judge r7 fix 3): the lower face answers the jaw. On a big drop (the surprise O most of all) the cheeks narrow by up
   *  to ~4.5 px per side and the jaw corners follow the chin; a smile (cheeks pushed out) cancels most of it. */
  jawShape() {
    const sol = this.solver;
    if (!sol) return [0, 0];
    const o = clamp01((sol.lowerDrop() - 8) / 38), sur = sol.surprised || 0, sm = clamp01((this.expr.smile - 0.2) / 0.5);
    const narrow = 4.5 * F.k * o * (0.4 + 0.6 * sur) * (1 - 0.75 * sm);
    const broad = 0.45 * sol.jaw() * sur;
    return [broad, narrow];
  }

  /** r5 (fps): per-frame coefficients of faceOffset; faceOffW applies them to precomputed weights. */
  faceCoef() {
    const ES = this.exprSide, { smile, cheek } = this.expr, wk = this.wink || { L: 0, R: 0 };
    const sL = ES ? ES.L.smile : smile, sR = ES ? ES.R.smile : smile, cL = ES ? ES.L.cheek : cheek, cR = ES ? ES.R.cheek : cheek;
    const ol = this.openLift(), js = this.jawShape();
    const K = F.k;
    return (this._fc = [(sL * 4.5 + cL * 5.5) * K + ol, (sR * 4.5 + cR * 5.5) * K + ol, sL * 1.5 * K, sR * 1.5 * K, wk.L * 9 * K, wk.R * 9 * K, this.solver ? this.solver.jaw() : 0, js[0], js[1]]);
  }
  faceOffW(W, i, noJaw, out) {
    const c = this._fc, o = i * FWN;
    // r8: the broad-jaw and narrowing terms are skin motion, applied even where the lip shell owns the jaw (noJaw)
    out[0] = W[o + 5] * (c[2] * W[o] + c[3] * W[o + 1]) - c[8] * W[o + 7];
    out[1] = -(c[0] * W[o] + c[1] * W[o + 1]) - c[4] * W[o + 2] - c[5] * W[o + 3] + (noJaw ? 0 : c[6] * W[o + 4]) + c[7] * W[o + 6];
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
        const BD = F.body;
        let Y = BD.hem + (y - BD.hem) * (1 + 0.004 * s.bob / (-1.4 * F.k));
        let X = x;
        // r5 (judge r4, secondary life): the shoulders rise on the in-breath (they lag the chest a little: life.breathS)
        const sh = smooth(BD.sh[0], BD.sh[1], Math.abs(x - BD.cx)) * (1 - smooth(BD.shY[2], BD.shY[3], y)) * smooth(BD.shY[0], BD.shY[1], y);
        if (sh > 0) { Y -= 2.4 * F.k * this.life.breathS * sh; X += Math.sign(x - BD.cx) * 0.5 * F.k * this.life.breathS * sh; }
        // r7 (judge r6 fix 5, the acting layer): the upper body carries the head's lean and roll. A lean in (concern,
        // listening) brings the shoulders down and a touch wider (toward the camera), a lean back (surprise) lifts them;
        // a head roll tilts the shoulder line ~20% the same way (the body leads, the head follows). The hem stays put.
        { const bw = 1 - smooth(BD.bw[0], BD.bw[1], y);
          if (bw > 0 && (s.lean !== 0 || s.roll !== 0)) {
            Y += (s.leanY * 0.5 + (x - BD.cx) * Math.sin(-s.roll * D2R) * 0.2 * smooth(BD.rollY[0], BD.rollY[1], y)) * bw;
            X += (x - BD.cx) * 0.012 * s.lean * bw;
          } }
        // r3: the neck column carries the head transform fully up to the jaw (the keyform field already decays to 0 at
        // the collar), so the chin and the neck under it move as one; uniform across the neck's width (no shear)
        const neck = smooth(BD.neckY[0], BD.neckY[1], y) * (1 - smooth(BD.neckW[0], BD.neckW[1], Math.abs(x - BD.cx)));
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
    let pin = null;
    if (L.name === "hair" && this.browCh) {
      if (!L.pinW) {
        L.pinW = new Float32Array(n * 2);
        for (let i = 0; i < n; i++) { const x = rest[i * 2], y = rest[i * 2 + 1]; for (let k = 0; k < 2; k++) { const [ax, ay] = F.pins[k]; L.pinW[i * 2 + k] = Math.exp(-((x - ax) ** 2 + (y - ay) ** 2) / (2 * F.pinS * F.pinS)); } }
      }
      const a = this.browOffset("L", F.pins[0][0], F.pins[0][1]), b = this.browOffset("R", F.pins[1][0], F.pins[1][1]);
      pin = [0.9 * a[0], 0.9 * Math.min(0, a[1]), 0.9 * b[0], 0.9 * Math.min(0, b[1])];
    }
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
      } else if (pin) {
        // r7 (judge r6 fix 1): the hairline is PINNED to the brow warp. A raised brow's outer tail used to slide up under
        // the temple hairline (the hair draws over the brows), leaving a pointed dark tip where tail and hair edge met;
        // the hair edge around each brow's outer end now rides up with it (90% of the end's lift, 55 px falloff)
        const wl = L.pinW[i * 2], wr = L.pinW[i * 2 + 1];
        x += wl * pin[0] + wr * pin[2];
        y += wl * pin[1] + wr * pin[3];
      } else if (bun) {
        x += this.bunOff ? this.bunOff[0] : 0;
        y += this.bunOff ? this.bunOff[1] : 0;
      }
      const p = isFace ? this.projectTo(x, y, z[i], this._tmp || (this._tmp = [0, 0]), x, rest[i * 2 + 1]) : this.projectTo(x, y, z[i], this._tmp || (this._tmp = [0, 0]));
      // r7: the SIDE-OF-HEAD layers (hair shell, lock bed, locks, ears, hair back) keep only part of the far-side
      // silhouette's inward travel: the face's front surface swings in past them (parallax), so a far lock hangs outside
      // the cheek instead of crossing the far eye. Precomputed per vertex (silK); 0 on the near side and for face layers.
      if (L.silK && this.st.ykf > 0) p[0] += this.st.ykf * (this.st.yaw >= 0 ? L.silK[0][i] : L.silK[1][i]);
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
    const kb = F.kb;
    return { lift: (14 * wide + 12 * outer + 5 * inner + 4.2 * fl) * kb, inner: (53 * inner + 3 * fl) * kb, arch: 38 * outer * kb, knit: 21 * down * kb };
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
      return 5.0 * F.kb * Math.max(this.blinkDip || 0, smooth(0.3, 0.6, this.lidShared || 0) * (this.bsh && this.bsh.active ? 1 : 0.8)) - c.lift - c.inner * Math.pow(1 - ui, 1.3) - c.arch * (0.35 + 0.65 * peak) * Math.pow(ui, 0.5) + c.knit * (1 - 0.6 * ui);
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
    const dipA = 5.0 * F.kb * Math.max(this.blinkDip || 0, smooth(0.3, 0.6, this.lidShared || 0) * (this.bsh && this.bsh.active ? 1 : 0.8));
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
    if (this.view.length >= 4) { const cw = R.canvas.width, ch = R.canvas.height, v = this.view, sc = Math.min(cw / v[2], ch / v[3]), w = cw / sc, h = ch / sc; R.setCam(v[0] + (v[2] - w) / 2, v[1] + (v[3] - h) / 2, w); }
    else R.setCam(this.view[0], this.view[1], this.view[2]);
    const SF = F.shade.face, SH = F.shade.hair, sd0 = s.yaw >= 0 ? "R" : "L";
    const shadeFace = [s.yaw >= 0 ? 1 : -1, SF[sd0][0], SF[sd0][1], SF.amt * Math.abs(s.yaw) / 20];
    const shadeHair = [shadeFace[0], SH[sd0][0], SH[sd0][1], SH.amt * Math.abs(s.yaw) / 20];
    const dbg = this.debug;
    const PF = this.prof, now = () => performance.now();
    const draw = (n, shade) => {
      const L = this.layers[n];
      const t0 = PF ? now() : 0;
      if (this.deformLayer(L)) R.update(L.mesh, "aPos", L.pos);
      if (PF) PF[n] = (PF[n] || 0) + now() - t0;
      if (dbg && dbg.only && !dbg.only.includes(n)) return;
      R.drawPaint(L.mesh, this.tex[n], L.rect, 1, shade, dbg && dbg.tint ? DBG_TINT[n] : null, n === "face" ? [Math.sign(s.yaw), smooth(2, 20, Math.abs(s.yaw))] : null);
    };
    // the backdrop is c-front's cream (std < 1.5/255 over the plate): the clear colour, no full-screen pass
    draw("hairback", shadeHair);
    if (this.layers.nape) draw("nape");
    draw("bun", shadeHair);
    draw("body");
    draw("ears", shadeFace);
    this.drawGlints();
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
    // r8 (judge r7 fix 4): the far eye is COMPRESSED to a set width, 1 - 0.15 * (|yaw| / 20) (0.85 at 20 deg), instead of
    // floored at 0.72 after the field shrank it to ~0.49; the far outline and lock moved out to make room (SIL.far)
    const emT = 1 - 0.15 * clamp(Math.abs(s.yaw) / 20, 0, 1), em = ratio < emT ? emT / ratio : 1;   // r7: 0.78 -> 0.72 with the silhouette deform (blind r7 i2: 'far eye stays too large')   // r6 (judge r5 fix 4): the far eye narrows to ~0.8x, not 0.6x   // r4b: 0.85 -> 0.6: the painted three-quarter key narrows the far eye to 0.56-0.59 (blind r4c/d 4 of 6: 'far eye stays too large')
    const fixX = (p) => { if (em !== 1) p[0] = ecx + (p[0] - ecx) * em; return p; };
    this.eyeFix = { ecx, em };
    // opening strip
    let k = 0;
    for (let i = 0; i < E.C; i++) {
      const x = Math.min(E.xb, E.xa + i * 2), ii = x - E.xa;
      let top = E.top[ii], bot = E.bot[ii];
      // r2: round the opening's ends (the hand-read corners were blunt: a vertical white edge at 2x and on turns)
      const dEnd = Math.min(x - E.xa, E.xb - x);
      if (dEnd < F.eye.round) { const f = Math.sqrt(Math.max(0, 1 - (1 - dEnd / F.eye.round) ** 2)), mid = (top + bot) / 2; top = mid + (top - mid) * f; bot = mid + (bot - mid) * f; }
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
    const liveA = this.winkI && this.winkI[sd] ? 1 - smooth(0.5, 0.54, E.blink) : 1 - smooth(0.05, 0.35, this.wink ? this.wink[sd] : 0);
    // iris: gaze in rest-space px, foreshortened by gaze + head yaw; squashed a little at full blink
    // r4b: Bell's phenomenon: in a real blink the eyes dip down; a still caught mid-blink then reads as a blink in
    // motion (looking down through closing lids), not a sleepy / smug half-lid stare (blind r4f 3/3)
    const bd = this.bsh && this.bsh.active ? (this.blinkDip || 0) : 0;
    const g0 = this.gaze || [0, 0], ms = this.life.sacc;   // r5: + fixational micro-saccades (life.js)
    const gz = [g0[0] + ms[0], g0[1] + ms[1] - (bd > 0 ? 6 * bd : 0)];
    // r2: the upward range was too timid to read as "looking up" (c-thinking parks the iris under the upper lid)
    const ox = (gz[0] / 25) * 18 * F.ke, oy = (-(gz[1] / 20) * 12 + (gz[1] < 0 ? -gz[1] / 25 * 2 : 0)) * F.ke;
    const fx = Math.cos((gz[0] + 0.2 * s.yaw) * D2R * 1.2);
    const [icx, icy] = e.iris;
    // r2: a lowering lid pushes the catchlight down with it (it stays visible on the iris until the eye is nearly
    // shut): a half-lidded eye with no catchlight read as a dead gaze to both blind judges
    const [ccx, ccy, cr] = e.catch;
    const lidAt = interp(E.xa, E.top, ccx), push = Math.max(0, lidAt + cr + 1.5 - (ccy + oy * 0.45));
    const catchY = oy * 0.45 + Math.min(push, 14 * F.ke), catchA = clamp01((0.92 - E.blink) / 0.2) * (1 - (this.g.lidKeys ? clamp01((E.blink - 0.6) / 0.1) : 0));
    const irisScr = fixX(this.project(icx + ox, icy + oy, zEye(icx + ox, icy + oy)));
    const pa = this.project(icx - 12, icy, zEye(icx - 12, icy)), pb = this.project(icx + 12, icy, zEye(icx + 12, icy));
    const wx = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) / 24;
    // r8 (judge r7 fix 4): the FAR iris is foreshortened horizontally with the opening (x 0.85 at 20 deg, full height)
    // instead of shrunk uniformly to 0.9 (it read as a smaller eye, not a turned one)
    const isFar = Math.abs(s.yaw) > 0.5 && (sd === "R") === (s.yaw > 0);
    const irisK = isFar ? 1 : clamp(0.55 + 0.45 * wx, 0.9, 1.06), irisSX = isFar ? 1 - 0.15 * clamp(Math.abs(s.yaw) / 20, 0, 1) : 1;
    const catchScr = fixX(this.project(ccx + ox * 0.45, ccy + catchY, zEye(ccx, ccy)));
    if (liveA > 0.02) R.drawEye(E.mesh, {
      sclera: { tex: this.tex["sclera" + sd], rect: this.g.rects["sclera" + sd] },
      iris: { tex: this.tex["iris" + sd], rect: this.g.rects["iris" + sd] },
      catch: { tex: this.tex["catch" + sd], rect: this.g.rects["catch" + sd] },
      irisC: [icx, icy], irisScr, irisK, irisScale: [irisSX, E.blink > 0.85 ? 0.95 : 1],
      catchScr, catchC: [ccx, ccy], catchA, lidShade: F.eye.shade[0] + (F.eye.shade[1] - F.eye.shade[0]) * clamp01(Math.abs(interp(E.xa, E.top, icx) - interp(E.xa, e.top, icx)) / 4), topY: interp(E.xa, E.top, icx),
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
    // r6: lid volume on the live lid (happy eyes, a lowering lid); exactly 1.0 at rest
    const vol = Math.max(this.happy || 0, 0.8 * smooth(0.08, 0.34, E.blink));
    for (let q = 0; q < n; q++) { E.lA[q] = liveA; E.lL[q] = 1 + vol * (0.075 * E.LH[q] - 0.07 * E.LS[q]); }
    R.update(E.lmesh, "aA", E.lA);
    R.update(E.lmesh, "aL", E.lL);
    R.drawLip(E.lmesh, this.tex["lid" + sd], this.g.rects["lid" + sd], shade);
    // r3 painted lid keys over the live eye: mid (a real lowered lid with its crease) then shut
    if (this.g.lidKeys) {
      const l = E.blink, wI = this.winkI && this.winkI[sd];
      // a winking eye goes live lid -> arched shut key directly (the mid key under a raised cheek made a broken lash)
      const midA = wI ? 0 : smooth(0.3, 0.36, l), shutA = wI ? smooth(0.5, 0.54, l) : smooth(0.72, 0.82, l);
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
          if (kk === "mid") {
            // r6: the mid lid's lash bows DOWN over the eyeball (+3.5 px at the centre, 0 at the corners): r5's key was a
            // near-straight lash (judge: 'flat lids')
            const lx0 = E.e.lashX[0], lx1 = E.e.lashX[1], xc = (lx0 + lx1) / 2, hw = (lx1 - lx0) / 2;
            const r2 = Math.min(1, ((x - xc) / hw) ** 2), wy = smooth(M.rect[1], M.rect[1] + 60 * F.ke, M.rest[q * 2 + 1]);
            y += 3.5 * F.ke * (1 - r2) * wy;
          }
          if (wk > 0) {
            // a parabola about the lash centre: the middle rises, both ends (wing included) drop, so the painted U sag
            // (~22 px) inverts into an arch without lifting the key off the skin under it
            const lx0 = E.e.lashX[0], lx1 = E.e.lashX[1], xc = (lx0 + lx1) / 2, hw = (lx1 - lx0) / 2;
            const r2 = Math.min(1.25, ((x - xc) / hw) ** 2);
            const wy = 0.2 + 0.8 * smooth(M.rect[1], M.rect[1] + 70 * F.ke, M.rest[q * 2 + 1]);
            y += wk * (-15 + 36 * r2) * F.ke * wy;
          }
          const p = fixX(this.projectTo(x, y, M.z[q], this._tmp || (this._tmp = [0, 0])));
          M.pos[q * 2] = p[0];
          M.pos[q * 2 + 1] = p[1];
        }
        R.update(M.mesh, "aPos", M.pos);
        M.alpha.fill(a);
        R.update(M.mesh, "aA", M.alpha);
        R.drawLip(M.mesh, this.tex[`lid${kk}${sd}`], M.rect, shade);
      }
    }
  }

  drawMouth(shade) {
    const R = this.R, sol = this.solver, shell = this.shell;
    sol.farSign = Math.sign(this.st.yaw); sol.farAmt = smooth(4, 18, Math.abs(this.st.yaw));
    shell.update(sol);
    // shell vertices: rest + lip deformation + the face surface's offsets (cheeks, jaw), then the head projection
    const fo = this._fo || (this._fo = [0, 0]);
    for (const n of ["U", "L"]) {
      const sh = shell.sheets[n];
      if (!sh.FW) sh.FW = faceWArr(sh.rest, sh.C * sh.R);
      for (let q = 0; q < sh.C * sh.R; q++) {
        let x = sh.pos[q * 2], y = sh.pos[q * 2 + 1];
        const [dx, dy] = this.faceOffW(sh.FW, q, true, fo);
        const p = this.projectTo(x + dx, y + dy, sh.z[q], this._tmp || (this._tmp = [0, 0]), x + dx, sh.rest[q * 2 + 1]);
        sh.pos[q * 2] = p[0];
        sh.pos[q * 2 + 1] = p[1];
      }
    }
    // r6: the inner-edge AA row (row 1) sits a fixed 1.5 px from the edge (row 0) in y; where the projected lip edge runs
    // steep (the corners of an open D, compressed on a turn's far side) its perpendicular width fell under a pixel and
    // the lip / cavity border aliased into a stair. Push row 1 along the screen normal to keep >= 1.6 px.
    if (!(this.debug && this.debug.noPush)) for (const n of ["U", "L"]) {
      const sh = shell.sheets[n], R = sh.R, P = sh.pos, C = sh.C;
      for (let c = 0; c < C; c++) {
        const a0 = Math.max(0, c - 1) * R, a1 = Math.min(C - 1, c + 1) * R, q0 = c * R, q1 = q0 + 1;
        let tx = P[a1 * 2] - P[a0 * 2], ty = P[a1 * 2 + 1] - P[a0 * 2 + 1];
        const tl = Math.hypot(tx, ty);
        if (tl < 1e-3) continue;
        tx /= tl; ty /= tl;
        let nx = -ty, ny = tx;
        const vx = P[q1 * 2] - P[q0 * 2], vy = P[q1 * 2 + 1] - P[q0 * 2 + 1];
        let d = vx * nx + vy * ny;
        if (d < 0) { nx = -nx; ny = -ny; d = -d; }
        if (d < 1.6 && Math.hypot(vx, vy) > 0.05) { P[q1 * 2] += nx * (1.6 - d); P[q1 * 2 + 1] += ny * (1.6 - d); }
      }
    }
    const I = shell.inner;
    for (let i = 0; i < I.pos.length / 2; i++) {
      const x = I.pos[i * 2], y = I.pos[i * 2 + 1];
      const [dx, dy] = this.faceOffset(x, y, true);
      // the strip's rest point: its column on the rest lip line (the same point the shell's inner edge samples)
      const xr = shell.cols[i >> 1];
      // r8: depth at the strip's REST point (its column on the rest lip line), as the shell's sheets use their rest depth;
      // r7 sampled the displaced point, so under a head pitch (concern B: ~12 deg) a lowered lower lip and the strip under it
      // projected ~2 px apart and the face showed through as an orange band along the lower inner lip edge
      const p = this.projectTo(x + dx, y + dy, zFast(xr, lineYAt(xr)), this._tmp || (this._tmp = [0, 0]), x + dx, lineYAt(xr));
      I.proj[i * 2] = p[0];
      I.proj[i * 2 + 1] = p[1];
    }
    R.update(this.innerMesh, "aPos", I.proj);
    R.update(this.innerMesh, "aDT", I.dt);
    R.update(this.innerMesh, "aGap", I.gap);
    const p = sol.p;
    const teethH = (10 + 5 * p.tuck + 4.5 * p.sq) * F.mouth.k;   // r5: f/v shows the incisors' full length, their tips on the lower lip; r6: ch's two rows meet
    const ext = (2 + 9 * p.tuck) * F.mouth.k;   // = LipShell.update's strip extension below the lower inner edge
    if (p.g > 0.05 && !(this.debug && this.debug.noInner)) R.drawInner(this.innerMesh, this.tex.interior, [p.T, p.TL, teethH, sol.joy || 0], [p.th, p.tip, p.curl, p.dim], 1 - 0.5 * shade[3], 0, ext);
    for (const n of ["L", "U"]) {
      const sh = shell.sheets[n];
      if (n === "U" && p.tuck > 0.05 && p.g > 0.05) R.drawInner(this.innerMesh, this.tex.interior, [p.T, p.TL, teethH, 0.5], [p.th, p.tip, p.curl, 0], 1 - 0.5 * shade[3], 1, ext);
      R.update(this.shellMesh[n], "aPos", sh.pos);
      R.update(this.shellMesh[n], "aA", sh.alpha);
      R.update(this.shellMesh[n], "aL", sh.light);
      R.update(this.shellMesh[n], "aT", sh.tint);
      R.update(this.shellMesh[n], "aUv", sh.uv);
      if (!(this.debug && this.debug.noShell)) R.drawLip(this.shellMesh[n], this.tex.mouth_rest, this.g.rects.mouth_rest, shade, smooth(2, 8, p.g));
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
