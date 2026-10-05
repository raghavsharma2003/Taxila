// Read sim-<label>.json files and report the V1.3 / V1.4 numbers (all SIMULATED). With --fit, a calibration map is fitted
// on TRAIN children (even ids) and evaluated on HELD-OUT children (odd ids), so the "after" number is never in-sample.
//   node evals/mastery-calibration/analyze.mjs results/<date>/sim-baseline.json [more.json ...] [--fit]
import { readFileSync, writeFileSync } from "node:fs";

const files = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const FIT = process.argv.includes("--fit");
const BINS = 10;

export function ece(pairs, bins = BINS) {
  const B = Array.from({ length: bins }, () => ({ n: 0, p: 0, y: 0 }));
  for (const [p, y] of pairs) { const b = B[Math.min(bins - 1, Math.floor(p * bins))]; b.n++; b.p += p; b.y += y ? 1 : 0; }
  const n = pairs.length || 1;
  const curve = B.map((b, i) => ({ bin: `${(i / bins).toFixed(1)}-${((i + 1) / bins).toFixed(1)}`, n: b.n, meanPred: b.n ? +(b.p / b.n).toFixed(3) : null, observed: b.n ? +(b.y / b.n).toFixed(3) : null }));
  const e = B.reduce((a, b) => a + (b.n ? (b.n / n) * Math.abs(b.p / b.n - b.y / b.n) : 0), 0);
  const brier = pairs.reduce((a, [p, y]) => a + (p - (y ? 1 : 0)) ** 2, 0) / n;
  return { n: pairs.length, ece: +e.toFixed(4), brier: +brier.toFixed(4), curve };
}
/** Bootstrap 95% CI of ECE, resampling CHILDREN (answers within a child are not independent). */
function eceCI(rows, key = "pred", B = 300) {
  const byChild = new Map(); for (const r of rows) (byChild.get(r.child) ?? byChild.set(r.child, []).get(r.child)).push(r);
  const kids = [...byChild.keys()]; let seed = 12345; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  const vals = [];
  for (let b = 0; b < B; b++) { const pick = []; for (let i = 0; i < kids.length; i++) pick.push(...byChild.get(kids[Math.floor(rnd() * kids.length)])); vals.push(ece(pick.map((r) => [r[key], r.correct])).ece); }
  vals.sort((a, b) => a - b);
  return [vals[Math.floor(0.025 * B)], vals[Math.floor(0.975 * B)]];
}
/** Isotonic regression (pool adjacent violators) of y on p, as a step map; applied by nearest-left knot. */
function isotonic(pairs) {
  const s = [...pairs].sort((a, b) => a[0] - b[0]).map(([p, y]) => ({ p, sum: y ? 1 : 0, n: 1 }));
  const st = [];
  for (const x of s) { st.push({ lo: x.p, hi: x.p, sum: x.sum, n: x.n }); while (st.length > 1 && st[st.length - 2].sum / st[st.length - 2].n >= st[st.length - 1].sum / st[st.length - 1].n) { const b = st.pop(), a = st.pop(); st.push({ lo: a.lo, hi: b.hi, sum: a.sum + b.sum, n: a.n + b.n }); } }
  const knots = st.map((b) => ({ lo: b.lo, v: (b.sum + 0.5) / (b.n + 1) }));
  return (p) => { let v = knots[0].v; for (const k of knots) { if (k.lo <= p) v = k.v; else break; } return v; };
}
const share = (xs, f) => (xs.length ? +(xs.filter(f).length / xs.length).toFixed(4) : null);
const wilson = (k, n) => { if (!n) return null; const z = 1.96, p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d; return [+(c - h).toFixed(4), +(c + h).toFixed(4)]; };

