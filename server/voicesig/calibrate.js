// Calibration for h1..h4 (SPEC §3.2, §3.3, §7 VS-A4). Pure, deterministic: isotonic regression (pool-adjacent-
// violators), Platt / temperature scaling, ECE with equal-mass bins, and reliability tables. Shared by the server (apply a
// fitted table) and the eval harness (fit on pilot outcomes, child-clustered CV). Until a table is fitted on outcome-
// labelled child data, `identity` is used and the head output is SHADOW ONLY (calibrated: false).

const clamp01 = (p) => Math.min(1 - 1e-6, Math.max(1e-6, p));
export const logit = (p) => Math.log(clamp01(p) / (1 - clamp01(p)));
export const sigmoid = (x) => 1 / (1 + Math.exp(-x));

/**
 * Isotonic fit of y ∈ {0,1} on score s. Returns breakpoints {x: ascending score thresholds, y: fitted prob}, applied as a
 * step function with linear interpolation between block centres.
 * @param {number[]} s @param {number[]} y @param {number[]} [w]
 */
export function fitIsotonic(s, y, w) {
  const idx = s.map((_, i) => i).sort((a, b) => s[a] - s[b]);
  const blocks = [];
  for (const i of idx) {
    blocks.push({ sx: s[i] * (w?.[i] ?? 1), sy: y[i] * (w?.[i] ?? 1), w: w?.[i] ?? 1 });
    while (blocks.length > 1) {
      const a = blocks[blocks.length - 2], b = blocks[blocks.length - 1];
      if (a.sy / a.w <= b.sy / b.w) break;
      blocks.splice(-2, 2, { sx: a.sx + b.sx, sy: a.sy + b.sy, w: a.w + b.w });
    }
  }
  return { kind: "isotonic", x: blocks.map((b) => b.sx / b.w), y: blocks.map((b) => b.sy / b.w) };
}

export function applyIsotonic(t, s) {
  const { x, y } = t;
  if (!x.length) return 0.5;
  if (s <= x[0]) return clamp01(y[0]);
  if (s >= x[x.length - 1]) return clamp01(y[y.length - 1]);
  let i = 1;
  while (x[i] < s) i++;
  const f = (s - x[i - 1]) / (x[i] - x[i - 1] || 1);
  return clamp01(y[i - 1] + f * (y[i] - y[i - 1]));
}

/** Platt scaling p = σ(a·s + b) by Newton's method on the log-loss (with a tiny ridge for separable data). */
export function fitPlatt(s, y, { iters = 50, ridge = 1e-3 } = {}) {
  let a = 1, b = 0;
  for (let it = 0; it < iters; it++) {
    let ga = ridge * a, gb = 0, haa = ridge, hab = 0, hbb = 1e-9;
    for (let i = 0; i < s.length; i++) {
      const p = sigmoid(a * s[i] + b), r = p - y[i], v = p * (1 - p);
      ga += r * s[i]; gb += r; haa += v * s[i] * s[i]; hab += v * s[i]; hbb += v;
    }
    const det = haa * hbb - hab * hab;
    if (Math.abs(det) < 1e-12) break;
    const da = (hbb * ga - hab * gb) / det, db = (haa * gb - hab * ga) / det;
    a -= da; b -= db;
    if (Math.abs(da) + Math.abs(db) < 1e-9) break;
  }
  return { kind: "platt", a, b };
}

/** Apply any fitted table; `identity` treats s as a logit. */
export function applyCal(t, s) {
  if (!t || t.kind === "identity") return sigmoid(s);
  if (t.kind === "platt") return sigmoid(t.a * s + t.b);
  if (t.kind === "isotonic") return applyIsotonic(t, s);
  throw new Error(`unknown calibration ${t.kind}`);
}
export const IDENTITY = Object.freeze({ kind: "identity" });

/** Expected calibration error with `bins` equal-mass bins (VS-A4 uses 10). */
export function ece(p, y, bins = 10) {
  const idx = p.map((_, i) => i).sort((a, b) => p[a] - p[b]);
  const n = idx.length;
  if (!n) return NaN;
  let e = 0;
  for (let b = 0; b < bins; b++) {
    const lo = Math.floor((b * n) / bins), hi = Math.floor(((b + 1) * n) / bins);
    if (hi <= lo) continue;
    let sp = 0, sy = 0;
    for (let k = lo; k < hi; k++) { sp += p[idx[k]]; sy += y[idx[k]]; }
    e += (Math.abs(sp - sy) / n);
  }
  return e;
}

/** Reliability table: per equal-mass bin, mean predicted vs observed rate and count. */
export function reliability(p, y, bins = 10) {
  const idx = p.map((_, i) => i).sort((a, b) => p[a] - p[b]);
  const n = idx.length, out = [];
  for (let b = 0; b < bins; b++) {
    const lo = Math.floor((b * n) / bins), hi = Math.floor(((b + 1) * n) / bins);
    if (hi <= lo) continue;
    let sp = 0, sy = 0;
    for (let k = lo; k < hi; k++) { sp += p[idx[k]]; sy += y[idx[k]]; }
    out.push({ pred: sp / (hi - lo), obs: sy / (hi - lo), n: hi - lo });
  }
  return out;
}
