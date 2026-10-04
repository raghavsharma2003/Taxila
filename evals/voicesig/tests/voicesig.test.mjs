// voicesig unit + gate tests (SPEC §2.3, §7 VS-A10/A12, G-VS-ONE, G-VS-DXEQ, G-VS-LABEL, G-VS-SAFETY, G-VS-SCHEMA,
// G-VS-NODOUBLE, SY-1, SY-2, SY-4). Run by `npm test` through the one-line shim tests/voicesig.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { RATE, FrameAnalyzer } from "../../../src/voice/dsp.ts";
import { FrameCore, frameStats } from "../../../src/voicesig/frontend/frames.ts";
import { LogMel, logMelFrame, melFilters, N_BINS, N_MELS } from "../../../src/voicesig/frontend/logmel.ts";
import { GRU_DIM, GruInput, fillerRuns } from "../../../src/voicesig/frontend/gruInput.ts";
import { FrontEndCore } from "../../../src/voicesig/frontend/bus.ts";
import { Encoder, encoderStats } from "../../../src/voicesig/frontend/encoder.ts";
import { turnAcoustics, finalRelDb } from "../../../src/voicesig/turn.ts";
import { VoicesigHead } from "../../../src/voicesig/head.ts";
import { ChildAudioTracker } from "../../../src/duplex/audio.ts";
import { toSignalInput, validateKv, replaceTimingTerm, updateBaseline, vsMode } from "../../../server/voicesig/adapter.js";
import { VsBaseline, welfordStep, subjectOf, saveBaseline, loadBaseline } from "../../../server/voicesig/baseline.js";
import { LADDER, VS_STATES, capFor, afterRefit } from "../../../server/voicesig/ladder.js";
import { score } from "../../../server/voicesig/rules.js";
import { fitIsotonic, applyIsotonic, ece, fitPlatt } from "../../../server/voicesig/calibrate.js";
import { auroc, clusterBoot } from "../metrics.mjs";
import { simulate } from "../simulate-pilot.mjs";
import { evaluate } from "../harness.mjs";

const ROOT = new URL("../../../", import.meta.url).pathname;

/** 16 kHz audio from segments: { ms, f0 } (two-harmonic tone, optional glide to f1) or { ms } (near-silence). */
function synth(segments, { amp = 0.2, noise = 0.0005, seed = 7 } = {}) {
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff - 0.5) * 2;
  const total = segments.reduce((a, g) => a + Math.round((g.ms / 1000) * RATE), 0);
  const x = new Float32Array(total);
  let i = 0, phase = 0;
  for (const g of segments) {
    const n = Math.round((g.ms / 1000) * RATE);
    for (let k = 0; k < n; k++, i++) {
      const f = g.f0 ? g.f0 + ((g.f1 ?? g.f0) - g.f0) * (k / n) : 0;
      phase += (2 * Math.PI * f) / RATE;
      x[i] = (g.f0 ? amp * (g.a ?? 1) * (Math.sin(phase) + 0.4 * Math.sin(2 * phase)) : 0) + noise * rnd();
    }
  }
  return x;
}
const chunks = (x, t0 = 0) => { const out = []; for (let i = 0; i + 320 <= x.length; i += 320) out.push({ t: t0 + (i / RATE) * 1000, p: x.slice(i, i + 320) }); return out; };

// A "turn": 1 s room, her audio ends at 1000 ms, child silent for `gap` ms, then speech with a pause.
function turnAudio(gap, { lead = 0 } = {}) {
  const segs = [{ ms: 1000 }, { ms: gap }];
  if (lead) segs.push({ ms: lead, f0: 210 });                       // flat "ummm"
  segs.push({ ms: 400, f0: 230, f1: 260 }, { ms: 120 }, { ms: 300, f0: 250, f1: 200 }, { ms: 500, f0: 240, f1: 210 }, { ms: 600 }, { ms: 400, f0: 220, f1: 250 }, { ms: 800 });
  return synth(segs);
}

// ───────────── front-end ─────────────

test("G-VS-DXEQ (frames): FrameCore P frames are byte-identical to the shipped FrameAnalyzer", () => {
  const x = turnAudio(1500);
  const fa = new FrameAnalyzer();
  const fc = new FrameCore();
  const a = [], b = [];
  for (const c of chunks(x)) { a.push(...fa.push(c.p, c.t)); b.push(...fc.push(c)); }
  assert.equal(a.length, b.length);
  for (let i = 0; i < a.length; i++) {
    assert.equal(b[i].t, a[i].t); assert.equal(b[i].rmsDb, a[i].rmsDb); assert.equal(b[i].f0, a[i].f0); assert.equal(b[i].speech, a[i].speech);
  }
});

