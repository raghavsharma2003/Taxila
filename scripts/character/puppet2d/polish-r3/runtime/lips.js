// r3 METHOD CHANGE (judge r2 fix 1): the mouth is ONE warped lip-contour shell cut from c-front's own lips, never a
// swapped whole-mouth sprite. Two sheets (upper lip + skin above, lower lip + skin below) split along c-front's lip
// line; their corners are driven continuously by mouthSmile / mouthStretch / mouthPucker / mouthFrown / mouthLeft-Right,
// their opening by jawOpen and the visemes. The gap between the inner lip edges shows the interior (teeth, tongue,
// cavity) from layers/interior.png, the strips cut from the gpt-image-2 atlas (interior.py). The smile weight therefore
// carries straight through speech, and every change is a continuous blend of one parameter vector: nothing swaps.
//
// Contour model (c-front px; ~16 control points): the lip line L(x) (traced: darkest pixel per column), the upper outer
// contour L - tU(s) and the lower outer contour L + tL(s), s = signed distance from the mouth centre in half-widths
// (|s| = 1 at the lip ends 466 / 596; 1 < |s| < 1.2 is the smile crease, which fades as the smile goes).

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const clamp01 = (x) => clamp(x, 0, 1);
const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// traced lip line, x 448..612 step 4 (scripts/character/puppet2d/polish-r3: darkest pixel per column, c-front)
const LINE_X0 = 448;
const LINE = [585, 584, 584, 587, 589, 592, 594, 596, 597, 599, 600, 601, 602, 603, 604, 604, 605, 605, 606, 606, 606, 606, 606, 605, 605, 604, 603, 602, 601, 600, 598, 597, 596, 594, 592, 589, 587, 584, 580, 576, 576, 575];
export const MOUTH = { cx: 530, hwL: 64, hwR: 66, tU: 13.5, tL: 21, cy: 606 };
export function lineY(x) {
  const f = (x - LINE_X0) / 4;
  if (f <= 0) return LINE[0];
  if (f >= LINE.length - 1) return LINE[LINE.length - 1];
  const i = Math.floor(f), t = f - i;
  return LINE[i] * (1 - t) + LINE[i + 1] * t;
}
const sOf = (x) => (x - MOUTH.cx) / (x < MOUTH.cx ? MOUTH.hwL : MOUTH.hwR);
const tUof = (a) => (a >= 1 ? 0 : MOUTH.tU * Math.pow(1 - a * a, 0.55));
const tLof = (a) => (a >= 1 ? 0 : MOUTH.tL * Math.pow(Math.max(0, 1 - Math.pow(a, 2.2)), 0.75));

// ---- viseme targets: g = centre gap px (at 1024), up = share of the gap carried by the upper lip, wid = corner
// travel px (+ out), round 0..1 (ellipse opening + fuller lips), press 0..1, T / TL = upper / lower teeth shown,
// th = tongue height share, tip / curl = tongue keys, tuck = lower lip raised toward the upper teeth (f / v)
const Z = { g: 0, up: 0.3, wid: 0, round: 0, press: 0, T: 0.6, TL: 0.2, th: 0.25, tip: 0, curl: 0, tuck: 0 };
const V = {
  viseme_sil: { ...Z },
  viseme_PP: { ...Z, wid: -3, press: 1 },
  viseme_FF: { ...Z, g: 3.5, up: 0.15, wid: -2, T: 1, TL: 0, tuck: 1 },
  viseme_TH: { ...Z, g: 9, up: 0.4, T: 0.75, TL: 0.4, tip: 1, th: 0.5 },
  viseme_DD: { ...Z, g: 11, up: 0.3, T: 0.8, TL: 0.45, tip: 0.8 },
  viseme_kk: { ...Z, g: 13, up: 0.3, T: 0.6, TL: 0.3, th: 0.55 },
  viseme_CH: { ...Z, g: 7, up: 0.4, wid: -9, round: 0.55, T: 1, TL: 0.9 },
  viseme_SS: { ...Z, g: 5, up: 0.4, wid: 3, T: 1, TL: 1 },
  viseme_nn: { ...Z, g: 10, up: 0.3, T: 0.7, TL: 0.4, tip: 0.8 },
  viseme_RR: { ...Z, g: 9, up: 0.35, wid: -9, round: 0.5, T: 0.6, TL: 0.3, tip: 0.6 },
  viseme_aa: { ...Z, g: 25, up: 0.24, wid: -3, round: 0.25, T: 0.8, TL: 0.1, th: 0.22 },
  viseme_E: { ...Z, g: 11, up: 0.35, wid: 5, T: 1, TL: 0.7 },
  viseme_I: { ...Z, g: 7, up: 0.4, wid: 5, T: 1, TL: 0.8 },
  viseme_O: { ...Z, g: 19, up: 0.35, wid: -17, round: 0.9, T: 0.45, TL: 0.1 },
  viseme_U: { ...Z, g: 9, up: 0.4, wid: -24, round: 1, T: 0.15, TL: 0 },
};
const KEYS = Object.keys(Z);
// per-parameter smoothing time constants (s): the opening tracks the phonemes, the corners and the smile glide
const TAU = { g: 0.022, up: 0.03, wid: 0.045, round: 0.045, press: 0.03, T: 0.03, TL: 0.03, th: 0.03, tip: 0.025, curl: 0.03, tuck: 0.025 };

