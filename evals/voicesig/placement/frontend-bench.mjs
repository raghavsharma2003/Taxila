// Run: node --experimental-strip-types frontend-bench.mjs
// Front-end cost on this Xeon (one thread, V8): (a) the shipped dsp.ts FrameAnalyzer per 20 ms hop on voiced audio
// (YIN runs on speech frames only); (b) a Whisper-style 80-bin log-mel over 8 s (400-pt Hann, hop 160, 512 FFT),
// i.e. the extra work the shared encoder needs on top of the tap the device already runs.
import { FrameAnalyzer, RATE } from "../../../src/voice/dsp.ts";

function voiced(sec, f0 = 260) {           // harmonic child-range tone with slow vibrato + a little noise
  const n = sec * RATE, x = new Float32Array(n); let ph = 0, s = 7;
  for (let i = 0; i < n; i++) {
    const f = f0 * (1 + 0.05 * Math.sin((2 * Math.PI * 3 * i) / RATE)); ph += (2 * Math.PI * f) / RATE;
    s = (s * 1664525 + 1013904223) >>> 0;
    x[i] = 0.3 * Math.sin(ph) + 0.12 * Math.sin(2 * ph) + 0.06 * Math.sin(3 * ph) + 0.01 * (s / 4294967296 - 0.5);
  }
  return x;
}
const q = (a, p) => a.slice().sort((x, y) => x - y)[Math.floor(p * (a.length - 1))];

// (a) FrameAnalyzer: 0.5 s near-silence seed, then 10 s voiced, pushed in 20 ms chunks like the worklet.
{
  const fa = new FrameAnalyzer();
  const sil = new Float32Array(RATE / 2).map(() => (Math.random() - 0.5) * 1e-4);
  const sig = voiced(10); const all = new Float32Array(sil.length + sig.length); all.set(sil); all.set(sig, sil.length);
  const per = []; let frames = 0, voicedFrames = 0;
  for (let reps = 0; reps < 3; reps++) for (let off = 0; off + 320 <= all.length; off += 320) {
    const t = performance.now(); const out = fa.push(all.subarray(off, off + 320), (off / RATE) * 1000 + reps * 20000); per.push(performance.now() - t);
    frames += out.length; voicedFrames += out.filter((f) => f.f0 != null).length;
  }
  console.log(JSON.stringify({ bench: "dsp.FrameAnalyzer per 20ms hop", n: per.length, frames, voicedFrames, p50ms: +q(per, 0.5).toFixed(4), p95ms: +q(per, 0.95).toFixed(4), p99ms: +q(per, 0.99).toFixed(4), msPerAudioSec: +(per.reduce((a, b) => a + b, 0) / (per.length * 0.02)).toFixed(3) }));
}

// (b) log-mel 80 x 800 from 8 s (radix-2 FFT, slaney-ish triangular mel bank built once).
{
  const N = 512, WIN = 400, HOPM = 160, MEL = 80;
  const hann = Float32Array.from({ length: WIN }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / WIN));
  const hz2mel = (f) => 2595 * Math.log10(1 + f / 700), mel2hz = (m) => 700 * (10 ** (m / 2595) - 1);
  const pts = Array.from({ length: MEL + 2 }, (_, i) => mel2hz((i * hz2mel(8000)) / (MEL + 1)));
  const bins = pts.map((f) => Math.floor(((N + 1) * f) / RATE));
  const bank = Array.from({ length: MEL }, (_, m) => { const w = new Float32Array(N / 2 + 1);
    for (let k = bins[m]; k < bins[m + 1]; k++) w[k] = (k - bins[m]) / Math.max(1, bins[m + 1] - bins[m]);
    for (let k = bins[m + 1]; k < bins[m + 2]; k++) w[k] = (bins[m + 2] - k) / Math.max(1, bins[m + 2] - bins[m + 1]); return w; });
  const re = new Float32Array(N), im = new Float32Array(N);
  const rev = Uint16Array.from({ length: N }, (_, i) => { let r = 0, x = i; for (let b = 0; b < 9; b++) { r = (r << 1) | (x & 1); x >>= 1; } return r; });
  function fft() { for (let i = 0; i < N; i++) { const j = rev[i]; if (j > i) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= N; len <<= 1) { const a = (-2 * Math.PI) / len; for (let i = 0; i < N; i += len) for (let k = 0; k < len / 2; k++) {
      const c = Math.cos(a * k), s = Math.sin(a * k), xr = re[i + k + len / 2], xi = im[i + k + len / 2];
      const tr = xr * c - xi * s, ti = xr * s + xi * c; re[i + k + len / 2] = re[i + k] - tr; im[i + k + len / 2] = im[i + k] - ti; re[i + k] += tr; im[i + k] += ti; } } }
  const x = voiced(8), out = new Float32Array(MEL * 800), times = [];
  for (let rep = 0; rep < 30; rep++) {
    const t = performance.now();
    for (let fr = 0; fr < 800; fr++) {
      re.fill(0); im.fill(0); const o = fr * HOPM - WIN / 2;
      for (let i = 0; i < WIN; i++) { const idx = o + i; re[i] = idx >= 0 && idx < x.length ? x[idx] * hann[i] : 0; }
      fft();
      for (let m = 0; m < MEL; m++) { let e = 0; const w = bank[m]; for (let k = 0; k <= N / 2; k++) if (w[k]) e += w[k] * (re[k] * re[k] + im[k] * im[k]); out[m * 800 + fr] = Math.log10(Math.max(e, 1e-10)); }
    }
    times.push(performance.now() - t);
  }
  console.log(JSON.stringify({ bench: "JS log-mel 80x800 (8 s)", n: times.length, p50ms: +q(times, 0.5).toFixed(2), p95ms: +q(times, 0.95).toFixed(2) }));
}