test("G-VS-DXEQ (duplex): ChildAudioTracker fed by the shared front-end equals the old featureWorklet path, every frame", () => {
  const x = turnAudio(900, { lead: 400 });
  const oldT = new ChildAudioTracker(), newT = new ChildAudioTracker();
  const fa = new FrameAnalyzer(), fe = new FrontEndCore();
  const lin = (db) => Math.pow(10, db / 20);
  let n = 0;
  for (const c of chunks(x)) {
    const fo = fa.push(c.p, c.t), fn = fe.push(c.t, c.p);
    assert.equal(fo.length, fn.length);
    for (let i = 0; i < fo.length; i++) {
      const ro = oldT.push(fo[i].t, lin(fo[i].rmsDb), fo[i].f0), rn = newT.push(fn[i].t, lin(fn[i].rmsDb), fn[i].f0);
      assert.deepEqual(rn, ro);
      assert.equal(JSON.stringify(newT.prosody()), JSON.stringify(oldT.prosody()));
      assert.equal(JSON.stringify(newT.snapshot()), JSON.stringify(oldT.snapshot()));
      n++;
    }
  }
  assert.ok(n > 200);
});

test("G-VS-DXEQ (worklet): taxila-tap2 P chunks equal taxila-feature-tap chunks sample for sample; R joins aligned", async () => {
  const procs = {};
  const posted = { "taxila-feature-tap": [], "taxila-tap2": [] };
  globalThis.sampleRate = 48_000;
  globalThis.currentTime = 0;
  globalThis.AudioWorkletProcessor = class { constructor() { this.port = { onmessage: null, postMessage: (m) => posted[this.constructor.__name].push(m) }; } };
  globalThis.registerProcessor = (name, ctor) => { ctor.__name = name; procs[name] = ctor; };
  await import("../../../src/voice/featureWorklet.ts");
  await import("../../../src/voicesig/frontend/tapWorklet.ts");
  const A = new procs["taxila-feature-tap"](), B = new procs["taxila-tap2"]();
  let ph = 0;
  for (let q = 0; q < 600; q++) {
    const P = new Float32Array(128);
    for (let i = 0; i < 128; i++) { ph += (2 * Math.PI * 220) / 48_000; P[i] = 0.3 * Math.sin(ph) + 0.1 * Math.sin(3.1 * ph); }
    const R = P.map((v) => v * 0.5);
    globalThis.currentTime = (q * 128) / 48_000;
    A.process([[P]]);
    B.process(q >= 200 ? [[P], [R]] : [[P]]);              // R joins mid-stream (a second getUserMedia resolves later)
  }
  const a = posted["taxila-feature-tap"], b = posted["taxila-tap2"];
  assert.equal(a.length, b.length);
  for (let i = 0; i < a.length; i++) { assert.equal(b[i].t, a[i].t); assert.deepEqual(Array.from(b[i].p), Array.from(a[i].x)); }
  const withR = b.filter((m) => m.r);
  assert.ok(withR.length > 50, "R chunks flow after the join");
  // Same windows: R is half of P in amplitude (−6.02 dB) once the fresh decimator has settled.
  const late = withR.slice(5);
  for (const m of late) {
    let sp = 0, sr = 0;
    for (let i = 0; i < 320; i++) { sp += m.p[i] ** 2; sr += m.r[i] ** 2; }
    assert.ok(Math.abs(10 * Math.log10(sr / sp) + 6.02) < 0.3, `R/P level ${10 * Math.log10(sr / sp)}`);
  }
});

test("R track: raw dB tracks the same window as P; her-audible frames carry no raw values (SY-4)", () => {
  const x = turnAudio(800);
  let her = true;
  const fc = new FrameCore({ herAudible: (t) => her && t < 1000 });
  const out = [];
  for (const c of chunks(x)) out.push(...fc.push({ ...c, r: c.p.map((v) => v * 0.5) }));
  const during = out.filter((f) => f.t < 1000), after = out.filter((f) => f.t > 1100 && f.speech);
  assert.ok(during.every((f) => f.rawDb === undefined), "no R values while her audio is audible");
  assert.ok(after.length > 20);
  for (const f of after) assert.ok(Math.abs(f.rawDb - (f.rmsDb - 6.0206)) < 1e-3, `${f.rawDb} vs ${f.rmsDb}`);
  her = false;
});

