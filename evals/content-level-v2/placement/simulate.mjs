// Simulated placement runs over the REAL bank and the REAL server/placement code (RS-6). Labelled simulation: no child
// answered anything. Two response models:
//   "model"  — simulated children answer from the same 4PL the CAT assumes (optimistic bound);
//   "missp"  — misspecified: each item's true difficulty is its anchor + N(0, 0.6) GE (rater calibration error), true slope
//              1.2 instead of 1.7, and 10% of answers are unparseable / "I don't know" regardless of ability.
//   node evals/content-level-v2/placement/simulate.mjs [--select blend|info|target] [--n 60]
import { writeFileSync } from "node:fs";
import { loadBank, poolFor, nextItem, result, priorFor, itemParams, pCorrect, strandFor } from "../../../server/placement/index.js";
import { prng } from "../../../server/placement/cat.js";

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const SELECT = arg("--select", "blend"), N = Number(arg("--n", 60));
const bank = loadBank();
const OFFSETS = [-3, -2, -1, -0.5, 0, 0.5, 1]; // θ relative to an on-track child on 4 Oct (GE C-1+0.6)
const DATE = "2026-10-04";
function gauss(r) { return Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r()); }

function run({ C, subject, theta, arm, seed }) {
  const r = prng(seed);
  const pool = poolFor(subject, C, bank);
  const shift = new Map(pool.map((it) => [it.id, arm === "missp" ? 0.6 * gauss(r) : 0]));
  const asked = [];
  for (;;) {
    const it = nextItem({ classLevel: C, pool, asked, prior: priorFor(C), rnd: r, select: SELECT });
    if (!it) break;
    const p = itemParams(it);
    const pt = arm === "missp" ? { ...p, a: 1.2, b: p.b + shift.get(it.id) } : p;
    let y = r() < pCorrect(theta, pt) ? 1 : 0, w;
    if (arm === "missp" && r() < 0.1) { if (r() < 0.5) y = null; else { y = 0; w = 0.5; } }
    asked.push({ item: it, y, ...(w ? { w } : {}) });
  }
  return { asked, res: result({ classLevel: C, strand: strandFor(subject, C), asked, date: DATE }) };
}

const rows = [];
for (const arm of ["model", "missp"]) for (const subject of ["maths", "science"]) for (const C of [4, 5, 6, 7]) for (const off of OFFSETS) {
  const expected = C - 1 + 0.6;
  const theta = expected + off;
  const trueLevel = theta < expected - 1 ? "behind" : theta > expected + 0.5 ? "ahead" : "on_track";
  let se = 0, bias = 0, items = 0, levelOk = 0, down = 0, up = 0, skip = 0, cover = 0;
  for (let k = 0; k < N; k++) {
    const { asked, res } = run({ C, subject, theta, arm, seed: 1000 * C + 37 * k + Math.round(off * 10) + (arm === "missp" ? 99991 : 0) + (subject === "maths" ? 0 : 55555) });
    se += (res.mean - theta) ** 2; bias += res.mean - theta; items += asked.length;
    levelOk += res.level === trueLevel ? 1 : 0; down += res.movedDown ? 1 : 0; up += res.movedUp ? 1 : 0; skip += res.skipAhead ? 1 : 0;
    cover += Math.abs(res.mean - theta) <= 1.96 * res.sd ? 1 : 0;
  }
  rows.push({ arm, subject, C, off, theta: +theta.toFixed(2), n: N, rmse: +Math.sqrt(se / N).toFixed(2), bias: +(bias / N).toFixed(2), items: +(items / N).toFixed(1),
    levelOk: +(levelOk / N).toFixed(2), movedDown: +(down / N).toFixed(2), movedUp: +(up / N).toFixed(2), skipAhead: +(skip / N).toFixed(2), ci95cover: +(cover / N).toFixed(2) });
}
const agg = (f) => { const xs = rows.filter(f); const w = xs.reduce((s, r) => s + r.n, 0); const m = (k) => +(xs.reduce((s, r) => s + r[k] * r.n, 0) / w).toFixed(2); return { runs: w, rmse: +Math.sqrt(xs.reduce((s, r) => s + r.rmse ** 2 * r.n, 0) / w).toFixed(2), bias: m("bias"), items: m("items"), levelOk: m("levelOk"), ci95cover: m("ci95cover") }; };
const summary = {
  select: SELECT, date: DATE, bankItems: bank.length,
  model: agg((r) => r.arm === "model"), missp: agg((r) => r.arm === "missp"),
  byOffset: Object.fromEntries(OFFSETS.map((o) => [o, { model: agg((r) => r.arm === "model" && r.off === o), missp: agg((r) => r.arm === "missp" && r.off === o) }])),
  movedDownWhenBehind2: agg((r) => r.off <= -2), movedDownRate: +(rows.filter((r) => r.off <= -2).reduce((s, r) => s + r.movedDown, 0) / rows.filter((r) => r.off <= -2).length).toFixed(2),
  movedUpRateWhenAhead: +(rows.filter((r) => r.off >= 0.5).reduce((s, r) => s + r.movedUp, 0) / rows.filter((r) => r.off >= 0.5).length).toFixed(2),
  skipAheadRateWhenAhead1: +(rows.filter((r) => r.off === 1).reduce((s, r) => s + r.skipAhead, 0) / rows.filter((r) => r.off === 1).length).toFixed(2),
  skipAheadRateWhenOnTrack: +(rows.filter((r) => r.off === 0).reduce((s, r) => s + r.skipAhead, 0) / rows.filter((r) => r.off === 0).length).toFixed(2),
};
writeFileSync(new URL(`../out/placement-sim-${SELECT}.json`, import.meta.url), JSON.stringify({ summary, rows }, null, 1));
console.log(JSON.stringify(summary, null, 1));
