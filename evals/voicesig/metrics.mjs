// Acceptance-metric primitives for voicesig (SPEC §7). Pure and seeded: the same data and seed give the same numbers.
// Every interval is a CHILD-CLUSTERED bootstrap (resample children, keep all their turns), because turns of one child are
// not independent and a turn-level bootstrap would report intervals several times too narrow.
import { ece, reliability } from "../../server/voicesig/calibrate.js";

export { ece, reliability };

/** Mann-Whitney AUROC with tie correction; NaN when a class is empty. */
export function auroc(score, y) {
  const idx = score.map((_, i) => i).sort((a, b) => score[a] - score[b]);
  let nPos = 0, nNeg = 0, rankSumPos = 0;
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && score[idx[j + 1]] === score[idx[i]]) j++;
    const r = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) if (y[idx[k]] === 1) { rankSumPos += r; nPos++; } else nNeg++;
    i = j + 1;
  }
  if (!nPos || !nNeg) return NaN;
  return (rankSumPos - (nPos * (nPos + 1)) / 2) / (nPos * nNeg);
}

/** Deterministic PRNG (mulberry32). */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function quantile(xs, p) {
  const s = xs.filter(Number.isFinite).sort((a, b) => a - b);
  if (!s.length) return NaN;
  const i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
  return s[lo] + (s[hi] - s[lo]) * (i - lo);
}

/**
 * Child-clustered bootstrap of a statistic over rows. `stat(rows)` → number. Returns { est, lo, hi, n, clusters, B }.
 * @param {any[]} rows @param {(r: any) => string} clusterOf @param {(rows: any[]) => number} stat
 */
export function clusterBoot(rows, clusterOf, stat, { B = 1000, alpha = 0.05, seed = 7 } = {}) {
  const groups = new Map();
  for (const r of rows) {
    const c = clusterOf(r);
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c).push(r);
  }
  const keys = [...groups.keys()];
  const est = stat(rows);
  const R = rng(seed);
  const reps = [];
  for (let b = 0; b < B; b++) {
    const sample = [];
    for (let k = 0; k < keys.length; k++) sample.push(...groups.get(keys[Math.floor(R() * keys.length)]));
    const v = stat(sample);
    if (Number.isFinite(v)) reps.push(v);
  }
  return { est, lo: quantile(reps, alpha / 2), hi: quantile(reps, 1 - alpha / 2), n: rows.length, clusters: keys.length, B: reps.length };
}

/** k-fold split of cluster ids (deterministic). Returns an array of Sets of cluster ids, one per fold. */
export function clusterFolds(ids, k = 5, seed = 11) {
  const u = [...new Set(ids)];
  const R = rng(seed);
  for (let i = u.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [u[i], u[j]] = [u[j], u[i]]; }
  const folds = Array.from({ length: k }, () => new Set());
  u.forEach((c, i) => folds[i % k].add(c));
  return folds;
}

/**
 * L2-regularised logistic regression by IRLS (Newton). X rows are feature arrays (an intercept is added). Returns weights.
 * Small, dependency-free, deterministic: enough for pilot-sized text-only / text+voice comparisons.
 */
export function fitLogistic(X, y, { l2 = 1, iters = 30 } = {}) {
  const d = (X[0]?.length ?? 0) + 1;
  let w = new Array(d).fill(0);
  for (let it = 0; it < iters; it++) {
    const g = new Array(d).fill(0);
    const H = Array.from({ length: d }, () => new Array(d).fill(0));
    for (let i = 0; i < X.length; i++) {
      const x = [1, ...X[i]];
      let z = 0;
      for (let k = 0; k < d; k++) z += w[k] * x[k];
      const p = 1 / (1 + Math.exp(-z)), v = Math.max(p * (1 - p), 1e-6);
      for (let a = 0; a < d; a++) {
        g[a] += (p - y[i]) * x[a];
        for (let b = a; b < d; b++) H[a][b] += v * x[a] * x[b];
      }
    }
    for (let a = 0; a < d; a++) {
      if (a > 0) { g[a] += l2 * w[a]; H[a][a] += l2; }
      H[a][a] += 1e-9;
      for (let b = 0; b < a; b++) H[a][b] = H[b][a];
    }
    const step = solve(H, g);
    if (!step) break;
    let delta = 0;
    w = w.map((v, k) => { delta += Math.abs(step[k]); return v - step[k]; });
    if (delta < 1e-8) break;
  }
  return w;
}
export const predictLogistic = (w, x) => 1 / (1 + Math.exp(-(w[0] + x.reduce((s, v, k) => s + v * w[k + 1], 0))));

function solve(A, b) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) return null;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((r, i) => r[n] / r[i]);
}

/**
 * Out-of-fold predictions from a child-clustered k-fold logistic fit. rows → feats(r) → number[]; label(r) → 0|1.
 * Returns an array aligned with rows (NaN where the fold could not be fitted).
 */
export function oofLogistic(rows, feats, label, clusterOf, { k = 5, seed = 11, l2 = 1 } = {}) {
  const folds = clusterFolds(rows.map(clusterOf), k, seed);
  const out = new Array(rows.length).fill(NaN);
  for (const fold of folds) {
    const tr = [], te = [];
    rows.forEach((r, i) => (fold.has(clusterOf(r)) ? te : tr).push(i));
    const ytr = tr.map((i) => label(rows[i]));
    if (!ytr.includes(0) || !ytr.includes(1)) continue;
    const w = fitLogistic(tr.map((i) => feats(rows[i])), ytr, { l2 });
    for (const i of te) out[i] = predictLogistic(w, feats(rows[i]));
  }
  return out;
}
