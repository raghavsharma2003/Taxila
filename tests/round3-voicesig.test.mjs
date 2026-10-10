// Round 3 voicesig: the thinking-pause cue for duplex (src/voicesig/holdCue.ts + holdBus.ts), its kv counters, and the
// server's shadow log of what she WOULD have done (server/voicesig/lesson.js would / shadowReasons / shadowDiff).
// Pure: no DOM, no network, no database. Hooks live inside describe blocks (npm test runs every file in one process).
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { trailingFiller, HoldCueCore, HoldCue, HOLD_CUE_DEFAULTS, HOLD_CUE_VER } from "../src/voicesig/holdCue.ts";
import { onThinkingPause, publishThinkingPause, holdBusStats } from "../src/voicesig/holdBus.ts";
import { holdCueAllowed } from "../src/voicesig/flag.ts";
import { turn, config, wouldHintsOf, holdOf, shadowDiff, decisionOf } from "../server/voicesig/lesson.js";
import { validateKv } from "../server/voicesig/adapter.js";
import { emotionWordsDeep } from "../server/voicesig/lint.js";
import { COMPONENTS, EVIDENCE, gateReason } from "../server/voicesig/gate.js";

const ROOT = new URL("..", import.meta.url).pathname;
const DIM = 22;
const fr = (t, speech) => ({ t, rmsDb: speech ? -20 : -60, f0: speech ? 200 : null, speech });
const x0 = () => new Float32Array(DIM);

/** Drive a core over a voiced run then silence; returns the actions seen. */
function drive(core, { voicedMs = 1000, silenceMs = 1500, herAudibleAt = null, resumeAt = null } = {}) {
  const acts = [];
  let t = 0;
  for (; t < voicedMs; t += 20) acts.push([t, core.frame(fr(t, true), x0())]);
  for (; t < voicedMs + silenceMs; t += 20) {
    const speech = resumeAt !== null && t >= voicedMs + resumeAt;
    acts.push([t, core.frame(fr(t, speech), x0(), herAudibleAt !== null && t >= voicedMs + herAudibleAt)]);
  }
  return acts;
}

describe("round3 voicesig: trailingFiller (the TypeScript twin of evals/voicesig/r3/ami_pauses.py trailing_filler)", () => {
  const cfg = { thr: 0.44, minFillerMs: 200, tailGapMs: 120 };
  const sp = (n) => Array.from({ length: n }, () => true);
  test("a >= 200 ms filler run ending at the offset fires", () => {
    const p = [...Array(40).fill(0.05), ...Array(10).fill(0.9)];
    assert.deepEqual(trailingFiller(sp(50), p, 49, cfg), { fired: true, runMs: 200, gapMs: 0 });
  });
  test("a 180 ms run is a long vowel, not a filler", () => {
    const p = [...Array(41).fill(0.05), ...Array(9).fill(0.9)];
    assert.equal(trailingFiller(sp(50), p, 49, cfg).fired, false);
  });
  test("content after the filler ('umm, paanch' + silence) does not fire: the run must end within tailGapMs", () => {
    const p = [...Array(30).fill(0.05), ...Array(12).fill(0.9), ...Array(8).fill(0.05)];
    const r = trailingFiller(sp(50), p, 49, cfg);
    assert.equal(r.fired, false);
    const p2 = [...Array(30).fill(0.05), ...Array(12).fill(0.9), ...Array(6).fill(0.05)];
    assert.equal(trailingFiller(sp(48), p2, 47, cfg).fired, true, "a 120 ms gap still counts");
  });
  test("non-speech frames never count toward a run", () => {
    const p = Array(50).fill(0.9);
    const s = sp(50).map((v, i) => i % 3 !== 0);
    assert.equal(trailingFiller(s, p, 49, cfg).fired, false);
  });
});

