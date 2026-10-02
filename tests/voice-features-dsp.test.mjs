// On-device voice feature math on synthetic signals: YIN f0 on sines and a glide, pause structure from
// silence gaps, onset latency against the teacher's audio end, and the tracker's windowing rules.
import { test } from "node:test";
import assert from "node:assert/strict";
import { RATE, HOP_MS, FrameAnalyzer, yin, utteranceStats, speechRuns, olsSlope } from "../src/voice/dsp.ts";
import { UtteranceTracker } from "../src/voice/tracker.ts";

/** Build 16 kHz audio from segments: { ms, f0 } (sine, optionally gliding to f1) or { ms } (silence). */
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
      // A little 2nd harmonic: a pure sine is too easy for a pitch tracker.
      x[i] = (g.f0 ? amp * (Math.sin(phase) + 0.4 * Math.sin(2 * phase)) : 0) + noise * rnd();
    }
  }
  return x;
}

/** Push audio through the analyser in 20 ms chunks, as the worklet does. */
function frames(x, t0 = 0) {
  const fa = new FrameAnalyzer();
  const out = [];
  for (let i = 0; i < x.length; i += 320) out.push(...fa.push(x.slice(i, i + 320), t0 + (i / RATE) * 1000));
  return out;
}

test("YIN recovers known f0 on single windows (child and adult range)", () => {
  for (const f0 of [110, 180, 220, 310, 450]) {
    const x = synth([{ ms: 40, f0 }], { noise: 0 });
    const r = yin(x.subarray(0, 640));
    assert.ok(r.f0 != null, `voiced at ${f0}`);
    assert.ok(Math.abs(r.f0 - f0) / f0 < 0.01, `f0 ${f0}: got ${r.f0.toFixed(1)}`);
  }
  assert.equal(yin(synth([{ ms: 40 }], { noise: 0.1 }).subarray(0, 640)).f0, null, "white noise is unvoiced");
});

test("steady 240 Hz: median within 1%, IQR ~0, slope ~0, fully voiced", () => {
  const st = utteranceStats(frames(synth([{ ms: 300 }, { ms: 1000, f0: 240 }, { ms: 300 }])));
  assert.ok(st);
  assert.ok(Math.abs(st.f0MedianHz - 240) / 240 < 0.01, `median ${st.f0MedianHz}`);
  assert.ok(st.f0IqrSt < 0.1, `iqr ${st.f0IqrSt}`);
  assert.ok(Math.abs(st.f0SlopeStPerS) < 0.3, `slope ${st.f0SlopeStPerS}`);
  assert.ok(Math.abs(st.durationMs - 1000) <= 2 * HOP_MS + 20, `duration ${st.durationMs}`);
  assert.ok(st.voicedFrac > 0.9, `voiced ${st.voicedFrac}`);
  assert.equal(st.pauseCount, 0);
  assert.equal(st.flatVoicedRuns, 1, "a long flat voiced run reads as filled-pause-like");
});

test("glide 200→300 Hz over 1 s: slope ≈ 12·log2(1.5) = 7.02 st/s, terminal slope rising", () => {
  const st = utteranceStats(frames(synth([{ ms: 200 }, { ms: 1000, f0: 200, f1: 300 }, { ms: 200 }])));
  // Linear-in-Hz glide is slightly concave in semitones; OLS over it sits close to the endpoint slope.
  assert.ok(Math.abs(st.f0SlopeStPerS - 7.02) < 0.6, `slope ${st.f0SlopeStPerS}`);
  assert.ok(st.f0EndSlopeStPerS > 4, `end slope ${st.f0EndSlopeStPerS}`);
  assert.ok(st.f0IqrSt > 2.5 && st.f0IqrSt < 4.5, `iqr ${st.f0IqrSt}`);
  assert.equal(st.flatVoicedRuns, 0, "a glide is not a filled pause");
});

