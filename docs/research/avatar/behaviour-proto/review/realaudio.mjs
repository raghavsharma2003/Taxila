// Graphics review: run the controller's exact prosody front end (fast/slow RMS, accent rule, 150 ms pause rule)
// on real realtime-voice clips instead of the sim's synthetic 4.5 Hz envelope. Usage: node realaudio.mjs <dir-with-wavs> [gain]
import fs from 'node:fs'; import path from 'node:path';
const dir = process.argv[2], gain = +(process.argv[3] ?? 1);
function readWav(f) { const b = fs.readFileSync(f); let o = 12, sr = 0, data = null;
  while (o < b.length) { const id = b.toString('ascii', o, o + 4), n = b.readUInt32LE(o + 4);
    if (id === 'fmt ') sr = b.readUInt32LE(o + 12); if (id === 'data') data = new Int16Array(b.buffer.slice(b.byteOffset + o + 8, b.byteOffset + o + 8 + n)); o += 8 + n + (n & 1); }
  return { sr, x: Float32Array.from(data, v => v / 32768) }; }
const q = (a, p) => { const s = [...a].sort((m, n) => m - n); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const rows = [];
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.wav')).sort()) {
  const { sr, x } = readWav(path.join(dir, f)); const win = Math.round(sr * 0.0427); // = AnalyserNode fftSize 2048 @ 48 kHz
  const R = { fast: 0, slow: 0.02, lastAccent: -9 }; let t = 0, accents = 0, strong = 0, pauses = 0, voicedF = 0, frames = 0, herVoiced = false, pauseT0 = -1, handled = false; const rmsAll = [];
  for (let end = win; end < x.length; end += Math.round(sr / 30)) {
    const dt = 1 / 30; t += dt; let s = 0; for (let i = end - win; i < end; i++) s += x[i] * x[i]; const her = Math.sqrt(s / win) * gain; rmsAll.push(her);
    R.fast += (1 - Math.exp(-dt / 0.03)) * (her - R.fast); if (her > 0.01) R.slow += (1 - Math.exp(-dt / 1.5)) * (her - R.slow);
    const voiced = R.fast > 0.012; frames++; if (voiced) voicedF++;
    if (!voiced && herVoiced) pauseT0 = t; if (!voiced && pauseT0 > 0 && t - pauseT0 > 0.15 && !handled) { handled = true; pauses++; } if (voiced) handled = false;
    if (voiced && R.fast > R.slow * 1.6 && t - R.lastAccent > 0.35) { R.lastAccent = t; accents++; if (R.fast > R.slow * 2.2) strong++; }
    herVoiced = voiced; }
  rows.push({ f, dur: +t.toFixed(1), accentsPerS: +(accents / t).toFixed(2), strongPerS: +(strong / t).toFixed(2), pausesPerMin: +(pauses / t * 60).toFixed(1), voiced: +(voicedF / frames).toFixed(2), rmsP50: +q(rmsAll, .5).toFixed(3), rmsP90: +q(rmsAll, .9).toFixed(3) });
}
console.table(rows);
const m = k => (rows.reduce((a, r) => a + r[k], 0) / rows.length).toFixed(2);
console.log(`gain ${gain}: mean accents/s ${m('accentsPerS')} (refractory ceiling 2.86/s), strong/s ${m('strongPerS')}, phrase pauses/min ${m('pausesPerMin')}, voiced frac ${m('voiced')}`);