describe("round3 voicesig: HoldCueCore (state machine)", () => {
  test("reads once per pause after readAfterMs, publishes only after a fired read, stamped and below 0.5", () => {
    const core = new HoldCueCore({ pComplete: 0.15 });
    const acts = drive(core);
    const reads = acts.filter(([, a]) => a.kind === "read");
    assert.equal(reads.length, 1, "one read per pause");
    const [tRead, read] = reads[0];
    assert.ok(tRead >= 1000 + HOLD_CUE_DEFAULTS.readAfterMs - 20 && tRead <= 1000 + HOLD_CUE_DEFAULTS.readAfterMs + 20, `read at ${tRead}`);
    assert.equal(acts.filter(([, a]) => a.kind === "publish").length, 0, "nothing published before the detector answered");
    // answer: a filler at the end of the voiced run
    const p = new Float32Array(read.frames).fill(0.05);
    for (let i = read.offsetIdx - 11; i <= read.offsetIdx; i++) p[i] = 0.9;
    const r = core.result(read.pauseId, p, read.offsetIdx, 3);
    assert.equal(r.fired, true);
    const a = core.frame(fr(1400, false), x0());
    assert.equal(a.kind, "publish");
    assert.equal(a.est.model, HOLD_CUE_VER);
    assert.equal(a.est.atMs, 1400);
    assert.ok(a.est.pComplete < 0.5, "the cue argues for waiting only");
    assert.ok(a.est.pHoldWanted >= 0.6);
  });
  test("a read that did not fire publishes nothing; speech ends the pause; a late answer for an old pause is ignored", () => {
    const core = new HoldCueCore();
    const acts = drive(core, { silenceMs: 400 });
    const [, read] = acts.find(([, a]) => a.kind === "read");
    assert.equal(core.result(read.pauseId, new Float32Array(read.frames).fill(0.05), read.offsetIdx).fired, false);
    assert.equal(core.frame(fr(1420, false), x0()).kind, "none");
    // the child speaks again: a new run, a new pause
    for (let t = 1440; t < 1800; t += 20) core.frame(fr(t, true), x0());
    let act = { kind: "none" };
    for (let t = 1800; t < 2000 && act.kind !== "read"; t += 20) act = core.frame(fr(t, false), x0());
    assert.equal(act.kind, "read");
    assert.equal(core.result(read.pauseId, new Float32Array(read.frames).fill(0.9), read.offsetIdx), null, "stale pause id");
  });
  test("maxHoldMs bounds the publishing; her audio resets the cue", () => {
    const core = new HoldCueCore({ maxHoldMs: 600 });
    let t = 0;
    for (; t < 1000; t += 20) core.frame(fr(t, true), x0());
    let read = null;
    for (; !read; t += 20) { const a = core.frame(fr(t, false), x0()); if (a.kind === "read") read = a; }
    core.result(read.pauseId, new Float32Array(read.frames).fill(0.9), read.offsetIdx);
    let pubs = 0;
    for (; t < 3000; t += 20) if (core.frame(fr(t, false), x0()).kind === "publish") pubs++;
    assert.ok(pubs > 0 && pubs <= Math.ceil(600 / 20), `published ${pubs} hops`);
    const c2 = new HoldCueCore();
    const acts = drive(c2, { herAudibleAt: 0 });
    assert.equal(acts.filter(([, a]) => a.kind !== "none").length, 0, "her audio: no read, no publish");
  });
  test("a click (< minVoicedMs of voice) is not a pause", () => {
    const core = new HoldCueCore();
    assert.equal(drive(core, { voicedMs: 100 }).filter(([, a]) => a.kind === "read").length, 0);
  });
});