test("silence gaps: pauses ≥250 ms counted with their lengths, shorter dips bridged", () => {
  const x = synth([{ ms: 400 }, { ms: 600, f0: 220 }, { ms: 500 }, { ms: 400, f0: 260 }, { ms: 120 }, { ms: 400, f0: 230 }, { ms: 800 }, { ms: 300, f0: 220 }, { ms: 300 }]);
  const st = utteranceStats(frames(x));
  assert.equal(st.pauseCount, 2, "500 ms and 800 ms gaps are pauses; 120 ms is not");
  assert.ok(Math.abs(st.longestPauseMs - 800) <= 60, `longest ${st.longestPauseMs}`);
  assert.ok(Math.abs(st.pauseTotalMs - 1300) <= 100, `total ${st.pauseTotalMs}`);
  assert.ok(Math.abs(st.durationMs - 3120) <= 80, `duration ${st.durationMs}`);
  assert.ok(Math.abs(st.pauseFrac - 1300 / 3120) < 0.04);
});

test("clicks shorter than a speech run are not speech", () => {
  const x = synth([{ ms: 500 }, { ms: 30, f0: 300 }, { ms: 500 }]);
  assert.equal(utteranceStats(frames(x)), null);
  assert.deepEqual(speechRuns([]), []);
});

test("energy: a 6 dB quieter utterance reads ~6 dB lower", () => {
  const loud = utteranceStats(frames(synth([{ ms: 200 }, { ms: 800, f0: 220 }, { ms: 200 }], { amp: 0.2 })));
  const soft = utteranceStats(frames(synth([{ ms: 200 }, { ms: 800, f0: 220 }, { ms: 200 }], { amp: 0.1 })));
  assert.ok(Math.abs(loud.rmsMeanDb - soft.rmsMeanDb - 6.02) < 0.5, `${loud.rmsMeanDb} vs ${soft.rmsMeanDb}`);
});

test("FrameAnalyzer re-anchors on a dropped chunk instead of drifting", () => {
  const fa = new FrameAnalyzer();
  const chunk = synth([{ ms: 20, f0: 220 }]);
  const a = fa.push(chunk, 0); void a;
  fa.push(chunk, 20);
  const later = fa.push(chunk, 5000); // a 5 s gap
  const more = fa.push(chunk, 5020);
  const all = [...later, ...more];
  assert.ok(all.every((f) => f.t >= 5000), "frames after the gap carry the new clock");
});

test("olsSlope", () => {
  assert.equal(olsSlope([0, 1, 2], [1, 3, 5]), 2);
  assert.equal(olsSlope([1, 1, 1], [1, 2, 3]), null);
  assert.equal(olsSlope([0, 1], [0, 1]), null);
});

// ───────────── tracker: onset, windows, typed turns, barge-in ─────────────

function tracked(segments, t0 = 10_000) {
  const t = new UtteranceTracker();
  t.addFrames(frames(synth(segments), t0));
  return t;
}

test("onset latency = child speech onset − teacher audio end on the device", () => {
  // Teacher audio ends at t0 + 500; the child starts at t0 + 1200 (700 ms later).
  const t0 = 10_000;
  const tr = tracked([{ ms: 1200 }, { ms: 900, f0: 260 }, { ms: 600 }], t0);
  tr.teacherAudioStarted();
  tr.teacherAudioEnded(t0 + 500);
  tr.speechStart(t0 + 1300);
  tr.speechEnd(t0 + 2100);
  const u = tr.finalize({ text: "paanch", startedAt: t0 + 1300, asrConfidence: 0.9 }, t0 + 3000);
  assert.ok(u);
  assert.equal(u.bargeIn, false);
  assert.equal(u.context, "answer");
  assert.ok(Math.abs(u.features.onsetMs - 700) <= 40, `onset ${u.features.onsetMs}`);
  assert.equal(u.features.words, 1);
  assert.ok(Math.abs(u.features.speechRateWps - 1 / 0.9) < 0.1);
  assert.equal(u.asrConf, 0.9);
  // Only the FIRST utterance after a teacher turn has an onset.
  tr.addFrames(frames(synth([{ ms: 300 }, { ms: 500, f0: 250 }, { ms: 300 }]), t0 + 2700));
  const u2 = tr.finalize({ text: "haan paanch", startedAt: t0 + 3000 }, t0 + 3800);
  assert.ok(u2);
  assert.equal(u2.features.onsetMs, undefined);
});

