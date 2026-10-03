// M0 lip driver bench: the REAL src/avatar/lip.ts LipDriver against Azure's phone-aligned viseme ground truth,
// scored exactly as docs/research/avatar/bench/bench.mjs (r(open), bilabial closure recall, vowel false-closure,
// one fixed lag per arm), plus the R-7 re-score against UNSMOOTHED ground truth.
//
//   node evals/avatar/lip-bench.mjs <dir-with-wavs>
// The viseme JSON is committed in docs/research/avatar/bench/stim/; the WAVs are regenerated from the same text +
// voice with Azure Speech (REST), since only the JSON was kept. The arm "rmsS" is the original bench's RMS
// baseline: reproducing its committed r (0.563 hi / 0.697 en) checks that the regenerated audio aligns.
import fs from "node:fs";
import { LipDriver } from "../../src/avatar/lip.ts";

const STIM = new URL("../../docs/research/avatar/bench/stim/", import.meta.url).pathname;
const WAVS = process.argv[2] || STIM;
const SR = 48000;
const AZ2OC = ["sil","aa","aa","O","E","RR","I","U","O","O","O","I","kk","RR","nn","SS","CH","TH","FF","DD","kk","PP"];
const OPEN = { aa:1.0, E:0.7, I:0.5, O:0.75, U:0.4, PP:0.0, SS:0.25, TH:0.3, DD:0.35, FF:0.15, kk:0.45, nn:0.3, RR:0.4, CH:0.3, sil:0.0 };
const GROUP = (v) => v === "sil" ? "sil" : v === "PP" ? "closed" : ["aa","E","I","O","U"].includes(v) ? "vowel" : "cons";

function readWav(f) {
  const b = fs.readFileSync(f); let o = 12, sr = 24000, data;
  while (o < b.length) { const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4);
    if (id === "fmt ") sr = b.readUInt32LE(o + 12); if (id === "data") { data = b.subarray(o + 8, o + 8 + sz); break; } o += 8 + sz; }
  const x = new Float32Array(data.length / 2); for (let i = 0; i < x.length; i++) x[i] = data.readInt16LE(i * 2) / 32768;
  return { sr, x };
}
function upsample(x, from) { const r = SR / from, y = new Float32Array(Math.floor(x.length * r));
  for (let i = 0; i < y.length; i++) { const p = i / r, k = Math.floor(p), f = p - k; y[i] = (x[k] ?? 0) * (1 - f) + (x[k + 1] ?? 0) * f; } return y; }
const gtAt = (vis, t) => { let v = "sil"; for (const e of vis) { if (e.t <= t) v = AZ2OC[e.id]; else break; } return v; };
function smooth(vals, frameMs, tauMs = 50) { const a = 1 - Math.exp(-frameMs / tauMs); let y = 0; return vals.map((v) => (y += a * (v - y))); }
function pearson(a, b) { const n = a.length; let ma = 0, mb = 0; for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n;
  let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; } return sab / Math.sqrt(saa * sbb || 1); }

// Arms run causally on the 2048-sample window an AnalyserNode would hold at each render instant.
function runDriver(x, fps, opts) {
  const d = new LipDriver(SR, opts), out = [], N = 2048, frame = 1000 / fps, dur = x.length / SR * 1000;
  for (let t = 0; t < dur; t += frame) { const e = Math.floor(t / 1000 * SR); const buf = new Float32Array(N);
    for (let i = 0; i < N; i++) buf[i] = x[e - N + i] ?? 0; out.push(d.step(buf, t / 1000).jaw / (opts?.jawCeiling ?? 0.85)); }
  return out;
}
function runRmsS(x, fps) { const out = [], frame = 1000 / fps, dur = x.length / SR * 1000;
  for (let t = 0; t < dur; t += frame) { const e = Math.floor(t / 1000 * SR); let s = 0; for (let i = e - 512; i < e; i++) { const v = x[i] ?? 0; s += v * v; }
    out.push(Math.max(0, Math.min(1, (Math.sqrt(s / 512) - 0.01) * 6))); }
  return smooth(out, frame); }