test("G-VS-ONE: one analysis per chunk however many consumers subscribe; one encoder pass per turnSeq; one session", async () => {
  Encoder.resetShared();
  const runs = [];
  const fakeOrt = {
    Tensor: class { constructor(type, data, dims) { this.data = data; this.dims = dims; } },
    InferenceSession: { create: async () => ({ run: async (feeds) => { runs.push(feeds); return { logits: { data: [0.7], dims: [1, 1] }, pooled: { data: new Float32Array(384), dims: [1, 384] } }; } }) },
  };
  const enc = Encoder.shared(fakeOrt, { model: "x.onnx", now: () => 0 });
  assert.equal(Encoder.shared(fakeOrt, { model: "other.onnx" }), enc, "a second request returns the same encoder");
  assert.equal(await enc.open(), true);
  const s0 = encoderStats.sessionsCreated;
  await enc.open();
  assert.equal(encoderStats.sessionsCreated, s0, "open() is idempotent");
  const fe = new FrontEndCore({ encoder: enc });
  let seen = 0;
  fe.onFrame(() => seen++); fe.onFrame(() => {}); // duplex glue + src/voice + head would all subscribe
  const head = new VoicesigHead(fe, { now: () => 0 });
  const calls0 = frameStats.analyzerCalls;
  const cs = chunks(turnAudio(700));
  for (const c of cs) fe.push(c.t, c.p);
  assert.equal(frameStats.analyzerCalls - calls0, cs.length, "exactly one FrameAnalyzer push per chunk");
  assert.ok(seen > 0);
  const passes = [];
  fe.onEncoderPass((p) => passes.push(p));
  const runs0 = runs.length;
  fe.requestPass(7, 3000); fe.requestPass(7, 3100);            // duplex candidate end + voicesig commit, same turn
  await fe.pass(7);
  assert.equal(runs.length - runs0, 1, "one pass for one turnSeq");
  assert.equal(passes.length, 1);
  head.dispose();
  Encoder.resetShared();
});

test("log-mel: Slaney filters are normalised triangles; a 1 kHz tone peaks in the right band; streaming == batch", () => {
  const w = melFilters();
  for (let m = 0; m < N_MELS; m++) { let s = 0; for (let k = 0; k < N_BINS; k++) s += w[m * N_BINS + k]; assert.ok(s > 0, `band ${m} empty`); }
  const x = synth([{ ms: 100, f0: 1000 }], { noise: 0 }).map((v, i) => 0.3 * Math.sin((2 * Math.PI * 1000 * i) / RATE));
  const lm = logMelFrame(x.subarray(0, 400));
  const peak = lm.indexOf(Math.max(...lm));
  // Slaney mel of 1 kHz = 15; 82 points over [0, mel(8000)=45.2] → band ≈ 26.
  assert.ok(Math.abs(peak - 26) <= 1, `peak band ${peak}`);
  const y = turnAudio(500);
  const a = new LogMel(1, 10_000), b = new LogMel(1, 10_000);
  const fa = [], fb = [];
  for (let i = 0; i + 320 <= y.length; i += 320) fa.push(...a.push(y.slice(i, i + 320), (i / RATE) * 1000));
  for (let i = 0; i + 1000 <= y.length; i += 1000) fb.push(...b.push(y.slice(i, i + 1000), (i / RATE) * 1000));
  const n = Math.min(fa.length, fb.length);
  assert.ok(n > 100);
  for (let i = 0; i < n; i++) { assert.equal(fa[i].t, fb[i].t); assert.deepEqual(Array.from(fa[i].v), Array.from(fb[i].v)); }
  const win = a.whisperWindow(800);
  assert.equal(win.length, 80 * 800);
  assert.ok(Math.max(...win) <= (Math.max(...fa.flatMap((f) => Array.from(f.v))) + 4) / 4 + 1e-6);
});