test("barge-in: no onset, flagged, window not clipped at the teacher's end", () => {
  const t0 = 10_000;
  const tr = tracked([{ ms: 300 }, { ms: 900, f0: 260 }, { ms: 500 }], t0);
  tr.teacherAudioStarted();
  tr.speechStart(t0 + 300);          // child starts while the teacher is still playing
  tr.teacherAudioEnded(t0 + 700);    // she is cut off
  tr.speechEnd(t0 + 1200);
  const u = tr.finalize({ text: "ruko ruko", startedAt: t0 + 300 }, t0 + 1600);
  assert.equal(u.bargeIn, true);
  assert.equal(u.features.onsetMs, undefined);
  assert.ok(u.features.durationMs > 800, "the speech before the teacher stopped still counts");
});

test("frames before the teacher's end never enter the answer (echo guard)", () => {
  const t0 = 10_000;
  // 600 ms of "teacher" tone leaking into the mic, then silence, then the child.
  const tr = tracked([{ ms: 600, f0: 180 }, { ms: 700 }, { ms: 600, f0: 300 }, { ms: 300 }], t0);
  tr.teacherAudioStarted();
  tr.teacherAudioEnded(t0 + 600);
  const u = tr.finalize({ text: "teen", startedAt: t0 + 1300 }, t0 + 2300);
  assert.ok(Math.abs(u.features.f0MedianHz - 300) / 300 < 0.02, `f0 ${u.features.f0MedianHz}`);
  assert.ok(Math.abs(u.features.onsetMs - 700) <= 40);
});

test("typed turns and speechless windows yield no features", () => {
  const tr = tracked([{ ms: 1000 }]);
  assert.equal(tr.finalize({ text: "5", typed: true }, 12_000), null);
  assert.equal(tr.finalize({ text: "five", startedAt: 10_200 }, 11_000), null);
});

test("read-aloud: WCPM from reading time and alignment", () => {
  const t0 = 10_000;
  // 3 s of "reading" (with a 300 ms pause) of a 6-word target, 5 words right.
  const tr = tracked([{ ms: 200 }, { ms: 1400, f0: 250 }, { ms: 300 }, { ms: 1300, f0: 240 }, { ms: 300 }], t0);
  tr.setReadAloudTarget("Raju ke paas teen aam hain");
  const u = tr.finalize({ text: "Raju ke paas do aam hain", startedAt: t0 + 200 }, t0 + 3600);
  assert.equal(u.context, "read_aloud");
  assert.equal(u.features.targetWords, 6);
  const expected = 5 / (u.features.durationMs / 60_000);
  assert.ok(Math.abs(u.features.wcpm - expected) < 1e-9);
  assert.ok(u.features.wcpm > 95 && u.features.wcpm < 105, `wcpm ${u.features.wcpm}`);
  assert.ok(Math.abs(u.features.readAccuracy - 5 / 6) < 1e-9);
  tr.setReadAloudTarget(null);
});

test("no text or audio ever appears in the feature record (numbers only)", () => {
  const t0 = 10_000;
  const tr = tracked([{ ms: 200 }, { ms: 800, f0: 250 }, { ms: 300 }], t0);
  const u = tr.finalize({ text: "mera naam Aarav hai", startedAt: t0 + 200, itemId: "it_1" }, t0 + 1300);
  for (const [k, v] of Object.entries(u.features)) assert.equal(typeof v, "number", k);
  assert.ok(!JSON.stringify(u).includes("Aarav"));
});
