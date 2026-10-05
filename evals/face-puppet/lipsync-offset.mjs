// Lip-sync offset of Diya's own viseme events against her audio (V4 measure 1, event-timing half).
//   node evals/face-puppet/lipsync-offset.mjs            (after synth-diya.mjs)
// Two estimators that use only the audio as ground truth (no model in the loop):
//   E1 envelope lag: the viseme track mapped to mouth openness (the same map src/face-puppet/visemes.ts uses) is
//      cross-correlated with the audio's log-energy envelope (10 ms windows, 5 ms hop); the lag with the highest Pearson r
//      in -300..+300 ms is the line's offset. + = the mouth would move LATER than the sound.
//   E2 bilabial closures: every p/b/m viseme (Azure id 21) predicts a lip seal, which in the audio is an energy dip (a
//      stop gap for p/b, a nasal murmur for m). For each one, the deepest dip within +-120 ms of the viseme's segment
//      centre is found; offset = viseme centre - dip time. Reported as the median and IQR over all closures.
// Also reports the event grid (quantisation step of the offsets) and the word-boundary vs acoustic-onset gap.
import fs from "node:fs";
import { OPENNESS } from "../../src/face-puppet/visemes.ts";

const DIR = new URL("./out/diya/", import.meta.url).pathname;
const files = fs.readdirSync(DIR).filter((f) => /^\d\d\.json$/.test(f)).sort();
const HOP = 5, WIN = 10; // ms
const SR = 24000;

function envelope(pcm) {
  const s = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length >> 1);
  const hop = (SR * HOP) / 1000, win = (SR * WIN) / 1000;
  const out = [];
  for (let i = 0; i + win <= s.length; i += hop) {
    let e = 0;
    for (let j = i; j < i + win; j++) e += (s[j] / 32768) ** 2;
    out.push(10 * Math.log10(e / win + 1e-9));
  }
  return out;
}
function track(visemes, n) {
  const out = new Float64Array(n);
  for (let k = 0; k < visemes.length; k++) {
    const a = Math.round(visemes[k].ms / HOP), b = k + 1 < visemes.length ? Math.round(visemes[k + 1].ms / HOP) : n;
    for (let i = a; i < Math.min(b, n); i++) out[i] = OPENNESS[visemes[k].id] ?? 0;
  }
  return out;
}
function pearson(a, b, lag) {
  // corr(a[i], b[i - lag]) : track shifted by lag (lag > 0 = track later than audio)
  let n = 0, sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
  for (let i = 0; i < a.length; i++) {
    const j = i + lag;
    if (j < 0 || j >= b.length) continue;
    const x = a[i], y = b[j];
    n++; sa += x; sb += y; saa += x * x; sbb += y * y; sab += x * y;
  }
  const cov = sab / n - (sa / n) * (sb / n), va = saa / n - (sa / n) ** 2, vb = sbb / n - (sb / n) ** 2;
  return cov / Math.sqrt(va * vb + 1e-12);
}
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

