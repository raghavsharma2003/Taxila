// Normalisation for the distress predicate's SECOND pass (safety-robust, 2026-10-05). The first pass (director/safety.js
// FAMILIES on the bytes, unchanged) stays; this module makes the readings a real transcript needs before the same families
// and the fuzzy shapes (fuzzy.js) look again:
//   - Unicode: NFKC → NFC, zero-width joiners dropped, curly quotes straight, nukta dropped and chandrabindu → anusvara
//     (as the first pass already does), Devanagari digits as ASCII;
//   - punctuation: danda / double danda and every other mark become a space. The shipped lookaheads `(?![ऀ-ॿ])` treat
//     "।" (U+0964, inside the Devanagari block) as a LETTER, so "मैं ना रहूं।" — how every live final ends — never matched
//     (CRITIQUE.md §4/§5; PartialSafety worked around it, classify and the brain did not);
//   - repeated letters: a Latin letter run of 3+ is one letter ("nooo", "pleeease"), a doubled combining mark is one;
//   - script: Devanagari ↔ Roman by a phonetic transliteration (schwa deletion; nukta-aware: ज़ z, फ़ f, ड़ d), a
//     script-agnostic canonical key (aa→a, ee→i, oo→u, w→v, z→j, ph→f, doubled letters single) so "मारते" = "maarte" =
//     "marte", and an English consonant skeleton so English said inside Hindi speech and written in Devanagari ("नोबडी",
//     "विश", "हियर") can be compared with the English lexicon;
//   - readability: a letter of another script (the transcriber's hallucinated Japanese / Telugu / Korean / Bengali
//     segments, 5/90 real segments) is never content. readability() reports it so the caller asks again (fuzzy.js and the
//     patches under evals/safety-robust/patches/).
// Pure and browser-safe (the device runs the predicate on partials through server/duplex/partialSafety.js).

