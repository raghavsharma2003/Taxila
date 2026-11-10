// v6 R4 (main, director8: "the language mode must visibly change her register for the rest of the lesson"): after the child
// asks for Hindi, the English words of her spoken line become their Hindi words, in code, every turn after. The card (verified
// content shown on screen) and the beat's must-say words are left as they are. Pure.
const HINDI = [
  [/\bnumber\s+lines?\b/gi, "sankhya rekha"], [/\bfractions\b/gi, "bhinn"], [/\bfraction\b/gi, "bhinn"],
  [/\bnumerators?\b/gi, "ansh"], [/\bdenominators?\b/gi, "har"],
  [/\bequal\b/gi, "barabar"], [/\bparts\b/gi, "hisse"], [/\bpart\b/gi, "hissa"], [/\bpieces\b/gi, "tukde"], [/\bpiece\b/gi, "tukda"],
  // (v6.9 R6, main on director17: "Tab jitne slice the" became "jitne tukda the": a slice after jitne, kitne, saare, sab, kai, a count
  // word or a number of two or more is plural)
  [/\b(jitne|kitne|saare|sare|sab|kai|do|teen|chaar|paanch|chhah|saat|aath|nau|das|[2-9]|[1-9]\d+)\s+slice\b/gi, (m, w) => `${w} tukde`],
  [/\bslices\b/gi, "tukde"], [/\bslice\b/gi, "tukda"], [/\bperimeter\b/gi, "parimap"], [/\bsides\b/gi, "bhujayein"],
  // (v6.10 R7, main on director18: "upar 6, side mein 4" became "bhuja mein 4" — "side mein" is a place, not a side of a shape)
  [/\bside\s+(mein|par|se)\b/gi, (m, w) => `bagal ${w}`], [/\bside\b/gi, "bhuja"],
  [/\btotal\b/gi, "kul"], [/\banswer\b/gi, "jawab"], [/\bsteps?\b/gi, "kadam"], [/\brectangles?\b/gi, "aayat"], [/\bsquares?\b/gi, "varg"],
  [/\btriangles?\b/gi, "tribhuj"], [/\blength\b/gi, "lambai"], [/\b(?:breadth|width)\b/gi, "chaudai"], [/\bshapes?\b/gi, "aakaar"],
  [/\bhalf\b/gi, "aadha"], [/\bcompare(?=\s+kar)/gi, "tulna"], [/\bcompare\b/gi, "tulna karo"], [/\bbigger\b/gi, "bada"], [/\bsmaller\b/gi, "chhota"], [/\bgroups?\b/gi, "samooh"],
  [/\bsiblings\b/gi, "bhai-behen"], [/\bcorrect\b/gi, "sahi"], [/\bclear\b/gi, "saaf"],
  // (v6.4 L1, director12 c5-t01: "0 se 1 tak ki line hai, aur beech mein 2 marks" came back unchanged after "hindi mein batao")
  [/\blines\b/gi, "rekhayein"], [/\bline\b/gi, "rekha"], [/\bmarks\b/gi, "nishaan"], [/(?<!question\s)\bmark\b/gi, "nishaan"],
  [/\bke\s+ek\s+pakke\s+spots?\b/gi, "ki ek pakki jagah"], [/\bpakke\s+spots?\b/gi, "pakki jagah"], [/\bek\s+spot\b/gi, "ek jagah"], [/\bspots?\b/gi, "jagah"], [/\bdistance\b/gi, "doori"], [/\bunits?\b/gi, "ikaai"], [/\bpoints?\b/gi, "bindu"],
];
const keepCase = (from, to) => (/^[A-Z]/.test(from) ? to.charAt(0).toUpperCase() + to.slice(1) : to);

/** The line in Hindi words; `keep` (must-say terms) and `card` (a substring left byte for byte) are not touched. */
export function inHindiWords(line, { keep = [], card = null } = {}) {
  const text = String(line ?? "");
  const at = card ? text.lastIndexOf(card) : -1;
  const [head, tail] = at >= 0 ? [text.slice(0, at), text.slice(at)] : [text, ""];
  const kept = keep.map((k) => String(k ?? "").trim().toLowerCase()).filter(Boolean);
  let out = head;
  // (v6.10 R7, main on director18: "group" said beside "samooh" — a word kept as a must-say term is kept everywhere in the line, never
  // half-swapped)
  const keptRule = (re) => kept.some((k) => { re.lastIndex = 0; const hit = re.test(k); re.lastIndex = 0; return hit; });
  for (const [re, to] of HINDI) { if (keptRule(re)) continue; out = out.replace(re, (m, ...g) => (kept.some((k) => k === m.toLowerCase() || k.includes(m.toLowerCase())) ? m : typeof to === "function" ? to(m, ...g) : keepCase(m, to))); }
  // v6.1 R11 (director9: "Parimap (parimap)"): an English word glossed in brackets becomes the same word twice once it is in
  // Hindi words; the bracket goes
  return agree(out.replace(/(?<![\p{L}])(\p{L}+)\s*\(\s*\1\s*\)/giu, "$1")) + tail;
}
/** v6.3 R2 (main, director11 c4: "Ek pizza ke 4 barabar tukda the", "slice" made Hindi without its number): a count of two or more
 *  takes the plural (tukde, hisse, bhujayein), one word between allowed; a fraction's denominator ("1/4 hissa") is no count. */
const PLURAL = { tukda: "tukde", hissa: "hisse", bhuja: "bhujayein" };
export function agree(text) {
  return String(text ?? "").replace(/\btulna karo (?=kar)/giu, "tulna ").replace(/(?<![\d/.])\b([2-9]|[1-9]\d+)(\s+(?:\p{L}+\s+)?)(tukda|hissa|bhuja)(?![\p{L}])/giu,
    (m, n, mid, w) => (/^(?:ka|ki|ke|wala|wali|wale|se|mein|par)\s+$/i.test(mid.trim() + " ") ? m : `${n}${mid}${keepCase(w, PLURAL[w.toLowerCase()])}`));
}