test("SY-2: GRU inputs and turn features are gain-invariant over ±12 dB (relative channels only)", () => {
  const x = turnAudio(1200);
  const run = (g) => {
    const fc = new FrameCore(), gi = new GruInput(), lm = new LogMel(1, 10_000);
    const rows = [], frames = [];
    for (const c of chunks(x.map((v) => v * g))) {
      const ms = lm.push(c.p, c.t);
      for (const f of fc.push(c)) {
        frames.push(f);
        const m = ms.reduce((best, mm) => (!best || Math.abs(mm.t - f.t) < Math.abs(best.t - f.t) ? mm : best), null);
        rows.push(Array.from(gi.next(f, m && Math.abs(m.t - f.t) <= 6 ? m.v : null)));
      }
    }
    return { rows, ac: turnAcoustics({ frames, teacherEndAt: 1000, words: 4 }) };
  };
  const base = run(1), lo = run(0.25), hi = run(3.98);
  for (const o of [lo, hi]) {
    assert.ok(Math.abs(o.ac.onsetMs - base.ac.onsetMs) <= 20, `onset ${o.ac.onsetMs} vs ${base.ac.onsetMs}`);
    assert.ok(Math.abs(o.ac.pauseFrac - base.ac.pauseFrac) <= 0.05);
    let d = 0, n = 0;
    for (let i = 60; i < base.rows.length; i++) for (const k of [2, 3, ...Array.from({ length: 16 }, (_, j) => 6 + j)]) { d += Math.abs(o.rows[i][k] - base.rows[i][k]); n++; }
    assert.ok(d / n < 0.1, `mean relative-channel drift ${d / n}`);
  }
});

test("SY-1: onset error vs a known inserted silence ≤ 40 ms median, ≤ 120 ms worst (0.3-6 s)", () => {
  const errs = [];
  for (const gap of [300, 600, 1000, 1800, 3000, 4500, 6000]) {
    const fc = new FrameCore(), frames = [];
    for (const c of chunks(turnAudio(gap))) frames.push(...fc.push(c));
    const ac = turnAcoustics({ frames, teacherEndAt: 1000 });
    errs.push(Math.abs(ac.onsetMs - gap));
  }
  errs.sort((a, b) => a - b);
  assert.ok(errs[Math.floor(errs.length / 2)] <= 40, `median ${errs}`);
  assert.ok(errs.at(-1) <= 120, `worst ${errs}`);
});

test("filler runs: lead time counts leading filled runs only; F7 needs raw frames", () => {
  const fr = Array.from({ length: 100 }, (_, i) => ({ t: i * 20, rmsDb: -20, f0: 200, speech: i >= 10 }));
  const p = fr.map((_, i) => (i >= 10 && i < 30 ? 0.9 : i >= 60 && i < 75 ? 0.9 : 0.1));
  const r = fillerRuns(fr, p, 0.5);
  assert.equal(r.runs.length, 2);
  assert.equal(r.leadMs, 400);
  assert.equal(finalRelDb(fr, 0, 2000), null, "no raw track → no F7");
  const fr2 = fr.map((f, i) => ({ ...f, rawDb: i >= 85 ? -14 : -20 }));
  assert.equal(finalRelDb(fr2, 0, 2000), 6);
});

test("head: stage-0 kv validates on the server; a detector adds lead time; the head never reports stage 2", async () => {
  const fe = new FrontEndCore();
  const fakeOrt = { Tensor: class { constructor(t, d, dims) { this.data = d; this.dims = dims; } } };
  const filler = { ort: fakeOrt, thr: 0.5, ver: "test", session: { run: async (feeds) => { const T = feeds.x.dims[1]; return { p: { data: Float32Array.from({ length: T }, (_, i) => (i * 20 < 2400 - 1000 + 400 && i * 20 >= 1500 - 1000 ? 0.9 : 0.05)) } }; } } };
  const head = new VoicesigHead(fe, { filler, now: () => 0 });
  for (const c of chunks(turnAudio(500, { lead: 600 }))) fe.push(c.t, c.p);
  const kv = await head.commit({ fromT: 1000, toT: 6000, teacherEndAt: 1000, words: 3, langMode: "hinglish", micClass: "builtin" });
  assert.ok(kv);
  assert.equal(kv.stage, 0);
  assert.equal(kv.q.det, 1);
  assert.ok(kv.f.fillerLeadMs >= 400, `lead ${kv.f.fillerLeadMs}`);
  assert.ok(kv.f.contentOnsetMs > kv.f.onsetMs);
  assert.ok(validateKv(kv), "server allowlist admits what the device sends");
  assert.ok(!("aLogit" in kv));
  assert.ok(GRU_DIM === 22);
  head.dispose();
});

// ───────────── server ─────────────

