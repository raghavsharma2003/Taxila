// Round 7 face (independent of the look decision): would r8 gain from lamp2's b / m / p rule? r8 draws with the BASE rule
// today (track.ts extendedBilabials = false; stage.ts turns the extended rule on for a key rig only).
// The 24-line Diya battery (evals/face-puppet/lines.mjs; stored synthesis evals/face-puppet/out/diya/NN.json + .pcm +
// .ctc.json), offline, no Azure spend, on r8's PRODUCT mouth path: visemes.ts resolveVisemes (base vs extended rule) +
// weightsAt at 60 fps with r8's timing (track.ts: weights at audio time + EVENT_LEAD_MS; no key lead).
//   sealed     a b / m / p word (the route-b battery's word rule; Azure's own viseme 21 in the word counts it too) is
//              SEALED when some frame in [word start - 80 ms, word end] crosses the r8 lip solver's own seal line
//              (runtime/lips.js: cPP = smoothstep(0.6, 0.92, viseme_PP) > 0.85 shuts the lip gap and holds it 67 ms,
//              whatever the jaw does).
//   unowed     sealed frame runs that fall inside no b / m / p word window: a closure the audio does not ask for.
//   offset     the E3 estimator (lipsync-offset.mjs): best Pearson lag (5 ms grid, +-300 ms) of the drawn jaw against the
//              audio's log-energy envelope, minus the same lag of the wav2vec2 forced-alignment track. + = the mouth is later.
//   node evals/face-puppet/r8-bilabial-battery.mjs [out.json]
import fs from "node:fs";
import { resolveVisemes, weightsAt, OPENNESS } from "../../src/face-puppet/visemes.ts";
import { EVENT_LEAD_MS } from "../../src/face-puppet/track.ts";
import { LINES } from "./lines.mjs";

const DIR = new URL("./out/diya/", import.meta.url).pathname;
const HOP = 5, WIN = 10, SR = 24000, FRAME = 1000 / 60, JAW_MAX = 0.62;
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
function envelope(pcm) {
  const s = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length >> 1), hop = (SR * HOP) / 1000, win = (SR * WIN) / 1000, out = [];
  for (let i = 0; i + win <= s.length; i += hop) { let e = 0; for (let j = i; j < i + win; j++) e += (s[j] / 32768) ** 2; out.push(10 * Math.log10(e / win + 1e-9)); }
  return out;
}
function stepTrack(visemes, n) {
  const out = new Float64Array(n);
  for (let k = 0; k < visemes.length; k++) { const a = Math.round(visemes[k].ms / HOP), b = k + 1 < visemes.length ? Math.round(visemes[k + 1].ms / HOP) : n; for (let i = a; i < Math.min(b, n); i++) out[i] = OPENNESS[visemes[k].id] ?? 0; }
  return out;
}
function pearson(a, b, lag) {
  let n = 0, sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
  for (let i = 0; i < a.length; i++) { const j = i + lag; if (j < 0 || j >= b.length) continue; const x = a[i], y = b[j]; n++; sa += x; sb += y; saa += x * x; sbb += y * y; sab += x * y; }
  const cov = sab / n - (sa / n) * (sb / n), va = saa / n - (sa / n) ** 2, vb = sbb / n - (sb / n) ** 2;
  return cov / Math.sqrt(va * vb + 1e-12);
}
const bestLag = (env, tr, R = 60) => { let best = -2, L = 0; for (let lag = -R; lag <= R; lag++) { const r = pearson(env, tr, lag); if (r > best) { best = r; L = lag; } } return L * HOP; };
const BIL_ROMAN = /(^|[^p])(?:b|m|p(?!h))/;
const BIL_DEV = /[पबभम]/u;
const isBilabialWord = (t) => { const w = t.normalize("NFC"); return /[ऀ-ॿ]/u.test(w) ? BIL_DEV.test(w) : BIL_ROMAN.test(w.toLowerCase().replace(/[^a-z]/g, "")); };

