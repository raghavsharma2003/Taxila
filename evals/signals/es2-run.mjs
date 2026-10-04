// ES-2 runner: every clip through the REAL on-device pipeline in Node — src/voice/featureWorklet.ts (the actual
// AudioWorklet processor, driven by a shim at 48 kHz in 128-sample render quanta) → src/voice/dsp.ts FrameAnalyzer →
// src/voice/tracker.ts UtteranceTracker → src/signals extras. What is NOT reproduced here: the browser's AGC, noise
// suppression and echo cancellation (getUserMedia constraints), and real playback/Bluetooth latency. Those need the
// fake-mic Chromium run (tests/voice-features-browser.test.mjs pattern) and are reported as NOT RUN.
//
// Per clip: clean, +12 dB, −12 dB, and one noise bed (fan / TV babble / traffic, cycling) at 10 / 5 / 0 dB SNR.
//   node evals/signals/es2-run.mjs   → evals/signals/results/es2.json
import fs from "node:fs";
import path from "node:path";
import { CACHE } from "./es2-build.mjs";
import { r3, quantile } from "./lib/metrics.mjs";

// ── AudioWorklet shim: load the real processor class ──
let Proc = null, sink = null;
globalThis.sampleRate = 48_000;
globalThis.currentTime = 0;
globalThis.AudioWorkletProcessor = class { constructor() { this.port = { postMessage: (m) => sink?.(m), onmessage: null }; } };
globalThis.registerProcessor = (_name, ctor) => { Proc = ctor; };
await import("../../src/voice/featureWorklet.ts");
const { FrameAnalyzer, HOP_MS, st } = await import("../../src/voice/dsp.ts");
const { UtteranceTracker } = await import("../../src/voice/tracker.ts");
const { signalExtras, leadingFilledMs, laughCandidate, speakerShift } = await import("../../src/signals/index.ts");

const manifest = JSON.parse(fs.readFileSync(new URL("./data/es2-manifest.json", import.meta.url), "utf8"));
const IN_RATE = 24_000, SR = 48_000;
const PRE_MS = 1000;           // room before the teacher stops (floor seeding)
const TAIL_MS = 900;