const kvOf = (f = {}, q = {}) => ({ v: 1, modelVer: "t", stage: 0, f: { durationMs: 900, onsetMs: 1500, pauseFrac: 0.1, voicedFrac: 0.6, longestPauseMs: 100, flatVoicedRuns: 0, ...f }, q: { audio: 1, raw: 0, enc: 0, det: 0, micClass: "builtin", langMode: "hinglish", ...q }, computeMs: 3 });
const matureBaseline = () => {
  const b = new VsBaseline();
  for (let i = 0; i < 30; i++) b.update("answer", "hinglish", "number", { onsetMs: 1200 + (i % 5) * 150, pauseFrac: 0.08 + (i % 3) * 0.02, durationMs: 900 });
  return b;
};

test("G-VS-SAFETY: 10k generated safety turns abstain 100% with no reason codes and LR 1", () => {
  let ok = 0;
  for (let i = 0; i < 10_000; i++) {
    const v = ["correct", "partial", "not_yet", "ungraded"][i % 4];
    const out = toSignalInput(kvOf({ onsetMs: (i * 37) % 20_000, fillerLeadMs: (i * 13) % 2000 }, { det: i % 2 }), { verdict: v, safety: true, mode: ["on", "shadow", "off"][i % 3], baseline: matureBaseline(), ling: { idk: i % 5 ? null : "cant_recall" } });
    if (out.abstain && out.lrV === 1 && out.lrVApplied === 1 && out.reasons.length === 0 && out.state === null) ok++;
  }
  assert.equal(ok, 10_000);
});

test("adapter: off → null; shadow and the shipped L0 ladder never apply an LR, even in mode on", () => {
  assert.equal(vsMode({}), "off");
  assert.equal(toSignalInput(kvOf(), { verdict: "correct", safety: false, mode: "off" }), null);
  const b = matureBaseline();
  for (const mode of ["shadow", "on"]) {
    const slow = toSignalInput(kvOf({ onsetMs: 6000, pauseFrac: 0.4 }), { verdict: "correct", safety: false, mode, baseline: b, ling: { hedge: true }, deltaFitted: true });
    assert.equal(slow.state, "fragileCorrect");
    assert.equal(slow.lrVApplied, 1);
    assert.equal(slow.shadow, true);
  }
  assert.ok(VS_STATES.every((s) => LADDER[s].level === 0), "every state ships at L0");
});

test("adapter: a promoted + calibrated state applies an LR within its cap; disagreement nulls the state", () => {
  const b = matureBaseline();
  const ladder = { ...LADDER, fragileCorrect: { level: 1, earnedBy: "test", at: "2026-10-04" }, fluentRecall: { level: 1, earnedBy: "test", at: "2026-10-04" } };
  const cal = { h1: { kind: "identity" }, h2: { kind: "identity" }, h3: { kind: "identity" }, h4: { kind: "identity" } };
  const out = toSignalInput(kvOf({ onsetMs: 6000, pauseFrac: 0.4 }), { verdict: "correct", safety: false, mode: "on", baseline: b, ling: { hedge: true }, ladder, cal, deltaFitted: true });
  assert.equal(out.state, "fragileCorrect");
  assert.ok(out.lrVApplied <= 1 && out.lrVApplied >= 0.9, `lr ${out.lrVApplied}`);
  // voice says fluent (fast, unfilled) but the text hedges → SL-11 abstain
  const dis = toSignalInput(kvOf({ onsetMs: 300 }), { verdict: "correct", safety: false, mode: "on", baseline: b, ling: { hedge: true, repairDir: "right_to_wrong" }, ladder, cal: { h1: { kind: "platt", a: 3, b: 3 } }, deltaFitted: true });
  assert.notEqual(dis.state, "fluentRecall");
  // young baseline → maturity 0 → LR exactly 1 whatever the state
  const young = toSignalInput(kvOf({ onsetMs: 6000 }), { verdict: "correct", safety: false, mode: "on", baseline: new VsBaseline(), ling: { hedge: true }, ladder, cal });
  assert.equal(young.lrV, 1);
  // low audio quality → g = 0
  const noisy = toSignalInput(kvOf({ onsetMs: 6000 }, { audio: 0.4 }), { verdict: "correct", safety: false, mode: "on", baseline: b, ling: { hedge: true }, ladder, cal });
  assert.equal(noisy.lrV, 1);
});