/** r8's product mouth: per-frame [audioMs, pp, jaw] and the drawn jaw on the 5 ms grid. */
function simulate(m, n, extended) {
  const track = resolveVisemes(m.visemes, m.words, m.text, { extendedBilabials: extended });
  const w = {}, frames = [], jaw = new Float64Array(n);
  for (let t = -200; t < n * HOP; t += FRAME) {
    weightsAt(track, t + EVENT_LEAD_MS, w, 0);
    const j = (w.jawOpen ?? 0) / JAW_MAX;
    frames.push([t, w.viseme_PP ?? 0, j]);
    const i0 = Math.max(0, Math.floor(t / HOP)), i1 = Math.min(n, Math.floor((t + FRAME) / HOP));
    for (let i = i0; i < i1; i++) jaw[i] = j;
  }
  return { frames, jaw };
}
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const shut = ([, pp]) => sstep(0.6, 0.92, pp) > 0.85;

const arms = { base: { sealed: 0, words: 0, missed: [], unowed: [], offset: [] }, extended: { sealed: 0, words: 0, missed: [], unowed: [], offset: [] } };
for (let k = 0; k < LINES.length; k++) {
  const f = String(k).padStart(2, "0");
  const m = JSON.parse(fs.readFileSync(`${DIR}${f}.json`, "utf8"));
  const env = envelope(fs.readFileSync(`${DIR}${f}.pcm`)), n = env.length;
  const bil = m.words.filter((w) => isBilabialWord(w.text) || m.visemes.some((v) => v.id === 21 && v.ms >= w.ms - 60 && v.ms <= w.ms + w.durMs));
  const owed = (t) => bil.some((w) => t >= w.ms - 80 && t <= w.ms + w.durMs);
  const cf = `${DIR}${f}.ctc.json`;
  const ctcLag = fs.existsSync(cf) ? bestLag(env, stepTrack(JSON.parse(fs.readFileSync(cf, "utf8")).visemes, n)) : null;
  for (const [name, extended] of [["base", false], ["extended", true]]) {
    const a = arms[name], sim = simulate(m, n, extended);
    for (const w of bil) {
      a.words++;
      if (sim.frames.some((fr) => fr[0] >= w.ms - 80 && fr[0] <= w.ms + w.durMs && shut(fr))) a.sealed++; else a.missed.push(`${f}:${w.text}`);
    }
    // sealed runs outside every b / m / p window
    let run = null;
    for (const fr of sim.frames) {
      if (shut(fr) && fr[0] >= 0) { run ??= fr[0]; } else if (run != null) { const mid = (run + fr[0]) / 2; if (!owed(mid)) a.unowed.push(`${f}@${Math.round(mid)}ms`); run = null; }
    }
    if (ctcLag != null) a.offset.push(bestLag(env, sim.jaw) - ctcLag);
  }
}
const dist = (a) => ({ n: a.length, median: q(a, 0.5), q25: q(a, 0.25), q75: q(a, 0.75), min: Math.min(...a), max: Math.max(...a), within50: +(a.filter((x) => Math.abs(x) <= 50).length / a.length).toFixed(2) });
const result = {
  date: new Date().toISOString().slice(0, 10),
  method: fs.readFileSync(new URL(import.meta.url)).toString().split("\n").filter((l) => l.startsWith("//")).map((l) => l.slice(3)).join("\n"),
  arms: Object.fromEntries(Object.entries(arms).map(([k, a]) => [k, { sealed: `${a.sealed}/${a.words}`, missed: a.missed, unowed: a.unowed.length, unowedAt: a.unowed, offset: dist(a.offset) }])),
  bar: "-125 <= offset <= +45 ms (decisions.md E-P8, ITU-R BT.1359)",
};
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(result, null, 1));
console.log(JSON.stringify(result.arms, null, 1));
