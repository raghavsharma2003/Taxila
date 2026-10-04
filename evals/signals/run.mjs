// Signals eval harness (SIGNALS-SPEC §7): ES-1 traces, ES-3 adversarial, ES-4 lexicon precision, ES-5 latency, plus the
// ES-2 extractor summary when evals/signals/results/es2.json exists (node evals/signals/es2-run.mjs).
// Reports, per derived state: n, positives, precision, recall, AUC (binary decision: (TPR + TNR) / 2; a score AUC where a
// state has one), false alarms per 100 turns, and a trace-clustered bootstrap CI. ECE is reported only where a state emits
// a probability; v1 states are boolean rules, so ECE is "n/a" by construction (calibration is an S2 bar).
//
//   node evals/signals/run.mjs   → evals/signals/results/summary.json (+ a printed table). No network, no spend.
import fs from "node:fs";
import { step, safetyBackstop } from "../../server/signals/index.js";
import { readText } from "../../server/signals/linguistic.js";
import { scanSafety } from "../../server/director/safety.js";
import { buildES1 } from "./es1-traces.mjs";
import { ES3 } from "./es3-adversarial.data.mjs";
import { ES4 } from "./es4-lexicon.data.mjs";
import { auc, clusterBootstrap, confusion, quantile, r3 } from "./lib/metrics.mjs";

const DATE = "2026-10-04";
const out = { date: DATE, method: {}, es1: {}, es3: {}, es4: {}, es5: {}, es2: null };

// ───────────── ES-1 ─────────────
const traces = buildES1();
const rows = [];
let budgetViolations = 0, consolidateOver = 0, flipChanges = 0, flipChecked = 0;
for (const tr of traces) {
  let sess = null;
  const fired = [];
  const asr = tr.signalsOn ? "mai-transcribe-2" : "gpt-live-transcribe";
  for (const [i, t] of tr.turns.entries()) {
    const input = { turn: i + 1, lane: "cascade", typed: false, safety: false, asrSource: asr, cls: null, teacherLast3: [], ...t.input };
    const { frame, next } = step(sess, input);
    // verdict-flip invariance on plain answers (G-SIG-VERDICT): flip correct ↔ not_yet on a cloned session
    if (t.truth.plainCorrect) {
      const flipped = step(sess, { ...input, verdict: input.verdict === "correct" ? "not_yet" : "correct" }).frame;
      flipChecked++;
      if (JSON.stringify(frame.childWin ?? null) !== JSON.stringify(flipped.childWin ?? null)) flipChanges++;
    }
    sess = next;
    fired.push(frame.verifyDue || frame.choiceDue ? 1 : 0);
    rows.push({ cluster: tr.id, lang: tr.lang, persona: tr.persona, signalsOn: tr.signalsOn, input, truth: t.truth, frame });
  }
  for (let k = 0; k + 4 <= fired.length; k++) if (fired.slice(k, k + 4).reduce((a, b) => a + b, 0) > 1) budgetViolations++;
  for (const v of Object.values(sess.consolidated)) if (v > 2) consolidateOver++;
}

