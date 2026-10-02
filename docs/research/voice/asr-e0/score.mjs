// score.mjs — script-aware scoring for Hindi / English / Hinglish child ASR. Built for E0 (synthetic) and
// reused unchanged for E1 (real children). Deterministic: no model is ever used to score.
//
// Why several metrics: Gurukul measured that raw WER mixes two different failures — writing the right
// word in another script (Sarvam/Devanagari transliterating English; gpt-4o-transcribe choosing Urdu)
// and hearing the wrong word. Hamed et al. 2022 (arXiv 2211.16319) found transliteration + normalisation
// correlates best with human judgement of code-switched ASR. So we keep:
//   rawWER      — vs the canonical code-mix reference (Hindi in Devanagari, English in Latin), exact script
//   skelCER     — script-agnostic consonant-skeleton CER (Devanagari / Urdu / Latin all map to one space)
//   keyRecall   — answer-carrying terms recovered, script-agnostic (skeleton)
//   keyRawRecall— answer-carrying terms recovered IN THE EXPECTED SCRIPT (what string-matching code needs)
//   answer      — the value the child gave (numbers, fractions, last value after self-correction)
//   wrongScript — any Arabic/Nastaliq, Bengali, Gurmukhi or other non-target script in the output
//   decoyHits   — boosted vocabulary inserted although never spoken (over-biasing)
import { NUM } from "./stimuli.mjs";

const RANGES = { deva: [0x0900, 0x097f], arabic: [0x0600, 0x06ff], arabicExt: [0x0750, 0x077f], bengali: [0x0980, 0x09ff], gurmukhi: [0x0a00, 0x0a7f] };
export function scriptProfile(text = "") {
  const c = { deva: 0, latin: 0, arabic: 0, bengali: 0, gurmukhi: 0, other: 0 };
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (!/\p{L}/u.test(ch)) continue;
    if (cp >= 0x41 && cp <= 0x7a || (cp >= 0xc0 && cp <= 0x24f)) c.latin++;
    else if (cp >= RANGES.deva[0] && cp <= RANGES.deva[1]) c.deva++;
    else if ((cp >= RANGES.arabic[0] && cp <= RANGES.arabic[1]) || (cp >= RANGES.arabicExt[0] && cp <= RANGES.arabicExt[1])) c.arabic++;
    else if (cp >= RANGES.bengali[0] && cp <= RANGES.bengali[1]) c.bengali++;
    else if (cp >= RANGES.gurmukhi[0] && cp <= RANGES.gurmukhi[1]) c.gurmukhi++;
    else c.other++;
  }
  const n = Object.values(c).reduce((a, b) => a + b, 0) || 1;
  const share = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, +(v / n).toFixed(3)]));
  share.wrongScript = c.arabic + c.bengali + c.gurmukhi + c.other > 0;
  return share;
}

// Matras are \p{M}; keep them (Gurukul: a \p{L}\p{N}-only tokenizer shredded every matra).
export function normText(t = "") {
  return t.normalize("NFC").toLowerCase()
    .replace(/़/g, "")            // nukta: ज़ = ज for scoring
    .replace(/ँ/g, "ं")      // chandrabindu → anusvara (हाँ = हां)
    .replace(/[।॥]/g, " ")   // danda
    .replace(/(\d)\s*[\/]\s*(\d)/g, "$1 / $2")
    .replace(/[^\p{L}\p{M}\p{N}\/\s]/gu, " ")
    .replace(/\s+/g, " ").trim();
}

// Spoken-number aliases across scripts, for answer extraction and digit normalisation.
const ROMAN = { 2: ["do"], 3: ["teen", "tin"], 4: ["char", "chaar"], 5: ["paanch", "panch", "paach"], 6: ["chhe", "chhah", "che"],
  12: ["barah", "baarah", "bara"], 24: ["chaubees", "chaubis", "chobis"], 60: ["saath", "sath"], 14: ["chaudah"], 20: ["bees"] };