describe("round3 voicesig: HoldCue driver + holdBus", () => {
  test("a sync detector that hears a trailing filler publishes to the bus; narrowband routes are off", () => {
    const got = [];
    const off = onThinkingPause((e) => got.push(e));
    const cue = new HoldCue({ detector: { detect: (_x, T) => { const p = new Float32Array(T).fill(0.05); for (let i = T - 20; i < T; i++) p[i] = 0.9; return p; } }, onEstimate: publishThinkingPause, cfg: { pComplete: 0.15 } });
    let t = 0;
    for (; t < 1000; t += 20) cue.frame(fr(t, true), x0());
    for (; t < 2000; t += 20) cue.frame(fr(t, false), x0());
    off();
    assert.ok(got.length > 10, `published ${got.length}`);
    assert.ok(got.every((e) => e.pComplete === 0.15 && e.model === HOLD_CUE_VER));
    assert.equal(holdBusStats().listeners, 0);
    assert.equal(cue.core.stats.fired, 1);
    for (const mic of ["bt", "speaker_route"]) assert.equal(new HoldCue({ detector: { detect: () => new Float32Array(0) }, onEstimate: () => {}, micClass: mic }).disabled, true, mic);
  });
  test("a throwing detector disables the cue and never throws into the tap", () => {
    const cue = new HoldCue({ detector: { detect: () => { throw new Error("boom"); } }, onEstimate: () => {} });
    let t = 0;
    for (; t < 1000; t += 20) cue.frame(fr(t, true), x0());
    for (; t < 1600; t += 20) assert.doesNotThrow(() => cue.frame(fr(t, false), x0()));
    assert.equal(cue.disabled, true);
  });
  test("a listener that throws never reaches the publisher", () => {
    const off = onThinkingPause(() => { throw new Error("x"); });
    assert.doesNotThrow(() => publishThinkingPause({ atMs: 0, pComplete: 0.1, pHoldWanted: 0.8, model: HOLD_CUE_VER, computeMs: 0 }));
    off();
  });
  test("switch: the cue follows the detector; TAXILA_VOICESIG_HOLDCUE=0 kills it alone; the ship5 config shape is unchanged", () => {
    assert.equal(holdCueAllowed({ mode: "shadow", frontend: true, detector: true }), true);
    assert.equal(holdCueAllowed({ mode: "shadow", frontend: true, detector: false }), false);
    assert.equal(holdCueAllowed({ mode: "off", frontend: false, detector: true }), false);
    assert.equal(holdCueAllowed({ mode: "shadow", frontend: true, detector: true, holdCue: false }), false);
    assert.deepEqual(config({}), { mode: "shadow", frontend: true, detector: true, ver: "vs-seam/1" });
    assert.equal(config({ TAXILA_VOICESIG_HOLDCUE: "0" }).holdCue, false);
  });
});

