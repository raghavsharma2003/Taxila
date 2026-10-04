// CPU cost of the shipped code paths (VS-A9 server half; front-end per audio second). Node, single thread, on whatever
// box runs it: phones are slower (×2-4 [E]) until the device lab (VSP-M1) measures them.
//   node evals/voicesig/bench.mjs
import { FrontEndCore } from "../../src/voicesig/frontend/bus.ts";
import { VoicesigHead } from "../../src/voicesig/head.ts";
import { toSignalInput, updateBaseline } from "../../server/voicesig/adapter.js";
import { VsBaseline } from "../../server/voicesig/baseline.js";

const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(4); };

// Front-end: 60 s of a speech-like signal through FrontEndCore (FrameAnalyzer + R RMS + 10 ms log-mel) + the head's GRU inputs.
{
  const fe = new FrontEndCore();
  const head = new VoicesigHead(fe);
  const S = 60, x = new Float32Array(16000 * S), r = new Float32Array(16000 * S);
  let ph = 0;
  for (let i = 0; i < x.length; i++) {
    const on = Math.floor(i / 8000) % 3 !== 2;
    ph += (2 * Math.PI * (200 + 30 * Math.sin(i / 4000))) / 16000;
    x[i] = on ? 0.2 * (Math.sin(ph) + 0.4 * Math.sin(2 * ph)) : 0.0005 * Math.sin(i);
    r[i] = x[i] * 0.7;
  }
  const t = performance.now();
  for (let i = 0; i + 320 <= x.length; i += 320) fe.push((i / 16000) * 1000, x.subarray(i, i + 320), r.subarray(i, i + 320));
  const ms = performance.now() - t;
  const kvT = performance.now();
  const kv = await head.commit({ fromT: 50_000, toT: 60_000, teacherEndAt: 50_000, words: 6 });
  console.log(JSON.stringify({ bench: "frontend", audioS: S, msPerAudioS: +(ms / S).toFixed(2), withRawTrack: true, mel10ms: true, headCommitMs: +(performance.now() - kvT).toFixed(2), kvOk: !!kv }));
  head.dispose();
}

// Server adapter: 20k calls with a mature baseline, mixed verdicts.
{
  const b = new VsBaseline();
  const mk = (i) => ({ v: 1, modelVer: "b", stage: 0, f: { durationMs: 800 + (i % 7) * 100, onsetMs: 600 + (i * 37) % 5000, pauseFrac: (i % 9) / 30, voicedFrac: 0.6, longestPauseMs: 200, flatVoicedRuns: 0, fillerLeadMs: (i % 5) * 150 }, q: { audio: 1, raw: 0, enc: 0, det: 1, micClass: "builtin", langMode: "hinglish" }, computeMs: 3 });
  for (let i = 0; i < 50; i++) updateBaseline(b, mk(i), { safety: false });
  const times = [];
  for (let i = 0; i < 20_000; i++) {
    const t = performance.now();
    toSignalInput(mk(i), { verdict: ["correct", "not_yet", "ungraded", "partial"][i % 4], safety: false, mode: "shadow", baseline: b, ling: { idk: i % 4 === 2 ? "cant_recall" : null, hedge: i % 11 === 0 }, words: 1 + (i % 4), deltaFitted: true });
    times.push(performance.now() - t);
  }
  console.log(JSON.stringify({ bench: "adapter", n: times.length, p50Ms: q(times, 0.5), p99Ms: q(times, 0.99), maxMs: q(times, 1) }));
}