function evalState(name, filter, truthFn, predFn, scoreFn) {
  const sel = rows.filter(filter);
  const res = {};
  for (const split of ["all", "in", "out"]) {
    const s = split === "all" ? sel : sel.filter((r) => r.truth.split === split);
    const c = confusion(s.map(predFn), s.map(truthFn));
    const ci = clusterBootstrap(s, (xs) => confusion(xs.map(predFn), xs.map(truthFn)).aucBinary, { reps: 300 });
    res[split] = { ...roundAll(c), aucBinaryCI80: ci.ci80.map(r3), aucBinaryCI95: ci.ci95.map(r3) };
    if (scoreFn) res[split].aucScore = r3(auc(s.map(scoreFn), s.map((r) => (truthFn(r) ? 1 : 0))));
  }
  res.ece = "n/a (boolean rule; no probability emitted)";
  out.es1[name] = res;
}
const roundAll = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === "number" && !Number.isInteger(v) ? r3(v) : v]));
const correctTurns = (r) => r.input.verdict === "correct" && r.truth.fragile != null;
evalState("unsureCorrect(L3)", correctTurns, (r) => r.truth.fragile === 1, (r) => !!r.frame.unsureCorrect);
evalState("verifyDue(D2)", correctTurns, (r) => r.truth.fragile === 1, (r) => !!r.frame.verifyDue);
evalState("evidenceWeight(D1)", correctTurns, (r) => r.truth.fragile === 1, (r) => (r.frame.evidenceWeight?.k ?? 1) < 1, (r) => 1 - (r.frame.evidenceWeight?.k ?? 1));
const stepRows = (r) => r.truth.step !== "na";
evalState("stuck_productive(D3)", stepRows, (r) => r.truth.step === "stuck_productive", (r) => r.frame.stepState?.s === "stuck_productive");
evalState("stuck_unproductive(D3)", stepRows, (r) => r.truth.step === "stuck_unproductive", (r) => r.frame.stepState?.s === "stuck_unproductive");
evalState("recallCue(D4, on idk turns)", (r) => !!r.truth.recall, (r) => r.truth.recall === "recallCue", (r) => r.frame.recall === "recallCue");
evalState("idk detected(L1, on idk turns)", (r) => !!r.truth.recall, () => true, (r) => !!r.frame.recall);
evalState("choiceDue(D5, turn-level: 3rd non-answer)", () => true, (r) => r.truth.choice === 1, (r) => !!r.frame.choiceDue);
// Episode level: precision = fires inside a disengaged run / all fires; recall = disengaged runs with ≥ 1 fire.
{
  const fires = rows.filter((r) => r.frame.choiceDue);
  const dis = new Map();
  for (const r of rows) if (r.truth.dis) dis.set(r.truth.epId, (dis.get(r.truth.epId) ?? 0) + (r.frame.choiceDue ? 1 : 0));
  out.es1["choiceDue(D5, episode-level)"] = { fires: fires.length, firesInDisengagedRun: fires.filter((r) => r.truth.dis).length,
    precision: r3(fires.filter((r) => r.truth.dis).length / Math.max(1, fires.length)), runs: dis.size, runsWithFire: [...dis.values()].filter((v) => v > 0).length,
    recall: r3([...dis.values()].filter((v) => v > 0).length / Math.max(1, dis.size)),
    firesByEpisode: Object.fromEntries([...new Set(fires.map((r) => r.truth.ep))].map((e) => [e, fires.filter((r) => r.truth.ep === e).length])) };
}
evalState("paceDown(D6)", () => true, (r) => r.truth.pace === 1, (r) => !!r.frame.paceDown);
evalState("breakDue(D7, child_said path)", () => true, (r) => r.truth.brk === 1, (r) => r.frame.breakDue?.path === "child_said");
out.es1["breakDue(D7, composite path)"] = { fires: rows.filter((r) => r.frame.breakDue?.path === "composite").length, sessionsWithFire: new Set(rows.filter((r) => r.frame.breakDue?.path === "composite").map((r) => r.cluster)).size,
  note: "no synthetic truth exists for the composite path (needs SG-M15 on real schedules); reported as a fire count only. Once per session by construction." };