function loadPcm(id) {
  const b = fs.readFileSync(path.join(CACHE, `${id}.pcm`));
  const x = new Float32Array(b.length / 2);
  for (let i = 0; i < x.length; i++) x[i] = b.readInt16LE(i * 2) / 32768;
  return x;
}
function up2(x) { // 24 → 48 kHz, linear
  const y = new Float32Array(x.length * 2);
  for (let i = 0; i < x.length; i++) { const a = x[i], b = i + 1 < x.length ? x[i + 1] : a; y[2 * i] = a; y[2 * i + 1] = (a + b) / 2; }
  return y;
}
/** Oracle onset/offset of the TTS speech: first/last 5 ms block above 1e-3 RMS (TTS silence is digital zero). */
function oracle(x, rate) {
  const blk = Math.round(rate * 0.005);
  let first = -1, last = -1;
  for (let i = 0; i + blk <= x.length; i += blk) {
    let s = 0; for (let k = i; k < i + blk; k++) s += x[k] * x[k];
    if (Math.sqrt(s / blk) > 1e-3) { if (first < 0) first = i; last = i + blk; }
  }
  return { startMs: (first / rate) * 1000, endMs: (last / rate) * 1000 };
}
let seed = 12345;
const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 2 ** 32 - 0.5) * 2;
function noiseBed(kind, n, babble) {
  const y = new Float32Array(n);
  let b0 = 0, b1 = 0, b2 = 0, brown = 0;
  for (let i = 0; i < n; i++) {
    const w = rnd();
    if (kind === "fan") { b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; y[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2; }
    else if (kind === "traffic") { brown = (brown + 0.02 * w) / 1.02; y[i] = brown * 3 * (0.6 + 0.4 * Math.sin((2 * Math.PI * 0.3 * i) / SR)); }
    else y[i] = babble[i % babble.length];
  }
  return y;
}
const rms = (x) => { let s = 0, n = 0; for (let i = 0; i < x.length; i++) { s += x[i] * x[i]; n++; } return Math.sqrt(s / Math.max(1, n)); };

function runPipeline(audio, clip, truth) {
  const tracker = new UtteranceTracker();
  const fa = new FrameAnalyzer();
  const proc = new Proc();
  const allFrames = [];
  sink = (m) => { if (m && m.x) { const fr = fa.push(m.x, m.t * 1000); allFrames.push(...fr); tracker.addFrames(fr); } };
  const Q = 128;
  for (let i = 0; i < audio.length; i += Q) {
    globalThis.currentTime = i / SR;
    proc.process([[audio.subarray(i, Math.min(audio.length, i + Q))]]);
  }
  sink = null;
  const teacherEnd = PRE_MS;
  tracker.teacherAudioStarted();
  tracker.teacherAudioEnded(teacherEnd);
  tracker.speechStart(truth.onsetEpoch + 250);    // server VAD mark lags real onset
  tracker.speechEnd(truth.endEpoch + 200);
  const u = tracker.finalize({ text: (clip.fillerWord ? clip.fillerWord + " " : "") + clip.text, startedAt: truth.onsetEpoch + 250 }, (audio.length / SR) * 1000);
  const win = allFrames.filter((f) => f.t >= teacherEnd + 80 && f.t <= truth.endEpoch + 500);
  const ex = u ? signalExtras(win, { onsetMs: u.features.onsetMs, durationMs: u.features.durationMs, rmsMeanDb: u.features.rmsMeanDb, rmsP90Db: u.features.rmsP90Db }) : null;
  const exFull = u ? signalExtras(win, { onsetMs: u.features.onsetMs, durationMs: u.features.durationMs, rmsMeanDb: u.features.rmsMeanDb, rmsP90Db: u.features.rmsP90Db, teacherEndAt: teacherEnd, history: allFrames }) : null;
  return { u, ex: exFull ?? ex, win };
}

const results = [];
const babbleSrc = (() => { const c = manifest.clips.find((x) => x.lang === "en" && x.voice.includes("Rehaan") && fs.existsSync(path.join(CACHE, `${x.id}.pcm`))); return c ? up2(loadPcm(c.id)) : null; })();
const KINDS = ["fan", "tv", "traffic"], SNRS = [10, 5, 0];
let k = 0;
for (const clip of manifest.clips) {
  const f = path.join(CACHE, `${clip.id}.pcm`);
  if (!fs.existsSync(f)) continue;
  const tts = up2(loadPcm(clip.id));
  const orc = oracle(tts, SR);
  // normalise active speech to −24 dBFS RMS, then assemble [pre][onset][tts][tail]
  const active = tts.subarray(Math.round((orc.startMs / 1000) * SR), Math.round((orc.endMs / 1000) * SR));
  const g = 10 ** (-24 / 20) / Math.max(1e-6, rms(active));
  const n = Math.round(((PRE_MS + clip.onset + TAIL_MS) / 1000) * SR) + tts.length;
  const base = new Float32Array(n);
  const off = Math.round(((PRE_MS + clip.onset) / 1000) * SR);
  for (let i = 0; i < tts.length; i++) base[off + i] = tts[i] * g;
  const truth = { onsetMs: clip.onset + orc.startMs, onsetEpoch: PRE_MS + clip.onset + orc.startMs, endEpoch: PRE_MS + clip.onset + orc.endMs };
  const variants = { clean: 0, gainPlus12: 12, gainMinus12: -12 };
  const kind = KINDS[k % 3], snr = SNRS[Math.floor(k / 3) % 3];
  k++;
  const row = { id: clip.id, lang: clip.lang, lh: clip.lh, lhEnd: !!clip.lhEnd, filler: !!clip.fillerWord, pausesTruth: clip.pauses.length, rate: clip.rate, base: clip.base, voice: clip.voice, onsetTruth: r3(truth.onsetMs), words: clip.words, runs: {} };
  for (const [name, db] of Object.entries(variants)) {
    const a = new Float32Array(n);
    const gg = 10 ** (db / 20);
    for (let i = 0; i < n; i++) a[i] = base[i] * gg + 3e-4 * rnd();           // −70 dBFS room floor
    row.runs[name] = summarise(runPipeline(a, clip, truth));
  }
  if (kind !== "tv" || babbleSrc) {
    const bed = noiseBed(kind, n, babbleSrc);
    const ng = (10 ** (-24 / 20) / 10 ** (snr / 20)) / Math.max(1e-6, rms(bed));
    const a = new Float32Array(n);
    for (let i = 0; i < n; i++) a[i] = base[i] + bed[i] * ng + 3e-4 * rnd();
    row.runs.noise = { kind, snr, ...summarise(runPipeline(a, clip, truth)) };
  }
  results.push(row);
}

function summarise({ u, ex, win }) {
  if (!u) return { detected: false };
  const F = u.features;
  return { detected: true, onsetMs: F.onsetMs ?? null, pauseCount: F.pauseCount, longestPauseMs: F.longestPauseMs, pauseFrac: r3(F.pauseFrac), articulationWps: F.articulationWps ?? null,
    speechRateWps: F.speechRateWps ?? null, voicedFrac: r3(F.voicedFrac), f0MedianHz: F.f0MedianHz ?? null, f0EndSlopeStPerS: F.f0EndSlopeStPerS ?? null, flatVoicedRuns: F.flatVoicedRuns,
    durationMs: F.durationMs, leadMs: leadingFilledMs(win), onsetContentMs: ex?.onsetContentMs ?? null, nucleiPerSec: ex?.nucleiPerSec ?? null, laugh: laughCandidate(win),
    shiftOwn: F.f0MedianHz ? speakerShift(win, { baselineF0Hz: F.f0MedianHz, baselineN: 20, band: "B3" }) : 0, qBed: ex?.qBed ?? 1 };
}

// ── metrics ──
const main = results.filter((r) => !r.lhEnd);
const clean = main.filter((r) => r.runs.clean.detected);
const within = (xs, tol) => (xs.length ? xs.filter((e) => Math.abs(e) <= tol).length / xs.length : null);
const onsetErr = (cond) => results.map((r) => r.runs[cond]).filter((x) => x?.detected && x.onsetMs != null).map((x, i) => x.onsetMs);
const errOf = (cond) => main.filter((r) => r.runs[cond]?.detected && r.runs[cond].onsetMs != null).map((r) => r.runs[cond].onsetMs - r.onsetTruth);
void onsetErr;
const pauseRows = clean.filter((r) => !r.lh && !r.filler);
const pauseErr = pauseRows.map((r) => r.runs.clean.pauseCount - r.pausesTruth);
const fillerRows = clean.filter((r) => r.filler), noFiller = clean.filter((r) => !r.filler);
const inv = {};
for (const feat of ["onsetMs", "pauseCount", "longestPauseMs", "pauseFrac", "articulationWps", "voicedFrac", "f0MedianHz", "flatVoicedRuns", "nucleiPerSec", "leadMs"]) {
  for (const cond of ["gainPlus12", "gainMinus12"]) {
    const pairs = clean.filter((r) => r.runs[cond]?.detected && r.runs.clean[feat] != null && r.runs[cond][feat] != null);
    const ok = pairs.filter((r) => { const a = r.runs.clean[feat], b = r.runs[cond][feat]; return a === 0 ? b === 0 : Math.abs(b - a) / Math.abs(a) <= 0.05; });
    inv[`${feat}@${cond}`] = { n: pairs.length, within5pct: r3(ok.length / Math.max(1, pairs.length)) };
  }
}
const noise = {};
for (const kind of KINDS) for (const snr of SNRS) {
  const rs = main.filter((r) => r.runs.noise?.kind === kind && r.runs.noise?.snr === snr);
  const det = rs.filter((r) => r.runs.noise.detected && r.runs.noise.onsetMs != null);
  const e = det.map((r) => r.runs.noise.onsetMs - r.onsetTruth);
  const okQ = det.filter((r) => r.runs.noise.qBed !== 0);
  const eQ = okQ.map((r) => r.runs.noise.onsetMs - r.onsetTruth);
  noise[`${kind}@${snr}dB`] = { n: rs.length, onsetMeasured: det.length, qBedFlagged: r3(1 - okQ.length / Math.max(1, det.length)), a1Within60AmongQBedPass: r3(within(eQ, 60)), a1Within60: r3(within(e, 60)), a1Within80: r3(within(e, 80)), a1MedianAbsErrMs: r3(quantile(e.map(Math.abs), 0.5)),
    pauseExactPm1: r3(within(rs.filter((r) => r.runs.noise.detected && !r.lh && !r.filler).map((r) => r.runs.noise.pauseCount - r.pausesTruth), 1)) };
}
// rate: articulation ratio vs the base's rate-0 clip (same voice + text), against (1 + rate/100)
const rateRows = [];
for (const r of clean) {
  if (r.rate === 0 || r.lh) continue;
  const ref = clean.find((x) => x.base === r.base && x.rate === 0 && !x.filler && x.pausesTruth === 0);
  if (!ref?.runs.clean.articulationWps || !r.runs.clean.articulationWps) continue;
  rateRows.push({ rate: r.rate, ratio: r.runs.clean.articulationWps / ref.runs.clean.articulationWps, expected: 1 + r.rate / 100 });
}
const rateByLevel = {};
for (const lv of [-30, -15, 10, 20]) { const xs = rateRows.filter((x) => x.rate === lv).map((x) => x.ratio); rateByLevel[`${lv}%`] = { n: xs.length, medianRatio: r3(quantile(xs, 0.5)), expected: 1 + lv / 100 }; }
// A16 proxy band on correctly transcribed speech: art / nuclei inside [0.2, 1.25]?
const band = clean.filter((r) => r.runs.clean.articulationWps && r.runs.clean.nucleiPerSec).map((r) => r.runs.clean.articulationWps / r.runs.clean.nucleiPerSec);
// Hindi L-H: end slope on non-final-phrase clips vs final statements, and a per-voice z against the voice's final clips
const hiRows = results.filter((r) => r.runs.clean.detected && r.lang === "hi" && r.runs.clean.f0EndSlopeStPerS != null && (r.lhEnd || !r.lh));
const lhZ = [];
for (const v of new Set(hiRows.map((r) => r.voice))) {
  const fin = hiRows.filter((r) => r.voice === v && !r.lh).map((r) => r.runs.clean.f0EndSlopeStPerS);
  const m = fin.reduce((a, b) => a + b, 0) / Math.max(1, fin.length);
  const sd = Math.max(2, Math.sqrt(fin.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, fin.length - 1)));
  for (const r of hiRows.filter((x) => x.voice === v && x.lhEnd)) lhZ.push((r.runs.clean.f0EndSlopeStPerS - m) / sd);
}