describe("round3 voicesig: server shadow log (what she would have done)", () => {
  const item = { id: "it1", answer: "12" };
  const kvOf = (f = {}) => ({ v: 1, modelVer: "vs-head/0.1", stage: 0, f: { durationMs: 900, onsetMs: 2400, pauseFrac: 0.3, voicedFrac: 0.6, longestPauseMs: 600, flatVoicedRuns: 1, ...f }, q: { audio: 1, raw: 0, enc: 0, det: 0, micClass: "builtin", langMode: "hinglish" }, computeMs: 2 });
  test("shadow fragileCorrect: reasons unchanged (ship5 contract), the would-hint and hold codes ride in shadowReasons", () => {
    const out = turn({ kv: kvOf({ thinkPauses: 1, pausesRead: 2 }), childText: "umm shayad 12", cls: { outcome: "correct" }, item, classLevel: 5, env: {} });
    assert.deepEqual(out.reasons, ["vs.fragileCorrect", "vs_gate.not_measured_on_children"]);
    assert.deepEqual(out.hints, {}, "shadow hands the Director nothing");
    assert.deepEqual(out.would, { followUpProbe: true });
    assert.deepEqual(out.shadowReasons, ["vs_would.followUpProbe", "vs_hold.fired"]);
    assert.deepEqual(out.trace.hold, { read: 2, fired: 1 });
    assert.deepEqual(out.trace.would, ["followUpProbe"]);
    assert.deepEqual(emotionWordsDeep({ out }), [], "restriction 12: no state-of-mind word anywhere");
  });
  test("a safety turn gets nothing, not even a shadow code", () => {
    const out = turn({ kv: kvOf({ thinkPauses: 3, pausesRead: 3 }), childText: "mujhe marna hai", cls: { outcome: "correct" }, item, classLevel: 5, env: {} });
    assert.equal(out.read, null);
    assert.deepEqual(out.shadowReasons, []);
    assert.deepEqual(out.would, {});
  });
  test("kv counters are validated (ranges) and optional", () => {
    assert.ok(validateKv(kvOf({ thinkPauses: 2, pausesRead: 5 })));
    assert.equal(validateKv(kvOf({ thinkPauses: 999 })), null, "out of range → dropped (never a 400)");
    assert.equal(holdOf(validateKv(kvOf())), null);
    assert.deepEqual(holdOf({ f: { thinkPauses: 0, pausesRead: 4 } }), { read: 4, fired: 0 });
  });
  test("wouldHintsOf: a licence of none hands nothing; a live read is not a counterfactual", () => {
    assert.deepEqual(wouldHintsOf({ state: "fragileCorrect", licence: "none", live: false }), {});
    assert.deepEqual(wouldHintsOf({ state: "searching", licence: "recall_cue", live: false }), { gentlerHint: true });
    assert.deepEqual(wouldHintsOf(null), {});
  });
  test("shadowDiff: same / changed / not_run, move kinds only", () => {
    const vs = { would: { followUpProbe: true } };
    const plan = (kind, hintLevel = 0, probe = null) => ({ r: { move: { kind, say: "words never copied" }, state: { hintLevel, ...(probe ? { pendingProbe: { cls: probe } } : {}) } } });
    assert.deepEqual(shadowDiff(vs, plan("advance"), plan("advance")).codes, ["vs_diff.same"]);
    const d = shadowDiff(vs, plan("advance"), plan("probe", 0, "probe.why"));
    assert.deepEqual(d.codes, ["vs_diff.changed"]);
    assert.equal(d.record.shadow.move, "probe");
    assert.equal(d.record.shadow.probe, "probe.why");
    assert.match(d.record.shadow.shape, /^[0-9a-f]+$/, "the shape only as a hash");
    const g = (shape) => ({ r: { move: { kind: "hint", shape }, state: { hintLevel: 2 } } });
    assert.deepEqual(shadowDiff({ would: { gentlerHint: true } }, g("rung 2 note"), g("gentler rung 2 note")).codes, ["vs_diff.changed"], "a gentler rung's content is a change");
    assert.ok(!JSON.stringify(d).includes("words never copied"));
    assert.deepEqual(shadowDiff(vs, plan("advance"), null).codes, ["vs_diff.not_run"]);
    assert.deepEqual(shadowDiff({ would: {} }, plan("advance"), plan("probe")).codes, []);
    assert.equal(decisionOf(null), null);
  });
});

describe("round3 voicesig: the shipped evidence stays honest", () => {
  test("no state opens the gate on adult or simulated numbers; components carry n / method / population", () => {
    for (const [s, e] of Object.entries(EVIDENCE)) assert.notEqual(gateReason(s, { mode: "on", evidence: EVIDENCE }), null, `${s} (${e.population}) must stay shadow`);
    for (const [k, c] of Object.entries(COMPONENTS)) {
      assert.ok(["adult", "children", "simulated"].includes(c.population), k);
      assert.ok(typeof c.n === "number" && c.n > 0 && c.method && c.at, `${k} has n, method, date`);
    }
  });
  test("the round-3 model card, when present, names its data, licence, population and operating point", { skip: !existsSync(ROOT + "models/voicesig/filler-gru-r3.json") }, () => {
    const card = JSON.parse(readFileSync(ROOT + "models/voicesig/filler-gru-r3.json", "utf8"));
    assert.ok(card.threshold > 0 && card.threshold < 1);
    assert.match(card.trainingData, /AMI/);
    assert.match(card.trainingData, /CC BY 4\.0/);
    assert.ok(card.notCovered.some((x) => /child/i.test(x)), "the card says it is not a child number");
    assert.ok(card.metrics?.test?.event?.precision > 0, "test precision recorded");
  });
});