evalState("childWin(D8)", () => true, (r) => r.truth.winAny === 1, (r) => !!r.frame.childWin);
evalState("tryFirst(D10, window semantics)", () => true, (r) => r.truth.gamingWindow === 1, (r) => !!r.frame.tryFirst);
evalState("advanceOk vs consolidate(D9)", (r) => !!r.truth.advance && !!r.frame.advance, (r) => r.truth.advance === "consolidate", (r) => r.frame.advance === "consolidate");
// childWin per cause (precision of each emitted cause)
const causePrec = {};
for (const cause of ["insight", "self_repair", "effort", "child_joke"]) {
  const has = (r) => (r.truth.wins ?? (r.truth.win ? [r.truth.win] : [])).includes(cause);
  const em = rows.filter((r) => r.frame.childWin?.causes.includes(cause));
  const tru = rows.filter(has);
  causePrec[cause] = { emitted: em.length, correctCause: em.filter(has).length, truthN: tru.length, recalled: tru.filter((r) => r.frame.childWin?.causes.includes(cause)).length };
}
out.es1.childWinByCause = causePrec;
out.es1.sarcasmTurns = { n: rows.filter((r) => r.truth.sarcasm).length, childWinFired: rows.filter((r) => r.truth.sarcasm && r.frame.childWin).length };
out.es1.guardrails = { traces: traces.length, turns: rows.length, budgetViolationWindows: budgetViolations, consolidateOverCap: consolidateOver, verdictFlipChecked: flipChecked, verdictFlipChildWinChanges: flipChanges };
out.es1.fireRatePer100 = Object.fromEntries(["verifyDue", "choiceDue", "paceDown", "breakDue", "childWin", "tryFirst"].map((k) => [k, r3((100 * rows.filter((r) => r.frame[k]).length) / rows.length)]));
out.method.es1 = "400 synthetic traces (seed 1) from a latent-state generator; labels by construction; 30% held-out paraphrases (split 'out'); no acoustics in ES-1; trace-clustered bootstrap (300 reps). Proves rule implementation and lexicon coverage, NOT validity on real children.";

// ───────────── ES-3 ─────────────
const ITEM = { id: "adv", skillId: "adv.s", form: "number", kitTerms: ["half", "aadha", "numerator"], keyNum: 5, expectsNumber: true };
const NEUTRAL = (o) => ({ turn: 1, lane: "cascade", typed: false, asrSource: "mai-transcribe-2", asrConfidence: 0.9, cls: null, band: "B3", teacherLast3: [], minutes: 6, item: ITEM, ...o });
const LIC = ["evidenceWeight", "verifyDue", "unsureCorrect", "stepState", "recall", "choiceDue", "paceDown", "breakDue", "childWin", "advance", "tryFirst", "evidenceDiscount"];
const es3 = { byCat: {}, failures: [], predicateMisses: [] };
for (const c of ES3) {
  const run = (safetyMode) => {
    let sess = null;
    for (let k = 0; k < (c.prefix ?? 0); k++) sess = step(sess, NEUTRAL({ childText: "5", verdict: "correct", safety: false })).next;
    for (let k = 0; k < (c.priorErrors ?? 0); k++) sess = step(sess, NEUTRAL({ childText: String(3), verdict: "not_yet", safety: false })).next;
    const voice = c.speakerShift != null || c.baseline
      ? { f: { durationMs: 1800, voicedFrac: 0.5, articulationWps: 2.2, onsetMs: 1400, speakerShift: c.speakerShift ?? 0 }, reliable: true,
        z: c.baseline === "own" ? { onsetMs: 0.4, pauseFrac: 0.6, longestPauseMs: 0.5, speechRateWps: -0.5, articulationWps: -0.4, disfluencyPer100Words: 0.7 } : {} }
      : undefined;
    const safety = safetyMode === "layer" ? c.cat === "a" : scanSafety(c.text).distress;
    const input = NEUTRAL({ childText: c.text, verdict: c.verdict, safety, voice, cls: c.act || c.share ? { outcome: "no_evidence", signals: { act: c.act ?? "chit_chat", personalShare: !!c.share, interest: "none", humour: false } } : null });
    return step(sess, input).frame;
  };
  const results = {};
  for (const mode of ["layer", "pipeline"]) {
    const f = run(mode);
    const e = c.expect;
    const fails = [];
    if (e.abstain && !(f.abstain && LIC.every((k) => f[k] === undefined) && f.reasons.length === 0)) fails.push("abstain");
    if (e.noChildWin && f.childWin) fails.push("childWin");
    if (e.unproductiveIfI1ge3 && (c.priorErrors ?? 0) >= 3 && f.stepState?.s !== "stuck_unproductive") fails.push("unproductive");
    if (e.noIdk && f.recall) fails.push("idk");
    if (e.noHedge && (f.unsureCorrect || f.verifyDue)) fails.push("hedge");
    if (e.noVerify && f.verifyDue) fails.push("verify");
    if (e.noChoice && f.choiceDue) fails.push("choice");
    if (e.noReading && ["childWin", "verifyDue", "choiceDue", "paceDown", "breakDue", "recall", "evidenceWeight", "unsureCorrect"].some((k) => f[k])) fails.push("reading");
    if (e.inert && (f.advance || (f.evidenceWeight && f.evidenceWeight.k > 1) || f.childWin || f.verifyDue)) fails.push("inert");
    if (e.acousticUnreliable && f.q.acoustic !== 0) fails.push("acoustic_q");
    if (e.noJokeIfShift && c.speakerShift === 1 && f.childWin?.causes.includes("child_joke")) fails.push("joke");
    if (e.noELicence && (f.paceDown?.why[0].tier === "E" || f.verifyDue?.why[0].tier === "E" || (f.evidenceWeight && f.evidenceWeight.lrE !== 1))) fails.push("e_licence");
    results[mode] = fails;
  }
  const b = (es3.byCat[c.cat] ??= { n: 0, layerPass: 0, pipelinePass: 0 });
  b.n++;
  if (!results.layer.length) b.layerPass++; else es3.failures.push({ id: c.id, text: c.text, mode: "layer", fails: results.layer });
  if (!results.pipeline.length) b.pipelinePass++; else es3.failures.push({ id: c.id, text: c.text, mode: "pipeline", fails: results.pipeline });
  // The FLOOR's own miss, counted independently of the frame: the signal layer's abstain-only backstop (backstop.js) makes
  // the frame pass on these, but the child still gets no helpline unless scanSafety (W2-I) or the classifier fires.
  if (c.cat === "a" && !scanSafety(c.text).distress) { es3.predicateMisses.push(c.text); es3.predicateMissTurns = (es3.predicateMissTurns ?? 0) + 1; if (safetyBackstop(c.text)) es3.backstopCaught = (es3.backstopCaught ?? 0) + 1; }
}
es3.predicateMisses = [...new Set(es3.predicateMisses)];
for (const v of Object.values(es3.byCat)) { v.layerRate = r3(v.layerPass / v.n); v.pipelineRate = r3(v.pipelinePass / v.n); }
es3.n = ES3.length;
out.es3 = es3;
out.method.es3 = "300 hand-written adversarial turns (single author, no κ). 'layer' = the safety flag is the label (tests the signal layer); 'pipeline' = the flag is the REAL predicate server/director/safety.js scanSafety (the production classifier is not run offline), so category-a pipeline misses are predicate misses, owned by W2-I. Since the 2026-10-04 review the layer also abstains on its own backstop (abstain-only), so predicateMisses is counted from scanSafety directly, not from the frame.";