test("adapter: searching vs absent split, licences, and voice-only costly moves are refused", () => {
  const b = matureBaseline();
  const s = toSignalInput(kvOf({ onsetMs: 5000, fillerLeadMs: 900 }, { det: 1 }), { verdict: "ungraded", safety: false, mode: "shadow", baseline: b, ling: { idk: "cant_recall" }, deltaFitted: true });
  assert.equal(s.state, "searching");
  assert.equal(s.licence, "fsrs_lapse_route");
  const a = toSignalInput(kvOf({ onsetMs: 500 }), { verdict: "ungraded", safety: false, mode: "shadow", baseline: b, ling: { idk: "not_known" }, deltaFitted: true });
  assert.equal(a.state, "absent");
  assert.equal(a.licence, "teach_fresh");
  // heldBelief without O3 history is voice-only → licence none (costly: contrast correction needs Tier T)
  const h = toSignalInput(kvOf({ onsetMs: 600 }), { verdict: "not_yet", safety: false, mode: "shadow", baseline: b, ling: {}, deltaFitted: true });
  if (h.state === "heldBelief") assert.equal(h.licence, "none");
});

test("G-VS-NODOUBLE: replaceTimingTerm never leaves the cap for any input (property)", () => {
  let s = 3;
  const r = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = 0; i < 20_000; i++) {
    const st = VS_STATES[i % VS_STATES.length], lvl = i % 4, cap = capFor(st, lvl);
    const v = replaceTimingTerm(0.5 + r() * 1.5, 0.3 + r() * 3, cap);
    assert.ok(v >= cap[0] - 1e-12 && v <= cap[1] + 1e-12);
  }
  assert.deepEqual(capFor("fluentRecall", 0), [1, 1]);
  assert.deepEqual(afterRefit({ level: 2, earnedBy: "m", at: "x" }, { passed: false, measurementId: "m2", at: "y" }).level, 1);
  assert.deepEqual(afterRefit({ level: 2, earnedBy: "m", at: "x" }, { passed: true, measurementId: "m2", at: "y" }).level, 2);
});

test("validateKv: unknown fields, out-of-range values and a device-sent state name are rejected", () => {
  assert.equal(validateKv({ ...kvOf(), f: { ...kvOf().f, state: 1 } }), null);
  assert.equal(validateKv({ ...kvOf(), f: { ...kvOf().f, onsetMs: -5 } }), null);
  assert.equal(validateKv({ ...kvOf(), aLogit: [0, 0, 0, 99] }), null);
  assert.equal(validateKv({ ...kvOf(), q: { ...kvOf().q, micClass: "x" } }), null);
  assert.ok(validateKv(kvOf()));
});

test("baseline: Welford equals server/voice/features.js; z null below 8; low-q turns never update", async () => {
  const vf = await import("../../../server/voice/features.js");
  let a = { n: 0, nTotal: 0, mean: 0, m2: 0 }, b = { ...a };
  for (let i = 0; i < 400; i++) { const x = Math.sin(i) * 3 + i * 0.01; a = welfordStep(a, x); b = vf.welfordStep(b, x); }
  assert.deepEqual(a, b);
  const base = new VsBaseline();
  for (let i = 0; i < 7; i++) base.update("answer", "hi", "number", { onsetMs: 1000 + i * 100 });
  assert.equal(base.z("answer", "hi", "number", { onsetMs: 2000 }).z.onsetMs, null);
  base.update("answer", "hi", "number", { onsetMs: 1500 });
  assert.ok(Number.isFinite(base.z("answer", "hi", "number", { onsetMs: 2000 }).z.onsetMs));
  assert.equal(updateBaseline(base, kvOf({}, { audio: 0.3 }), { safety: false }), false);
  assert.equal(updateBaseline(base, kvOf(), { safety: true }), false);
  assert.equal(VsBaseline.maturity(7), 0);
});

test("baseline I/O: nothing persists without V2; with V2 rows are keyed by HMAC subject, never the child id", async () => {
  const calls = [];
  const q = async (sql, params) => { calls.push({ sql, params }); return sql.startsWith("insert into voicesig.baseline") ? [1] : []; };
  const key = "k".repeat(32);
  const l = await loadBaseline(q, { childId: "c1", key, v2: false });
  assert.equal(l.persisted, false);
  assert.equal(calls.length, 0);
  l.baseline.update("answer", "hi", "number", { onsetMs: 1000 });
  assert.equal(await saveBaseline(q, { childId: "c1", key, v2: false, band: "B3", consentVer: "vs-1" }, l.baseline), 0);
  assert.equal(calls.length, 0);
  assert.equal(await saveBaseline(q, { childId: "c1", key, v2: true, band: "B3", consentVer: "vs-1" }, l.baseline), 1);
  const sub = subjectOf("c1", key);
  assert.ok(calls.every((c) => Buffer.isBuffer(c.params[0]) && c.params[0].equals(sub)));
  assert.ok(calls.filter((c) => c.sql.startsWith("insert into voicesig.baseline")).every((c) => !c.params.includes("c1")));
  assert.throws(() => subjectOf("c1", "short"));
});