describe("round3 voicesig: the consented pilot's recorder (src/voicesig/pilotRecorder.ts)", async () => {
  const { pilotCode, PilotRecorder, PILOT_KEY, MAX_MINUTES } = await import("../src/voicesig/pilotRecorder.ts");
  const store = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k), m }; };
  test("only a coordinator's code starts it; anything else is ignored; nothing persists it (round 3 fix, adversarial N4)", () => {
    const s = store();
    assert.equal(pilotCode({ search: "" }, s), null, "no default");
    assert.equal(pilotCode({ search: "?vspilot=1" }, s), null);
    assert.equal(pilotCode({ search: "?vspilot=hello" }, s), null);
    assert.equal(pilotCode({ search: "?vspilot=P07-S1" }, s), "P07-S1");
    // a later lesson on the same device, opened without the link, records nothing (it used to be kept in localStorage)
    assert.equal(pilotCode({ search: "" }, s), null, "never kept on the device");
    assert.equal(pilotCode({ search: "?vspilot=0" }, s), null);
    // a code an earlier build left in storage is removed on sight, and never used
    s.setItem(PILOT_KEY, "P07-S1");
    assert.equal(pilotCode({ search: "" }, s), null);
    assert.equal(s.m.has(PILOT_KEY), false);
  });
  test("records the P chunks as 16-bit 16 kHz WAV with a numbers-only sidecar (clock segments, her spans, kv)", () => {
    const r = new PilotRecorder("P07-S1");
    const chunk = new Float32Array(320).fill(0.5);
    for (let i = 0; i < 50; i++) r.chunk(1_000 + i * 20, chunk);
    r.chunk(5_000, chunk); // a clock jump (dropped chunks)
    r.her(1_100); r.her(1_300); r.her(2_000);
    r.turn(1_500, 800, false, { v: 1, modelVer: "x", stage: 0, f: { durationMs: 800, voicedFrac: 0.5, pauseFrac: 0, longestPauseMs: 0, flatVoicedRuns: 0 }, q: { audio: 1, raw: 0, enc: 0, det: 0, micClass: "builtin", langMode: "hi" }, computeMs: 1 });
    const { wav, sidecar } = r.finish(9_000);
    assert.equal(String.fromCharCode(...wav.slice(0, 4)), "RIFF");
    const dv = new DataView(wav.buffer);
    assert.equal(dv.getUint32(24, true), 16000);
    assert.equal(dv.getUint16(34, true), 16);
    assert.equal(wav.length, 44 + 51 * 320 * 2);
    assert.equal(dv.getInt16(44, true), Math.round(0.5 * 32767));
    assert.deepEqual(sidecar.segments, [{ sample: 0, t: 1_000 }, { sample: 50 * 320, t: 5_000 }]);
    assert.deepEqual(sidecar.herSpans, [[1_100, 1_300], [2_000, 2_000]]);
    assert.equal(sidecar.turns.length, 1);
    assert.equal(sidecar.code, "P07-S1");
    assert.ok(!JSON.stringify(sidecar).match(/text|transcript/), "no words in the sidecar");
    r.chunk(10_000, chunk);
    assert.equal(r.finish().sidecar.samples, 0, "nothing after stop");
    assert.ok(MAX_MINUTES <= 60);
  });
});