// ───────────── ES-4 ─────────────
const FIRE = {
  hedge: (t) => readText({ childText: t, item: ITEM }).hedge,
  cant_recall: (t) => readText({ childText: t, item: ITEM }).idk?.v === "cant_recall",
  initiative: (t) => readText({ childText: t, item: ITEM }).initiative != null,
  question_depth: (t) => ["why_how", "what_if"].includes(readText({ childText: t, item: ITEM }).question?.depth),
  filler_lead: (t) => readText({ childText: t, item: ITEM }).fillerLead?.v === true,
};
for (const [lex, fire] of Object.entries(FIRE)) {
  const s = ES4.filter((x) => x.lexicon === lex);
  const pred = s.map((x) => fire(x.text));
  const c = confusion(pred, s.map((x) => x.y === 1));
  out.es4[lex] = { ...roundAll(c), passesSGM7: c.precision != null && c.precision >= 0.8, errors: s.filter((x, i) => pred[i] !== (x.y === 1)).map((x) => `${x.y ? "MISS" : "FP"}: ${x.text}`).filter((v, i, a) => a.indexOf(v) === i) };
}
out.method.es4 = "600 turns = 5 lexicons × 60 hand-written frames × 2 fills; single rater who also wrote the lexicons (optimistic); ~half adversarial confusers.";

