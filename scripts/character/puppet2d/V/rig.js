// Arm V runtime: a small WebGL2 renderer for character C as parametric vector layers.
//
//   const rig = new PuppetV(canvas, window.PUPPET_V, FEATURES);
//   rig.apply(bs, head, gaze, lean, breath);   // the HeadRig signature, unchanged (PLAN §7)
//   rig.render(dtSeconds);
//
// Static regions (hair, face, ears, neck, kurta, piping, locks) come from build.py as gradient meshes with a 2.5D
// depth per vertex; ONE vertex shader projects them (yaw/pitch about the head pivot, roll about the neck, jaw/cheek
// lattice weights, lock sway). The features (eyes, lids, lashes, brows, lips, teeth, tongue, bindi, studs) are
// parametric shapes rebuilt every frame on the CPU from the HeadRig weights and drawn through the SAME shader, so
// they turn with the head. Eyes and mouth are stencil-clipped (sclera ref 1/2, mouth interior ref 3).
// Zero dependencies. No images.
import { mouthState } from "./mouth.js";

const VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aP;
layout(location=1) in vec4 aC;
layout(location=2) in vec4 aW;
uniform mat3 uPost;
uniform vec3 uRot;     // pitch, yaw (rad), perspective k
uniform vec2 uPivot;
uniform float uJaw;
uniform vec2 uCheekL;
uniform vec2 uCheekR;
uniform vec3 uSway;    // x, y (px at weight 1), exponent
uniform vec2 uView;    // 2 / canvas size in 1024 units
out vec4 vC;
void main(){
  vec2 p = aP.xy;
  p.y += uJaw * aW.x;
  p += uCheekL * aW.y + uCheekR * aW.z;
  p += uSway.xy * pow(max(aW.w, 0.0), uSway.z);
  vec3 q = vec3(p - uPivot, aP.z);
  float cy = cos(uRot.y), sy = sin(uRot.y);
  q = vec3(q.x * cy + q.z * sy, q.y, -q.x * sy + q.z * cy);
  float cp = cos(uRot.x), sp = sin(uRot.x);
  q = vec3(q.x, q.y * cp + q.z * sp, -q.y * sp + q.z * cp);
  float s = 1.0 + uRot.z * (q.z - aP.z);
  vec2 r = q.xy * s + uPivot;
  vec3 w = uPost * vec3(r, 1.0);
  gl_Position = vec4(w.x * uView.x - 1.0, 1.0 - w.y * uView.y, 0.0, 1.0);
  vC = aC;
}`;
const FS = `#version 300 es
precision mediump float;
in vec4 vC;
out vec4 o;
void main(){ o = vec4(vC.rgb * vC.a, vC.a); }`;

const STRIDE = 11; // x y z r g b a w0 w1 w2 w3
const DEG = Math.PI / 180;
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const c01 = (x) => clamp(x, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

// ------------------------------------------------------------------ curve helpers
function catmull(pts, closed = false, per = 8) {
  const out = [];
  const n = pts.length;
  const get = (i) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  if (!closed) out.push(pts[n - 1].slice());
  return out;
}
/** Resample a polyline to n points evenly by arc length. */
function resample(pl, n) {
  const L = [0];
  for (let i = 1; i < pl.length; i++) L.push(L[i - 1] + Math.hypot(pl[i][0] - pl[i - 1][0], pl[i][1] - pl[i - 1][1]));
  const tot = L[L.length - 1], out = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const d = (tot * i) / (n - 1);
    while (j < L.length - 2 && L[j + 1] < d) j++;
    const t = (d - L[j]) / Math.max(1e-6, L[j + 1] - L[j]);
    out.push([lerp(pl[j][0], pl[j + 1][0], t), lerp(pl[j][1], pl[j + 1][1], t)]);
  }
  return out;
}
function normals(pl) {
  const n = pl.length, out = [];
  for (let i = 0; i < n; i++) {
    const a = pl[Math.max(0, i - 1)], b = pl[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    out.push([-dy / l, dx / l]);
  }
  return out;
}

// ------------------------------------------------------------------ dynamic geometry batch
class Batch {
  constructor(cap) {
    this.buf = new ArrayBuffer(cap * 16);
    this.f = new Float32Array(this.buf);
    this.u8 = new Uint8Array(this.buf);
    this.cap = cap;
    this.n = 0;
    this.items = [];
    this.zAt = null;
  }
  reset() { this.n = 0; this.items.length = 0; }
  begin(mode = 0, ref = 0) { this.items.push({ start: this.n, count: 0, mode, ref }); }
  end() { const it = this.items[this.items.length - 1]; it.count = this.n - it.start; }
  v(x, y, c, a = 1, zoff = 0) {
    if (this.n >= this.cap) return;
    const o = this.n * 4, f = this.f, u = this.u8, ob = o * 4 + 12;
    f[o] = x; f[o + 1] = y; f[o + 2] = this.zAt(x, y) + zoff;
    const al = (c.length > 3 ? c[3] : 1) * a;
    u[ob] = c[0]; u[ob + 1] = c[1]; u[ob + 2] = c[2]; u[ob + 3] = al <= 0 ? 0 : al >= 1 ? 255 : al * 255;
    this.n++;
  }
  tri(a, b, c, ca, cb, cc, z = 0) {
    this.v(a[0], a[1], ca, 1, z); this.v(b[0], b[1], cb, 1, z); this.v(c[0], c[1], cc, 1, z);
  }
  /** Strip between rows of points (rows[k][i]); cols[k] is a colour or a function (i, n) -> colour. */
  rows(rows, cols, z = 0) {
    const n = rows[0].length, R = rows.length;
    // resolve every row's colours once (a colour or a per-index function)
    const CC = this._cc || (this._cc = []);
    for (let k = 0; k < R; k++) {
      const c = cols[k];
      let a = CC[k];
      if (!a || a.length < n) a = CC[k] = new Array(Math.max(n, 64));
      if (typeof c === "function") for (let i = 0; i < n; i++) a[i] = c(i, n);
      else for (let i = 0; i < n; i++) a[i] = c;
    }
    for (let k = 0; k < R - 1; k++) {
      const A = rows[k], Bq = rows[k + 1], ca = CC[k], cb = CC[k + 1];
      for (let i = 0; i < n - 1; i++) {
        this.v(A[i][0], A[i][1], ca[i], 1, z); this.v(A[i + 1][0], A[i + 1][1], ca[i + 1], 1, z); this.v(Bq[i][0], Bq[i][1], cb[i], 1, z);
        this.v(A[i + 1][0], A[i + 1][1], ca[i + 1], 1, z); this.v(Bq[i + 1][0], Bq[i + 1][1], cb[i + 1], 1, z); this.v(Bq[i][0], Bq[i][1], cb[i], 1, z);
      }
    }
  }
  fan(c, ring, cc, cr, z = 0) {
    for (let i = 0; i < ring.length; i++) {
      const j = (i + 1) % ring.length;
      this.tri(c, ring[i], ring[j], cc, colAt(cr, i, ring.length), colAt(cr, j, ring.length), z);
    }
  }
  /** Concentric rings around a centre: radii[k] with colours cols[k] (colour or fn(angle)). */
  disc(cx, cy, rx, ry, radii, cols, seg = 36, z = 0, rot = 0) {
    const U = (this._unit || (this._unit = {}))[seg] || (this._unit[seg] = Array.from({ length: seg + 1 }, (_, i) => [Math.cos((i / seg) * Math.PI * 2), Math.sin((i / seg) * Math.PI * 2)]));
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const R = radii.map((r) => U.map(([ca, sa]) => { const x = ca * rx * r, y = sa * ry * r; return [cx + x * cr - y * sr, cy + x * sr + y * cr]; }));
    const C = cols.map((c) => (typeof c === "function" ? (i, n) => c((i / (n - 1)) * Math.PI * 2) : c));
    this.rows(R, C, z);
  }
  /** Ribbon along a centre line with half-widths; optional feather (px) to alpha 0 on both sides. */
  ribbon(pl, half, col, feather = 1, z = 0, colB = null) {
    const N = normals(pl), n = pl.length;
    const L = [], R = [], Lf = [], Rf = [];
    for (let i = 0; i < n; i++) {
      const h = typeof half === "function" ? half(i / (n - 1)) : half[i] ?? half;
      L.push([pl[i][0] + N[i][0] * h, pl[i][1] + N[i][1] * h]);
      R.push([pl[i][0] - N[i][0] * h, pl[i][1] - N[i][1] * h]);
      Lf.push([pl[i][0] + N[i][0] * (h + feather), pl[i][1] + N[i][1] * (h + feather)]);
      Rf.push([pl[i][0] - N[i][0] * (h + feather), pl[i][1] - N[i][1] * (h + feather)]);
    }
    const cA = colB || col;
    const t0 = [...col.slice(0, 3), 0], t1 = [...cA.slice(0, 3), 0];
    this.rows([Lf, L, R, Rf], [t0, col, cA, t1], z);
  }
}
function colAt(c, i, n) { return typeof c === "function" ? c(i, n) : c; }
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3] ?? 1, b[3] ?? 1, t)];
const alpha = (c, a) => [c[0], c[1], c[2], (c[3] ?? 1) * a];
const scale = (c, k) => [c[0] * k, c[1] * k, c[2] * k, c[3] ?? 1];

// ------------------------------------------------------------------ the rig
export class PuppetV {
  constructor(canvas, data, feat, opts = {}) {
    this.canvas = canvas;
    this.data = data;
    this.F = feat;
    this.opts = opts;
    const gl = canvas.getContext("webgl2", { antialias: true, stencil: true, alpha: false, premultipliedAlpha: true, preserveDrawingBuffer: !!opts.preserve, powerPreference: "high-performance" });
    if (!gl) throw new Error("webgl2 unavailable");
    this.gl = gl;
    this.prog = this._program(VS, FS);
    this.U = {};
    for (const u of ["uPost", "uRot", "uPivot", "uJaw", "uCheekL", "uCheekR", "uSway", "uView"]) this.U[u] = gl.getUniformLocation(this.prog, u);
    // depth grid for features
    const zg = data.zgrid, ZN = zg.n, Z = new Float32Array(zg.data);
    this.zAt = (x, y) => {
      const gx = clamp((x / data.W) * ZN - 0.5, 0, ZN - 1.001), gy = clamp((y / data.H) * ZN - 0.5, 0, ZN - 1.001);
      const ix = gx | 0, iy = gy | 0, fx = gx - ix, fy = gy - iy;
      const a = Z[iy * ZN + ix], b = Z[iy * ZN + ix + 1], c = Z[(iy + 1) * ZN + ix], d = Z[(iy + 1) * ZN + ix + 1];
      return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
    };
    this.regions = {};
    let tris = 0;
    for (const r of data.regions) {
      const nv = r.z.length, f = new Float32Array(nv * STRIDE);
      for (let i = 0; i < nv; i++) {
        const o = i * STRIDE;
        f[o] = r.p[2 * i]; f[o + 1] = r.p[2 * i + 1]; f[o + 2] = r.z[i];
        f[o + 3] = r.c[4 * i] / 255; f[o + 4] = r.c[4 * i + 1] / 255; f[o + 5] = r.c[4 * i + 2] / 255; f[o + 6] = r.c[4 * i + 3] / 255;
        f[o + 7] = r.w[4 * i]; f[o + 8] = r.w[4 * i + 1]; f[o + 9] = r.w[4 * i + 2]; f[o + 10] = r.w[4 * i + 3];
      }
      const idx = nv > 65535 ? new Uint32Array(r.t) : new Uint16Array(r.t);
      this.regions[r.id] = { ...this._vao(f, idx), group: r.group, count: r.t.length, type: nv > 65535 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT };
      tris += r.t.length / 3;
    }
    this.staticTris = tris;
    this.batch = new Batch(60000);
    this.batch.zAt = this.zAt;
    {
      const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
      const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
      gl.bufferData(gl.ARRAY_BUFFER, this.batch.buf.byteLength, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.UNSIGNED_BYTE, true, 16, 12);
      gl.disableVertexAttribArray(2); gl.vertexAttrib4f(2, 0, 0, 0, 0);
      gl.bindVertexArray(null);
      this.dyn = { vao, vb };
    }
    this.state = { bs: {}, head: [0, 0, 0], gaze: [0, 0], lean: 0, breath: 0 };
    this.phys = { lockL: { x: 0, v: 0, y: 0, vy: 0 }, lockR: { x: 0, v: 0, y: 0, vy: 0 }, bun: { x: 0, v: 0, y: 0, vy: 0 }, prevYaw: 0, prevRoll: 0, prevPitch: 0, t: 0 };
    this._prepFeatures();
    this.lastDraws = 0;
    this.lastDynTris = 0;
  }

  _program(vs, fs) {
    const gl = this.gl;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  _vao(f, idx, dynamic = false) {
    const gl = this.gl;
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, dynamic ? f.byteLength : f, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
    const B = STRIDE * 4;
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, B, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, B, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, B, 28);
    let ib = null;
    if (idx) { ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW); }
    gl.bindVertexArray(null);
    return { vao, vb, ib };
  }

  _prepFeatures() {
    const F = this.F;
    this.eyes = {};
    const NE = 20;
    for (const side of ["SL", "SR"]) {
      const e = F.eyes[side];
      const U0 = resample(catmull([e.inner, ...e.up, e.outer]), NE);
      const L0 = resample(catmull([e.inner, ...e.lo, e.outer]), NE);
      const T = resample(catmull(e.lashTop), NE);
      // lash offsets relative to the lid edge at matching arc fraction (they ride the lid when it moves)
      const off = U0.map((p, i) => [T[i][0] - p[0], T[i][1] - p[1]]);
      const h = L0.map((p, i) => p[1] - U0[i][1]);
      const fl = e.flick.map((p) => [p[0] - e.outer[0], p[1] - e.outer[1]]);
      this.eyes[side] = { e, U0, L0, off, h, fl, dir: Math.sign(e.outer[0] - e.inner[0]) };
    }
    this.brows = {};
    for (const side of ["SL", "SR"]) {
      const b = F.brows[side];
      const c = resample(catmull(b.c), 16);
      // thickness by arc fraction (piecewise linear over the control points)
      const thAt = (s) => { const k = s * (b.th.length - 1), i = Math.min(b.th.length - 2, k | 0); return lerp(b.th[i], b.th[i + 1], k - i); };
      this.brows[side] = { c, thAt, dir: Math.sign(b.c[b.c.length - 1][0] - b.c[0][0]) };
    }
    this.ms = {};
  }

  /** HeadRig.apply: store the frame's inputs (render() consumes them). */
  apply(bs, head, gaze, lean, breath) {
    this.state.bs = bs; this.state.head = head; this.state.gaze = gaze; this.state.lean = lean; this.state.breath = breath;
  }

  stats() {
    return { triangles: Math.round(this.staticTris + this.lastDynTris), meshes: this.lastDraws };
  }

  dispose() {
    const gl = this.gl;
    for (const r of Object.values(this.regions)) { gl.deleteBuffer(r.vb); if (r.ib) gl.deleteBuffer(r.ib); gl.deleteVertexArray(r.vao); }
    gl.deleteBuffer(this.dyn.vb); gl.deleteVertexArray(this.dyn.vao); gl.deleteProgram(this.prog);
  }

  // ---------------------------------------------------------------- physics (renderer-side, purely physical)
  _physics(dt) {
    const P = this.phys, [pitch, yaw, roll] = this.state.head;
    if (!(dt > 0)) dt = 1 / 60;
    dt = Math.min(dt, 0.1);
    const vy = (yaw - P.prevYaw) / dt, vr = (roll - P.prevRoll) / dt, vp = (pitch - P.prevPitch) / dt;
    P.prevYaw = yaw; P.prevRoll = roll; P.prevPitch = pitch;
    const red = this.opts.reducedMotion ? 0.3 : 1;
    const step = (s, k, z, fx, fy) => {
      const c = 2 * z * Math.sqrt(k);
      let left = dt;
      while (left > 1e-6) {
        const h = Math.min(0.004, left);
        s.v += (-k * s.x - c * s.v + fx) * h; s.x += s.v * h;
        s.vy += (-k * s.y - c * s.vy + fy) * h; s.y += s.vy * h;
        left -= h;
      }
    };
    // inertial force opposes the head's angular velocity (deg/s -> px/s^2 scale)
    const fx = -(vy * 1.1 + vr * 1.6) * red, fy = -(vp * 0.8) * red + Math.sin(P.t * 1.57) * 0;
    step(P.lockL, 60, 0.22, fx * 9, fy * 6);
    step(P.lockR, 55, 0.22, fx * 9, fy * 6);
    step(P.bun, 90, 0.5, -vy * 2.0 * red, -vp * 1.5 * red);
    P.t += dt;
  }

  // ---------------------------------------------------------------- per-frame features
  _features(bs, gaze, headYaw) {
    const B = this.batch, F = this.F, C = F.colors;
    const g = (k) => bs[k] || 0;
    B.reset();
    const ms = mouthState(bs, this.ms);
    const smileAvg = (ms.smileL + ms.smileR) / 2;

    // studs (behind the face edge; drawn before the face by render())
    // -> handled in _studs

    // ------------------ brows
    for (const side of ["SL", "SR"]) {
      const br = this.brows[side], A = F.brows[side].arkit;
      const inner = g("browInnerUp"), outer = g(`browOuterUp${A}`), down = g(`browDown${A}`);
      const n = br.c.length;
      const pl = br.c.map((p, i) => {
        const s = i / (n - 1);
        const dy = -inner * 20 * Math.pow(1 - s, 1.4) - outer * 15 * Math.pow(s, 1.1) + down * 9 * (1 - 0.55 * s) - 3.5 * inner * Math.sin(Math.PI * s) * 0.3;
        const dx = -br.dir * (down * 5 * (1 - s)) + br.dir * inner * 2 * (1 - s);
        return [p[0] + dx, p[1] + dy];
      });
      B.begin(0);
      const half = (s) => br.thAt(s) / 2;
      const N = normals(pl), nn = pl.length;
      const upS = side === "SL" ? 1 : -1; // +normal points up for SL (the curve runs right-to-left), down for SR
      const topE = [], botE = [], midE = [];
      for (let i = 0; i < nn; i++) {
        const h = half(i / (nn - 1));
        topE.push([pl[i][0] + N[i][0] * h * upS, pl[i][1] + N[i][1] * h * upS]);
        botE.push([pl[i][0] - N[i][0] * h * upS, pl[i][1] - N[i][1] * h * upS]);
        midE.push([pl[i][0] + N[i][0] * h * upS * 0.25, pl[i][1] + N[i][1] * h * upS * 0.25]);
      }
      // the brow's soft cast shadow on the skin below it (moves with the brow)
      const sh1 = botE.map((p) => [p[0], p[1] + 2.5]), sh2 = botE.map((p) => [p[0], p[1] + 9]);
      const fadeEnds = (c) => (i, n2) => alpha(c, Math.pow(Math.sin((Math.PI * (i + 0.5)) / n2), 0.5));
      B.rows([botE, sh1, sh2], [fadeEnds(alpha(C.lid.browShadow, 0.42)), fadeEnds(alpha(C.lid.browShadow, 0.26)), alpha(C.lid.browShadow, 0)], 0.3);
      const topF = topE.map((p, i) => [p[0] + N[i][0] * upS * 1.1, p[1] + N[i][1] * upS * 1.1]);
      const botF = botE.map((p, i) => [p[0] - N[i][0] * upS * 1.0, p[1] - N[i][1] * upS * 1.0]);
      const ct = C.browTop, cb = C.brow, cm = mix(ct, cb, 0.45);
      B.rows([topF, topE, midE, botE, botF], [alpha(ct, 0), ct, cm, cb, alpha(cb, 0)], 0.5);
      // rounded head cap, shaded by height so it matches the ribbon
      const h0 = half(0), c0 = pl[0];
      const bx = c0[0] - pl[1][0], by = c0[1] - pl[1][1], bl = Math.hypot(bx, by) || 1;
      const cap = [], capF = [];
      for (let k = 0; k <= 12; k++) {
        const an = (k / 12) * Math.PI, ca = Math.cos(an), sa = Math.sin(an);
        const dx = N[0][0] * upS * ca + (bx / bl) * sa, dy = N[0][1] * upS * ca + (by / bl) * sa;
        cap.push([c0[0] + dx * h0, c0[1] + dy * h0]);
        capF.push([c0[0] + dx * (h0 + 1.1), c0[1] + dy * (h0 + 1.1)]);
      }
      const capCol = (i, n2) => { const p = cap[i]; const t = c01((p[1] - (c0[1] - h0)) / (2 * h0)); return mix(ct, cb, t); };
      B.rows([cap, capF], [capCol, (i, n2) => alpha(capCol(i, n2), 0)], 0.5);
      B.fan(c0, cap, cm, capCol, 0.5);
      B.end();
    }

    // ------------------ eyes
    const eyeDraw = (side, ref) => {
      const E = this.eyes[side], e = E.e, A = e.arkit;
      const blink = c01(g(`eyeBlink${A}`)), squint = c01(g(`eyeSquint${A}`) + 0.6 * g(`cheekSquint${A}`) + 0.35 * smileAvg * 0.5);
      const wide = c01(g(`eyeWide${A}`)), lookUp = c01(g(`eyeLookUp${A}`)), lookDown = c01(g(`eyeLookDown${A}`));
      const happy = c01((smileAvg - 0.3) / 0.3) * c01((blink - 0.45) / 0.4);
      const n = E.U0.length;
      const U = [], L = [], Cl = [];
      for (let i = 0; i < n; i++) {
        const s = i / (n - 1), bump = Math.pow(Math.sin(Math.PI * s), 0.7);
        const u0 = E.U0[i], l0 = E.L0[i], h = E.h[i];
        const cl = [lerp(l0[0], u0[0], 0.24), lerp(l0[1], u0[1], 0.24) - happy * 15 * Math.sin(Math.PI * s)];
        Cl.push(cl);
        let uy = u0[1] + bump * (-wide * 0.12 * 30 + lookDown * 0.16 * h - lookUp * 0.06 * h);
        const ly0 = l0[1] - bump * squint * 0.3 * h;
        const u = [lerp(u0[0], cl[0], blink), lerp(uy, cl[1], blink)];
        const lt = Math.max(Math.pow(blink, 3), happy);
        const l = [lerp(l0[0], cl[0], lt), lerp(ly0, cl[1], lt)];
        if (u[1] > l[1]) { const m = (u[1] + l[1]) / 2; u[1] = m; l[1] = m; }
        U.push(u); L.push(l);
      }
      const open = Math.max(0, 1 - blink);
      // sclera (writes the stencil)
      if (open > 0.02) {
        B.begin(1, ref);
        const at = (k) => U.map((p, i) => [lerp(p[0], L[i][0], k), lerp(p[1], L[i][1], k)]);
        const rows = [U, at(0.2), at(0.55), at(0.86), L];
        const corner = (i, nn) => 0.86 + 0.14 * Math.pow(Math.sin((Math.PI * i) / (nn - 1)), 0.5);
        const pink = (i, nn) => Math.max(0, 1 - i / (nn * 0.18));
        B.rows(rows, C.sclera.map((c) => (i, nn) => mix(scale(c, corner(i, nn)), [214, 150, 130], 0.45 * pink(i, nn))), -2);
        B.end();
        // iris, pupil, catchlight, lid shadow (stencil test)
        B.begin(2, ref);
        const [icx, icy, ir] = e.iris;
        const gx = clamp(gaze[0] / 25, -1.2, 1.2) * 19, gy = -clamp(gaze[1] / 25, -1.2, 1.2) * 11;
        const fs = Math.cos(clamp(gaze[0] + headYaw * 0.6, -60, 60) * DEG * 0.8);
        const cx = icx + gx, cy = icy + gy + lookDown * 2;
        const ic = C.iris, pr = e.pupil[2] / ir;
        // warm lower crescent, dark under the lid (c-front: ~(146,74,36) low, ~(76,41,19) at the sides)
        const lowK = (a, k) => Math.pow(Math.max(0, Math.sin(a)), 1.4) * k;
        const sh = (c, k) => (a) => mix(scale(c, 1 - 0.3 * Math.max(0, -Math.sin(a))), ic.low, lowK(a, k));
        B.disc(cx + e.pupil[0], cy + e.pupil[1], ir * fs, ir, [0, pr - 0.03, pr + 0.03, 0.66, 0.84, 0.94, 1.0, 1.05],
          [ic.pupil, ic.pupil, sh(ic.inner, 0.35), sh(ic.mid, 0.95), sh(ic.mid, 0.75), sh(ic.outer, 0.25), ic.limbus, alpha(ic.limbus, 0)], 30, -1);
        // lid shadow on the eyeball
        const S1 = U.map((p, i) => [p[0], p[1] + 9]);
        B.rows([U, S1], [[20, 10, 8, 0.42 * open], [20, 10, 8, 0]], -0.5);
        // catchlight (stays with the iris, drifts a little against the gaze: the cornea reads as wet)
        const [kx, ky, kr] = e.catch;
        B.disc(cx + kx - gx * 0.12, cy + ky - gy * 0.12, kr * fs, kr, [0, 0.82, 1.0, 1.18], [[255, 255, 255, 1], [255, 255, 255, 1], [255, 255, 255, 0.85], [255, 255, 255, 0]], 18, 0);
        B.end();
      }
      // lower lid soft line + lash line
      B.begin(0);
      const LL1 = L.map((p) => [p[0], p[1] + 1.2]), LL2 = L.map((p) => [p[0], p[1] + 4.5]);
      B.rows([L, LL1, LL2], [[120, 60, 40, 0.0], [130, 64, 40, 0.32 * open + 0.1], [130, 64, 40, 0]], 0);
      // lash: the lid edge plus the rest offsets
      const T = U.map((p, i) => {
        const s = i / (n - 1), k = 1 - 0.5 * blink; // the lash thins as it closes (it folds onto the lower lid)
        return [p[0] + E.off[i][0] * k, p[1] + E.off[i][1] * k];
      });
      const Ub = U.map((p) => [p[0], p[1] + 1.3]); // lash bottom edge slightly inside the opening (no sclera halo)
      const Tf = T.map((p, i) => [p[0] + (T[i][0] - U[i][0]) * 0.08, p[1] - 1.1]);
      const lc = C.lash;
      B.rows([Tf, T, Ub], [alpha(lc, 0), lc, lc], 1);
      // upper-lid highlight band and crease above the lash (they ride the lid, the crease lags: skin folds)
      const Tr = E.U0.map((p, i) => [p[0] + E.off[i][0], p[1] + E.off[i][1]]);
      const ends = (i) => Math.pow(Math.sin((Math.PI * i) / (n - 1)), 0.6);
      const H0 = T.map((p) => [p[0], p[1] - 0.6]);
      const H1 = T.map((p, i) => [lerp(p[0], Tr[i][0], 0.6), lerp(p[1], Tr[i][1], 0.6) - 4.2 - 2 * wide]);
      const H2 = T.map((p, i) => [lerp(p[0], Tr[i][0], 0.65), lerp(p[1], Tr[i][1], 0.65) - 7.0 - 2.5 * wide]);
      const hl = C.lid.hilite;
      B.rows([H0, H1, H2], [(i) => alpha(hl, 0.55 * ends(i)), (i) => alpha(hl, 0.5 * ends(i)), alpha(hl, 0)], 0.8);
      const cr = T.map((p, i) => [lerp(p[0], Tr[i][0], 0.7), lerp(p[1], Tr[i][1], 0.7) - 9.6 - 3 * wide + 1.5 * squint]);
      const crA = (i) => 0.62 * Math.pow(Math.sin((Math.PI * i) / (n - 1)), 0.9);
      const cr0 = cr.map((p) => [p[0], p[1] + 1.6]), cr1 = cr.map((p) => [p[0], p[1] - 1.0]), cr2 = cr.map((p) => [p[0], p[1] - 6.5]);
      B.rows([cr0, cr, cr1, cr2], [alpha(C.lid.crease, 0), (i) => alpha(C.lid.crease, crA(i)), (i) => alpha(C.lid.crease, crA(i) * 0.55), alpha(C.lid.crease, 0)], 0.8);
      // flick: a tapered strip from the lash's outer end to the tip (upper edge) and from the lid corner (lower edge)
      const o = U[n - 1], ot = T[n - 1];
      const fl = E.fl.map((d) => [o[0] + d[0], o[1] + d[1] - blink * 1.5]);
      const upE = resample(catmull([ot, fl[0], fl[1]]), 9);
      const loE = resample(catmull([[o[0], o[1] + 0.8], fl[3], fl[2], fl[1]]), 9);
      const nU = normals(upE), nL = normals(loE);
      const sd = E.dir < 0 ? 1 : -1;
      const upF = upE.map((p, i) => [p[0] + nU[i][0] * sd * 1.2, p[1] + nU[i][1] * sd * 1.2]);
      const loF = loE.map((p, i) => [p[0] - nL[i][0] * sd * 1.2, p[1] - nL[i][1] * sd * 1.2]);
      B.rows([upF, upE, loE, loF], [alpha(lc, 0), lc, lc, alpha(lc, 0)], 1);
      B.end();
    };
    eyeDraw("SL", 1);
    eyeDraw("SR", 2);

    // ------------------ mouth
    this._mouth(ms);

    // ------------------ bindi
    B.begin(0);
    const [bx, by, brr] = F.bindi;
    B.disc(bx, by, brr, brr, [0, 0.55, 0.92, 1.0, 1.12], [[118, 60, 58], C.bindi, scale(C.bindi, 0.88), scale(C.bindi, 0.85), alpha(scale(C.bindi, 0.85), 0)], 32, 0.5);
    B.end();
    // nose: crisp nostril shadows and a soft tip highlight on top of the fitted field
    if (F.nose) {
      B.begin(0);
      for (const [nx, ny, rx, ry, rot] of F.nose.nostrils) {
        const flare = 1 + 0.12 * c01(g("noseSneerLeft") + g("noseSneerRight"));
        B.disc(nx, ny - 0.8 * (flare - 1) * 10, rx * flare, ry, [0, 0.5, 1.0, 1.7], [[96, 40, 8, 0.75], [104, 44, 10, 0.6], [120, 52, 14, 0.18], [120, 52, 14, 0]], 20, 3, rot);
      }
      const [tx, ty, trx, try_] = F.nose.tip;
      B.disc(tx, ty, trx, try_, [0, 0.5, 1], [[255, 196, 130, 0.38], [255, 190, 125, 0.2], [255, 190, 125, 0]], 24, 4);
      B.end();
    }
    return ms;
  }

  _studs() {
    const B = this.batch, G = this.F.colors.gold, [, yaw] = this.state.head;
    for (const [x, y, r] of this.F.studs) {
      B.begin(0);
      const gl = clamp(-yaw / 20, -1, 1) * 2.5;
      B.disc(x, y, r, r, [0, 0.35, 0.7, 0.92, 1.0, 1.1], [G[0], G[1], G[1], G[2], G[3], alpha(G[3], 0)], 30, 2);
      B.disc(x - 3.5 + gl, y - 4, 3.2, 2.6, [0, 1, 1.5], [[255, 255, 245, 0.95], [255, 255, 240, 0.7], [255, 255, 240, 0]], 16, 3);
      B.end();
    }
  }

  _mouth(ms) {
    const B = this.batch, M = this.F.mouth, C = this.F.colors;
    const s0 = M.restSmile;
    const N = 29;
    const open = ms.open, round = ms.round, wide = ms.wide, press = ms.press;
    const smile = (ms.smileL + ms.smileR) / 2;
    const halfW = M.halfW * (1 + 0.13 * wide - 0.33 * round + 0.07 * Math.max(0, smile - s0) - 0.04 * press - 0.1 * ms.frown - 0.16 * open * (1 - wide));
    // the smile curve flattens as the jaw opens (the corners stay, the centre of the seam rises toward them)
    const sagSide = (sm, fr) => (M.sag * (0.25 + 0.75 * Math.min(1, sm / s0)) + 17 * Math.max(0, sm - s0) - 26 * fr + 3 * wide) * (1 - 0.6 * press) * (1 - 0.5 * round) * (1 - 0.45 * open);
    const sagL = sagSide(ms.smileL, ms.frownL), sagR = sagSide(ms.smileR, ms.frownR);
    const drop = 50 * open + 6 * ms.lowerDown;
    const raise = 4 * open + 6 * ms.upperUp;
    const eL = 0.75 - 0.35 * round + 0.25 * wide, eU = 1.2 - 0.5 * round;
    const tu = M.tu * (1 + 0.45 * round - 0.5 * press - 0.65 * ms.rollIn - 0.2 * open);
    const tl = M.tl * (1 + 0.22 * round - 0.3 * press - 0.55 * ms.rollIn - 0.28 * open - 0.12 * wide);
    const ct = Math.cos(M.tilt), st = Math.sin(M.tilt);
    const cx = M.cx + ms.skew * 15, cy = M.cy + 1.0 * open;
    const P = (lx, ly) => [cx + lx * ct - ly * st, cy + lx * st + ly * ct];
    const Uin = [], Lin = [], Uout = [], Lout = [], seam = [], prL = [], prU = [], lU = [], lL = [], xs = [];
    for (let i = 0; i < N; i++) {
      const t = -1 + (2 * i) / (N - 1), at = Math.abs(t);
      const sag = t < 0 ? sagL : sagR;
      const q = Math.max(0, 1 - t * t);
      const pl = Math.pow(q, eL), pu = Math.pow(q, eU);
      prL.push(pl); prU.push(pu);
      const x = t * halfW;
      const sy = -sag * Math.pow(at, M.pseam || 2.3) - ms.skew * 7 * t;
      const uin = sy - raise * pu;
      const lin = sy + drop * pl;
      const tU = t / (M.extU || 1), tL = t / ((M.extL || 1) * (1 + 0.15 * open));
      const uo = uin - tu * Math.pow(Math.max(0, 1 - tU * tU), M.pu || 0.45) - 0.6 * Math.max(0, 1 - tU * tU);
      const lo = lin + tl * Math.pow(Math.max(0, 1 - tL * tL), M.pl || 0.62) + 0.5 * Math.max(0, 1 - tL * tL);
      xs.push(x); lU.push(uin); lL.push(lin);
      seam.push(P(x, sy)); Uin.push(P(x, uin)); Lin.push(P(x, lin)); Uout.push(P(x, uo)); Lout.push(P(x, lo));
    }
    const gap = drop + raise;
    const zl = 2;
    const at = (arr, t) => { const k = ((t + 1) / 2) * (N - 1), i = clamp(k | 0, 0, N - 2), f = k - i; return lerp(arr[i], arr[i + 1], f); };
    if (gap > 0.8) {
      B.begin(1, 3);
      const mid = Uin.map((p, i) => [lerp(p[0], Lin[i][0], 0.5), lerp(p[1], Lin[i][1], 0.5)]);
      B.rows([Uin, mid, Lin], C.interior, zl - 3);
      B.end();
      B.begin(2, 3);
      // tongue: a soft blob resting on the floor of the mouth; Hindi keys lift (dental/alveolar), curl (retroflex),
      // widen (lateral) or push it to the teeth (TH)
      const lift0 = Math.max(ms.tipUp, 0.8 * ms.curl, ms.tongueOut);
      const teethH = (Math.min(9, Math.max(0, gap - 2.5) * 0.3 + 0.5) + 3 * ms.teeth * Math.min(1, gap / 6) + 4 * ms.upperUp) * (1 - 0.6 * lift0);
      const NT = 15, top = [], hi = [], bot = [];
      const tw = 0.62 + 0.2 * ms.tongueWide - 0.1 * round;
      const th = Math.max(3, gap * 0.34 + 2) * (1 - 0.2 * ms.tongueWide);
      const lift = Math.max(ms.tipUp, 0.8 * ms.curl, ms.tongueOut);
      for (let k = 0; k < NT; k++) {
        const u = -1 + (2 * k) / (NT - 1), t = u * tw;
        const floor = at(lL, t);
        const roof = at(lU, t) + teethH * Math.pow(at(prU, t), 0.9) * (ms.tongueOut > 0.2 ? 0.45 : 1) + 1;
        const dome = Math.pow(Math.max(0, 1 - u * u), 0.5);
        let y = floor + 3 - th * dome;
        const tipW = Math.exp(-((u / 0.45) ** 2));
        y = lerp(y, roof + 1, lift * Math.pow(tipW, 0.8));
        const x = at(xs, t) * (1 - 0.18 * ms.curl * tipW);
        top.push(P(x, y)); hi.push(P(x * 0.7, lerp(y, floor, 0.4))); bot.push(P(x * 1.05, floor + 10));
      }
      const tc = C.tongue;
      B.rows([top, hi, bot], [tc[1], tc[2], tc[0]], zl - 2);
      if (ms.curl > 0.05) {
        const und = top.map((p, k) => { const u = -1 + (2 * k) / (NT - 1), w = Math.exp(-((u / 0.38) ** 2)); return [p[0], p[1] + 11 * ms.curl * w]; });
        B.rows([top, und], [(i) => alpha(C.tongueUnder, Math.min(1, ms.curl * 1.6) * Math.exp(-(((i - (NT - 1) / 2) / (NT * 0.2)) ** 2))), alpha(C.tongueUnder, 0)], zl - 1.5);
      }
      if (ms.tipUp > 0.05 || ms.tongueOut > 0.05) {
        // a lighter tip where it touches the teeth ridge
        const k = NT >> 1;
        B.disc(top[k][0], top[k][1] + 2.5, 9 * tw, 3.5, [0, 1], [[232, 140, 132, 0.6 * lift], [232, 140, 132, 0]], 16, zl - 1.4);
      }
      // upper teeth: one curved band hugging the upper lip, tapering into the corners (clipped by the interior)
      const tcol = C.teeth;
      const tTop = Uin.map((p) => [p[0], p[1] - 3]);
      const tRow = (k) => Uin.map((p, i) => [p[0], p[1] + teethH * Math.pow(prU[i], 0.9) * k]);
      const edge = (c) => (i, n) => scale(c, 0.92 + 0.08 * Math.pow(Math.sin((Math.PI * i) / (n - 1)), 0.5));
      B.rows([tTop, tRow(0.25), tRow(1), tRow(1.12)], [edge(tcol[0]), edge(tcol[1]), edge(tcol[2]), alpha(tcol[2], 0)], zl - 1);
      // lower teeth: only a hint in the centre on teeth-forward shapes (SS, E, I) or a wide-open laugh
      const lowH = (2.5 * ms.teeth * c01((gap - 16) / 8) + Math.max(0, gap - 30) * 0.12) * (1 - c01(lift0 * 2));
      if (lowH > 0.5) {
        const a = 1 - 0.85 * ms.tongueOut;
        const cprof = Lin.map((p, i) => Math.pow(Math.max(0, 1 - ((-1 + (2 * i) / (N - 1)) / 0.6) ** 2), 0.6));
        const L0 = Lin.map((p) => [p[0], p[1] + 3]);
        const L1 = Lin.map((p, i) => [p[0], p[1] - lowH * cprof[i]]);
        const L2 = Lin.map((p, i) => [p[0], p[1] - lowH * cprof[i] - 1.2]);
        B.rows([L0, L1, L2], [(i) => alpha(tcol[2], a * Math.min(1, cprof[i] * 3)), (i) => alpha(tcol[1], a * Math.min(1, cprof[i] * 3)), alpha(tcol[1], 0)], zl - 1);
      }
      B.end();
    }
    // lips
    B.begin(0);
    const ul = C.upLip, ll = C.loLip;
    const Uf = Uout.map((p) => [p[0], p[1] - 2.6]);
    const Um = Uout.map((p, i) => [lerp(p[0], Uin[i][0], 0.45), lerp(p[1], Uin[i][1], 0.45)]);
    const openK = c01(gap / 6);
    B.rows([Uf, Uout, Um, Uin], [alpha(ul[0], 0), ul[0], ul[1], mix(ul[2], [150, 64, 44], openK)], zl);
    const Lr = [0.22, 0.5, 0.82].map((k) => Lin.map((p, i) => [lerp(p[0], Lout[i][0], k), lerp(p[1], Lout[i][1], k)]));
    const Lf = Lout.map((p) => [p[0], p[1] + 4.5]);
    const hl = (c) => (i, n) => { const t = -1 + (2 * i) / (n - 1); return mix(ll[1], c, Math.exp(-((t / 0.55) ** 2))); };
    B.rows([Lin, Lr[0], Lr[1], Lr[2], Lout, Lf], [mix(ll[0], [150, 64, 44], openK * 0.6), ll[1], hl(ll[2]), hl(ll[3]), ll[4], alpha(ll[4], 0)], zl);
    // inner-lip rim when open (wet edge), seam line when (nearly) closed
    if (openK > 0.05) {
      const r1 = Uin.map((p) => [p[0], p[1] - 1.6]);
      B.rows([r1, Uin], [[120, 48, 32, 0], [120, 48, 32, 0.5 * openK]], zl + 0.2);
      const r2 = Lin.map((p) => [p[0], p[1] + 1.8]);
      B.rows([Lin, r2], [[150, 62, 48, 0.45 * openK], [150, 62, 48, 0]], zl + 0.2);
    }
    const sa = 1 - c01(gap / 3.5);
    if (sa > 0.01) B.ribbon(seam.map((p, i) => [lerp(Uin[i][0], Lin[i][0], 0.5), lerp(Uin[i][1], Lin[i][1], 0.5)]), (s) => { const u = Math.abs(2 * s - 1); return (0.55 + 0.75 * u * u) * Math.pow(Math.max(0, 1 - u), 0.15); }, alpha(C.seam, sa), 0.9, zl + 0.5);
    // corner tucks (curl up with the smile)
    for (const [i, sgn, sm] of [[0, -1, ms.smileL], [N - 1, 1, ms.smileR]]) {
      const c = seam[i];
      const k = 0.7 + 0.9 * c01(sm);
      const pl = [[c[0] - sgn * 5, c[1] + 2], [c[0], c[1]], [c[0] + sgn * 3.5 * k, c[1] - 3 * k], [c[0] + sgn * 5 * k, c[1] - 6.5 * k]];
      B.ribbon(resample(catmull(pl), 12), (s) => 1.25 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.15 + s * 0.85)), 0.8) + 0.15, [100, 42, 22, 0.55 * (1 - 0.6 * c01(gap / 10))], 1.6, zl + 0.5);
      B.disc(c[0] + sgn * 2.5, c[1] - 2, 7, 5, [0, 1], [[130, 58, 30, 0.16], [130, 58, 30, 0]], 16, zl + 0.4);
    }
    B.end();
  }

  // ---------------------------------------------------------------- render
  render(dt = 1 / 60) {
    const gl = this.gl, { bs, head, gaze, lean, breath } = this.state;
    const W = this.canvas.width, H = this.canvas.height;
    this._physics(dt);
    gl.viewport(0, 0, W, H);
    const bg = this.data.bg;
    gl.clearColor(bg[0] / 255, bg[1] / 255, bg[2] / 255, 1);
    gl.clearStencil(0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.useProgram(this.prog);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    const fit = this.opts.fit || { s: W / 1024, x: 0, y: 0 };
    gl.uniform2f(this.U.uView, (2 / W) * fit.s, (2 / H) * fit.s);
    const pv = this.data.spec.pivots;
    const pitch = clamp(head[0], -10, 12) * DEG, yaw = clamp(head[1], -20, 20) * DEG, roll = clamp(head[2], -20, 20) * DEG;
    // group post-transforms (2D affine in 1024 space): roll about the neck pivot, breath, lean
    const aff = (rot, piv, sx, sy, tx, ty) => {
      const c = Math.cos(rot), s = Math.sin(rot);
      // T(piv) * R * S * T(-piv) then translate
      return new Float32Array([
        c * sx, s * sx, 0,
        -s * sy, c * sy, 0,
        piv[0] - (c * sx * piv[0] - s * sy * piv[1]) + tx + fit.x / fit.s, piv[1] - (s * sx * piv[0] + c * sy * piv[1]) + ty + fit.y / fit.s, 1,
      ]);
    };
    const leanS = 1 + 0.025 * lean;
    const breathY = 1 + 0.006 * breath;
    const bodyM = aff(0, pv.hem, leanS, breathY * leanS, 0, 0);
    const neckM = aff(roll * 0.35, pv.neck, leanS, leanS, 0, -1.0 * breath * 0.8 + 6 * lean);
    const headM = aff(roll, pv.roll, leanS, leanS, 0, -1.2 * breath * 0.6 + 6 * lean);
    const P = this.phys;
    const setGroup = (grp) => {
      if (grp === "body") {
        gl.uniformMatrix3fv(this.U.uPost, false, bodyM); gl.uniform3f(this.U.uRot, 0, 0, 0);
      } else if (grp === "neck") {
        gl.uniformMatrix3fv(this.U.uPost, false, neckM); gl.uniform3f(this.U.uRot, pitch * 0.35, yaw * 0.35, 0.0006);
      } else {
        gl.uniformMatrix3fv(this.U.uPost, false, headM); gl.uniform3f(this.U.uRot, pitch, yaw, 0.0007);
      }
      gl.uniform2f(this.U.uPivot, pv.head[0], pv.head[1]);
      gl.uniform1f(this.U.uJaw, 0);
      gl.uniform2f(this.U.uCheekL, 0, 0); gl.uniform2f(this.U.uCheekR, 0, 0);
      if (grp === "lock_L") gl.uniform3f(this.U.uSway, P.lockL.x, P.lockL.y, 1.6);
      else if (grp === "lock_R") gl.uniform3f(this.U.uSway, P.lockR.x, P.lockR.y, 1.6);
      else gl.uniform3f(this.U.uSway, 0, 0, 1);
    };
    let draws = 0;
    const drawRegion = (id, extra) => {
      const r = this.regions[id];
      if (!r) return;
      setGroup(r.group);
      if (extra) extra();
      gl.bindVertexArray(r.vao);
      gl.drawElements(gl.TRIANGLES, r.count, r.type, 0);
      draws++;
    };
    // features geometry for this frame
    const ms = this._features(bs, gaze, head[1]);
    const featItems = this.batch.items.slice();
    const featEnd = this.batch.n;
    this._studs();
    const studItems = this.batch.items.slice(featItems.length);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dyn.vb);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.batch.u8, 0, this.batch.n * 16);
    this.lastDynTris = this.batch.n / 3;
    const drawItems = (items) => {
      setGroup("head");
      gl.bindVertexArray(this.dyn.vao);
      for (const it of items) {
        if (!it.count) continue;
        if (it.mode === 0) gl.disable(gl.STENCIL_TEST);
        else {
          gl.enable(gl.STENCIL_TEST);
          if (it.mode === 1) { gl.stencilFunc(gl.ALWAYS, it.ref, 0xff); gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE); }
          else { gl.stencilFunc(gl.EQUAL, it.ref, 0xff); gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP); }
        }
        gl.drawArrays(gl.TRIANGLES, it.start, it.count);
        draws++;
      }
      gl.disable(gl.STENCIL_TEST);
    };
    // bun sway on hair_back via the w3 weight
    drawRegion("nape");
    drawRegion("hair_back", () => gl.uniform3f(this.U.uSway, P.bun.x, P.bun.y, 1));
    drawRegion("hair_back_strokes", () => gl.uniform3f(this.U.uSway, P.bun.x, P.bun.y, 1));
    drawRegion("neck");
    drawRegion("kurta");
    drawRegion("piping");
    drawRegion("ear_L");
    drawRegion("ear_R");
    drawItems(studItems);
    const g = (k) => bs[k] || 0;
    const jawPx = this.data.spec.jaw.k * ms.open + 4 * ms.lowerDown;
    const liftL = 5.5 * c01(ms.smileL + g("cheekSquintRight") * 0.8) + 2 * ms.cheekPuff;
    const liftR = 5.5 * c01(ms.smileR + g("cheekSquintLeft") * 0.8) + 2 * ms.cheekPuff;
    drawRegion("face", () => {
      gl.uniform1f(this.U.uJaw, jawPx);
      gl.uniform2f(this.U.uCheekL, -1.5 * liftL - 3 * ms.cheekPuff, -liftL);
      gl.uniform2f(this.U.uCheekR, 1.5 * liftR + 3 * ms.cheekPuff, -liftR);
    });
    drawItems(featItems);
    drawRegion("hair_front");
    drawRegion("hair_front_strokes");
    drawRegion("lock_L");
    drawRegion("lock_R");
    gl.bindVertexArray(null);
    this.lastDraws = draws;
  }
}
