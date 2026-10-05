// Is an out-of-lexicon Roman word Hindi? Only words no lexicon knows reach this (lexicon.js, numbers.js,
// lexicon-learned.js answer first), and a "no" is always safe: the word stays Latin, exactly what the voice gets today.
// So the bar is PRECISION: convert only on spelling evidence English almost never shows. Measured by
// evals/translit/run.mjs (rule precision / recall on the held-out split).
//
// Evidence used:
//   - Hindi inflection endings on a stem of >= 3 letters: -iye/-iyega/-enge/-engi/-oge/-ogi/-iyon/-iyan/-iyaan/-aaon/-aayein,
//     -waala/-wali/-wale, -kar after a long vowel; plural/oblique -on / -ein / -en after a doubled vowel or aspirate
//   - doubled long vowels "aa" (rare in English), aspirate digraphs English lacks (bh, dh, kh, gh at word start, chh, jh)
//   - and NOT an English shape: common English suffixes (-tion, -ing, -ness, -ment, -able, -ous, -ly, -ed, -er, -est, -ize,
//     -ful, -less, -ity, -ism) or English-only letter clusters (ck, wh, ph at start, -tch, qu, x)
const EN_SHAPE = /(tion|sion|ing|ness|ment|able|ible|ous|ly|ed|est|ize|ise|ful|less|ity|ism|ture|ance|ence|ship|ward|wise|graph|ology|ck|tch|que)$|^(wh|ph|qu|kn|wr|ps)|x|ck|q(?!a)|w[^aiu]/;
const HI_END = /(iye|iyega|iyegi|enge|engi|oge|ogi|iyon|iyan|iyaan|aaon|aayein|aayen|aaein|waala|waali|waale|wala|wali|wale|ega|egi|unga|ungi|aiye|aiyega)$/;
const HI_PLURAL = /(aa|ee|oo|bh|dh|kh|gh|chh|jh|th)[a-z]*(on|ein|en|iyan|iyaan)$/;
const HI_LETTERS = /aa|^bh|^dh|^kh|^gh|chh|jh|ii|uu|zh/;

/** @param {string} w lowercase Latin word */
export function looksHindi(w) {
  if (w.length < 3) return false;
  if (EN_SHAPE.test(w)) return false;
  if (HI_END.test(w) && w.length >= 5) return true;
  if (HI_PLURAL.test(w)) return true;
  if (HI_LETTERS.test(w)) return true;
  return false;
}

// ── the "small fast model" arm (TAXILA_TRANSLIT_FALLBACK=model): char 1-4-gram naive Bayes trained on the dev split
// (evals/translit/train-model.mjs, 37 KB of log-odds). Loaded lazily, once. Same precision-first contract: a word must
// clear MODEL_MARGIN nats of log-odds to convert, and the English-shape veto above still applies.
import { readFileSync } from "node:fs";
let NB = null;
const nb = () => (NB ??= JSON.parse(readFileSync(new URL("./model-nb.json", import.meta.url), "utf8")));
export const MODEL_MARGIN = 2.0;
/** Log-odds that a lowercase word is Hindi (naive Bayes over char 1-4-grams). */
export function hindiLogOdds(w) {
  const m = nb(); const s = `^${w}$`; let z = m.prior;
  for (let n = 1; n <= 4; n++) for (let i = 0; i + n <= s.length; i++) { const g = s.slice(i, i + n); z += m.w[g] ?? 0; }
  return z;
}
/** @param {string} w lowercase Latin word */
export function looksHindiModel(w, margin = MODEL_MARGIN) {
  if (w.length < 3 || EN_SHAPE.test(w)) return false;
  return hindiLogOdds(w) >= margin;
}
