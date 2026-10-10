// Bilabial seals from the word text (src/face-puppet/visemes.ts addBilabials, integrate patch 06): the 24-line battery
// the patch's own note asked for. Offline, no Azure spend: Diya's recorded lines in evals/face-puppet/out/diya/*.{json,pcm}.
//   node evals/face-puppet/bilabial-battery.mjs            → out/bilabial-battery.json
// Per word with a b / bh / p / m onset (Roman or प ब भ म) or a word-internal bb / pp / mm / mb / mp:
//   coverage   does the word's window [start - 60, end] hold a viseme 21 (p b m: the lips seal) from Azure alone, and
//              after addBilabials?
//   timing     for every seal, Azure's and the added ones alike, lipsync-offset.mjs's E2 estimator: the seal's segment
//              centre minus the deepest audio-energy dip within ±120 ms (a stop gap or a nasal murmur). + = the seal
//              lands after the dip. The added seals are judged against Azure's own distribution on the same lines.
// Also checks every added seal is owed to a b/m/p word (within that word's [start - 40, end]); an unowed one is a
// false seal (must be 0).
import fs from "node:fs";
import { addBilabials } from "../../src/face-puppet/visemes.ts";

const DIR = "evals/face-puppet/out/diya/";
const OUT = "evals/face-puppet/out/bilabial-battery.json";
const HOP = 5, WIN = 10, SR = 24000;
const ONSET_ROMAN = /^(?:bh|b|p(?!h)|m)/, ONSET_DEV = /^[पबभम]/u, INNER = /(?:bb|pp|mm|mb|mp)/;

function envelope(pcm) {
  const s = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length >> 1);
  const hop = (SR * HOP) / 1000, win = (SR * WIN) / 1000, out = [];
  for (let i = 0; i + win <= s.length; i += hop) {
    let e = 0;
    for (let j = i; j < i + win; j++) e += (s[j] / 32768) ** 2;
    out.push(10 * Math.log10(e / win + 1e-9));
  }
  return out;
}
/** E2 (lipsync-offset.mjs): seal segment centre minus the deepest dip within ±120 ms. */
function dipOffset(env, events, k) {
  const v = events[k];
  const end = k + 1 < events.length ? events[k + 1].ms : v.ms + 80;
  const c = (v.ms + end) / 2;
  let mi = null, mv = Infinity;
  for (let t = c - 120; t <= c + 120; t += HOP) { const i = Math.round(t / HOP); if (i >= 0 && i < env.length && env[i] < mv) { mv = env[i]; mi = t; } }
  return mi == null ? null : c - mi;
}
const q = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const stat = (a) => ({ n: a.length, p25: q(a, 0.25), median: q(a, 0.5), p75: q(a, 0.75), absMedian: q(a.map(Math.abs), 0.5) });

const files = fs.readdirSync(DIR).filter((f) => /^\d\d\.json$/.test(f)).sort();
let words = 0, before = 0, after = 0, falseSeals = 0;
const azureOff = [], addedOff = [], missed = [], perLine = [];
for (const f of files) {
  const meta = JSON.parse(fs.readFileSync(DIR + f, "utf8"));
  const env = envelope(fs.readFileSync(DIR + f.replace(".json", ".pcm")));
  const az = meta.visemes, out = addBilabials(az, meta.words);
  const azSet = new Set(az.filter((v) => v.id === 21).map((v) => v.ms));
  const has21 = (evs, a, b) => evs.some((v) => v.id === 21 && v.ms >= a && v.ms <= b);
  let lw = 0, lb = 0, la = 0;
  for (const w of meta.words) {
    const raw = String(w.text || "").normalize("NFC");
    const dev = /[ऀ-ॿ]/u.test(raw);
    const r = dev ? raw : raw.toLowerCase().replace(/[^a-z]/g, "");
    if (!r) continue;
    const bilabial = dev ? ONSET_DEV.test(r) : ONSET_ROMAN.test(r) || INNER.test(r);
    const wasSealed = has21(az, w.ms - 60, w.ms + w.durMs), isSealed = has21(out, w.ms - 60, w.ms + w.durMs);
    if (!bilabial) continue;
    words++; lw++;
    if (wasSealed) { before++; lb++; }
    if (isSealed) { after++; la++; } else missed.push(`${f} ${w.text}`);
  }
  const bilabialWords = meta.words.filter((w) => {
    const raw = String(w.text || "").normalize("NFC"), dev = /[ऀ-ॿ]/u.test(raw);
    const r = dev ? raw : raw.toLowerCase().replace(/[^a-z]/g, "");
    return !!r && (dev ? ONSET_DEV.test(r) : ONSET_ROMAN.test(r) || INNER.test(r));
  });
  for (const v of out) if (v.id === 21 && !azSet.has(v.ms) && !bilabialWords.some((w) => v.ms >= w.ms - 40 && v.ms <= w.ms + w.durMs)) falseSeals++;
  out.forEach((v, k) => {
    if (v.id !== 21) return;
    const o = dipOffset(env, out, k);
    if (o == null) return;
    (azSet.has(v.ms) ? azureOff : addedOff).push(o);
  });
  perLine.push({ line: f, words: lw, sealedAzure: lb, sealedWithRule: la });
}
const res = {
  date: new Date().toISOString().slice(0, 10),
  method: "offline: Diya DragonHD lines (evals/face-puppet/out/diya, rate -35, 24 lines, Azure viseme + word-boundary events); seal coverage per b/m/p word before/after addBilabials; timing by lipsync-offset.mjs E2 (seal segment centre minus deepest energy dip within ±120 ms)",
  lines: files.length, bilabialWords: words,
  coverage: { azureOnly: before, withRule: after, azureShare: +(before / words).toFixed(3), withRuleShare: +(after / words).toFixed(3) },
  falseSeals, missed,
  timingMs: { azureSeals: stat(azureOff), addedSeals: stat(addedOff) },
  perLine,
};
fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
console.log(`${files.length} lines, ${words} b/m/p words: sealed ${before}/${words} by Azure alone → ${after}/${words} with the rule; false seals ${falseSeals}`);
console.log(`E2 offset (ms, + = seal after the dip): Azure seals median ${res.timingMs.azureSeals.median} IQR [${res.timingMs.azureSeals.p25}, ${res.timingMs.azureSeals.p75}] |abs| ${res.timingMs.azureSeals.absMedian} (n ${azureOff.length}); added seals median ${res.timingMs.addedSeals.median} IQR [${res.timingMs.addedSeals.p25}, ${res.timingMs.addedSeals.p75}] |abs| ${res.timingMs.addedSeals.absMedian} (n ${addedOff.length})`);
if (missed.length) console.log(`still unsealed: ${missed.join(", ")}`);
