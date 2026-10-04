// src/signals on synthetic audio through the REAL dsp.ts FrameAnalyzer: A2 leading filled segment, A16 syllable nuclei,
// A14 speaker shift, the laugh candidate (off), A13 echo risk and the q terms.
import { test } from "node:test";
import assert from "node:assert/strict";
import { RATE, FrameAnalyzer } from "../src/voice/dsp.ts";
import { leadingFilledMs, onsetContentMs, nucleiPerSec, speakerShift, echoRisk, durQ, levelQ, laughCandidate, LAUGH_DETECTOR_ENABLED, signalExtras } from "../src/signals/index.ts";

/** 16 kHz audio from segments: { ms, f0, f1?, am? } (am = amplitude-modulation rate, Hz) or { ms } silence. */
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
      const env = g.am ? 0.15 + 0.85 * Math.max(0, Math.sin((2 * Math.PI * g.am * k) / RATE)) : 1;
      x[i] = (g.f0 ? amp * env * (Math.sin(phase) + 0.4 * Math.sin(2 * phase)) : 0) + noise * rnd();
    }
  }
  return x;
}
function frames(x) {
  const fa = new FrameAnalyzer();
  const out = [];
  for (let off = 0; off < x.length; off += 320) out.push(...fa.push(x.subarray(off, off + 320), (off / RATE) * 1000));
  return out;
}
const lead = [{ ms: 600 }]; // floor seeding + silence before the child speaks

test("A2: a flat 'ummm' before the content adds its span (± one 40 ms window); content-first adds nothing", () => {
  const withFiller = frames(synth([...lead, { ms: 500, f0: 220 }, { ms: 150 }, { ms: 600, f0: 220, f1: 320 }, { ms: 500 }]));
  const ms = leadingFilledMs(withFiller);
  assert.ok(Math.abs(ms - 650) <= 60, `lead ${ms}`);
  const contentFirst = frames(synth([...lead, { ms: 600, f0: 220, f1: 320 }, { ms: 150 }, { ms: 500, f0: 220 }, { ms: 500 }]));
  assert.equal(leadingFilledMs(contentFirst), 0);
  assert.equal(onsetContentMs(900, withFiller, 1250), 900 + ms);
  assert.equal(onsetContentMs(undefined, withFiller, 1250), undefined);
});

test("A16: syllable nuclei per second track an amplitude-modulated voiced tone (3, 5, 7 Hz) within 20%", () => {
  for (const hz of [3, 5, 7]) {
    const n = nucleiPerSec(frames(synth([...lead, { ms: 3000, f0: 240, f1: 260, am: hz }, { ms: 400 }])));
    assert.ok(n != null && Math.abs(n - hz) / hz <= 0.2, `${hz} Hz → ${n}`);
  }
});

test("A14: a far-from-baseline second voice inside the turn flags; the child's own voice, no baseline, or B4 does not", () => {
  const two = frames(synth([...lead, { ms: 700, f0: 300 }, { ms: 300 }, { ms: 700, f0: 460 }, { ms: 400 }]));
  assert.equal(speakerShift(two, { baselineF0Hz: 200, baselineN: 20, band: "B3" }), 1);
  assert.equal(speakerShift(two, { baselineF0Hz: 200, baselineN: 3, band: "B3" }), 0);
  assert.equal(speakerShift(two, { baselineF0Hz: 200, baselineN: 20, band: "B4" }), 0);
  const own = frames(synth([...lead, { ms: 700, f0: 260 }, { ms: 300 }, { ms: 700, f0: 280 }, { ms: 400 }]));
  assert.equal(speakerShift(own, { baselineF0Hz: 265, baselineN: 20, band: "B3" }), 0);
});

test("A15 laugh candidate (disabled): a 5 Hz burst train fires, continuous speech does not", () => {
  assert.equal(LAUGH_DETECTOR_ENABLED, false);
  const burst = [];
  for (let i = 0; i < 5; i++) burst.push({ ms: 110, f0: 320 }, { ms: 90 });
  assert.equal(laughCandidate(frames(synth([...lead, ...burst, { ms: 400 }]))), true);
  assert.equal(laughCandidate(frames(synth([...lead, { ms: 1500, f0: 240, f1: 300 }, { ms: 400 }]))), false);
});

test("A13 echo risk and q terms", () => {
  assert.equal(echoRisk({ teacherAudibleAtOnset: true }), 1);
  assert.equal(echoRisk({ route: "speaker", onsetMs: 250 }), 1);
  assert.equal(echoRisk({ route: "speaker", onsetMs: 900 }), 0);
  assert.equal(echoRisk({ route: "headset", onsetMs: 100 }), 0);
  assert.equal(durQ(250), 0);
  assert.equal(durQ(800), 1);
  assert.equal(levelQ({ rmsMeanDb: -60, rmsP90Db: -50 }), 0);
  assert.equal(levelQ({ rmsMeanDb: -20, rmsP90Db: -0.1 }), 0);
  assert.equal(levelQ({ rmsMeanDb: -25, rmsP90Db: -12 }), 1);
});

test("signalExtras: numbers only, every key inside EXTRA_RANGES", async () => {
  const { EXTRA_RANGES } = await import("../src/signals/index.ts");
  const fr = frames(synth([...lead, { ms: 500, f0: 220 }, { ms: 150 }, { ms: 900, f0: 220, f1: 320, am: 4 }, { ms: 500 }]));
  const ex = signalExtras(fr, { onsetMs: 1200, durationMs: 1550, rmsMeanDb: -22, rmsP90Db: -14, route: "headset" });
  for (const [k, v] of Object.entries(ex)) {
    assert.equal(typeof v, "number", k);
    const [lo, hi] = EXTRA_RANGES[k];
    assert.ok(v >= lo && v <= hi, `${k}=${v}`);
  }
  assert.ok(ex.onsetContentMs > 1200);
});

test("perf: extras for a 6 s utterance stay well under 1 ms-per-utterance scale (≤ 5 ms in Node)", () => {
  const fr = frames(synth([...lead, { ms: 6000, f0: 230, f1: 300, am: 4 }, { ms: 300 }]));
  const t0 = performance.now();
  for (let i = 0; i < 50; i++) signalExtras(fr, { onsetMs: 1000, durationMs: 6000, rmsMeanDb: -22, rmsP90Db: -14 });
  const per = (performance.now() - t0) / 50;
  assert.ok(per < 5, `${per.toFixed(2)} ms`);
});