describe("round3 voicesig: the pre-registered pilot scorer (evals/voicesig/r3/pilot_score.mjs)", async () => {
  const { judge, scoreSession, fillerF1, clusterBoot, runsOf, BARS } = await import("../evals/voicesig/r3/pilot_score.mjs");
  test("bars are frozen at the protocol's values", () => {
    assert.equal(BARS.detector.precision, 0.8);
    assert.equal(BARS.detector.lo95, 0.72);
    assert.equal(BARS.state.precision, 0.8);
    assert.equal(BARS.cue.precision, 0.85);
    assert.throws(() => { BARS.detector.precision = 0.5; });
  });
  test("runs and the session score: a run counts once, her spans are excluded, coder fillers are the truth", () => {
    const frames = Array.from({ length: 200 }, (_, i) => ({ t: i * 20, speech: true }));
    const p = new Float32Array(200);
    for (let i = 20; i < 35; i++) p[i] = 0.9; // a 300 ms run at 400-700 ms: true (coder marked)
    for (let i = 100; i < 115; i++) p[i] = 0.9; // a 300 ms run at 2000-2300 ms: false
    for (let i = 150; i < 165; i++) p[i] = 0.9; // inside her span: dropped
    assert.equal(runsOf(frames, p, 0.5, [[3000, 3300]]).length, 2);
    const s = scoreSession({ frames, p, thr: 0.5, herMs: [[3000, 3300]], coding: { fillers: [[420, 650], [3500, 3800]], pauses: [[720, "continued"], [2400, "ended"]] },
      cueReads: [{ fired: true, offsetMs: 700 }, { fired: true, offsetMs: 2300 }, { fired: false, offsetMs: 900 }] });
    assert.deepEqual(s, { runs: 2, tp: 1, fillers: 2, hit: 1, cueK: 1, cueN: 2, endsFired: 1, ends: 1 });
  });
  test("judge: passes only with enough runs, children, a high enough lower bound and no failing group", () => {
    const participants = Object.fromEntries(Array.from({ length: 24 }, (_, i) => [`P${String(i).padStart(2, "0")}`, { ageBand: i % 2 ? "9-10" : "11-14", langMode: "hinglish" }]));
    const good = Object.keys(participants).map((child) => ({ child, runs: 20, tp: 18, fillers: 25, hit: 15, cueK: 9, cueN: 10, endsFired: 0, ends: 40 }));
    const r = judge(good, participants);
    assert.equal(r.detector.pass, true, JSON.stringify(r.detector));
    assert.equal(r.cue.pass, true, JSON.stringify(r.cue));
    const few = judge(good.slice(0, 10), participants);
    assert.equal(few.detector.pass, false, "too few children / runs");
    const weakBand = good.map((g, i) => (i % 2 ? { ...g, tp: 12 } : g));
    const w = judge(weakBand, participants);
    assert.equal(w.detector.pass, false, "the 9-10 band fails its own floor");
    assert.ok(w.detector.groupFail.includes("ageBand:9-10"));
    const states = Object.keys(participants).flatMap((child) => Array.from({ length: 6 }, (_, k) => ({ child, state: "fragileCorrect", outcome: k < 5 })));
    const st = judge(good, participants, states);
    assert.equal(st.states.fragileCorrect.n, 144);
    assert.equal(st.states.fragileCorrect.pass, true);
  });
  test("coder agreement and the clustered bootstrap are deterministic", () => {
    assert.equal(fillerF1([[0, 100], [200, 300]], [[50, 120], [500, 600]]), 0.5);
    const a = clusterBoot([{ c: "a", k: 8, n: 10 }, { c: "b", k: 9, n: 10 }, { c: "c", k: 7, n: 10 }]);
    const b = clusterBoot([{ c: "a", k: 8, n: 10 }, { c: "b", k: 9, n: 10 }, { c: "c", k: 7, n: 10 }]);
    assert.deepEqual(a, b);
    assert.equal(a.est, 0.8);
  });
});