test("rules: E terms vanish under low audio quality; 9-10 halves them; safety abstains", () => {
  const z = { onsetMs: 2.5, pauseFrac: 1.5 };
  const hi = score({ verdict: "correct", z, qAudio: 1, deltaFitted: true });
  const lo = score({ verdict: "correct", z, qAudio: 0.3, deltaFitted: true });
  const young = score({ verdict: "correct", z, qAudio: 1, deltaFitted: true, ageBand: "9-10" });
  assert.ok(hi.sE.h1 < 0);
  assert.equal(lo.sE.h1, 0);
  assert.equal(young.sE.h1, hi.sE.h1 / 2);
  assert.equal(score({ verdict: "correct", safety: true }).abstain, true);
  assert.equal(hi.calibrated, false, "no fitted table → shadow only");
});

test("calibration + metrics: isotonic is monotone, ECE of perfect predictions is 0, AUROC handles ties, cluster CI covers", () => {
  const s = [0, 1, 2, 3, 4, 5, 6, 7], y = [0, 0, 1, 0, 1, 1, 1, 1];
  const t = fitIsotonic(s, y);
  for (let i = 1; i < t.y.length; i++) assert.ok(t.y[i] >= t.y[i - 1]);
  assert.ok(applyIsotonic(t, 7) > applyIsotonic(t, 0));
  assert.equal(ece([0, 0, 1, 1], [0, 0, 1, 1]), 0);
  assert.equal(auroc([1, 1, 1, 1], [0, 1, 0, 1]), 0.5);
  assert.equal(auroc([0, 1, 2, 3], [0, 0, 1, 1]), 1);
  const p = fitPlatt([-2, -1, 0, 1, 2], [0, 0, 1, 1, 1]);
  assert.ok(p.a > 0);
  const rows = Array.from({ length: 200 }, (_, i) => ({ c: `c${i % 20}`, s: i % 7, y: i % 7 > 3 ? 1 : 0 }));
  const b = clusterBoot(rows, (r) => r.c, (rs) => auroc(rs.map((r) => r.s), rs.map((r) => r.y)), { B: 200 });
  assert.ok(b.lo <= b.est && b.est <= b.hi && b.clusters === 20);
});

test("harness: runs end to end on SIMULATED pilot rows; safety rows abstain; results carry n and children", () => {
  const res = evaluate(simulate({ children: 12, effect: 1, seed: 5 }), { B: 100 });
  assert.equal(res.children, 12);
  assert.equal(res.metrics["VS-A12"].value, 1);
  assert.ok(Number.isFinite(res.metrics["VS-A1"].value));
  assert.ok(res.metrics["VS-A1"].ci95.length === 2);
});

// ───────────── lints ─────────────

