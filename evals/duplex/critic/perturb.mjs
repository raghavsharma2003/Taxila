// Adversarial world perturbations for TaxilaFDB (critique of duplex v2, 2026-10-04). Each one is a WORLD change applied to a
// loaded stream before world.mjs runs it; nothing here touches the runtime. Every arm in a comparison gets the same
// perturbed world (same seed per stream), so differences are the arms'.
//
//   sttReal   the transcript is no longer the script. Calibrated [E] on the L2 run (48 test streams through the real
//             gpt-live-transcribe, 2026-10-04; scratch analysis in docs/research/duplex/CRITIQUE.md §2): 47% of aligned child
//             segments came back verbatim; English words inside Hindi speech came back in Devanagari ("कॉर्नर्स",
//             "स्क्वायर सेमी"); fillers were dropped or turned into words ("हम्म"→"हम", "उम्म"→"अम्मा", "umm"→"हाँ");
//             "दीदी"→"दीजिए" 2/3; 5/90 segments were hallucinated in another script (Japanese, Telugu, Korean, Bengali);
//             "सात"→"साथ", "छह दिन"→"シャーデン". Word timings are unchanged (the lane model still decides WHEN words land).
//   slow      a shy / slow child: every within-turn pause x factor (frames of the pause's own room noise are inserted;
//             every later gold time shifts). The child's words are unchanged.
//   quiet     the child is `db` quieter at the mic (far from the phone, soft voice); f0 is lost where the child's own
//             energy falls under the noise floor + 6 dB.
//   phone     a cheap phone mic in a busy home: stationary noise at `snr` dB under the child's median speech level, plus
//             aperiodic clatter bursts (200-400 ms, no f0) about every 3 s. f0 is lost where the child falls under noise + 6 dB.
import { rng } from "../streams.mjs";

const h32 = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h; };
const DEV = /[ऀ-ॿ]/u;
const LAT = /[a-z]/i;
const FILLERS = new Set(["उम्म", "हम्म", "अं", "उं", "अम्म", "umm", "um", "hmm", "uh", "aa", "आ", "एम्म"]);
const FILLER_MUTANTS = ["हम", "अम्मा", "हाँ", "उमर"];
const FOREIGN = ["そうです先生。", "చెప్పండి.", "있다", "পথে কদূর", "信じたい。", "シャーデン。"];

/** A crude Latin → Devanagari transliteration (the live transcriber's habit inside Hindi speech). Shape, not accuracy. */
export function translit(w) {
  const lower = w.toLowerCase().replace(/[^a-z]/g, "");
  if (!lower) return w;
  const pairs = [["tion", "शन"], ["ee", "ी"], ["oo", "ू"], ["ou", "ौ"], ["ai", "ै"], ["ch", "च"], ["sh", "श"], ["th", "थ"], ["ph", "फ"], ["ck", "क"],
    ["a", "ा"], ["e", "े"], ["i", "ि"], ["o", "ो"], ["u", "ु"], ["y", "ी"], ["b", "ब"], ["c", "क"], ["d", "ड"], ["f", "फ"], ["g", "ग"], ["h", "ह"],
    ["j", "ज"], ["k", "क"], ["l", "ल"], ["m", "म"], ["n", "न"], ["p", "प"], ["q", "क"], ["r", "र"], ["s", "स"], ["t", "ट"], ["v", "व"], ["w", "व"], ["x", "क्स"], ["z", "ज"]];
  const vowelSign = new Set(["ी", "ू", "ौ", "ै", "ा", "े", "ि", "ो", "ु"]);
  const indep = { "ी": "ई", "ू": "ऊ", "ौ": "औ", "ै": "ऐ", "ा": "आ", "े": "ए", "ि": "इ", "ो": "ओ", "ु": "उ" };
  let out = "", i = 0, prevVowel = true;
  while (i < lower.length) {
    const p = pairs.find(([a]) => lower.startsWith(a, i));
    const [a, b] = p;
    if (vowelSign.has(b)) { out += prevVowel ? indep[b] : b; prevVowel = true; }
    else { out += b; prevVowel = false; }
    i += a.length;
  }
  return out;
}

/** A plausible mis-hearing of one Devanagari / Latin token (drop or add a vowel sign; Latin: drop a letter). */
function garble(w, r) {
  if (DEV.test(w)) {
    if (/[ा-ौ]$/u.test(w)) return w.slice(0, -1);
    if (/ा/u.test(w)) return w.replace("ा", "");
    return w + "थ";
  }
  if (w.length > 3) { const k = 1 + Math.floor(r() * (w.length - 2)); return w.slice(0, k) + w.slice(k + 1); }
  return w + "e";
}

/**
 * Perturb the STT timeline (world.sttTimeline output) in place for the child's words only.
 * @param {{words:{w:string,seg:number,src:string}[], segs:{text:string,src:string}[]}} tl
 */
export function sttReal(tl, seed, { pSub = 0.06, pHall = 0.05, pDidi = 0.5 } = {}) {
  const r = rng(seed);
  const bySeg = new Map();
  for (const w of tl.words) if (w.src === "child") { if (!bySeg.has(w.seg)) bySeg.set(w.seg, []); bySeg.get(w.seg).push(w); }
  const drop = new Set();
  for (const [, ws] of bySeg) {
    const devDominant = ws.some((w) => DEV.test(w.w));
    if (r() < pHall) { const f = FOREIGN[Math.floor(r() * FOREIGN.length)]; ws.forEach((w, i) => { if (i === 0) w.w = f; else drop.add(w); }); continue; }
    for (const w of ws) {
      const bare = w.w.toLowerCase().replace(/[?？।.,!]/g, "");
      if (FILLERS.has(bare)) { const u = r(); if (u < 0.35) drop.add(w); else if (u < 0.65) w.w = FILLER_MUTANTS[Math.floor(r() * FILLER_MUTANTS.length)]; continue; }
      if (bare === "दीदी" && r() < pDidi) { w.w = "दीजिए"; continue; }
      if (devDominant && LAT.test(w.w)) w.w = translit(w.w);
      w.w = w.w.replace(/़/gu, "");
      if (r() < pSub) w.w = garble(w.w, r);
    }
  }
  tl.words = tl.words.filter((w) => !drop.has(w));
  return tl;
}