export class LipSolver {
  constructor() {
    this.p = { ...Z };
    this.side = { L: { wid: 0, dy: 0, crease: 1 }, R: { wid: 0, dy: 0, crease: 1 } };
    this.shift = 0;
    this.first = true;
  }

  /** Composited weights -> the shell parameters for this frame (continuous; no swaps, no holds). */
  solve(bs, dt) {
    const k = (n) => bs[n] ?? 0;
    // target from the visemes (weighted mean), else from the live lip.ts keys (jaw / funnel / pucker / stretch)
    const open = clamp01(k("jawOpen") / 0.85);
    const round = Math.max(k("mouthFunnel"), k("mouthPucker"));
    const stretch = (k("mouthStretchLeft") + k("mouthStretchRight")) / 2;
    const jawT = { ...Z, g: 30 * open, up: 0.28, wid: -18 * round + 6 * stretch, round: clamp01(round * 1.2 + 0.2 * open), T: 0.35 + 0.5 * open, TL: 0.1 + 0.3 * stretch, th: 0.25 };
    let W = 0;
    const vt = {};
    for (const key of KEYS) vt[key] = 0;
    for (const v in V) {
      const w = k(v);
      if (w <= 0.01) continue;
      W += w;
      for (const key of KEYS) vt[key] += w * V[v][key];
    }
    const tgt = {};
    if (W > 0) for (const key of KEYS) vt[key] /= W;
    const mix = Math.min(1, W);
    for (const key of KEYS) tgt[key] = W > 0 ? jawT[key] * (1 - mix) + vt[key] * mix : jawT[key];
    // the audio jaw still breathes the viseme's opening a little (a loud aa opens wider than a soft one)
    if (W > 0) tgt.g *= 0.85 + 0.35 * clamp01(open / 0.45);
    // expression jaw (surprise / delight / listening, no viseme): opening from jawOpen, an "o" when surprised
    const wide = (k("eyeWideLeft") + k("eyeWideRight")) / 2;
    if (W < 0.2 && wide > 0.45) { tgt.round = Math.max(tgt.round, 0.75); tgt.wid -= 12; tgt.T = 0.45; tgt.up = 0.3; }
    // an open-mouthed smile (delight / laugh): the D-shape. More opening, the upper lip stays high and flat, the
    // lower lip carries the drop, and the teeth show
    const smAvg = (k("mouthSmileLeft") + k("mouthSmileRight")) / 2;
    const joy = clamp01((smAvg - 0.35) / 0.4) * clamp01(open / 0.18);
    if (joy > 0) { tgt.g += 16 * joy * (1 - Math.min(1, W)); tgt.up = tgt.up * (1 - 0.6 * joy); tgt.T = Math.max(tgt.T, 0.9 * joy); tgt.th = Math.max(tgt.th, 0.35 * joy); }
    this.surprised = W < 0.2 && wide > 0.45 ? 1 : 0;
    // tongue keys from the contract (Hindi dental / retroflex / lateral)
    tgt.tip = clamp01(Math.max(tgt.tip, k("tongueTipUp")));
    tgt.curl = clamp01(Math.max(tgt.curl, k("tongueCurl")));
    // a retroflex curl must be seen: the teeth part and the gap opens a touch (the underside shows at the palate)
    if (tgt.curl > 0.3) { tgt.T = Math.min(tgt.T, 0.5); tgt.TL = 0; tgt.g = Math.max(tgt.g, 13); tgt.up = 0.38; }
    if (tgt.tip > 0.3) { tgt.TL = Math.min(tgt.TL, 0.15); }
    if (k("tongueWide") > 0.2) tgt.th = Math.max(tgt.th, 0.35);
    tgt.press = clamp01(Math.max(tgt.press, (k("mouthPressLeft") + k("mouthPressRight")) / 2 * 1.4));
    // smoothing
    const p = this.p;
    for (const key of KEYS) {
      if (this.first) { p[key] = tgt[key]; continue; }
      p[key] += (1 - Math.exp(-dt / TAU[key])) * (tgt[key] - p[key]);
    }
    // ---- corners, per side (ARKit Left = her left = screen right). Effective smile: c-front's own resting smile is
    // s = 0.45 (behaviour's idle warmth ~0.07 maps there); 0 = soft neutral (a gentle upturn is kept: she is warm),
    // 1 = the big delight grin. Frown pulls the corner down, the press flattens it.
    const smile = { L: k("mouthSmileRight"), R: k("mouthSmileLeft") };
    const frown = { L: k("mouthFrownRight"), R: k("mouthFrownLeft") };
    // the warm floor (0.22) gives way to a frown or a worried press: concern must not read as a smile
    const worry = clamp01(((k("mouthFrownLeft") + k("mouthFrownRight")) / 2) * 4 + Math.max(0, k("browInnerUp") - 0.5) * 1.2);
    const lift = (sm) => 0.22 * (1 - worry) + 0.23 * clamp01(sm / 0.045) + 0.6 * clamp01((sm - 0.045) / 0.8);
    const side = k("mouthLeft") - k("mouthRight");   // + = her left = screen right
    for (const s of ["L", "R"]) {
      const se = lift(smile[s]);
      const roundK = 1 - 0.45 * p.round;          // a rounded mouth keeps less of the smile's spread
      const wid = (se - 0.45) * 13 * roundK + p.wid;
      const dy = -(se - 0.45) * 19 * (1 - 0.3 * p.round) * (1 - 0.7 * (this.surprised || 0)) + frown[s] * 9 + p.press * 1.5;
      const crease = clamp01((se - 0.16) / 0.29) * (1 - 0.6 * p.round);
      const S = this.side[s], tc = this.first ? 1 : 1 - Math.exp(-dt / 0.06);
      S.wid += tc * (wid - S.wid);
      S.dy += tc * (dy - S.dy);
      S.crease += tc * (crease - S.crease);
    }
    // thinking "hmm": the mouth slides toward one cheek, and that corner tucks up a touch
    const sh = clamp(side * 1.6, -1, 1) * 13;
    this.shift += (this.first ? 1 : 1 - Math.exp(-dt / 0.08)) * (sh - this.shift);
    this.first = false;
    this.sideTilt = clamp(side * 1.6, -1, 1);
    return this;
  }