// ───────────── ES-5 latency ─────────────
{
  const words = ["umm", "matlab", "shayad", "pehle", "2", "phir", "3", "kyunki", "half", "aur", "मुझे", "लगता", "है", "bhool", "gaya", "nahi", "nahi", "5", "why", "toh"];
  let sess = null;
  const ts = [];
  for (let i = 0; i < 10_000; i++) {
    const text = Array.from({ length: 120 }, (_, k) => words[(k * 7 + i) % words.length]).join(" ");
    const input = NEUTRAL({ childText: text, verdict: ["correct", "not_yet", "partial", "ungraded"][i % 4], safety: false, held: i % 5 === 0 ? 1 : 0,
      teacherLast3: ["half numerator denominator compare", "the fraction half", "aadha numerator"], ledger: { mastered: i % 7 === 0 },
      voice: { f: { durationMs: 6000, voicedFrac: 0.6, articulationWps: 2.4, onsetMs: 1500, nucleiPerSec: 4 }, z: { onsetMs: 1, pauseFrac: 1, longestPauseMs: 1, speechRateWps: -1, articulationWps: -1, disfluencyPer100Words: 1 }, reliable: true },
      item: { ...ITEM, id: `lat${Math.floor(i / 6)}` } });
    const t0 = performance.now();
    sess = step(sess, input).next;
    ts.push(performance.now() - t0);
  }
  out.es5 = { n: ts.length, p50Ms: r3(quantile(ts, 0.5)), p99Ms: r3(quantile(ts, 0.99)), maxMs: r3(Math.max(...ts)), bar: "p99 ≤ 30 ms (target ≤ 5 ms)", machine: `node ${process.version}, this container (NOT the ACA image; SG-M18 measures production)` };
}

// ───────────── ES-2 (if run) ─────────────
const es2Path = new URL("./results/es2.json", import.meta.url);
if (fs.existsSync(es2Path)) out.es2 = JSON.parse(fs.readFileSync(es2Path, "utf8")).summary;

fs.writeFileSync(new URL("./results/summary.json", import.meta.url), JSON.stringify(out, null, 1));

// ───────────── print ─────────────
const p = (x) => (x == null ? "  -  " : typeof x === "number" ? x.toFixed(3) : String(x));
console.log(`\nES-1 (${traces.length} traces, ${rows.length} turns; synthetic, labels by construction)`);
console.log("state".padEnd(34), "split", "  n   pos   prec  recall  aucB   FA/100  aucB 95% CI");
for (const [k, v] of Object.entries(out.es1)) {
  if (!v.all) { if (k.includes("episode") || k.includes("composite")) console.log(k.padEnd(34), JSON.stringify(v)); continue; }
  for (const split of ["all", "in", "out"]) {
    const s = v[split];
    console.log((split === "all" ? k : "").padEnd(34), split.padEnd(5), String(s.n).padStart(4), String(s.pos).padStart(5), p(s.precision), p(s.recall), p(s.aucBinary), p(s.falseAlarmsPer100), JSON.stringify(s.aucBinaryCI95), s.aucScore != null ? `aucScore ${p(s.aucScore)}` : "");
  }
}
console.log("childWin by cause:", JSON.stringify(out.es1.childWinByCause));
console.log("sarcasm:", JSON.stringify(out.es1.sarcasmTurns), "guardrails:", JSON.stringify(out.es1.guardrails));
console.log("fire rate /100 turns:", JSON.stringify(out.es1.fireRatePer100));
console.log(`\nES-3 (${ES3.length} adversarial turns): by category`, JSON.stringify(out.es3.byCat));
console.log("ES-3 FLOOR predicate misses (category a, scanSafety alone):", out.es3.predicateMissTurns ?? 0, "turns,", out.es3.predicateMisses.length, "distinct; signal backstop abstained on", out.es3.backstopCaught ?? 0, JSON.stringify(out.es3.predicateMisses));
console.log("ES-3 other failures:", out.es3.failures.length, JSON.stringify(out.es3.failures.slice(0, 20)));
console.log("\nES-4 lexicon precision (n=120 each):");
for (const [k, v] of Object.entries(out.es4)) console.log(k.padEnd(16), "prec", p(v.precision), "recall", p(v.recall), "SG-M7", v.passesSGM7 ? "PASS" : "FAIL", v.errors.slice(0, 8).join(" | "));
console.log("\nES-5 latency:", JSON.stringify(out.es5));
if (out.es2) console.log("\nES-2:", JSON.stringify(out.es2));
