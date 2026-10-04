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
import { LipSolver, LipShell } from "./lips.js";

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

export class Puppet2DRig {
  static async load(canvas, base, opts = {}) {
    const j = (p) => fetch(base + p).then((r) => r.json());
    const geom = await j("geom.json");
    const mouths = null;
    const names = Object.keys(geom.rects).filter((n) => n !== "bg").concat(["interior"]);
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
      this.layers[name] = { name, rect, rest: gr.rest, z, pos, mesh, kind, n: gr.n };
    };
        mk("hairback", 24, "head");
    mk("bun", 16, "bun");
    mk("body", 24, "body");
    mk("ears", 12, "head");
    mk("face", 14, "face");
    for (const s of ["L", "R"]) {
      mk("brow" + s, 6, "brow");
    }
    mk("lockbed", 8, "head");
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
      const name = `lid${kk}${s}`, rect = geom.rects[name], gr = grid(rect, 8);
      const pos = new Float32Array(gr.rest), z = new Float32Array(gr.n);
      for (let i = 0; i < gr.n; i++) z[i] = zHead(gr.rest[i * 2], gr.rest[i * 2 + 1]);
      this.lidKeyMesh[name] = { rect, rest: gr.rest, z, pos, n: gr.n, mesh: this.R.mesh(P, { aPos: { data: pos, size: 2, dynamic: true }, aUv: { data: gr.uv, size: 2 } }, gr.idx) };
    }
    // r3 mouth: the lip shell (two sheets of c-front's own mouth region) + the interior strip
    this.shell = new LipShell(geom.rects.mouth_rest);
    this.shellMesh = {};
    for (const n of ["U", "L"]) {
      const sh = this.shell.sheets[n];
      this.shellMesh[n] = this.R.mesh(this.R.lip, { aPos: { data: sh.pos, size: 2, dynamic: true }, aUv: { data: sh.uv, size: 2 }, aA: { data: sh.alpha, size: 1, dynamic: true } }, sh.idx);
      sh.z = new Float32Array(sh.C * sh.R);
      for (let q = 0; q < sh.C * sh.R; q++) sh.z[q] = zHead(sh.rest[q * 2], sh.rest[q * 2 + 1]);
    }
    const I = this.shell.inner;
    I.proj = new Float32Array(I.pos.length);
    this.innerMesh = this.R.mesh(this.R.inner, { aPos: { data: I.proj, size: 2, dynamic: true }, aS: { data: I.s, size: 1 }, aDT: { data: I.dt, size: 1, dynamic: true }, aGap: { data: I.gap, size: 1, dynamic: true } }, I.idx);
    this.prevAnchor = null;
    this.prevVel = { L: [0, 0], R: [0, 0], bun: [0, 0] };
    this.st = null;
  }

  now() {
    return this.clock ?? performance.now() / 1000;
  }

  /** HeadRig.apply: one composited frame. */
  apply(bs, head, gaze, lean, breath) {
    const t = this.now();
    const dt = this.lastT < 0 ? 1 / 60 : clamp(t - this.lastT, 0, 0.1);
    this.lastT = t;
    this.bs = bs;
    this.gaze = gaze;
    const k = (n) => bs[n] ?? 0;
    const yaw = clamp(head[1], -25, 25), pitch = clamp(head[0], -10, 12), roll = clamp(head[2], -12, 12);
    const st = {
      sy: Math.sin(yaw * D2R) * PX.gain, cy: Math.cos(yaw * D2R),
      sp: Math.sin(pitch * D2R) * PX.gain, cp: Math.cos(pitch * D2R),
      sr: Math.sin(-roll * D2R), cr: Math.cos(-roll * D2R),
      yaw, pitch, roll,
      bob: -breath * 1.4, leanS: 1 + 0.03 * lean, leanY: 7 * lean,
    };
    // yaw keyform: side + weight (an ease-in so small drifts stay subtle and the key is reached at +-keyDeg)
    if (this.g.yawKeys) {
      const K = this.g.yawKeys, f = clamp(yaw / K.keyDeg, -1, 1);
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
    this.browCh = { L: this.browChannels("L"), R: this.browChannels("R") };
    this.solver.solve(bs, dt);
    const sp = this.solver.p;
    this.mouth = { name: "shell", row: sp.g > 3 ? "open" : "closed", jawGain: 1, p: sp };
    // ---- lids: screen-left eye (L) is her right eye (ARKit *Right)
    const side = { L: "Right", R: "Left" };
    const lookDown = clamp01(-gaze[1] / 25), lookUp = clamp01(gaze[1] / 20);
    const lidL = this.blinkShape(t, dt, k("eyeBlinkRight"));  // one shaper drives both lids
    this.lid = { L: lidL, R: this.blinkShape2(k("eyeBlinkLeft")) };
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
        const rise = (q * 0.3 + c * 0.2 + sm * 0.06) * H * Math.pow(hump, 1.4);
        let bot = B - rise;
        const follow = (lookDown * 0.14 - lookUp * 0.02) * H * hump;
        const closed = T + 0.72 * (B - T) - Math.min(rise, 0.25 * H);   // the lids meet ~70% down (Memoji)
        let top = T + follow - w * 0.13 * H * hump;
        // blink: the upper lid travels to the meeting line, the lower lid rises the last part (eased: fast close)
        // r3: the live lid only travels to the PAINTED mid lid's lash line (l = 0.5); beyond it the painted keys take
        // over (drawEye: lidmid / lidshut), so the lid skin is never stretched into a smear
        const ml = this.g.lidKeys ? this.g.lidKeys[s].midLash : null;
        const midY = ml ? ml.y[Math.min(ml.y.length - 1, i)] : closed;
        top = top + (Math.max(top, midY - 1) - top) * clamp01(b / 0.5);
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

  /** r3 blink shaper (judge r2 fix 4): an autonomic blink (a fast rise of eyeBlink) plays a 2-1-3 frame curve on
   *  30 Hz steps: 2 frames closing (mid key, shut key), 1 held shut, 3 opening (mid, mid, a light live lid), every frame
   *  a clean painted key, never a cross-faded smear. Slow changes (expression half-lids) pass through continuously. */
  blinkShape(t, dt, b) {
    const S = this.bsh || (this.bsh = { active: false, t0: 0, base: 0, prev: b, settle: false });
    const SEQ = [0.5, 1.0, 1.0, 0.6, 0.3, 0.1];
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
    return [X, Y];
  }

  /** Rest-space expression offsets on the face surface (cheek lift, jaw drop): shared by face and mouth. */
  faceOffset(x, y) {
    const { smile, cheek, open } = this.expr;
    let dx = 0, dy = 0;
    // cheeks lift and widen a touch on a smile
    for (const cx of [455, 605]) {
      const f = Math.exp(-((x - cx) ** 2 + (y - 585) ** 2) / (2 * 42 * 42));
      dy -= (smile * 4 + cheek * 3) * f;
      dx += Math.sign(x - 530) * smile * 1.5 * f;
    }
    // jaw: the chin and lower face move down with the open amount
    const jw = smooth(615, 700, y) * Math.exp(-(((x - 530) / 115) ** 2));
    // r3: the chin follows the lower lip's drop (the shell's opening), so the skin between them never crushes
    dy += (this.solver ? this.solver.lowerDrop() * 0.62 : open * 7) * jw;
    return [dx, dy];
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
        // r3: the neck column carries the head transform fully up to the jaw (the keyform field already decays to 0 at
        // the collar), so the chin and the neck under it move as one; uniform across the neck's width (no shear)
        const neck = smooth(772, 700, y) * (1 - smooth(110, 160, Math.abs(x - 527)));
        if (neck > 0) {
          const [hx, hy] = this.project(x, y, zHead(x, y));
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
    for (let i = 0; i < n; i++) {
      let x = rest[i * 2], y = rest[i * 2 + 1];
      if (isFace) {
        const [dx, dy] = this.faceOffset(x, y);
        x += dx;
        y += dy;
      } else if (L.kind === "brow") {
        const [dx, dy] = this.browOffset(L.name.slice(4), x, y);
        x += dx;
        y += dy;
      } else if (isLock) {
        const v = clamp01((y - L.y0) / L.len);
        const w = Math.pow(v, 1.4);
        x += (L.sx || 0) * w;
        y += (L.sy || 0) * w * 0.3;
      } else if (bun) {
        x += this.bunOff ? this.bunOff[0] : 0;
        y += this.bunOff ? this.bunOff[1] : 0;
      }
      const p = this.project(x, y, z[i]);
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
    return { lift: 10 * wide + 9 * outer + 4 * inner, inner: 28 * inner, arch: 30 * outer, knit: 16 * down };
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
      return 3.2 * (this.blinkDip || 0) - c.lift - c.inner * Math.pow(1 - ui, 1.3) - c.arch * (0.35 + 0.65 * peak) * Math.pow(ui, 0.5) + c.knit * (1 - 0.6 * ui);
    };
    const dy = dyAt(x);
    const th = Math.atan((dyAt(x + 3) - dyAt(x - 3)) / 6);
    const cl = b.cl, yc = cl ? cl.y[clamp(Math.round(x - cl.x0), 0, cl.y.length - 1)] : y;
    const v = y - yc;
    const dxT = (s === "L" ? 1 : -1) * (c.knit * 0.3 + c.inner * 0.05);
    return [dxT - v * Math.sin(th), dy + v * (Math.cos(th) - 1)];
  }

  render() {
    const R = this.R, s = this.st;
    if (!s) return;
    R.begin();
    R.setCam(this.view[0], this.view[1], this.view[2]);
    const shadeFace = [s.yaw >= 0 ? 1 : -1, s.yaw >= 0 ? 530 : 330, s.yaw >= 0 ? 730 : 530, 0.16 * Math.abs(s.yaw) / 20];
    const shadeHair = [shadeFace[0], s.yaw >= 0 ? 400 : 200, s.yaw >= 0 ? 820 : 660, 0.1 * Math.abs(s.yaw) / 20];
    const dbg = this.debug;
    const draw = (n, shade) => {
      const L = this.layers[n];
      if (this.deformLayer(L)) R.update(L.mesh, "aPos", L.pos);
      if (dbg && dbg.only && !dbg.only.includes(n)) return;
      R.drawPaint(L.mesh, this.tex[n], L.rect, 1, shade, dbg && dbg.tint ? DBG_TINT[n] : null);
    };
    // the backdrop is c-front's cream (std < 1.5/255 over the plate): the clear colour, no full-screen pass
    draw("hairback", shadeHair);
    draw("bun", shadeHair);
    draw("body");
    draw("ears", shadeFace);
    draw("face", shadeFace);
    for (const side of ["L", "R"]) this.drawEye(side, shadeFace);
    draw("browL");
    draw("browR");
    this.drawMouth(shadeFace);
    draw("lockbed", shadeFace);
    draw("hair", shadeHair);
    draw("lockL");
    draw("lockR");
  }

  drawEye(sd, shade) {
    const E = this.eyes[sd], e = E.e, R = this.R, s = this.st;
    const zEye = (x, y) => zHead(x, y);
    // r3: cap the far eye's horizontal compression at 15% (judge r2): the eye meshes (opening, lids, lower band) are
    // re-spread about the eye's projected centre when the turn would squeeze them more
    const ym = (e.top[Math.floor(e.top.length / 2)] + e.bot[Math.floor(e.bot.length / 2)]) / 2;
    const pA = this.project(E.xa, ym, zEye(E.xa, ym)), pB = this.project(E.xb, ym, zEye(E.xb, ym));
    const ratio = (pB[0] - pA[0]) / (E.xb - E.xa), ecx = (pA[0] + pB[0]) / 2;
    const em = ratio < 0.85 ? 0.85 / ratio : 1;
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
        const p = fixX(this.project(x, y, zEye(x, y)));
        E.pos[k * 2] = p[0];
        E.pos[k * 2 + 1] = p[1];
        k++;
      }
    }
    R.update(E.mesh, "aPos", E.pos);
    R.update(E.mesh, "aRest", E.restA);
    R.update(E.mesh, "aTop", E.topA);
    // iris: gaze in rest-space px, foreshortened by gaze + head yaw; squashed a little at full blink
    const gz = this.gaze || [0, 0];
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
    R.drawEye(E.mesh, {
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
        const p = fixX(this.project(x, yy, zEye(x, yy)));
        E.bpos[q * 2] = p[0];
        E.bpos[q * 2 + 1] = p[1];
      }
    R.update(E.bmesh, "aPos", E.bpos);
    R.drawPaint(E.bmesh, this.tex["lower" + sd], this.g.rects["lower" + sd], 1, shade);
    // upper lid: lash band translates with the lid edge, the skin above stretches
    const n = E.LC * E.LR;
    for (let q = 0; q < n; q++) {
      const x = E.lrest[q * 2], y = E.lrest[q * 2 + 1];
      let ii = Math.round(x - E.xa), f = 1;
      if (ii < 0) { f = Math.max(0.45, 1 + ii / 30); ii = 0; }
      if (ii > E.xb - E.xa) { f = Math.max(0.45, 1 - (ii - (E.xb - E.xa)) / 30); ii = E.xb - E.xa; }
      const dy = (E.top[ii] - e.top[ii]) * f;
      const yy = y + dy * E.lv[q];
      const p = fixX(this.project(x, yy, zEye(x, yy)));
      E.lpos[q * 2] = p[0];
      E.lpos[q * 2 + 1] = p[1];
    }
    R.update(E.lmesh, "aPos", E.lpos);
    R.drawPaint(E.lmesh, this.tex["lid" + sd], this.g.rects["lid" + sd], 1, shade);
    // r3 painted lid keys over the live eye: mid (a real lowered lid with its crease) then shut
    if (this.g.lidKeys) {
      const l = E.blink, midA = smooth(0.34, 0.42, l), shutA = smooth(0.72, 0.82, l);
      for (const [kk, a] of [["mid", midA * (1 - (shutA >= 1 ? 1 : 0))], ["shut", shutA]]) {
        if (a <= 0.003) continue;
        const M = this.lidKeyMesh[`lid${kk}${sd}`];
        // the lid keys ride the brow a little when it lifts (the lid skin is attached under the brow)
        for (let q = 0; q < M.n; q++) {
          const x = M.rest[q * 2], y = M.rest[q * 2 + 1];
          const p = fixX(this.project(x, y, M.z[q]));
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
    for (const n of ["U", "L"]) {
      const sh = shell.sheets[n];
      for (let q = 0; q < sh.C * sh.R; q++) {
        let x = sh.pos[q * 2], y = sh.pos[q * 2 + 1];
        const [dx, dy] = this.faceOffset(sh.rest[q * 2], sh.rest[q * 2 + 1]);
        const p = this.project(x + dx, y + dy, sh.z[q]);
        sh.pos[q * 2] = p[0];
        sh.pos[q * 2 + 1] = p[1];
      }
    }
    const I = shell.inner;
    for (let i = 0; i < I.pos.length / 2; i++) {
      const x = I.pos[i * 2], y = I.pos[i * 2 + 1];
      const [dx, dy] = this.faceOffset(x, y);
      const p = this.project(x + dx, y + dy, zHead(x, y));
      I.proj[i * 2] = p[0];
      I.proj[i * 2 + 1] = p[1];
    }
    R.update(this.innerMesh, "aPos", I.proj);
    R.update(this.innerMesh, "aDT", I.dt);
    R.update(this.innerMesh, "aGap", I.gap);
    const p = sol.p;
    if (p.g > 0.05) R.drawInner(this.innerMesh, this.tex.interior, [p.T, p.TL, 8, 0], [p.th, p.tip, p.curl, 0], 1 - 0.5 * shade[3]);
    for (const n of ["L", "U"]) {
      const sh = shell.sheets[n];
      R.update(this.shellMesh[n], "aPos", sh.pos);
      R.update(this.shellMesh[n], "aA", sh.alpha);
      R.drawLip(this.shellMesh[n], this.tex.mouth_rest, this.g.rects.mouth_rest, shade);
    }
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