  /** The lower lip's drop (px): the chin follows it so the skin between lip and chin never crushes. */
  lowerDrop() {
    return this.p.g * (1 - this.p.up);
  }
}

/** Mesh builder + per-frame deformation of the shell (rest-space displacement, before the head projection). */
export class LipShell {
  constructor(rect) {
    this.rect = rect; // the mouth_rest layer rect (texture = c-front's own mouth region, feathered ellipse alpha)
    const [x0, y0, x1, y1] = rect;
    const cols = [];
    for (let x = x0; x <= x1 + 0.01; x += 4) cols.push(Math.min(x, x1));
    this.cols = cols;
    // rows by distance from the lip line: dense at the lip, sparse toward the ellipse edge. Row 1 (0.9 px) is the
    // inner-edge AA row: when the lips part, row 0 goes transparent and the edge is an exact 0.9 px ramp.
    const dU = [0, 0.9, 3, 6, 9, 12, 15, 19, 24, 30, 37, 45, 55];
    const dL = [0, 0.9, 3, 6, 10, 14, 18, 22, 27, 33, 40, 48, 57, 67, 78, 90];
    this.sheets = {};
    for (const [name, ds, sign, ylim] of [["U", dU, -1, y0], ["L", dL, 1, y1]]) {
      const C = cols.length, R = ds.length;
      const rest = new Float32Array(C * R * 2), uv = new Float32Array(C * R * 2), d = new Float32Array(C * R);
      for (let i = 0; i < C; i++) {
        const x = cols[i], L = lineY(x);
        for (let j = 0; j < R; j++) {
          let y = L + sign * ds[j];
          if (j === R - 1) y = ylim;                 // the last row is the rect edge
          y = sign < 0 ? Math.max(ylim, y) : Math.min(ylim, y);
          const q = i * R + j;
          rest[q * 2] = x; rest[q * 2 + 1] = y;
          uv[q * 2] = (x - x0) / (x1 - x0); uv[q * 2 + 1] = (y - y0) / (y1 - y0);
          d[q] = Math.abs(y - L);
        }
      }
      const idx = new Uint16Array((C - 1) * (R - 1) * 6);
      let k = 0;
      for (let i = 0; i < C - 1; i++)
        for (let j = 0; j < R - 1; j++) {
          const a = i * R + j, b = a + 1, c = a + R, e = c + 1;
          idx.set([a, c, b, b, c, e], k);
          k += 6;
        }
      this.sheets[name] = { C, R, rest, uv, d, idx, pos: new Float32Array(C * R * 2), alpha: new Float32Array(C * R).fill(1), sign };
    }
    // interior strip: columns over the lip span, 2 rows (upper inner edge - 2 px, lower inner edge + 2 px)
    const IC = 41;
    this.IC = IC;
    this.inner = { pos: new Float32Array(IC * 2 * 2), s: new Float32Array(IC * 2), dt: new Float32Array(IC * 2), gap: new Float32Array(IC * 2) };
    const iidx = new Uint16Array((IC - 1) * 6);
    for (let i = 0; i < IC - 1; i++) { const a = i * 2; iidx.set([a, a + 2, a + 1, a + 1, a + 2, a + 3], i * 6); }
    this.inner.idx = iidx;
    for (let i = 0; i < IC; i++) { const s = (-1 + (2 * i) / (IC - 1)) * 1.04; this.inner.s[i * 2] = this.inner.s[i * 2 + 1] = s; }
  }

