// E6 span check (COMPREHENSION-ENGINE.md §4.2): a positive closed-label verdict must quote a span that CODE can find
// in the child's own transcript. Transliteration-aware: Devanagari is romanised crudely, and Roman Hindi spelling
// variants are folded (aa/a, ee/i, oo/u, w/v, z/j, ph/f, aspirates), so "samajh" / "samaj" / "समझ" all match. Pure.

const DEV = { "अ": "a", "आ": "a", "इ": "i", "ई": "i", "उ": "u", "ऊ": "u", "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au", "ऋ": "ri",
  "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "n", "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "n", "ट": "t", "ठ": "th", "ड": "d",
  "ढ": "dh", "ण": "n", "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n", "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m", "य": "y",
  "र": "r", "ल": "l", "व": "v", "श": "sh", "ष": "sh", "स": "s", "ह": "h", "ड़": "r", "ढ़": "rh", "क़": "k", "ख़": "kh", "ग़": "g", "ज़": "z", "फ़": "f",
  "ा": "a", "ि": "i", "ी": "i", "ु": "u", "ू": "u", "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ृ": "ri", "ं": "n", "ँ": "n", "ः": "h",
  "्": "", "़": "", "०": "0", "१": "1", "२": "2", "३": "3", "४": "4", "५": "5", "६": "6", "७": "7", "८": "8", "९": "9", "।": " " };
const CONS = /[कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहड़ढ़क़ख़ग़ज़फ़]/;
const MATRA = /[ािीुूेैोौृ्]/;   // anusvara / chandrabindu / visarga keep the inherent vowel

/** Devanagari → rough Roman (inherent 'a' after a consonant unless a matra or virama follows). */
export function romanise(s) {
  const chars = [...String(s).normalize("NFC")];
  let out = "";
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (DEV[c] === undefined) { out += c; continue; }
    out += DEV[c];
    if (CONS.test(c) && chars[i + 1] && !MATRA.test(chars[i + 1]) && /[ऀ-ॿ]/.test(chars[i + 1])) out += "a";
  }
  return out;
}

/** Fold Roman spelling variants so transliterations compare equal. */
export function foldRoman(w) {
  return w.replace(/chh/g, "c").replace(/ch/g, "c").replace(/sh/g, "s").replace(/ph/g, "f").replace(/([kgtdbj])h/g, "$1")
    .replace(/w/g, "v").replace(/z/g, "j").replace(/q/g, "k").replace(/ee|ii/g, "i").replace(/oo|uu/g, "u").replace(/aa/g, "a")
    .replace(/y$/, "i").replace(/(.)\1+/g, "$1").replace(/h$/, "").replace(/a$/, "");
}

/** Normalise a turn to folded tokens. */
export const tokens = (s) => romanise(String(s ?? "").toLowerCase()).normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .split(/[^a-z0-9]+/).filter(Boolean).map(foldRoman).filter(Boolean);

/** Consonant skeleton: vowels and pre-consonant nasals dropped (anusvara / matra spellings vary most). */
const skeleton = (w) => w.replace(/[nm](?=[^aeiouy])|[nm]$/g, "").replace(/[aeiouy]/g, "");

function near(a, b) {
  if (a === b) return true;
  const sa = skeleton(a);
  if (sa.length >= 2 && sa === skeleton(b)) return true;
  if (Math.min(a.length, b.length) < 4 || Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/**
 * Is `span` (quoted by a grader) really in the child's transcript? ≥ 80% of the span's tokens, in order, each
 * exact or within one edit (tokens ≥ 4 letters). An empty span never passes.
 * @param {string|null} span @param {string} childText the child's turn(s) only
 */
export function spanOk(span, childText) {
  const s = tokens(span ?? ""), t = tokens(childText);
  if (!s.length || !t.length) return false;
  let hit = 0, j = 0;
  for (const w of s) {
    let k = j;
    while (k < t.length && !near(w, t[k])) k++;
    if (k < t.length) { hit++; j = k + 1; }
  }
  return hit / s.length >= 0.8;
}