const summary = {
  date: "2026-10-04", clips: results.length, cleanDetected: clean.length,
  method: "Azure neural TTS (centralindia), pitch +15%, SSML breaks/rate; digital onset; Node run of the REAL worklet (shimmed, 48 kHz) → dsp → tracker → src/signals. No AGC/NS/AEC, no playback latency (browser-only; NOT RUN).",
  a1: { n: errOf("clean").length, within60: r3(within(errOf("clean"), 60)), within80: r3(within(errOf("clean"), 80)), medianErrMs: r3(quantile(errOf("clean"), 0.5)), p90AbsErrMs: r3(quantile(errOf("clean").map(Math.abs), 0.9)), bar: "±60 ms" },
  pauses: { n: pauseErr.length, exact: r3(within(pauseErr, 0)), within1: r3(within(pauseErr, 1)), meanSignedErr: r3(pauseErr.reduce((a, b) => a + b, 0) / Math.max(1, pauseErr.length)), bar: "exact ±1" },
  a7FlatRuns: { fillerClips: fillerRows.length, recall: r3(fillerRows.filter((r) => r.runs.clean.flatVoicedRuns >= 1).length / Math.max(1, fillerRows.length)), noFillerClips: noFiller.length, falsePositiveRate: r3(noFiller.filter((r) => r.runs.clean.flatVoicedRuns >= 1).length / Math.max(1, noFiller.length)), bar: "recall ≥ 0.8" },
  a2Lead: { recall: r3(fillerRows.filter((r) => r.runs.clean.leadMs > 0).length / Math.max(1, fillerRows.length)), falsePositiveRate: r3(noFiller.filter((r) => r.runs.clean.leadMs > 0).length / Math.max(1, noFiller.length)), medianLeadMsOnFiller: r3(quantile(fillerRows.map((r) => r.runs.clean.leadMs), 0.5)) },
  invariance: inv, noise, rate: rateByLevel,
  a16Band: { n: band.length, insideBand: r3(band.filter((x) => x >= 0.2 && x <= 1.25).length / Math.max(1, band.length)), p05: r3(quantile(band, 0.05)), p50: r3(quantile(band, 0.5)), p95: r3(quantile(band, 0.95)) },
  hindiLH: { lhClips: lhZ.length, zGe1_5: r3(lhZ.filter((z) => z >= 1.5).length / Math.max(1, lhZ.length)), medianZ: r3(quantile(lhZ, 0.5)), note: "z of f0EndSlope on Hindi clips ENDING on a non-final phrase against the same voice's final statements: the fraction that would count as signalsFrom's 'rising' hesitation cue" },
  qBedCleanFalseFlag: { n: clean.length, rate: r3(clean.filter((r) => r.runs.clean.qBed === 0).length / Math.max(1, clean.length)) },
  hindiFinalEndSlope: { n: hiRows.filter((r) => !r.lhEnd).length, median: r3(quantile(hiRows.filter((r) => !r.lhEnd).map((r) => r.runs.clean.f0EndSlopeStPerS), 0.5)) },
  hindiLHEndSlope: { n: hiRows.filter((r) => r.lhEnd).length, median: r3(quantile(hiRows.filter((r) => r.lhEnd).map((r) => r.runs.clean.f0EndSlopeStPerS), 0.5)) },
  laughFalseFire: { n: clean.length, rate: r3(clean.filter((r) => r.runs.clean.laugh).length / Math.max(1, clean.length)) },
  speakerShiftOwnVoiceFalseFire: { n: clean.length, rate: r3(clean.filter((r) => r.runs.clean.shiftOwn).length / Math.max(1, clean.length)) },
  notRun: ["AGC/NS/AEC (browser getUserMedia)", "echo / loudspeaker", "Bluetooth output latency", "real child voices"],
};
fs.writeFileSync(new URL("./results/es2.json", import.meta.url), JSON.stringify({ summary, rows: results }, null, 1));
console.log(JSON.stringify(summary, null, 1));
