// Text normalisation and phrase matching for the signal lexicons (SIGNALS-SPEC §2.3). Pure: no clock, no I/O.
//
// Combining marks are KEPT. The spec draft said "\p{M}-stripped", but the inherited never-rules defect
// (server/director/safety.js header) is exactly that: stripping marks turns "मैं हिंदी में" into "म ह द म", so Devanagari
// entries collide. Instead, like safety.js: NFC, nukta dropped, chandrabindu folded to anusvara, lowercase.
// Logged as rejection `rj-sig-strip-combining-marks`.

const NUKTA = /़/g;
const CHANDRABINDU = /ँ/g;

/** Normalise one string for matching (also applied to every lexicon entry at load). */
export function norm(s) {
  return String(s ?? "").normalize("NFC").replace(NUKTA, "").replace(CHANDRABINDU, "ं").toLowerCase();
}

const TOKEN = /[\p{L}\p{M}\p{N}]+(?:'[\p{L}]+)?|\?/gu;
/** Tokens: words (letters + marks + digits, one internal apostrophe) and "?" kept as its own token. */
export function tokens(s) {
  return (norm(s).match(TOKEN) ?? []).map((t) => t.replace(/'/g, ""));
}

const DEVANAGARI = /[ऀ-ॿ]/;
export const isDevanagari = (w) => DEVANAGARI.test(w);
export const isNumberToken = (w) => /^\d+(?:[.,]\d+)?$/.test(w) || NUMBER_WORDS.has(w);

/** Spoken number words (Roman Hindi, English, Devanagari) up to 20 + tens: enough for "is it a number" (L4, L5). */
const NUMBER_WORDS = new Map([
  ["zero", 0], ["one", 1], ["two", 2], ["three", 3], ["four", 4], ["five", 5], ["six", 6], ["seven", 7], ["eight", 8], ["nine", 9],
  ["ten", 10], ["eleven", 11], ["twelve", 12], ["thirteen", 13], ["fourteen", 14], ["fifteen", 15], ["sixteen", 16],
  ["seventeen", 17], ["eighteen", 18], ["nineteen", 19], ["twenty", 20], ["thirty", 30], ["forty", 40], ["fifty", 50],
  ["hundred", 100], ["shunya", 0], ["ek", 1], ["do", 2], ["teen", 3], ["char", 4], ["chaar", 4], ["paanch", 5], ["panch", 5],
  ["chhe", 6], ["chhah", 6], ["chah", 6], ["saat", 7], ["aath", 8], ["nau", 9], ["das", 10], ["gyarah", 11], ["barah", 12],
  ["baarah", 12], ["terah", 13], ["chaudah", 14], ["pandrah", 15], ["solah", 16], ["satrah", 17], ["atharah", 18],
  ["unnis", 19], ["bees", 20], ["tees", 30], ["chalis", 40], ["pachas", 50], ["sau", 100],
  ["शून्य", 0], ["एक", 1], ["दो", 2], ["तीन", 3], ["चार", 4], ["पांच", 5], ["छह", 6], ["छः", 6], ["सात", 7], ["आठ", 8], ["नौ", 9],
  ["दस", 10], ["ग्यारह", 11], ["बारह", 12], ["बीस", 20], ["सौ", 100],
].map(([k, v]) => [norm(k), v]));
/** Numeric value of a token, or null. "do" is also "give"; callers only ask on answer candidates. */
export function numberOf(w) {
  if (/^\d+(?:\.\d+)?$/.test(w)) return Number(w);
  return NUMBER_WORDS.has(w) ? NUMBER_WORDS.get(w) : null;
}

/** 32-bit FNV-1a, hex: answers are kept in the session as hashes, never text (SIGNALS-SPEC §5 "counts only"). */
export function fnv1a(s) {
  let h = 0x811c9dc5;
  const str = String(s);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

// ───────────── spans the lexicons must not read (quotation, reported speech, hypotheticals) ─────────────

const QUOTED = /"[^"]*"|“[^”]*”|‘[^’]*’|«[^»]*»|(?<![\p{L}])'[^']{2,}'(?![\p{L}])/gu;
// \b is ASCII-only even with /u, so Devanagari words get letter-class lookarounds instead (B … E).
const B = "(?<![\\p{L}\\p{M}])", E = "(?![\\p{L}\\p{M}])";
/** Reported speech: "X ne bola/kaha …", "she said …", "teacher bol rahi thi …" — the rest of the clause is someone else's. */
const REPORTED = new RegExp(`${B}(?:ne\\s+(?:bola|boli|kaha|kahaa|bataya|likha)|said|says|told\\s+me|bol\\s+(?:raha|rahi|rahe)\\s+(?:tha|thi|the)|ने\\s+(?:बोला|कहा|बताया))${E}[^.!?।]*`, "giu");
/** Hypotheticals: "agar/if/suppose/maan lo …" up to "toh/then" or the clause end. */
const HYPOTHETICAL = new RegExp(`${B}(?:agar|if|suppose|maan\\s+lo|man\\s+lo|अगर|मान\\s+लो)${E}[^.!?।]*?(?:${B}(?:toh|to|then|तो)${E}|(?=[.!?।]|$))`, "giu");

/**
 * The text a lexicon may read: quotations and reported speech removed; hypotheticals removed unless keepHypothetical
 * (the question-depth lexicon reads "agar … toh" as a what-if).
 */
export function ownWords(text, { keepHypothetical = false } = {}) {
  let t = String(text ?? "").replace(QUOTED, " ").replace(REPORTED, " ");
  if (!keepHypothetical) t = t.replace(HYPOTHETICAL, " ");
  return t;
}

// ───────────── phrase matching ─────────────

/**
 * Compile a phrase list. Entries are space-separated tokens; "*" matches 0-3 tokens. Each entry is normalised with
 * the same tokens() the input goes through, so Devanagari and Roman entries match their own spellings.
 * @param {string[]} entries
 */
export function compile(entries) {
  return entries.map((e) => ({ src: e, toks: e.split(/\s+/).flatMap((p) => (p === "*" ? ["*"] : tokens(p))) })).filter((p) => p.toks.length);
}

/** All matches of compiled phrases in a token list → [{ start, end (exclusive), src }]. */
export function findAll(toks, compiled) {
  const out = [];
  for (const p of compiled) {
    for (let i = 0; i < toks.length; i++) {
      const end = matchAt(toks, i, p.toks, 0);
      if (end >= 0) out.push({ start: i, end, src: p.src });
    }
  }
  return out.sort((a, b) => a.start - b.start || b.end - a.end);
}

function matchAt(toks, i, pat, j) {
  if (j === pat.length) return i;
  if (pat[j] === "*") {
    for (let k = 0; k <= 3 && i + k <= toks.length; k++) {
      const e = matchAt(toks, i + k, pat, j + 1);
      if (e >= 0) return e;
    }
    return -1;
  }
  if (i >= toks.length || toks[i] !== pat[j]) return -1;
  return matchAt(toks, i + 1, pat, j + 1);
}

const NEGATORS = new Set(["nahi", "nahin", "nai", "na", "mat", "not", "no", "never", "dont", "don't", "नहीं", "मत", "न"].map(norm));
/** A hit is negated when a negator sits within 2 tokens after it (Hindi) or right before it (English "not"). */
export function negated(toks, hit) {
  for (let k = hit.end; k < Math.min(toks.length, hit.end + 2); k++) if (NEGATORS.has(toks[k])) return true;
  const prev = toks[hit.start - 1];
  return prev === "not" || prev === "never" || prev === "dont";
}
