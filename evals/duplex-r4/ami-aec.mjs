// duplex r4: the PHONE PROFILE for the AMI overlap replay. A phone runs an echo canceller on the mic against her playback
// (src/lesson/cascadeLink.ts asks getUserMedia for echoCancellation); the AMI headset rig has none, so R6 there over-states a
// phone. For every ordered pair (X = the mic, Y = her) this removes Y's voice from X's raw headset audio with a LINEAR NLMS
// adaptive filter (her own audio as the reference: what an AEC has), then writes X's device frames (RMS dB + the shipped YIN,
// the same HOP / WIN / gate as evals/p1-duplex/ami-frames.mjs) for that pair. LABEL: simulated linear AEC (no residual
// echo suppressor, no comfort noise; WebRTC AEC3 also suppresses non-linearly), AMI real adult speech (CC BY 4.0).
//   node evals/duplex-r4/ami-aec.mjs <frames_dir> <pcm_dir> <out_dir> --meeting ES2004b [--taps 128] [--mu 0.05]
import fs from "node:fs";
import path from "node:path";
import { yin } from "../../src/voice/dsp.ts";
const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const [framesDir, pcmDir, outDir] = argv;
const m = opt("--meeting"), TAPS = Number(opt("--taps", 128)), MU = Number(opt("--mu", 0.05));
const LIMIT = Number(opt("--limit-s", 0)), ONLY = opt("--pair", null); // tuning: the first N seconds of one pair
const SR = 16000, HOP = 320, WIN = 640;
fs.mkdirSync(outDir, { recursive: true });
const M = JSON.parse(fs.readFileSync(path.join(framesDir, `${m}.json`), "utf8"));
const load = (a) => { const b = fs.readFileSync(path.join(pcmDir, `${m}.${a}.s16`)); const x = new Float32Array(b.length >> 1); for (let i = 0; i < x.length; i++) x[i] = b.readInt16LE(i * 2) / 32768; return x; };
const pcm = Object.fromEntries(Object.keys(M.chans).map((a) => [a, load(a)]));
for (const X of Object.keys(M.chans).sort()) for (const Y of Object.keys(M.chans).sort()) {
  if (X === Y || (ONLY && ONLY !== X + Y)) continue;
  const out = path.join(outDir, `${m}.${X}${Y}.json`);
  if (fs.existsSync(out) && !LIMIT) continue;
  const t0 = Date.now();
  const x = pcm[X], r = pcm[Y], n = LIMIT ? Math.min(x.length, r.length, LIMIT * SR) : Math.min(x.length, r.length);
  const w = new Float32Array(TAPS), e = new Float32Array(n);
  let pow = 1e-6; // running reference power over the filter span
  for (let i = 0; i < n; i++) {
    const rin = r[i], rout = i >= TAPS ? r[i - TAPS] : 0;
    pow += rin * rin - rout * rout;
    let y = 0;
    for (let k = 0; k < TAPS && i - k >= 0; k++) y += w[k] * r[i - k];
    const err = x[i] - y;
    e[i] = err;
    const g = (MU * err) / (pow + 1e-4);
    for (let k = 0; k < TAPS && i - k >= 0; k++) w[k] += g * r[i - k];
  }
  const db = [], f0 = [];
  for (let i = 0; i + HOP <= n; i += HOP) {
    let s = 0;
    for (let k = i; k < i + HOP; k++) s += e[k] * e[k];
    const d = 10 * Math.log10(s / HOP + 1e-12);
    let f = null;
    if (d > -45 && i + WIN <= n) f = yin(e.subarray(i, i + WIN), SR, 70, 600).f0;
    db.push(+d.toFixed(1));
    f0.push(f ? +f.toFixed(1) : null);
  }
  // how much of Y's bleed the filter removed, over frames where only Y talks (a reporting figure, not used by the engine)
  const talk = (a) => { const t = new Uint8Array(db.length); for (const [s0, e0] of M.chans[a].words) for (let k = Math.floor(s0 / 20); k < Math.ceil(e0 / 20) && k < t.length; k++) t[k] = 1; return t; };
  const tx = talk(X), ty = talk(Y);
  let before = 0, after = 0, c = 0;
  for (let k = 0; k < db.length; k++) if (ty[k] && !tx[k]) { before += M.chans[X].db[k] ?? 0; after += db[k]; c++; }
  fs.writeFileSync(out, JSON.stringify({ X, Y, taps: TAPS, mu: MU, db, f0, erleDb: c ? +((before - after) / c).toFixed(1) : null }));
  console.log(m, X, Y, `${((Date.now() - t0) / 1000).toFixed(0)} s, mean level drop on Y-only frames ${c ? ((before - after) / c).toFixed(1) : "-"} dB`);
}
