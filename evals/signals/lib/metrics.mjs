// Metrics for the signals eval harness: AUC (Mann-Whitney, ties = 1/2), ECE (equal-width bins), binary confusion, and a
// cluster bootstrap CI (clusters = traces or children, never turns). Deterministic: the bootstrap uses a seeded PRNG.

export function auc(scores, labels) {
  const pos = [], neg = [];
  scores.forEach((s, i) => (labels[i] ? pos : neg).push(s));
  if (!pos.length || !neg.length) return null;
  // rank-based, O(n log n)
  const all = scores.map((s, i) => ({ s, y: labels[i] })).sort((a, b) => a.s - b.s);
  let rankSum = 0;
  for (let i = 0; i < all.length;) {
    let j = i;
    while (j < all.length && all[j].s === all[i].s) j++;
    const r = (i + j + 1) / 2; // average 1-based rank
    for (let k = i; k < j; k++) if (all[k].y) rankSum += r;
    i = j;
  }
  return (rankSum - (pos.length * (pos.length + 1)) / 2) / (pos.length * neg.length);
}

export function ece(probs, labels, bins = 10) {
  if (!probs.length) return null;
  const b = Array.from({ length: bins }, () => ({ n: 0, p: 0, y: 0 }));
  probs.forEach((p, i) => { const k = Math.min(bins - 1, Math.floor(p * bins)); b[k].n++; b[k].p += p; b[k].y += labels[i] ? 1 : 0; });
  return b.reduce((s, x) => s + (x.n ? (x.n / probs.length) * Math.abs(x.p / x.n - x.y / x.n) : 0), 0);
}

export function confusion(pred, truth) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  pred.forEach((p, i) => { if (p && truth[i]) tp++; else if (p) fp++; else if (truth[i]) fn++; else tn++; });
  const n = pred.length;
  const precision = tp + fp ? tp / (tp + fp) : null;
  const recall = tp + fn ? tp / (tp + fn) : null;
  const specificity = tn + fp ? tn / (tn + fp) : null;
  const accuracy = n ? (tp + tn) / n : null;
  // For a binary decision, AUC = (TPR + TNR) / 2 (balanced accuracy).
  const aucBinary = recall != null && specificity != null ? (recall + specificity) / 2 : null;
  return { n, pos: tp + fn, tp, fp, fn, tn, precision, recall, specificity, accuracy, aucBinary, falseAlarmsPer100: n ? (100 * fp) / n : null };
}

export function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

/** Percentile CI of stat(rows) resampling CLUSTERS with replacement. rows: [{ cluster, ... }]. */
export function clusterBootstrap(rows, stat, { reps = 500, seed = 7, levels = [0.8, 0.95] } = {}) {
  const by = new Map();
  for (const r of rows) { if (!by.has(r.cluster)) by.set(r.cluster, []); by.get(r.cluster).push(r); }
  const keys = [...by.keys()];
  const R = rng(seed);
  const vals = [];
  for (let i = 0; i < reps; i++) {
    const sample = [];
    for (let k = 0; k < keys.length; k++) sample.push(...by.get(keys[Math.floor(R() * keys.length)]));
    const v = stat(sample);
    if (v != null && Number.isFinite(v)) vals.push(v);
  }
  vals.sort((a, b) => a - b);
  const q = (p) => (vals.length ? vals[Math.min(vals.length - 1, Math.max(0, Math.floor(p * vals.length)))] : null);
  const out = {};
  for (const l of levels) out[`ci${Math.round(l * 100)}`] = [q((1 - l) / 2), q(1 - (1 - l) / 2)];
  return out;
}

export const r3 = (x) => (x == null ? null : Math.round(x * 1000) / 1000);
export function quantile(xs, p) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
}
