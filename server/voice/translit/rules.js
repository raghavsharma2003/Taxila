// Rule fallback: one Roman Hinglish word → Devanagari, for a word no lexicon knows but the classifier calls Hindi.
// Written for the VOICE, not for a reader: a hi-IN front end applies its own schwa deletion, so a consonant cluster the
// Roman spelling elides ("samajhna") is written with full letters (समझना) and only real clusters get a halant
// (geminates kk/tt/cch, a second consonant y/r/v/w, and word-initial s+stop). Ambiguities Roman cannot carry (त/ट, द/ड,
// न/ण, स/श/ष) take the dental/plain letter: the eval measures how often that is wrong.
const CONS = [
  ["chh", "छ"], ["cch", "च्छ"], ["ksh", "क्ष"], ["kh", "ख"], ["gh", "घ"], ["ch", "च"], ["jh", "झ"], ["th", "थ"], ["dh", "ध"],
  ["ph", "फ"], ["bh", "भ"], ["sh", "श"], ["rh", "ढ़"], ["gy", "ग्य"], ["k", "क"], ["g", "ग"], ["c", "क"], ["j", "ज"], ["t", "त"],
  ["d", "द"], ["n", "न"], ["p", "प"], ["f", "फ़"], ["b", "ब"], ["m", "म"], ["y", "य"], ["r", "र"], ["l", "ल"], ["v", "व"],
  ["w", "व"], ["s", "स"], ["h", "ह"], ["z", "ज़"], ["q", "क़"], ["x", "क्स"],
];
// [roman, independent, matra]
const VOW = [
  ["aa", "आ", "ा"], ["ai", "ऐ", "ै"], ["au", "औ", "ौ"], ["ee", "ई", "ी"], ["ii", "ई", "ी"], ["oo", "ऊ", "ू"], ["ei", "ए", "े"],
  ["ey", "ए", "े"], ["a", "अ", ""], ["i", "इ", "ि"], ["u", "उ", "ु"], ["e", "ए", "े"], ["o", "ओ", "ो"],
];
const HALANT = "्";
const isVowelAt = (w, i) => VOW.some(([r]) => w.startsWith(r, i));
const matchAt = (table, w, i) => table.find(([r]) => w.startsWith(r, i));
const SECOND_JOIN = new Set(["य", "र", "व"]);

/**
 * @param {string} word one Latin word (any case)
 * @returns {string} Devanagari
 */
export function romanToDeva(word) {
  const w = String(word).toLowerCase().replace(/[’']/g, "");
  let out = "";
  let i = 0;
  let prevCons = null; // the Devanagari of a consonant that has no vowel yet
  const flushCons = () => { prevCons = null; };
  while (i < w.length) {
    // nasal: n / m before a consonant (not at word start, after a vowel) → anusvara; final n after ai/ei/ee/i/o/e/oo → anusvara
    if ((w[i] === "n" || (w[i] === "m" && /[pb]/.test(w[i + 1] ?? ""))) && i > 0 && !prevCons && !isVowelAt(w, i + 1)) {
      const atEnd = i === w.length - 1;
      const prevV = w.slice(Math.max(0, i - 2), i);
      if (!atEnd || /(ai|ei|ee|oo|[ieo])$/.test(prevV) && !/au$/.test(prevV)) {
        if (!(atEnd && /aa$/.test(prevV)) && w[i + 1] !== w[i]) { out += "ं"; i++; continue; }
      }
    }
    const v = matchAt(VOW, w, i);
    if (v) {
      const [r, ind, mat] = v;
      let m = mat;
      const atEnd = i + r.length === w.length;
      // word-final short vowels are long in Hinglish spelling: -a → ा, -i → ी, -u → ू
      if (atEnd && prevCons) { if (r === "a") m = "ा"; else if (r === "i") m = "ी"; else if (r === "u") m = "ू"; }
      if (prevCons) { out += m; flushCons(); }
      else out += atEnd && out ? (r === "a" ? "ा" : r === "i" ? "ई" : r === "u" ? "ऊ" : ind) : ind;
      i += r.length;
      continue;
    }
    const c = matchAt(CONS, w, i);
    if (c) {
      const [r, d] = c;
      // geminate (kk, tt, cch handled in the table) or a joining second consonant → halant on the previous consonant
      if (prevCons) {
        const gem = prevCons === d;
        const join = SECOND_JOIN.has(d[0]) || gem || (out.length <= 2 && prevCons === "स" && /[कटतपम]/.test(d[0]));
        if (join) out += HALANT;
        else if (r === "h" && prevCons) { /* final "ah"/"eh" spellings: keep the h */ }
      }
      out += d;
      prevCons = d;
      i += r.length;
      continue;
    }
    // anything else (digit, stray mark): pass through
    out += w[i]; flushCons(); i++;
  }
  return out;
}
