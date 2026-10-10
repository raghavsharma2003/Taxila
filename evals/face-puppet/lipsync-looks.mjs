// Round 4 stream 5: bilabial seals and the lip-sync offset, r8 vs lamp2, the product text rule vs rig2's extension
// (./bilabial2.js, a candidate), on ONE harness and ONE line set. Offline, no Azure spend: Diya's 24 stored lines
// (evals/face-puppet/out/diya/NN.{json,pcm,ctc.json}).
// The product timing path for both looks: track = resolveVisemes(visemes, words, text) (which applies the product rule,
// addBilabials); per 60 fps frame, weightsAt(track, t + EVENT_LEAD_MS [+ KEY_LEAD_MS for a key rig]).
//   r8      the continuous mouth: sealed when viseme_PP >= 0.9 at a frame; drawn openness = jawOpen / 0.62
//   lamp2   rig2's MouthKeys: sealed when the painted mbp key is up at >= 0.9; openness = KEY_OPENNESS through crossfades
//   seals   every word with a b / m / p sound (Roman b, bh, p not before h, m; Devanagari प ब भ म; or Azure's own 21
//           inside it) is SEALED if a frame inside [word start - 80 ms, word end] is sealed
//   offset  lipsync-offset.mjs's E3: best Pearson lag (5 ms grid) of drawn openness vs the audio log-energy envelope,
//           minus the same lag of the wav2vec2 forced-alignment track of the same audio (+ = the mouth is later);
//           search +-300 ms, and +-150 ms beside it
//   pacing  the same at 30 fps (the stage's slow-hold rate) for the frame-pacing share of the error
//   node evals/face-puppet/lipsync-looks.mjs [out.json]
import fs from "node:fs";
import { resolveVisemes, weightsAt, OPENNESS } from "../../src/face-puppet/visemes.ts";
import { EVENT_LEAD_MS } from "../../src/face-puppet/track.ts";
import { MouthKeys, KEY_OPENNESS, KEY_LEAD_MS } from "../../src/face-puppet/rig-keys/schedule.ts";
import { addBilabials2 } from "./bilabial2.js";
import { LINES } from "./lines.mjs";

const DIR = new URL("./out/diya/", import.meta.url).pathname;
const OUT = process.argv[2] ?? new URL("./out/lipsync-looks.json", import.meta.url).pathname;
const HOP = 5, WIN = 10, SR = 24000;
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
const BIL_ROMAN = /(^|[^p])(?:b|m|p(?!h))/, BIL_DEV = /[पबभम]/u;
const isBilabialWord = (t) => { const w = t.normalize("NFC"); return /[ऀ-ॿ]/u.test(w) ? BIL_DEV.test(w) : BIL_ROMAN.test(w.toLowerCase().replace(/[^a-z]/g, "")); };

/** One look, one rule, one frame rate: per-frame sealed flags and the drawn openness on the 5 ms grid. */
function simulate(look, vis, words, text, n, fps) {
  const track = resolveVisemes(vis, words, text);
  const frame = 1000 / fps, lead = EVENT_LEAD_MS + (look === "lamp2" ? KEY_LEAD_MS : 0);
  const mk = new MouthKeys(), w = {}, sealedAt = [], open = new Float64Array(n);
  for (let t = -200; t < n * HOP; t += frame) {
    weightsAt(track, t + lead, w, 0);
    let o, sealed;
    if (look === "lamp2") {
      const sw = mk.step(t + 1000, { bs: w });
      o = KEY_OPENNESS[sw.a] * (1 - sw.k) + KEY_OPENNESS[sw.b] * sw.k;
      sealed = (sw.b === "mbp" && sw.k >= 0.9) || (sw.a === "mbp" && sw.b === "mbp");
    } else {
      o = (w.jawOpen ?? 0) / 0.62;
      sealed = (w.viseme_PP ?? 0) >= 0.9;
    }
    sealedAt.push([t, sealed]);
    for (let i = Math.max(0, Math.floor(t / HOP)); i < Math.min(n, Math.floor((t + frame) / HOP)); i++) open[i] = o;
  }
  return { sealedAt, open };
}

const ARMS = [];
for (const look of ["r8", "lamp2"]) for (const rule of ["product", "extension"]) ARMS.push({ look, rule });
const acc = Object.fromEntries(ARMS.map((a) => [`${a.look}/${a.rule}`, { seal: [0, 0], missed: [], off: [], off150: [], off30fps: [] }]));
for (let k = 0; k < LINES.length; k++) {
  const f = String(k).padStart(2, "0");
  const m = JSON.parse(fs.readFileSync(`${DIR}${f}.json`, "utf8"));
  const env = envelope(fs.readFileSync(`${DIR}${f}.pcm`)), n = env.length;
  const cf = `${DIR}${f}.ctc.json`;
  const ctc = fs.existsSync(cf) ? JSON.parse(fs.readFileSync(cf, "utf8")).visemes : null;
  const ctcLag = ctc ? bestLag(env, stepTrack(ctc, n)) : null, ctcLag150 = ctc ? bestLag(env, stepTrack(ctc, n), 30) : null;
  for (const { look, rule } of ARMS) {
    const a = acc[`${look}/${rule}`];
    const vis = rule === "extension" ? addBilabials2(m.visemes, m.words) : m.visemes;
    const sim = simulate(look, vis, m.words, m.text, n, 60);
    for (const w of m.words) {
      const has21 = m.visemes.some((v) => v.id === 21 && v.ms >= w.ms - 60 && v.ms <= w.ms + w.durMs);
      if (!isBilabialWord(w.text) && !has21) continue;
      a.seal[1]++;
      if (sim.sealedAt.some(([t, s]) => s && t >= w.ms - 80 && t <= w.ms + w.durMs)) a.seal[0]++; else a.missed.push(`${f}:${w.text}`);
    }
    if (ctc) {
      a.off.push(bestLag(env, sim.open) - ctcLag);
      a.off150.push(bestLag(env, sim.open, 30) - ctcLag150);
      a.off30fps.push(bestLag(env, simulate(look, vis, m.words, m.text, n, 30).open) - ctcLag);
    }
  }
}
const dist = (a) => ({ n: a.length, median: q(a, 0.5), q25: q(a, 0.25), q75: q(a, 0.75), min: Math.min(...a), max: Math.max(...a), within50: +(a.filter((x) => Math.abs(x) <= 50).length / a.length).toFixed(2) });
const out = { date: new Date().toISOString().slice(0, 10), method: fs.readFileSync(new URL(import.meta.url)).toString().split("\n").filter((l) => l.startsWith("//")).map((l) => l.slice(3)).join("\n"), arms: {} };
for (const [k, a] of Object.entries(acc)) out.arms[k] = { sealed: `${a.seal[0]}/${a.seal[1]}`, missed: a.missed, offset: dist(a.off), offsetLag150: dist(a.off150), offset30fps: dist(a.off30fps), perLine: a.off };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
for (const [k, a] of Object.entries(out.arms)) console.log(k.padEnd(18), "sealed", a.sealed.padEnd(8), "offset med", a.offset.median, "±50", a.offset.within50, "| ±150 search: med", a.offsetLag150.median, "±50", a.offsetLag150.within50, "| 30 fps ±50", a.offset30fps.within50);
