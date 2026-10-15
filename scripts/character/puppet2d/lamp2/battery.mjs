// The 24-line Diya battery (evals/face-puppet/lines.mjs; stored synthesis evals/face-puppet/out/diya/NN.json + .pcm +
// .ctc.json), offline, no Azure spend: the PRODUCT mouth path (VisemeScheduler timing: Azure offsets - EVENT_LEAD_MS,
// visemes.ts resolveVisemes + weightsAt) feeding the lamp2 MouthKeys at 60 fps: Azure's visemes alone, + lamp1's bilabial
// text rule (lamp1/demo/bilabial.js), + the lamp2 extension (bilabial2.js; the offset is scored on this arm).
//   bilabials  every word with a b / m / p sound (Roman b, bh, p not before h, m; Devanagari प ब भ म; Azure's own
//              viseme 21 inside the word counts it too): SEALED when the painted mbp key is up at >= 0.9 at some frame
//              inside [word start - 80 ms, word end] (audio time).
//   offset     the lipsync-offset.mjs E3 estimator: best Pearson lag (5 ms grid, +-300 ms) of the drawn openness
//              (KEY_OPENNESS through the crossfades) against the audio's log-energy envelope, minus the same lag of the
//              wav2vec2 forced-alignment track of the same audio (the judged clips' timing). + = the mouth is later.
//              The continuous viseme jaw the r8 rig draws is scored the same way for reference.
//   node scripts/character/puppet2d/lamp2/battery.mjs <out.json>
import fs from "node:fs";
import { resolveVisemes, weightsAt, OPENNESS } from "../../../../src/face-puppet/visemes.ts";
import { EVENT_LEAD_MS } from "../../../../src/face-puppet/track.ts";
import { MouthKeys, KEY_OPENNESS, KEY_LEAD_MS } from "../../../../src/face-puppet/rig-keys/schedule.ts";
import { addBilabials } from "../lamp1/demo/bilabial.js";
import { addBilabials2 } from "./bilabial2.js";
import { LINES } from "../../../../evals/face-puppet/lines.mjs";

const DIR = new URL("../../../../evals/face-puppet/out/diya/", import.meta.url).pathname;
const HOP = 5, WIN = 10, SR = 24000, FRAME = 1000 / 60;
const KEY_LEAD = process.env.KEY_LEAD ? Number(process.env.KEY_LEAD) : KEY_LEAD_MS;
// eval sweeps: TIMING='{"holdMs":50}' etc. (schedule.ts MouthTiming)
const TIMING = process.env.TIMING ? JSON.parse(process.env.TIMING) : {};
// OPEN=<interior.json>: score the MEASURED drawn opening of each key instead of schedule.ts KEY_OPENNESS
const OPEN = process.env.OPEN ? JSON.parse(fs.readFileSync(process.env.OPEN, "utf8")).openness : null;
const openOf = (k) => (OPEN ? (OPEN[k] ?? 0) : KEY_OPENNESS[k]);
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

/** Simulate the product mouth: returns per-frame [audioMs, swap] and the drawn openness on the 5 ms grid. */
function simulate(vis, words, text, n) {
  const track = resolveVisemes(vis, words, text);
  const mk = new MouthKeys(TIMING), w = {}, frames = [];
  const open = new Float64Array(n), jaw = new Float64Array(n);
  const end = n * HOP;
  for (let t = -200; t < end; t += FRAME) {
    const ms = t + EVENT_LEAD_MS + KEY_LEAD;   // track.ts: weights at (now - playAt + lead); the key rig adds KEY_LEAD_MS
    weightsAt(track, ms, w, 0);
    const sw = mk.step(t + 1000, { bs: w });
    frames.push([t, sw]);
    const sw2 = sw, o = openOf(sw2.a) * (1 - sw2.k) + openOf(sw2.b) * sw2.k, j = (w.jawOpen ?? 0) / 0.62;
    const i0 = Math.max(0, Math.floor(t / HOP)), i1 = Math.min(n, Math.floor((t + FRAME) / HOP));
    for (let i = i0; i < i1; i++) { open[i] = o; jaw[i] = j; }
  }
  return { frames, open, jaw };
}
const sealed = (frames, a, b) => frames.some(([t, s]) => t >= a && t <= b && ((s.b === "mbp" && s.k >= 0.9) || (s.a === "mbp" && s.b === "mbp")));