const URDU = { 2: ["دو"], 3: ["تین"], 4: ["چار"], 5: ["پانچ"], 6: ["چھ", "چھے"], 12: ["بارہ"], 24: ["چوبیس"], 60: ["ساٹھ"], 20: ["بیس"], 14: ["چودہ"] };
const ALIAS = {};
for (const [v, forms] of Object.entries(NUM)) ALIAS[v] = [...forms, ...(ROMAN[v] || []), ...(URDU[v] || []), String(v)].map(normText);
const FRAC_SEP = new Set(["बटा", "by", "upon", "over", "/", "बटे", "batta", "bata", "بٹا"]);

// Replace digit tokens with the spoken form the reference uses (so "5" vs "पाँच" is not an error).
export function numNormalize(hyp, ref) {
  const r = normText(ref);
  return normText(hyp).replace(/\b\d+\b/g, (d) => {
    const forms = ALIAS[d]; if (!forms) return d;
    return forms.find((f) => f && !/^\d+$/.test(f) && (" " + r + " ").includes(" " + f + " ")) || NUM[d]?.[0] || d;
  }).replace(/(\S+) \/ (\S+)/g, (_m, a, b) => `${a} ${r.includes("बटा") ? "बटा" : "by"} ${b}`);
}

export function extractValues(hyp) {
  const toks = normText(hyp).split(" ").filter(Boolean); const vals = [];
  for (let i = 0; i < toks.length; i++) {
    const two = i + 1 < toks.length ? toks[i] + " " + toks[i + 1] : null;
    let hit = null, span = 1;
    for (const [v, forms] of Object.entries(ALIAS)) { if (two && forms.includes(two)) { hit = +v; span = 2; break; } }
    if (hit === null) for (const [v, forms] of Object.entries(ALIAS)) if (forms.includes(toks[i])) { hit = +v; break; }
    if (hit !== null) { vals.push({ v: hit, i }); i += span - 1; }
    else if (FRAC_SEP.has(toks[i])) vals.push({ sep: true, i });
  }
  const out = [];
  for (let k = 0; k < vals.length; k++) {
    if (vals[k + 1]?.sep && vals[k + 2] && vals[k].v !== undefined && vals[k + 2].v !== undefined) { out.push(`${vals[k].v}/${vals[k + 2].v}`); k += 2; }
    else if (vals[k].v !== undefined) out.push(vals[k].v);
  }
  return out;
}
export function answerOK(spec, hyp) {
  if (!spec) return null;
  const vals = extractValues(hyp); const eq = (a, b) => String(a) === String(b);
  if (spec.last) return vals.length > 0 && eq(vals[vals.length - 1], spec.want);
  return vals.some((v) => eq(v, spec.want)) && !vals.some((v) => spec.not.some((n) => eq(v, n)));
}

// --- consonant skeleton: one space for Devanagari, Urdu and Latin ----------------------------------
const DEVA = { "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "n", "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "n", "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
  "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n", "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m", "य": "y", "र": "r", "ल": "l", "व": "v", "श": "sh", "ष": "sh", "स": "s", "ह": "h",
  "क़": "k", "ख़": "kh", "ग़": "g", "ज़": "z", "ड़": "r", "ढ़": "rh", "फ़": "f", "ं": "n", "ँ": "n", "ः": "h", "ृ": "r", "ऋ": "r",
  "अ": "a", "आ": "a", "इ": "i", "ई": "i", "उ": "u", "ऊ": "u", "ए": "e", "ऐ": "e", "ओ": "o", "औ": "o", "ऑ": "o", "ॅ": "", "ॉ": "o" };
const URDU_MAP = { "ب": "b", "پ": "p", "ت": "t", "ٹ": "t", "ث": "s", "ج": "j", "چ": "ch", "ح": "h", "خ": "kh", "د": "d", "ڈ": "d", "ذ": "z", "ر": "r", "ڑ": "r", "ز": "z", "ژ": "z",
  "س": "s", "ش": "sh", "ص": "s", "ض": "z", "ط": "t", "ظ": "z", "ع": "", "غ": "g", "ف": "f", "ق": "k", "ک": "k", "ك": "k", "گ": "g", "ل": "l", "م": "m", "ن": "n", "ں": "n",
  "و": "o", "ہ": "h", "ھ": "h", "ة": "h", "ء": "", "ی": "i", "ي": "i", "ے": "e", "ئ": "i", "ا": "a", "آ": "a", "أ": "a", "إ": "a" };