const rows = [], closures = [], steps = [], wordGaps = [], pairedLag = [], wordDeltas = [];
for (const f of files) {
  const meta = JSON.parse(fs.readFileSync(DIR + f, "utf8"));
  const pcm = fs.readFileSync(DIR + f.replace(".json", ".pcm"));
  const env = envelope(pcm);
  const tr = track(meta.visemes, env.length);
  // E1: audio env a[i] vs track b[i+lag]: if the track is late by L, the best match is at lag = +L
  let best = -2, bestLag = 0;
  for (let lag = -60; lag <= 60; lag++) { const r = pearson(env, tr, lag); if (r > best) { best = r; bestLag = lag; } }
  const r0 = pearson(env, tr, 0);
  // E2
  const lineClos = [];
  meta.visemes.forEach((v, k) => {
    if (v.id !== 21) return;
    const end = k + 1 < meta.visemes.length ? meta.visemes[k + 1].ms : v.ms + 80;
    const c = (v.ms + end) / 2;
    let mi = -1, mv = Infinity;
    for (let t = c - 120; t <= c + 120; t += HOP) { const i = Math.round(t / HOP); if (i >= 0 && i < env.length && env[i] < mv) { mv = env[i]; mi = t; } }
    if (mi >= 0) { lineClos.push(c - mi); closures.push(c - mi); }
  });
  for (let k = 1; k < meta.visemes.length; k++) steps.push(meta.visemes[k].ms - meta.visemes[k - 1].ms);
  // word starts vs the first frame above (local floor + 12 dB) within -100..+150 ms
  const floor = q(env, 0.1);
  for (const w of meta.words) {
    let on = null;
    for (let t = w.ms - 100; t <= w.ms + 150; t += HOP) { const i = Math.round(t / HOP); if (env[i] > floor + 12 && (env[i - 4] ?? -99) <= floor + 12) { on = t; break; } }
    if (on !== null) wordGaps.push(w.ms - on);
  }
  // E3 (paired, same audio): the wav2vec2 forced-alignment track (ctc-align.py) scored with the SAME estimator; the
  // difference cancels the estimator's own bias. Plus Azure word starts minus CTC word starts (word by word, in order).
  let ctcLag = null, wordDelta = [];
  const cf = DIR + f.replace(".json", ".ctc.json");
  if (fs.existsSync(cf)) {
    const ctc = JSON.parse(fs.readFileSync(cf, "utf8"));
    const ct = track(ctc.visemes, env.length);
    let cb = -2;
    for (let lag = -60; lag <= 60; lag++) { const r = pearson(env, ct, lag); if (r > cb) { cb = r; ctcLag = lag * HOP; } }
    const az = meta.words.map((w) => ({ t: w.ms, k: w.text.toLowerCase().replace(/[^a-z]/g, "") })).filter((w) => w.k);
    let j = 0;
    for (const w of ctc.words) { while (j < az.length && az[j].k !== w.word) j++; if (j < az.length) { wordDelta.push(az[j].t - w.t0 * 1000); j++; } }
    pairedLag.push(bestLag * HOP - ctcLag);
    wordDeltas.push(...wordDelta);
  }
  rows.push({ line: f.slice(0, 2), ctcLagMs: ctcLag, pairedMs: ctcLag === null ? null : bestLag * HOP - ctcLag, wordVsCtcMedianMs: wordDelta.length ? q(wordDelta, 0.5) : null, text: meta.text.slice(0, 48), seconds: +(meta.ms / 1000).toFixed(2), visemes: meta.visemes.length, e1LagMs: bestLag * HOP, e1r: +best.toFixed(3), e1rAt0: +r0.toFixed(3), bilabials: lineClos.length, e2MedianMs: lineClos.length ? q(lineClos, 0.5) : null });
}
const lags = rows.map((r) => r.e1LagMs);
const gcd = (a, b) => (b < 0.5 ? a : gcd(b, a % b));
const res = {
  date: new Date().toISOString().slice(0, 10),
  voice: "en-IN-Diya:DragonHDLatestNeural @ -35%",
  method: "Azure TTS websocket viseme events vs the same synthesis's PCM; estimators E1 (openness-envelope cross-correlation) and E2 (bilabial closure vs energy dip)",
  nLines: rows.length,
  e1: { medianMs: q(lags, 0.5), p10: q(lags, 0.1), p90: q(lags, 0.9), absMaxMs: Math.max(...lags.map(Math.abs)), meanR: +(rows.reduce((a, r) => a + r.e1r, 0) / rows.length).toFixed(3) },
  e2: { n: closures.length, medianMs: q(closures, 0.5), q25: q(closures, 0.25), q75: q(closures, 0.75) },
  e3Paired: { n: pairedLag.length, note: "Azure-track lag minus CTC-track lag, same audio, same estimator (+ = Azure later)", medianMs: pairedLag.length ? q(pairedLag, 0.5) : null, q25: pairedLag.length ? q(pairedLag, 0.25) : null, q75: pairedLag.length ? q(pairedLag, 0.75) : null, min: Math.min(...pairedLag), max: Math.max(...pairedLag) },
  azureWordMinusCtcWord: { n: wordDeltas.length, medianMs: wordDeltas.length ? q(wordDeltas, 0.5) : null, q25: wordDeltas.length ? q(wordDeltas, 0.25) : null, q75: wordDeltas.length ? q(wordDeltas, 0.75) : null },
  wordBoundaryMinusAcousticOnset: { n: wordGaps.length, medianMs: q(wordGaps, 0.5), q25: q(wordGaps, 0.25), q75: q(wordGaps, 0.75) },
  eventGrid: { minStepMs: Math.min(...steps), medianStepMs: q(steps, 0.5), gridMs: +(steps.reduce((a, b) => gcd(a, Math.round(b * 10) / 10)) ).toFixed(2) },
  rows,
};
fs.writeFileSync(new URL("./out/lipsync-offset.json", import.meta.url), JSON.stringify(res, null, 1));
console.log(JSON.stringify({ ...res, rows: undefined }, null, 1));
console.table(rows);