const out = { date: new Date().toISOString().slice(0, 10), method: fs.readFileSync(new URL(import.meta.url)).toString().split("\n").filter((l) => l.startsWith("//")).map((l) => l.slice(3)).join("\n"), lines: [] };
const paired150 = [];
const words = { rule2: [0, 0], rule: [0, 0], azure: [0, 0] }, missed = { rule2: [], rule: [], azure: [] }, paired = [], pairedJaw = [];
for (let k = 0; k < LINES.length; k++) {
  const f = String(k).padStart(2, "0");
  const m = JSON.parse(fs.readFileSync(`${DIR}${f}.json`, "utf8"));
  const pcm = fs.readFileSync(`${DIR}${f}.pcm`);
  const env = envelope(pcm), n = env.length;
  const row = { line: f, text: m.text.slice(0, 60) };
  for (const [arm, vis] of [["rule2", addBilabials2(m.visemes, m.words)], ["rule", addBilabials(m.visemes, m.words)], ["azure", m.visemes]]) {
    const sim = simulate(vis, m.words, m.text, n);
    for (const w of m.words) {
      const has21 = m.visemes.some((v) => v.id === 21 && v.ms >= w.ms - 60 && v.ms <= w.ms + w.durMs);
      if (!isBilabialWord(w.text) && !has21) continue;
      words[arm][1]++;
      if (sealed(sim.frames, w.ms - 80, w.ms + w.durMs)) words[arm][0]++; else missed[arm].push(`${f}:${w.text}`);
    }
    if (arm === "rule2") {
      const cf = `${DIR}${f}.ctc.json`;
      if (fs.existsSync(cf)) {
        const ctcLag = bestLag(env, stepTrack(JSON.parse(fs.readFileSync(cf, "utf8")).visemes, n));
        row.keysMinusCtcMs = bestLag(env, sim.open) - ctcLag;
        row.continuousJawMinusCtcMs = bestLag(env, sim.jaw) - ctcLag;
        paired.push(row.keysMinusCtcMs); pairedJaw.push(row.continuousJawMinusCtcMs);
        // the same estimator with the lag search limited to +-150 ms (half a syllable): a stepped key mouth can lock onto the
        // NEIGHBOURING syllable at +-250-320 ms in the +-300 ms search; reported beside it, never instead of it
        const ctc150 = bestLag(env, stepTrack(JSON.parse(fs.readFileSync(cf, "utf8")).visemes, n), 30);
        row.keysMinusCtcMs150 = bestLag(env, sim.open, 30) - ctc150; paired150.push(row.keysMinusCtcMs150);
      }
    }
  }
  out.lines.push(row);
}
const dist = (a) => ({ n: a.length, median: q(a, 0.5), q25: q(a, 0.25), q75: q(a, 0.75), min: Math.min(...a), max: Math.max(...a), within50: +(a.filter((x) => Math.abs(x) <= 50).length / a.length).toFixed(2) });
out.bilabialWords = { withLamp2Rule: `${words.rule2[0]}/${words.rule2[1]}`, missedWithLamp2Rule: missed.rule2, withLamp1Rule: `${words.rule[0]}/${words.rule[1]}`, azureVisemesOnly: `${words.azure[0]}/${words.azure[1]}`, missedWithLamp1Rule: missed.rule, missedAzureOnly: missed.azure };
out.offset = { keys: dist(paired), keysLag150: dist(paired150), continuousVisemeJaw: dist(pairedJaw), bar: "-125 <= offset <= +45 ms (decisions.md E-P8, ITU-R BT.1359); p2-face product path measured median -5 ms, 89% within +-50 ms (measurements p2f-lipsync-product-2026-10-05)" };
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(JSON.stringify({ bilabialWords: out.bilabialWords, offset: out.offset }, null, 1));