  /** Displacement of the lip line itself at column x for sheet sign (-1 upper / +1 lower): [dx, dy, gapShare]. */
  edge(sol, x, sign) {
    const p = sol.p;
    const s = sOf(x), a = Math.abs(s), S = s < 0 ? sol.side.L : sol.side.R;
    const am = Math.min(1, a);
    // horizontal: corners travel S.wid, the centre stays; the crease beyond the lip end rides with the corner
    let dx = (a <= 1 ? s : Math.sign(s)) * S.wid + sol.shift;
    // vertical: the corner lift is carried by the outer part of the line
    let dy = S.dy * Math.pow(am, 1.8);
    // the side the mouth slid to tucks up (c-thinking)
    dy -= (sol.sideTilt || 0) * s * 3 * am;
    // opening profile: ellipse when rounded, squarer when spread; zero at the corners
    const kexp = 2 + 2.2 * (1 - p.round);
    const prof = a < 1 ? Math.pow(Math.max(0, 1 - Math.pow(a, kexp)), 0.9) : 0;
    const g = p.g * prof;
    if (sign < 0) dy -= g * p.up;
    else dy += g * (1 - p.up) - p.tuck * 2.5 * prof;
    return [dx, dy, g];
  }

  /** Rest-space deformed position for a sheet vertex (lip band moves with its edge, skin beyond decays to 0). */
  deform(sol, sheet, q, out) {
    const p = sol.p;
    const x = sheet.rest[q * 2], y = sheet.rest[q * 2 + 1], d = sheet.d[q], sign = sheet.sign;
    const ci = Math.floor(q / sheet.R), E = sign < 0 ? this.colU : this.colL;
    const ex = E[ci * 3], ey = E[ci * 3 + 1];
    const a = Math.abs(sOf(x));
    const t = sign < 0 ? tUof(a) : tLof(a);
    // lip thickness: fuller when rounded, thinner when pressed or spread
    const thick = 1 + 0.32 * p.round - 0.38 * p.press - 0.04 * Math.max(0, p.wid) - (sign > 0 ? 0.12 * p.tuck : 0);
    let dx, dy;
    if (d <= t + 1e-3) {
      const f = t > 0 ? d / t : 0;
      dx = ex;
      dy = ey + sign * f * (thick - 1) * t;
    } else {
      // skin beyond the lip: carries the edge motion, decaying to zero at the sheet's outer edge
      const reach = sign < 0 ? 26 : 46;
      const fall = 1 - sstep(t, t + reach, d);
      dx = ex * fall;
      dy = (ey + sign * (thick - 1) * t) * fall;
    }
    // corners beyond the crease end fade out sideways too (the ellipse edge stays put)
    const side = Math.abs(sOf(x));
    if (side > 1.2) { const f = 1 - sstep(1.2, 1.6, side); dx *= f; dy *= f; }
    out[0] = x + dx;
    out[1] = y + dy;
  }