function files(dir, ext = /\.(js|mjs|ts|py)$/) {
  const out = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { if (n !== "results" && n !== "node_modules" && n !== ".work") out.push(...files(p, ext)); }
    else if (ext.test(n)) out.push(p);
  }
  return out;
}
function stripComments(src, py) {
  if (py) return src.replace(/"""[\s\S]*?"""/g, "").replace(/#.*$/gm, "");
  let out = "", i = 0, q = null;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (q) { out += c; if (c === "\\") { out += n ?? ""; i += 2; continue; } if (c === q) q = null; i++; continue; }
    if (c === '"' || c === "'" || c === "`") { q = c; out += c; i++; continue; }
    if (c === "/" && n === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (c === "/" && n === "*") { i += 2; while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++; i += 2; continue; }
    out += c; i++;
  }
  return out;
}
/** SIGNALS-SPEC §3.1 regex + SPEC §1.1 additions (unsure, confident/confidence, doubt, nervous, hesitant, emotion*). */
const AFFECT = /frustrat|bored|anxi|sad\b|happy|arous|valence|mood|stress|tired|fatigue|confus|delight|emotion|feel|upset|angry|vibe|unsure|confiden|doubt|nervous|hesitant/i;
/**
 * FIXED allowlist. `asrConfidence` / `asrConf` are the STT's own score (an input name). The placement harness predates the
 * lint and is a research inventory that names EXCLUDED models; it ships nothing.
 */
const ALLOW = new Set(["asrConfidence", "asrConf", "unsureCorrect"]);
/** The lint's own file holds the forbidden list itself. */
const ALLOW_DIRS = ["evals/voicesig/placement/", "evals/voicesig/tests/"];

test("G-VS-LABEL: no state-of-mind or affect word in any identifier, key or string under the voicesig folders", () => {
  const scope = ["src/voicesig", "server/voicesig", "evals/voicesig", "scripts/voicesig"].flatMap((d) => files(join(ROOT, d)));
  const hits = [];
  for (const f of scope) {
    const rel = f.slice(ROOT.length);
    if (ALLOW_DIRS.some((d) => rel.startsWith(d))) continue;
    const code = stripComments(readFileSync(f, "utf8"), f.endsWith(".py"));
    for (const m of code.matchAll(/[\p{L}_$][\p{L}\p{N}_$-]*/gu)) if (!ALLOW.has(m[0]) && AFFECT.test(m[0])) hits.push(`${rel}: ${m[0]}`);
  }
  assert.deepEqual(hits, []);
  assert.ok(scope.length > 15);
});

test("G-VS-LABEL: every exported state name is a knowledge state or a move", () => {
  assert.deepEqual([...VS_STATES].sort(), ["absent", "effortfulGuess", "fluentRecall", "fragileCorrect", "heldBelief", "rapidGuess", "searching", "workingAloud"]);
  for (const s of VS_STATES) assert.ok(!AFFECT.test(s), s);
});

test("G-VS-SCHEMA: the migration proposal holds no per-turn history, text, audio, embedding or state column", () => {
  const sql = readFileSync(join(ROOT, "docs/design/voice-signals/migration-proposal.sql"), "utf8").toLowerCase();
  const code = sql.replace(/--.*$/gm, "");
  assert.ok(/create schema if not exists voicesig/.test(code));
  for (const bad of [/\btranscript\b/, /\btext_raw\b/, /\baudio\b/, /\bembedding\b/, /\bstate\b\s+text/, /\bturn_id\b/, /\butterance\b/, /\bvs_state\b/]) assert.ok(!bad.test(code), `schema mentions ${bad}`);
  for (const t of code.matchAll(/create table if not exists (\S+)/g)) assert.ok(t[1].startsWith("voicesig."), t[1]);
  assert.ok(/on delete cascade/.test(code), "erasure cascades");
});

test("boundaries: voicesig imports nothing from duplex or server/signals internals; nothing imports a research arm", () => {
  for (const f of [...files(join(ROOT, "src/voicesig")), ...files(join(ROOT, "server/voicesig"))]) {
    const code = readFileSync(f, "utf8");
    for (const m of code.matchAll(/from\s+["']([^"']+)["']/g)) {
      assert.ok(!/duplex|server\/signals|\/signals\//.test(m[1]) || f.includes("/tests/"), `${f.slice(ROOT.length)} imports ${m[1]}`);
      assert.ok(!/research|shadow-arm|placement/.test(m[1]), `${f.slice(ROOT.length)} imports ${m[1]}`);
    }
  }
});

test("A3 precondition: server/voice/features.js validateUtterance ignores a top-level kv (no HTTP 400 before A3 lands)", async () => {
  const vf = await import("../../../server/voice/features.js");
  const u = vf.validateUtterance({ context: "answer", bargeIn: false, features: { durationMs: 900, voicedFrac: 0.6, words: 2 }, kv: kvOf() });
  assert.equal(u.reliable, true);
  assert.equal("kv" in u, false, "kv is dropped, not stored, until A3 admits it");
  assert.throws(() => vf.validateUtterance({ features: { durationMs: 900, voicedFrac: 0.6, words: 2, fillerLeadMs: 300 } }), /unknown feature/, "kv fields inside `features` WOULD 400: never put them there");
});

test("G-VS-PURE: the adapter path (adapter, rules, ladder, calibrate, baseline) has no clock, randomness, env, network or DB import", () => {
  const banned = /Date\.now|new Date\(|Math\.random|performance\.now|\bfetch\(|process\.env|from\s+["'][^"']*(?:db\.js|pg|@neondatabase|azure\.js|http\.js)["']/;
  for (const n of ["adapter.js", "rules.js", "ladder.js", "calibrate.js", "baseline.js"]) {
    const code = stripComments(readFileSync(join(ROOT, "server/voicesig", n), "utf8"), false);
    assert.ok(!banned.test(code), `${n}: ${code.match(banned)?.[0]}`);
  }
});