function score(gtDisc, gtOpen, track, k) {
  const a = [], b = [], sa = [], sb = [];
  for (let i = 0; i < gtOpen.length; i++) { const j = i + k; if (j >= 0 && j < track.length) { a.push(gtOpen[i]); b.push(track[j]); if (gtDisc[i] !== "sil") { sa.push(gtOpen[i]); sb.push(track[j]); } } }
  let segs = 0, hit = 0; for (let i = 1; i < gtDisc.length; i++) if (gtDisc[i] === "PP" && gtDisc[i - 1] !== "PP") {
    segs++; let e = i; while (e < gtDisc.length && gtDisc[e] === "PP") e++; let ok = false;
    for (let q = i - 1 + k; q <= e + k; q++) if (track[q] !== undefined && track[q] < 0.2) ok = true; if (ok) hit++; }
  let vf = 0, vc = 0; for (let i = 0; i < gtDisc.length; i++) { const j = i + k; if (GROUP(gtDisc[i]) === "vowel" && track[j] !== undefined) { vf++; if (track[j] < 0.2) vc++; } }
  return { r: pearson(a, b), rSpeech: pearson(sa, sb), segs, hit, vowelClosed: vc / (vf || 1) };
}

const ARMS = {
  rmsS: (x, fps) => runRmsS(x, fps),
  m0: (x, fps) => runDriver(x, fps, {}),
  // Level robustness: the received level after Opus/AGC is unknown (GR-9). Same audio at -10.5 dB.
  rmsS_gain03: (x, fps) => runRmsS(x.map((v) => v * 0.3), fps),
  m0_gain03: (x, fps) => runDriver(x.map((v) => v * 0.3), fps, {}),
  ...(process.env.SWEEP ? Object.fromEntries(JSON.parse(process.env.SWEEP).map((o) => [`m0${JSON.stringify(o)}`, (x, fps) => runDriver(x, fps, o)])) : {}),
};
const result = { date: new Date().toISOString().slice(0, 10), method: "causal, 2048-sample window per render instant, 48 kHz (24 kHz WAV linearly upsampled), lag sweep -100..+250 ms, one lag per arm x language x fps", arms: {} };
const files = fs.readdirSync(STIM).filter((f) => f.endsWith(".json")).sort().filter((f) => fs.existsSync(WAVS + f.replace(".json", ".wav")));
for (const fps of [60, 30]) {
  const frame = 1000 / fps;
  const per = {};
  for (const f of files) {
    const meta = JSON.parse(fs.readFileSync(STIM + f, "utf8")); const w = readWav(WAVS + f.replace(".json", ".wav")); const x = upsample(w.x, w.sr);
    const dur = x.length / SR * 1000; const gtDisc = []; for (let t = 0; t < dur; t += frame) gtDisc.push(gtAt(meta.visemes, t));
    const raw = gtDisc.map((v) => OPEN[v]); const gtS = smooth(raw, frame);
    for (const [name, run] of Object.entries(ARMS)) { const tr = run(x, fps);
      for (let lag = -100; lag <= 250; lag += frame) { const k = Math.round(lag / frame);
        const key = `${name}|${meta.lang}|${Math.round(lag)}`; (per[key] ??= []).push({ s: score(gtDisc, gtS, tr, k), u: score(gtDisc, raw, tr, k) }); } }
  }
  for (const name of Object.keys(ARMS)) for (const lang of ["hi-IN", "en-IN"]) {
    let best = null;
    for (const [key, list] of Object.entries(per)) { const [n, l, lag] = key.split("|"); if (n !== name || l !== lang) continue;
      const mr = list.reduce((s, z) => s + z.s.r, 0) / list.length; if (!best || mr > best.mr) best = { mr, lag: +lag, list }; }
    const L = best.list, m = (fn) => +(L.reduce((s, z) => s + fn(z), 0) / L.length).toFixed(3);
    const lag0 = per[`${name}|${lang}|0`];
    result.arms[`${name}|${lang}|${fps}fps`] = { n: L.length, lagMs: best.lag, r_smoothedGT: m((z) => z.s.r), r_unsmoothedGT: m((z) => z.u.r), r_speechOnly_unsmoothed: m((z) => z.u.rSpeech),
      r_lag0_smoothedGT: +(lag0.reduce((s, z) => s + z.s.r, 0) / lag0.length).toFixed(3),
      bilabial: `${L.reduce((s, z) => s + z.s.hit, 0)}/${L.reduce((s, z) => s + z.s.segs, 0)}`, vowelFalseClose: m((z) => z.s.vowelClosed) };
  }
}
console.log(JSON.stringify(result, null, 1));
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(result, null, 1));
