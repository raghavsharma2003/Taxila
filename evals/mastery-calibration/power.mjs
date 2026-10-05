// Pilot power analysis for VALUES-100 V1.6 (docs/design/values/v1/PILOT-PROTOCOL.md §6). Monte Carlo, no network.
//   1. "secure" accuracy: delayed-check accuracy on skills the product marked secure must be >= 85%. Pass = the one-sided
//      95% lower bound (child-clustered percentile bootstrap) is above 0.85. Children differ (between-child spread of
//      their true accuracy, an intraclass correlation), so checks within a child are not independent.
//   2. calibration: ECE <= 0.05 between the product's predicted P(correct) and real delayed outcomes. Reported: the
//      measured ECE of a PERFECTLY calibrated predictor (its noise floor) and of one that is truly off by ~0.08, at each n;
//      and the power of the calibration-slope test (95% CI of the logistic recalibration slope inside [0.8, 1.2]).
//   node evals/mastery-calibration/power.mjs [--sims 400]
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const SIMS = Number(arg("--sims", 400)), BOOT = 300;
let seed = 99; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const gauss = () => { const u = rnd() || 1e-12, v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const logit = (p) => Math.log(p / (1 - p)), sig = (x) => 1 / (1 + Math.exp(-x));

function securePower(p, kids, m, sd = 0.6) {
  let pass = 0;
  for (let s = 0; s < SIMS; s++) {
    const per = [];
    for (let k = 0; k < kids; k++) { const pk = sig(logit(p) + sd * gauss()); let y = 0; for (let j = 0; j < m; j++) y += rnd() < pk ? 1 : 0; per.push(y); }
    const boots = [];
    for (let b = 0; b < BOOT; b++) { let y = 0; for (let k = 0; k < kids; k++) y += per[Math.floor(rnd() * kids)]; boots.push(y / (kids * m)); }
    boots.sort((a, b) => a - b);
    if (boots[Math.floor(0.05 * BOOT)] > 0.85) pass++;
  }
  return +(pass / SIMS).toFixed(3);
}
function ece(pairs) {
  const B = Array.from({ length: 10 }, () => ({ n: 0, p: 0, y: 0 }));
  for (const [p, y] of pairs) { const b = B[Math.min(9, Math.floor(p * 10))]; b.n++; b.p += p; b.y += y; }
  return B.reduce((a, b) => a + (b.n ? (b.n / pairs.length) * Math.abs(b.p / b.n - b.y / b.n) : 0), 0);
}
/** Logistic recalibration slope by Newton's method on logit(pred). */
function slope(pairs) {
  let a = 0, b = 1;
  for (let it = 0; it < 10; it++) {
    let g0 = 0, g1 = 0, h00 = 0, h01 = 0, h11 = 0;
    for (const [p, y] of pairs) { const x = logit(Math.min(0.999, Math.max(0.001, p))), q = sig(a + b * x), w = q * (1 - q); g0 += y - q; g1 += (y - q) * x; h00 += w; h01 += w * x; h11 += w * x * x; }
    const det = h00 * h11 - h01 * h01; if (Math.abs(det) < 1e-12) break;
    a += (h11 * g0 - h01 * g1) / det; b += (-h01 * g0 + h00 * g1) / det;
  }
  return b;
}
function calib(n, offset) {
  const e = [], slopeOk = [];
  for (let s = 0; s < Math.min(SIMS, 120); s++) {
    const pairs = [];
    for (let i = 0; i < n; i++) { const pred = 0.3 + 0.65 * rnd(); const truth = sig(logit(pred) * (1 - offset) + 0); pairs.push([pred, rnd() < truth ? 1 : 0]); }
    e.push(ece(pairs));
    // slope CI by bootstrap (iid here: the cluster effect is folded into the design effect in the report)
    const bs = []; for (let b = 0; b < 40; b++) { const r = []; for (let i = 0; i < n; i++) r.push(pairs[Math.floor(rnd() * n)]); bs.push(slope(r)); }
    bs.sort((x, y) => x - y); slopeOk.push(bs[1] >= 0.8 && bs[38] <= 1.2);
  }
  e.sort((a, b) => a - b);
  return { medianECE: +e[Math.floor(e.length / 2)].toFixed(4), p90ECE: +e[Math.floor(0.9 * e.length)].toFixed(4), shareECEle05: +(e.filter((x) => x <= 0.05).length / e.length).toFixed(3),
    slopeTestPass: +(slopeOk.filter(Boolean).length / slopeOk.length).toFixed(3) };
}
const out = { date: new Date().toISOString(), sims: SIMS, secure: [], calibration: [] };
for (const p of [0.88, 0.9, 0.93, 0.95]) for (const kids of [20, 30, 40, 60, 80]) for (const m of [4, 8]) out.secure.push({ pTrue: p, children: kids, checksPerChild: m, power: securePower(p, kids, m) });
for (const n of [150, 300, 600, 1200, 2400]) out.calibration.push({ n, calibrated: calib(n, 0), offBy: calib(n, 0.35) });
console.log(JSON.stringify(out, null, 1));