  /** Per-vertex alpha: the inner-edge AA row and the smile crease's fade. */
  alphaOf(sol, sheet, q, gapHere) {
    const j = q % sheet.R, x = sheet.rest[q * 2];
    let a = 1;
    if (j === 0) a = 1 - clamp01((gapHere - 1.0) / 1.2);   // lips parted: the cut edge becomes an AA ramp
    const s = sOf(x), S = s < 0 ? this.solCache.side.L : this.solCache.side.R;
    // the crease (lip line continued past the lip end) fades with the smile; within ~9 px of the line only
    if (Math.abs(s) > 0.9 && sheet.d[q] < 20) {
      const w = sstep(0.9, 1.08, Math.abs(s)) * (1 - sstep(8, 20, sheet.d[q]));
      a *= 1 - w * (1 - S.crease);
    }
    return a;
  }

  update(sol) {
    this.solCache = sol;
    const o = [0, 0];
    // per-column edge displacement, computed once per frame (both sheets share the columns)
    const C = this.cols.length;
    if (!this.colU) { this.colU = new Float32Array(C * 3); this.colL = new Float32Array(C * 3); }
    for (let i = 0; i < C; i++) {
      const u = this.edge(sol, this.cols[i], -1), l = this.edge(sol, this.cols[i], 1);
      this.colU.set(u, i * 3); this.colL.set(l, i * 3);
    }
    for (const name of ["U", "L"]) {
      const sh = this.sheets[name];
      for (let q = 0; q < sh.C * sh.R; q++) {
        this.deform(sol, sh, q, o);
        sh.pos[q * 2] = o[0];
        sh.pos[q * 2 + 1] = o[1];
        sh.alpha[q] = this.alphaOf(sol, sh, q, this.colL[Math.floor(q / sh.R) * 3 + 2]);
      }
    }
    // interior strip between the deformed inner edges (rest-space x of each column -> its deformed position)
    const I = this.inner;
    for (let i = 0; i < this.IC; i++) {
      const s = I.s[i * 2];
      const x = MOUTH.cx + s * (s < 0 ? MOUTH.hwL : MOUTH.hwR);
      const L = lineY(x);
      const [ux, uy] = this.edge(sol, x, -1);
      const [lx, ly] = this.edge(sol, x, 1);
      const top = L + uy, bot = L + ly, gap = Math.max(0, bot - top);
      I.pos[i * 4] = x + ux; I.pos[i * 4 + 1] = top - 2;
      I.pos[i * 4 + 2] = x + lx; I.pos[i * 4 + 3] = bot + 2;
      I.dt[i * 2] = -2; I.dt[i * 2 + 1] = gap + 2;
      I.gap[i * 2] = I.gap[i * 2 + 1] = gap;
    }
  }
}