const ZW = /[​-‍⁠﻿]/g;
const DEVA_DIGIT = /[०-९]/g;
/** A letter of a script other than Devanagari / Latin (Common and Inherited cover digits, punctuation, marks). */
export const OTHER_SCRIPT = /[^\p{Script=Devanagari}\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u;
const DEVA = /[ऀ-ॿ]/u;
const LATIN = /[a-z]/i;

/** NFC, zero-width dropped, quotes straight, nukta dropped, chandrabindu → anusvara, Devanagari digits ASCII. Keeps punctuation. */
export function foldUnicode(text) {
  return String(text ?? "").normalize("NFKC").normalize("NFC").replace(ZW, "")
    .replace(/[‘’ʼ`´]/g, "'").replace(/[“”]/g, '"')
    .replace(/़/g, "").replace(/ँ/g, "ं")
    .replace(DEVA_DIGIT, (d) => String(d.charCodeAt(0) - 0x0966));
}

/**
 * The first-pass families' second reading: foldUnicode, lower case, every mark except a word-internal apostrophe a space
 * (danda included), Latin letter runs of 3+ one letter, repeated combining marks one. Letters and digits are kept.
 */
export function foldText(text, { runs = true } = {}) {
  const s = foldUnicode(text).toLowerCase().replace(/(\p{M})\1+/gu, "$1");
  // the fuzzy matcher keeps letter runs (its own edit distance reads "jaaa" as one letter from "jaana")
  return (runs ? s.replace(/([a-z])\1{2,}/g, "$1") : s)
    .replace(/(?<![\p{L}\p{M}\p{N}])'|'(?![\p{L}\p{M}\p{N}])/gu, " ")
    .replace(/[^\p{L}\p{M}\p{N}']+/gu, " ").replace(/\s+/g, " ").trim();
}

/** Tokens of a folded text, each tagged with its script. */
export function tokensOf(folded) {
  return String(folded).split(" ").filter(Boolean).map((raw) => ({
    raw,
    script: OTHER_SCRIPT.test(raw) ? "other" : DEVA.test(raw) ? "deva" : LATIN.test(raw) ? "latin" : /\d/.test(raw) ? "num" : "other",
  }));
}

// ── Devanagari → Roman (phonetic, Hinglish-style) ──
const CONS = {
  "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "n", "च": "ch", "छ": "ch", "ज": "j", "झ": "jh", "ञ": "n", "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
  "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n", "प": "p", "फ": "f", "ब": "b", "भ": "bh", "म": "m", "य": "y", "र": "r", "ल": "l", "व": "v", "श": "sh",
  "ष": "sh", "स": "s", "ह": "h", "ळ": "l", "ऩ": "n", "ऱ": "r", "ऴ": "l",
  // precomposed nukta letters (the STT writes them; foldUnicode keeps them only if never decomposed)
  "क़": "k", "ख़": "kh", "ग़": "g", "ज़": "z", "ड़": "d", "ढ़": "dh", "फ़": "f", "य़": "y",
};
const MATRA = { "ा": "a", "ि": "i", "ी": "i", "ु": "u", "ू": "u", "ृ": "ri", "ॄ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ॅ": "e", "ॉ": "o", "ॆ": "e", "ॊ": "o" };
const INDEP = { "अ": "a", "आ": "a", "इ": "i", "ई": "i", "उ": "u", "ऊ": "u", "ऋ": "ri", "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au", "ऑ": "o", "ऍ": "e", "ऎ": "e", "ऒ": "o" };
const NUKTA_NEXT = { "ज": "z", "फ": "f", "ड": "d", "ढ": "dh", "क": "k", "ख": "kh", "ग": "g" };

/**
 * One Devanagari word in Roman letters, with the Hindi schwa rule (a final inherent 'a' is silent, and a medial one
 * between a vowel and a consonant-plus-vowel is silent: मारते → marte, लगता → lagta, मरना → marna). Pass the word
 * BEFORE nukta is dropped when you have it (ज़ → z); a nukta-less word still reads.
 */
export function devaToRoman(word) {
  const s = String(word ?? "").normalize("NFC");
  const units = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (CONS[ch] !== undefined) {
      let c = CONS[ch];
      if (s[i + 1] === "़") { c = NUKTA_NEXT[ch] ?? c; i++; }
      const u = { c, v: "a", inherent: true };
      const nx = s[i + 1];
      if (nx === "्") { u.v = ""; u.inherent = false; i++; }
      else if (MATRA[nx] !== undefined) { u.v = MATRA[nx]; u.inherent = false; i++; }
      units.push(u);
    } else if (INDEP[ch] !== undefined) {
      units.push({ c: "", v: INDEP[ch], inherent: false });
    } else if (ch === "ं" || ch === "ँ") {
      if (units.length) units[units.length - 1].nasal = true; else units.push({ c: "n", v: "", inherent: false });
    } else if (ch === "ः") {
      if (units.length) units[units.length - 1].post = "h";
    } else if (/[0-9a-z]/i.test(ch)) {
      units.push({ c: ch.toLowerCase(), v: "", inherent: false });
    }
  }
  // schwa deletion: final (when the word has 2+ units), then medial V C(a) C V, right to left
  const n = units.length;
  if (n > 1 && units[n - 1].inherent && !units[n - 1].nasal) units[n - 1].v = "";
  for (let i = n - 2; i >= 1; i--) {
    const u = units[i];
    if (!u.inherent || u.nasal || !u.c) continue;
    const prevV = !!units[i - 1].v;
    const nextV = !!units[i + 1].v && !!units[i + 1].c;
    if (prevV && nextV) u.v = "";
  }
  return units.map((u) => u.c + u.v + (u.nasal ? "n" : "") + (u.post ?? "")).join("");
}

/**
 * The script-agnostic canonical key of one token (Roman, English or Devanagari): what fuzzy.js compares. Spelling
 * variants a child, a transcriber or a transliteration produce collapse: maarte / marte / मारते → "marte",
 * rahoon / rahun / रहूँ → "rahun", zinda / ज़िंदा / जिंदा → "jinda", darr / डर → "dar", bully → "buli".
 */
export function canonKey(token) {
  let s = String(token ?? "");
  if (DEVA.test(s)) s = devaToRoman(s);
  s = s.toLowerCase().replace(/[^a-z]/g, "");
  if (!s) return "";
  s = s.replace(/ph/g, "f").replace(/ck/g, "k").replace(/q/g, "k").replace(/x/g, "ks").replace(/c(?!h)/g, "k").replace(/w/g, "v").replace(/z/g, "j")
    .replace(/aa+/g, "a").replace(/ee+/g, "i").replace(/ii+/g, "i").replace(/oo+/g, "u").replace(/uu+/g, "u")
    .replace(/(?<=[^aeiou])y$/g, "i");
  return s.replace(/(.)\1+/g, "$1");
}

/**
 * English consonant skeleton (vowels, y and h-digraph tails dropped; c/k/q, s/z/j, v/w, f/ph merged; doubles single): the
 * key for English words said inside Hindi speech and written in Devanagari (the live transcriber's habit, CRITIQUE §2 B1).
 * "would" → "vld" (and the lexicon carries "wud"), "notice" / "नोटिस" → "nts", "gone" / "गॉन" → "gn", "here" / "हियर" → "hr".
 */
export function englishSkeleton(token) {
  let s = String(token ?? "");
  if (DEVA.test(s)) s = devaToRoman(s);
  s = s.toLowerCase().replace(/[^a-z]/g, "");
  s = s.replace(/ph/g, "f").replace(/ck/g, "k").replace(/c(?=[eiy])/g, "s").replace(/c/g, "k").replace(/q/g, "k").replace(/x/g, "ks").replace(/w/g, "v")
    .replace(/[zj]/g, "s").replace(/(?<=[kgcdtbps])h/g, "").replace(/sh/g, "s");
  return s.replace(/[aeiouy]/g, "").replace(/(.)\1+/g, "$1");
}

/** Consonant skeleton of a Devanagari word: vowel signs, anusvara, visarga and virama dropped (the Hindi phonetic key). */
export const devaSkeleton = (w) => String(w ?? "").replace(/[ऀ-ःऺ-़ा-ॏॢॣ]/gu, "");

/**
 * Is any part of the turn unreadable? A token carrying a letter of another script is the transcriber hallucinating
 * (5/90 real segments, CRITIQUE §2 B1): it is never content. `readable` is the text with those tokens removed;
 * `share` the fraction of letter tokens that were unreadable.
 * @returns {{ unreadable: boolean, share: number, readable: string, tokens: string[] }}
 */
export function readability(text) {
  const toks = foldUnicode(text).split(/\s+/).filter(Boolean);
  const letter = toks.filter((w) => /\p{L}/u.test(w));
  const bad = letter.filter((w) => OTHER_SCRIPT.test(w.replace(/[^\p{L}\p{M}]/gu, "")));
  return { unreadable: bad.length > 0, share: letter.length ? bad.length / letter.length : 0, readable: toks.filter((w) => !bad.includes(w)).join(" "), tokens: bad };
}

/** The folded text with every Devanagari word in Roman letters. */
export const romanReading = (text) => foldText(text).split(" ").map((w) => (DEVA.test(w) ? devaToRoman(w) : w)).join(" ");

/**
 * The readings the first-pass families get on the second pass (each tried; a hit on any counts):
 *   folded (danda and marks gone, letter runs collapsed) and the same with unreadable tokens removed.
 * The raw text and its nukta/chandrabindu fold are the FIRST pass and are not repeated here.
 */
export function readingsFor(text) {
  const f = foldText(text);
  const out = new Set([f]);
  const r = readability(f);
  if (r.unreadable) out.add(foldText(r.readable));
  // NOT here: the Devanagari-in-Roman reading. Run through the Roman families it carried their reported-speech gaps into
  // Devanagari ("भाई ने छक्का मारा" fired `ACTOR ne (\S+ )?mara`, dev run 2026-10-05); cross-script matching is the
  // fuzzy shapes' job, where every abuse shape has the lesson-object guard. romanReading() stays for callers and tests.
  return [...out].filter(Boolean);
}