describe("round3 voicesig: restriction-12 lint over this round's code and patches", async () => {
  const { emotionWordsIn } = await import("../server/voicesig/lint.js");
  const { readdirSync } = await import("node:fs");
  // comments stripped (they cite the rule by name); identifiers, keys and strings are what must never carry the words
  // (the lint's own API names are the one allowed use of the word: they name the guard, not a reading)
  const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1").replace(/\bemotionWords(?:Deep|In)\b/g, "r12Lint");
  test("evals/voicesig/r3/*.mjs and the added lines of docs/design/round3/voicesig/patches/*.diff", () => {
    const hits = [];
    for (const f of readdirSync(ROOT + "evals/voicesig/r3").filter((n) => n.endsWith(".mjs"))) hits.push(...emotionWordsIn(code(readFileSync(ROOT + "evals/voicesig/r3/" + f, "utf8"))).map((w) => `${f}: ${w}`));
    const pd = ROOT + "docs/design/round3/voicesig/patches";
    for (const f of existsSync(pd) ? readdirSync(pd).filter((n) => n.endsWith(".diff")) : []) {
      const added = readFileSync(pd + "/" + f, "utf8").split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).map((l) => l.slice(1)).join("\n");
      hits.push(...emotionWordsIn(code(added)).map((w) => `${f}: ${w}`));
    }
    assert.deepEqual(hits, []);
  });
});

describe("round3 voicesig: the gate reads a children's interval, and the run length is the card's", async () => {
  const { gateReason: gr, MIN_PRECISION_LO } = await import("../server/voicesig/gate.js");
  const { LADDER: L } = await import("../server/voicesig/ladder.js");
  const { fillerRuns } = await import("../src/voicesig/frontend/gruInput.ts");
  const ladder = Object.fromEntries(Object.keys(L).map((s) => [s, { level: 1, earnedBy: "fixture", at: "2026-10-09" }]));
  const row = (o) => ({ fragileCorrect: { population: "children", precision: 0.83, recall: 0.4, fired: 300, truth: 500, method: "pilot fixture", at: "2026-10-09", ...o } });
  test("a children's point estimate over 0.80 with a lower bound under 0.70 stays shadow; too few children stays shadow", () => {
    assert.equal(gr("fragileCorrect", { mode: "on", evidence: row({ precisionCi95: [0.72, 0.9], children: 24 }), ladder }), null);
    assert.equal(gr("fragileCorrect", { mode: "on", evidence: row({ precisionCi95: [MIN_PRECISION_LO - 0.01, 0.9], children: 24 }), ladder }), "precision_below_bar");
    assert.equal(gr("fragileCorrect", { mode: "on", evidence: row({ precisionCi95: [0.75, 0.9], children: 12 }), ladder }), "too_few_firings");
  });
  test("fillerRuns: the default floor is 200 ms; a card's 300 ms drops a 240 ms run", () => {
    const frames = Array.from({ length: 40 }, (_, i) => ({ t: i * 20, rmsDb: -20, f0: 200, speech: true }));
    const p = Array.from({ length: 40 }, (_, i) => (i >= 10 && i < 22 ? 0.9 : 0.1));
    assert.equal(fillerRuns(frames, p, 0.5).runs.length, 1);
    assert.equal(fillerRuns(frames, p, 0.5, 20, 300).runs.length, 0);
  });
});

describe("round3 voicesig: a one-hop flicker inside a voiced run does not split it", () => {
  test("140 ms + 20 ms gap + 140 ms of voice, then silence: one pause, read once", () => {
    const core = new HoldCueCore();
    const acts = [];
    let t = 0;
    for (let k = 0; k < 7; k++, t += 20) acts.push(core.frame(fr(t, true), x0()));
    acts.push(core.frame(fr(t, false), x0())); t += 20;
    for (let k = 0; k < 7; k++, t += 20) acts.push(core.frame(fr(t, true), x0()));
    for (let k = 0; k < 30; k++, t += 20) acts.push(core.frame(fr(t, false), x0()));
    assert.equal(acts.filter((a) => a.kind === "read").length, 1, "the 280 ms run counts once the flicker is bridged");
    assert.equal(core.stats.pauses, 1);
  });
});