const report = {};
for (const f of files) {
  const d = JSON.parse(readFileSync(f, "utf8"));
  const out = { meta: d.meta };
  const firsts = d.answers.filter((a) => a.first);
  const checks = d.answers.filter((a) => a.check);
  for (const [name, rows] of [["firstTry", firsts], ["delayedCheck", checks]]) {
    out[name] = { model: ece(rows.map((r) => [r.pred, r.correct])), modelCI: eceCI(rows), oracle: ece(rows.map((r) => [r.ptrue, r.correct])) };
    for (const fam of ["A", "B"]) { const rr = rows.filter((r) => r.fam === fam); if (rr.length) out[name][`model_${fam}`] = ece(rr.map((r) => [r.pred, r.correct])).ece; }
    out[name].maxPred = rows.reduce((m, r) => Math.max(m, r.pred), 0);
    out[name].meanPred = +(rows.reduce((a, r) => a + r.pred, 0) / Math.max(1, rows.length)).toFixed(3);
    out[name].observed = +(rows.filter((r) => r.correct).length / Math.max(1, rows.length)).toFixed(3);
  }
  if (FIT) {
    const train = firsts.filter((r) => r.child % 4 < 2), test = firsts.filter((r) => r.child % 4 >= 2);
    const m = isotonic(train.map((r) => [r.pred, r.correct]));
    const tc = checks.filter((r) => r.child % 4 >= 2);
    out.recalibrated = { method: "isotonic map pred -> P(correct), fitted on children with id%4 in {0,1}, scored on id%4 in {2,3} (held-out; both families on each side)", heldOutFirstTry: ece(test.map((r) => [m(r.pred), r.correct])).ece,
      heldOutFirstTryBefore: ece(test.map((r) => [r.pred, r.correct])).ece, heldOutCheck: ece(tc.map((r) => [m(r.pred), r.correct])).ece, heldOutCheckBefore: ece(tc.map((r) => [r.pred, r.correct])).ece,
      nTrain: train.length, nTest: test.length, nTestChecks: tc.length };
  }
  // false mastery at each certification level
  out.falseMastery = {};
  for (const lvl of ["learned_today", "mastered", "durable"]) {
    const c = d.certs.filter((x) => x.level === lvl);
    const k = c.filter((x) => x.pNewNow < 0.5).length;
    out.falseMastery[lvl] = { n: c.length, fm50: share(c, (x) => x.pNewNow < 0.5), fm50CI: wilson(k, c.length), fm70: share(c, (x) => x.pNewNow < 0.7), fm50at7d: share(c, (x) => x.pNew7 < 0.5),
      byPersona: Object.fromEntries([...new Set(c.map((x) => x.persona))].map((p) => [p, { n: c.filter((x) => x.persona === p).length, fm50: share(c.filter((x) => x.persona === p), (x) => x.pNewNow < 0.5) }])) };
  }
  const ss = d.skillSessions.filter((x) => !x.across && x.items > 0);
  const across = d.skillSessions.filter((x) => x.across);
  out.policy = { skillSessions: ss.length, boredom: share(ss, (x) => x.bored), boredomCI: wilson(ss.filter((x) => x.bored).length, ss.length), overloadInSession: share(d.skillSessions.filter((x) => !x.across), (x) => x.overload),
    overloadAcross: share(across, (x) => x.overloadAcross), skillsAcross: across.length,
    byPersona: Object.fromEntries([...new Set(ss.map((x) => x.persona))].map((p) => [p, { n: ss.filter((x) => x.persona === p).length, boredom: share(ss.filter((x) => x.persona === p), (x) => x.bored), overload: share(d.skillSessions.filter((x) => !x.across && x.persona === p), (x) => x.overload) }])) };
  const lc = d.ledgerChecks ?? [];
  const ok = (x) => (x.firstCorrect ?? x.correct);
  out.ledgerChecks = { n: lc.length, newItem: share(lc, (x) => x.newItem), delayGE2d: share(lc, (x) => x.delayDays >= 2), firstTryPass: share(lc, ok),
    ece: ece(lc.filter((x) => (x.predFirst ?? x.pred) != null).map((x) => [x.predFirst ?? x.pred, ok(x)])), kinds: Object.fromEntries([...new Set(lc.map((x) => x.kind))].map((k) => [k, lc.filter((x) => x.kind === k).length])),
    // V1.6 proxy in simulation: of skills whose check PASSED, the mean TRUE chance of a further new-form success now
    passedTrueNewForm: lc.filter(ok).length ? +(lc.filter(ok).reduce((a, x) => a + x.pNew, 0) / lc.filter(ok).length).toFixed(3) : null };
  out.ledgerChecks.ece = out.ledgerChecks.ece.ece;
  // certification rules compared on the SAME traces (truth = pNew at the certifying check): one delayed pass vs two
  // consecutive delayed passes (different sessions), each on a never-seen item
  const bySk = new Map(); for (const x of lc) { const k = `${x.child}|${x.skill}`; (bySk.get(k) ?? bySk.set(k, []).get(k)).push(x); }
  const rule = (need, novelOnly) => { const certs = []; for (const xs of bySk.values()) { let run = 0; for (const x of xs) { if (novelOnly && !x.newItem) continue; run = ok(x) ? run + 1 : 0; if (run >= need) { certs.push(x); break; } } }
    return { n: certs.length, fm50: share(certs, (x) => x.pNew < 0.5), fm50CI: wilson(certs.filter((x) => x.pNew < 0.5).length, certs.length), meanTrueNewForm: certs.length ? +(certs.reduce((a, x) => a + x.pNew, 0) / certs.length).toFixed(3) : null }; };
  out.certRules = { onePass: rule(1, false), onePassNovel: rule(1, true), twoPasses: rule(2, false), twoPassesNovel: rule(2, true) };
  out.checks = { n: d.checks.length, newItem: share(d.checks, (x) => x.newItem), delayGE2d: share(d.checks, (x) => x.delayDays >= 2), medianDelay: d.checks.map((x) => x.delayDays).sort((a, b) => a - b)[Math.floor(d.checks.length / 2)] ?? null,
    accuracy: share(d.checks, (x) => x.correct), kinds: Object.fromEntries([...new Set(d.checks.map((x) => x.kind))].map((k) => [k, d.checks.filter((x) => x.kind === k).length])) };
  report[d.meta.label] = out;
}
const OUTF = process.argv.find((a) => a.startsWith("--out="))?.slice(6);
if (OUTF) writeFileSync(OUTF, JSON.stringify(report, null, 1));
for (const [label, o] of Object.entries(report)) {
  console.log(`\n=== ${label} (SIMULATED; ${o.meta.children} children x ${o.meta.lessons} lessons, family ${o.meta.family}, ${o.meta.turns} turns)`);
  for (const n of ["firstTry", "delayedCheck"]) console.log(`${n}: n=${o[n].model.n} ECE=${o[n].model.ece} CI=${JSON.stringify(o[n].modelCI)} (A ${o[n].model_A}, B ${o[n].model_B}) oracleECE=${o[n].oracle.ece} meanPred=${o[n].meanPred} observed=${o[n].observed} maxPred=${o[n].maxPred}`);
  if (o.recalibrated) console.log("recalibrated:", JSON.stringify(o.recalibrated));
  for (const [lvl, x] of Object.entries(o.falseMastery)) console.log(`FM ${lvl}: n=${x.n} fm<0.5=${x.fm50} CI=${JSON.stringify(x.fm50CI)} fm<0.7=${x.fm70} fm<0.5@7d=${x.fm50at7d} ${JSON.stringify(x.byPersona)}`);
  console.log("policy:", JSON.stringify(o.policy));
  console.log("checks(sim view):", JSON.stringify(o.checks));
  console.log("checks(ledger):", JSON.stringify(o.ledgerChecks));
  console.log("certification rules on ledger checks:", JSON.stringify(o.certRules));
}