/** Shift every gold time >= t0 by delta ms and insert delta/20 frames copied from the frame at t0 (a pause: room noise). */
function insertAt(d, t0, delta) {
  const fr = d.frames, i0 = Math.max(0, fr.t.findIndex((t) => t >= t0));
  const n = Math.round(delta / 20);
  for (const k of ["db", "f0", "herDb", "childOn", "ovOn"]) fr[k].splice(i0, 0, ...Array(n).fill(fr[k][i0]));
  fr.t = fr.db.map((_, i) => i * 20);
  const sh = (x) => (x !== null && x !== undefined && x >= t0 ? x + delta : x);
  const g = d.gold;
  for (const s of g.childSegs) { s.start = sh(s.start); s.end = sh(s.end); }
  for (const w of g.childWords) { w.start = sh(w.start); w.end = sh(w.end); }
  for (const p of g.pauses) { const inside = p.start < t0 && p.end >= t0; p.start = sh(p.start); p.end = sh(p.end); if (inside) p.ms += delta; }
  g.trueEnd = sh(g.trueEnd); g.childStart = sh(g.childStart); g.childOnset = sh(g.childOnset);
  g.herSpan = { start: sh(g.herSpan.start), end: sh(g.herSpan.end) };
  g.herWords = (g.herWords || []).map((w) => ({ ...w, start: sh(w.start), end: sh(w.end) }));
  g.herBoundaries = (g.herBoundaries || []).map(sh);
  for (const o of g.overlays) { o.start = sh(o.start); o.end = sh(o.end); for (const w of o.words || []) { w.start = sh(w.start); w.end = sh(w.end); } }
  d.meta.endMs += n * 20;
}

/** Shy / slow child: every within-turn pause stretched by `factor` (inserted at the pause middle). */
export function slow(d, factor = 1.6) {
  const ps = [...d.gold.pauses].sort((a, b) => b.start - a.start); // last first, so earlier insertions do not move later t0s
  for (const p of ps) {
    const delta = Math.round(((factor - 1) * (p.end - p.start)) / 20) * 20;
    if (delta <= 0) continue;
    insertAt(d, Math.round((p.start + (p.end - p.start) / 2) / 20) * 20, delta);
  }
  return d;
}

const pw = (db) => Math.pow(10, db / 10);
const dbOf = (p) => 10 * Math.log10(Math.max(p, 1e-12));
function floorPow(d) {
  const fr = d.frames, k = Math.max(3, Math.floor(d.gold.herSpan.start / 20));
  const bed = fr.db.slice(0, k).slice().sort((a, b) => a - b);
  return pw(bed[Math.floor(bed.length / 2)] ?? -60);
}

/** The child `db` quieter at the mic. */
export function quiet(d, db = 12) {
  const fr = d.frames, N = floorPow(d), g = pw(-db);
  for (let i = 0; i < fr.t.length; i++) {
    if (!fr.childOn[i]) continue;
    const P = pw(fr.db[i]), C = Math.max(0, P - N);
    const Cn = C * g;
    fr.db[i] = +dbOf(Cn + (P - C)).toFixed(2);
    if (Cn < N * pw(6)) fr.f0[i] = null;
  }
  return d;
}

/** A cheap phone mic in a busy home: noise at `snr` dB under the child's median speech, plus clatter bursts. */
export function phone(d, seed, snr = 6) {
  const fr = d.frames, r = rng(seed);
  const on = fr.db.filter((_, i) => fr.childOn[i]).sort((a, b) => a - b);
  const ref = on.length ? on[Math.floor(on.length / 2)] : -24;
  const N0 = floorPow(d), N2 = pw(ref - snr);
  let burstUntil = -1, nextBurst = r.u(1000, 5000);
  for (let i = 0; i < fr.t.length; i++) {
    const t = fr.t[i];
    if (t >= nextBurst) { burstUntil = t + r.u(200, 400); nextBurst = t + r.u(1500, 4500); }
    const P = pw(fr.db[i]);
    const child = fr.childOn[i] ? Math.max(0, P - N0) : 0;
    const burst = t < burstUntil ? pw(ref - 3) * r.u(0.5, 1.5) : 0;
    fr.db[i] = +dbOf(P + N2 * Math.max(0.2, 1 + 0.3 * r.gauss()) + burst).toFixed(2);
    if (burst > 0 && !fr.childOn[i]) fr.f0[i] = null;
    if (fr.childOn[i] && child < N2 * pw(6)) fr.f0[i] = null;
  }
  return d;
}

/** Apply a named condition list ("sttReal+slow+phone") to a loaded stream; returns { d, sttHook }. */
export function applyConds(d, conds) {
  const seed = h32(`${d.id}|critic`);
  for (const c of conds) {
    if (c === "slow") slow(d, 1.6);
    else if (c === "slower") slow(d, 2.2);
    else if (c === "quiet") quiet(d, 12);
    else if (c === "phone") phone(d, seed ^ 0x55, 6);
    else if (c !== "sttReal" && c !== "base") throw new Error(`unknown condition ${c}`);
  }
  const sttHook = conds.includes("sttReal") ? (tl) => sttReal(tl, seed ^ 0x9e37) : null;
  return { d, sttHook };
}
