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
import { MouthSolver } from "./mouth.js";

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const clamp01 = (x) => clamp(x, 0, 1);
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const D2R = Math.PI / 180;

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
    const [geom, mouths] = await Promise.all([j("geom.json"), j("mouths.json")]);
    const names = Object.keys(geom.rects).concat(["mouths"]);
    const imgs = {};
    await Promise.all(names.map(async (n) => {
      const im = new Image();
      im.src = `${base}${n}.png`;
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
    for (const [n, im] of Object.entries(imgs)) this.tex[n] = this.R.texture(im);
    this.solver = new MouthSolver(Object.keys(mouths.patches));
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
      const pos = new Float32Array(n * 2), restA = new Float32Array(n * 2), edge = new Float32Array(n);
      for (let i = 0; i < C; i++) for (let j = 0; j < R; j++) edge[i * R + j] = j === 0 || j === R - 1 ? 0 : 1;
      const mesh = this.R.mesh(this.R.eye, { aPos: { data: pos, size: 2, dynamic: true }, aRest: { data: restA, size: 2, dynamic: true }, aEdge: { data: edge, size: 1 } }, strip(C, R));
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
      this.eyes[s] = { e, xa, xb, C, R, pos, restA, mesh, LC, LR, lrest, lpos, lv, lmesh, BC, BR, brest, bpos, bv, bmesh, top: new Float32Array(xb - xa + 1), bot: new Float32Array(xb - xa + 1) };
    }
    // mouth patches: one mesh per patch (same rest geometry, own atlas uvs)
    const [cw, ch] = mouths.cell, [ox, oy] = mouths.origin;
    this.mouthRect = [ox, oy, ox + cw, oy + ch];
    const mg = grid(this.mouthRect, 14);
    this.mouthRest = mg.rest;
    this.mouthPos = new Float32Array(mg.rest);
    this.mouthZ = new Float32Array(mg.n);
    for (let i = 0; i < mg.n; i++) this.mouthZ[i] = zHead(mg.rest[i * 2], mg.rest[i * 2 + 1]);
    const aw = imgs.mouths.width, ah = imgs.mouths.height;
    this.mouthMesh = {};
    for (const [n, p] of Object.entries(mouths.patches)) {
      const uv = new Float32Array(mg.n * 2);
      for (let i = 0; i < mg.n; i++) {
        uv[i * 2] = (p.cell[0] + mg.uv[i * 2] * cw) / aw;
        uv[i * 2 + 1] = (p.cell[1] + mg.uv[i * 2 + 1] * ch) / ah;
      }
      this.mouthMesh[n] = this.R.mesh(P, { aPos: { data: this.mouthPos, size: 2, dynamic: true }, aUv: { data: uv, size: 2 } }, mg.idx);
    }
    this.mouthN = mg.n;
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
    const yaw = clamp(head[1], -20, 20), pitch = clamp(head[0], -10, 12), roll = clamp(head[2], -12, 12);
    const st = {
      sy: Math.sin(yaw * D2R) * PX.gain, cy: Math.cos(yaw * D2R),
      sp: Math.sin(pitch * D2R) * PX.gain, cp: Math.cos(pitch * D2R),
      sr: Math.sin(-roll * D2R), cr: Math.cos(-roll * D2R),
      yaw, pitch, roll,
      bob: -breath * 1.4, leanS: 1 + 0.03 * lean, leanY: 7 * lean,
    };
    this.st = st;
    // ---- expression state
    const smile = (k("mouthSmileLeft") + k("mouthSmileRight")) / 2;
    const cheek = (k("cheekSquintLeft") + k("cheekSquintRight")) / 2;
    const open = clamp01(k("jawOpen") / 0.85);
    this.expr = { smile, cheek, open };
    this.mouth = this.solver.solve(bs, dt);
    // ---- lids: screen-left eye (L) is her right eye (ARKit *Right)
    const side = { L: "Right", R: "Left" };
    const lookDown = clamp01(-gaze[1] / 25), lookUp = clamp01(gaze[1] / 20);
    for (const s of ["L", "R"]) {
      const E = this.eyes[s], e = E.e, sfx = side[s];
      const b = k("eyeBlink" + sfx), q = k("eyeSquint" + sfx), w = k("eyeWide" + sfx), c = k("cheekSquint" + sfx);
      const sm = k("mouthSmile" + sfx);
      for (let i = 0; i <= E.xb - E.xa; i++) {
        const T = e.top[i], B = e.bot[i], H = B - T;
        const u = i / (E.xb - E.xa);
        const hump = Math.pow(Math.max(0, Math.sin(Math.PI * u)), 0.7);
        const rise = (q * 0.34 + c * 0.26 + sm * 0.08) * H * hump;
        let bot = B - rise;
        const follow = (lookDown * 0.14 - lookUp * 0.06) * H * hump;
        const closed = T + 0.72 * (B - T) - Math.min(rise, 0.25 * H);   // the lids meet ~70% down (Memoji)
        let top = T + follow - w * 0.13 * H * hump;
        // blink: the upper lid travels to the meeting line, the lower lid rises the last part (eased: fast close)
        const bb = b * b * (3 - 2 * b);
        top = top + (closed - top) * bb;
        bot = bot + (closed - bot) * Math.max(0, (bb - 0.35) / 0.65);
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

  /** The head transform: rest (x, y) with depth z -> screen-space rest coordinates. */
  project(x, y, z) {
    const s = this.st;
    const dx = x - PX.cx, dy = y - PX.cy;
    const x1 = dx * s.cy + z * s.sy;
    const z1 = -dx * Math.sin(s.yaw * D2R) + z * s.cy;
    const y1 = dy * s.cp + z1 * s.sp;
    let X = PX.cx + x1, Y = PX.cy + y1;
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
    dy += open * 7 * jw * (this.mouth ? this.mouth.jawGain : 1);
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
        const neck = smooth(752, 655, y) * Math.exp(-(((x - 530) / 125) ** 2));
        if (neck > 0) {
          const [hx, hy] = this.project(x, y, zHead(x, y));
          X += (hx - x) * 0.55 * neck;
          Y += (hy - y) * 0.55 * neck;
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

  browOffset(s, x, y) {
    const bs = this.bs;
    const sfx = s === "L" ? "Right" : "Left";
    const b = this.g.brows[s];
    const x0 = b.x[0], x1 = b.x[1];
    // inner end is toward the nose: L brow's inner end is its right end
    const ui = s === "L" ? clamp01((x1 - x) / (x1 - x0)) : clamp01((x - x0) / (x1 - x0));
    const inner = bs.browInnerUp ?? 0, outer = bs["browOuterUp" + sfx] ?? 0, down = bs["browDown" + sfx] ?? 0, wide = bs["eyeWide" + sfx] ?? 0;
    let dy = -(inner * 22 * Math.pow(1 - ui, 1.4) + inner * 5 * Math.sin(Math.PI * ui) + outer * 17 * Math.pow(ui, 0.9) + wide * 6) + down * 9 * (1 - 0.5 * ui);
    const dx = (s === "L" ? 1 : -1) * down * 4 * (1 - ui);
    return [dx, dy];
  }

  render() {
    const R = this.R, s = this.st;
    if (!s) return;
    R.begin();
    R.setCam(this.view[0], this.view[1], this.view[2]);
    const shadeFace = [s.yaw >= 0 ? 1 : -1, s.yaw >= 0 ? 530 : 330, s.yaw >= 0 ? 730 : 530, 0.16 * Math.abs(s.yaw) / 20];
    const shadeHair = [shadeFace[0], s.yaw >= 0 ? 400 : 200, s.yaw >= 0 ? 820 : 660, 0.1 * Math.abs(s.yaw) / 20];
    const draw = (n, shade) => {
      const L = this.layers[n];
      if (this.deformLayer(L)) R.update(L.mesh, "aPos", L.pos);
      R.drawPaint(L.mesh, this.tex[n], L.rect, 1, shade);
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
    // opening strip
    let k = 0;
    for (let i = 0; i < E.C; i++) {
      const x = Math.min(E.xb, E.xa + i * 2), ii = x - E.xa;
      const top = E.top[ii], bot = E.bot[ii];
      const ys = [top - 0.6, top + 1.4, Math.max(top + 1.4, bot - 0.6), Math.max(top + 1.4, bot + 1.4)];
      for (let j = 0; j < 4; j++) {
        const y = bot <= top + 0.05 ? top : ys[j];
        E.restA[k * 2] = x;
        E.restA[k * 2 + 1] = y;
        const p = this.project(x, y, zEye(x, y));
        E.pos[k * 2] = p[0];
        E.pos[k * 2 + 1] = p[1];
        k++;
      }
    }
    R.update(E.mesh, "aPos", E.pos);
    R.update(E.mesh, "aRest", E.restA);
    // iris: gaze in rest-space px, foreshortened by gaze + head yaw; squashed a little at full blink
    const gz = this.gaze || [0, 0];
    const ox = (gz[0] / 25) * 17, oy = -(gz[1] / 20) * 8 + (gz[1] < 0 ? -gz[1] / 25 * 2 : 0);
    const fx = Math.cos((gz[0] + 0.2 * s.yaw) * D2R * 1.2);
    const [icx, icy] = e.iris;
    R.drawEye(E.mesh, {
      sclera: { tex: this.tex["sclera" + sd], rect: this.g.rects["sclera" + sd] },
      iris: { tex: this.tex["iris" + sd], rect: this.g.rects["iris" + sd] },
      catch: { tex: this.tex["catch" + sd], rect: this.g.rects["catch" + sd] },
      irisOff: [ox, oy], irisC: [icx + ox, icy + oy], irisScale: [Math.max(0.82, fx), E.blink > 0.85 ? 0.95 : 1],
      catchOff: [ox * 0.45, oy * 0.45], catchA: 1, lidShade: 0.06, topY: interp(E.xa, E.top, icx),
    });
    // lower lid band
    for (let i = 0; i < E.BC; i++)
      for (let j = 0; j < E.BR; j++) {
        const q = i * E.BR + j;
        const x = E.brest[q * 2], y = E.brest[q * 2 + 1];
        const ii = Math.round(x - E.xa);
        const rise = e.bot[clamp(ii, 0, e.bot.length - 1)] - E.bot[clamp(ii, 0, E.bot.length - 1)];
        const yy = y - rise * (1 - 0.75 * E.bv[q]);
        const p = this.project(x, yy, zEye(x, yy));
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
      const p = this.project(x, yy, zEye(x, yy));
      E.lpos[q * 2] = p[0];
      E.lpos[q * 2 + 1] = p[1];
    }
    R.update(E.lmesh, "aPos", E.lpos);
    R.drawPaint(E.lmesh, this.tex["lid" + sd], this.g.rects["lid" + sd], 1, shade);
  }

  drawMouth(shade) {
    const m = this.mouth, R = this.R;
    const rest = this.mouthRest, pos = this.mouthPos;
    for (let i = 0; i < this.mouthN; i++) {
      let x = rest[i * 2], y = rest[i * 2 + 1];
      const [dx, dy] = this.faceOffset(x, y);
      x += dx;
      y += dy;
      // lattice between swaps: continuous width / roundness / skew around the mouth centre
      const cx = 530, cy = 628;
      const bell = Math.exp(-(((y - cy) / 50) ** 2));
      // talking mouths read a touch bigger (c-talking): scale about the mouth centre with the open amount
      const sc = 1 + 0.1 * this.expr.open;
      x = cx + (x - cx) * sc;
      y = cy + (y - cy) * sc;
      x += (x - cx) * (m.wide * 0.05 - m.round * 0.04) * bell + m.skew * 6 * bell * Math.exp(-(((x - cx) / 90) ** 2));
      y += m.lowerDrop * smooth(cy - 5, cy + 40, y) * Math.exp(-(((x - cx) / 90) ** 2));
      const p = this.project(x, y, this.mouthZ[i]);
      pos[i * 2] = p[0];
      pos[i * 2 + 1] = p[1];
    }
    // shared position buffer: upload into the meshes that draw this frame
    for (const [n, a] of m.draw) {
      R.update(this.mouthMesh[n], "aPos", pos);
      R.drawPaint(this.mouthMesh[n], this.tex.mouths, this.mouthRect, a, shade);
    }
  }

  resetPhysics() {
    for (const s of ["L", "R"]) {
      const L = this.layers["lock" + s];
      L.spring.x = L.spring.v = L.springY.x = L.springY.v = 0;
    }
    for (const sp of this.bunSpring) sp.x = sp.v = 0;
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
