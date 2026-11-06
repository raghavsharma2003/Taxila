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
  return out + tail;
}