function translit(t) {
  let s = ""; for (const ch of t.normalize("NFD").normalize("NFC")) s += DEVA[ch] ?? URDU_MAP[ch] ?? (/[ऀ-ॿ؀-ۿ]/.test(ch) ? "" : ch);
  return s;
}
export function skeleton(t) {
  let s = translit(normText(t)).toLowerCase();
  s = s.replace(/[^a-z\s]/g, "")
    .replace(/chh|ch/g, "c").replace(/ck/g, "k").replace(/ph/g, "f").replace(/sh/g, "s").replace(/th/g, "t").replace(/dh/g, "d")
    .replace(/bh/g, "b").replace(/gh/g, "g").replace(/kh/g, "k").replace(/jh/g, "j").replace(/rh/g, "r")
    .replace(/c(?![aeiouy\s]|$)/g, "k").replace(/c(?=[aou])/g, "k").replace(/q/g, "k").replace(/x/g, "ks").replace(/w/g, "v").replace(/z/g, "j")
    .replace(/[aeiouy]/g, "").replace(/(.)\1+/g, "$1");
  return s.replace(/\s+/g, " ").trim();
}

// --- edit distances ---------------------------------------------------------------------------------
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
export const wer = (ref, hyp) => { const r = normText(ref).split(" ").filter(Boolean), h = normText(hyp).split(" ").filter(Boolean); return r.length ? lev(r, h) / r.length : (h.length ? 1 : 0); };
export const skelCER = (ref, hyp) => { const r = skeleton(ref).replace(/ /g, ""), h = skeleton(hyp).replace(/ /g, ""); return r.length ? lev([...r], [...h]) / r.length : (h.length ? 1 : 0); };

// Key-term recovery. Long skeletons: substring of the joined hypothesis skeleton (robust to word splits
// such as "carbon dioxide" vs "कार्बनडाइऑक्साइड"). Short skeletons (≤3): whole-token match only, so
// "हर" (denominator) cannot be found inside some unrelated word.
export function keyHit(term, hyp) {
  const k = skeleton(term).replace(/ /g, ""); if (!k) return false;
  const hs = skeleton(hyp);
  if (k.length >= 4) return hs.replace(/ /g, "").includes(k);
  return hs.split(" ").includes(k) || (term.includes(" ") && hs.includes(skeleton(term)));
}
export function rawKeyHit(term, hyp) { return (" " + normText(hyp) + " ").includes(" " + normText(term) + " "); }

export function scoreOne(stim, hyp) {
  const h = numNormalize(hyp || "", stim.ref);
  return {
    rawWER: +wer(stim.ref, h).toFixed(3),
    skelCER: +skelCER(stim.ref, h).toFixed(3),
    keyRecall: +(stim.keys.filter((k) => keyHit(k, h)).length / stim.keys.length).toFixed(3),
    keyRawRecall: +(stim.keys.filter((k) => rawKeyHit(k, h)).length / stim.keys.length).toFixed(3),
    answer: answerOK(stim.ans, hyp || ""),
    script: scriptProfile(hyp || ""),
  };
}
export function decoyHits(decoys, hyp) { return decoys.filter((d) => keyHit(d, hyp || "")); }

export function auroc(scores, labels) { // P(score_pos > score_neg); labels true = positive
  const pos = scores.filter((_, i) => labels[i]), neg = scores.filter((_, i) => !labels[i]);
  if (!pos.length || !neg.length) return null; let w = 0;
  for (const p of pos) for (const q of neg) w += p > q ? 1 : p === q ? 0.5 : 0;
  return +(w / (pos.length * neg.length)).toFixed(3);
}
