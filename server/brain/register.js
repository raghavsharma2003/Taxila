// v6 R4 (main, director8: "the language mode must visibly change her register for the rest of the lesson"): after the child
// asks for Hindi, the English words of her spoken line become their Hindi words, in code, every turn after. The card (verified
// content shown on screen) and the beat's must-say words are left as they are. Pure.
const HINDI = [
  [/\bnumber\s+lines?\b/gi, "sankhya rekha"], [/\bfractions\b/gi, "bhinn"], [/\bfraction\b/gi, "bhinn"],
  [/\bnumerators?\b/gi, "ansh"], [/\bdenominators?\b/gi, "har"],
  [/\bequal\b/gi, "barabar"], [/\bparts\b/gi, "hisse"], [/\bpart\b/gi, "hissa"], [/\bpieces\b/gi, "tukde"], [/\bpiece\b/gi, "tukda"],
  [/\bslices\b/gi, "tukde"], [/\bslice\b/gi, "tukda"], [/\bperimeter\b/gi, "parimap"], [/\bsides\b/gi, "bhujayein"], [/\bside\b/gi, "bhuja"],
  [/\btotal\b/gi, "kul"], [/\banswer\b/gi, "jawab"], [/\bsteps?\b/gi, "kadam"], [/\brectangles?\b/gi, "aayat"], [/\bsquares?\b/gi, "varg"],
  [/\btriangles?\b/gi, "tribhuj"], [/\blength\b/gi, "lambai"], [/\b(?:breadth|width)\b/gi, "chaudai"], [/\bshapes?\b/gi, "aakaar"],
  [/\bhalf\b/gi, "aadha"], [/\bcompare\b/gi, "tulna karo"], [/\bbigger\b/gi, "bada"], [/\bsmaller\b/gi, "chhota"], [/\bgroups?\b/gi, "samooh"],
  [/\bsiblings\b/gi, "bhai-behen"], [/\bcorrect\b/gi, "sahi"], [/\bclear\b/gi, "saaf"],
];
const keepCase = (from, to) => (/^[A-Z]/.test(from) ? to.charAt(0).toUpperCase() + to.slice(1) : to);

/** The line in Hindi words; `keep` (must-say terms) and `card` (a substring left byte for byte) are not touched. */
export function inHindiWords(line, { keep = [], card = null } = {}) {
  const text = String(line ?? "");
  const at = card ? text.lastIndexOf(card) : -1;
  const [head, tail] = at >= 0 ? [text.slice(0, at), text.slice(at)] : [text, ""];
  const kept = keep.map((k) => String(k ?? "").trim().toLowerCase()).filter(Boolean);
  let out = head;
  for (const [re, to] of HINDI) out = out.replace(re, (m) => (kept.some((k) => k === m.toLowerCase() || k.includes(m.toLowerCase())) ? m : keepCase(m, to)));
  // v6.1 R11 (director9: "Parimap (parimap)"): an English word glossed in brackets becomes the same word twice once it is in
  // Hindi words; the bracket goes
  return agree(out.replace(/(?<![\p{L}])(\p{L}+)\s*\(\s*\1\s*\)/giu, "$1")) + tail;
}
/** v6.3 R2 (main, director11 c4: "Ek pizza ke 4 barabar tukda the", "slice" made Hindi without its number): a count of two or more
 *  takes the plural (tukde, hisse, bhujayein), one word between allowed; a fraction's denominator ("1/4 hissa") is no count. */
const PLURAL = { tukda: "tukde", hissa: "hisse", bhuja: "bhujayein" };
export function agree(text) {
  return String(text ?? "").replace(/(?<![\d/.])\b([2-9]|[1-9]\d+)(\s+(?:\p{L}+\s+)?)(tukda|hissa|bhuja)(?![\p{L}])/giu,
    (m, n, mid, w) => (/^(?:ka|ki|ke|wala|wali|wale|se|mein|par)\s+$/i.test(mid.trim() + " ") ? m : `${n}${mid}${keepCase(w, PLURAL[w.toLowerCase()])}`));
}
