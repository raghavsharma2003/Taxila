// round 3 fix (experience B6, "false or unfair things said to the child"): arithmetic she states, checked in code. PURE.
//
// What the review heard: "1 by 4 ko 3 se multiply karne par 3 by 12 milta hai" (1/4 × 3 is 3/4), and "Haan, 2000 g…" to
// "2000" on her own board question "2000 + 50 = ___?". Kit items are graded against verified keys; a line or a question she
// makes up on the spot had no check at all (the praise guard reads "ungraded" and stands aside). Two predicates:
//   arithmeticSlip(text)          a claim "A op B = C" / "A ko B se multiply karne par C" that is false → the claim
//   selfPosedVerdict(asked, said) her own last question was a closed sum ("2000 + 50 = ___?") and the child said a bare
//                                 number → "correct" | "incorrect" (her words, never evidence: nothing is written)
// Exact rational arithmetic (fractions as num/den), so 3/12 vs 1/4 is decided without rounding. A claim it cannot read is
// never flagged (silence is safe; a false flag would only cost a rewrite).

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const R = (n, d = 1) => { if (!d) return null; const g = gcd(n, d) || 1; const s = d < 0 ? -1 : 1; return { n: (s * n) / g, d: (s * d) / g }; };
const eq = (a, b) => !!a && !!b && a.n === b.n && a.d === b.d;
const op = (a, o, b) => {
  if (!a || !b) return null;
  if (o === "+") return R(a.n * b.d + b.n * a.d, a.d * b.d);
  if (o === "-") return R(a.n * b.d - b.n * a.d, a.d * b.d);
  if (o === "*") return R(a.n * b.n, a.d * b.d);
  if (o === "/") return b.n ? R(a.n * b.d, a.d * b.n) : null;
  return null;
};
const WORDNUM = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, chhe: 6, saat: 7, aath: 8, nau: 9, das: 10 };
/** "3/12", "3 by 12", "1.5", "2,050", "teen" → a rational, or null. */
function num(s) {
  const t = String(s ?? "").trim().toLowerCase().replace(/(?<=\d),(?=\d{3}\b)/g, "");
  let m = t.match(/^(-?\d+)\s*(?:\/|by|upon|बटा)\s*(\d+)$/);
  if (m) return R(Number(m[1]), Number(m[2]));
  m = t.match(/^(-?\d+)(?:\.(\d+))?$/);
  if (m) return m[2] ? R(Number(m[1] + m[2]), 10 ** m[2].length) : R(Number(m[1]));
  if (t in WORDNUM) return R(WORDNUM[t]);
  return null;
}
const NUM = String.raw`(?:-?\d[\d,]*(?:\.\d+)?(?:\s*(?:\/|by|upon)\s*\d+)?)`;
const UNIT_WORDS = String.raw`(?:g|gm|grams?|kg|kilograms?|cm|mm|m|km|ml|l|litres?|liters?|rs|₹|rupees?|paise|minutes?|min|hours?|°c|degrees?)`;
// a unit is CAPTURED (each operand's own), so a sum across units ("1 kg + 300 g = 1300 g") is never read as false
const UNIT = String.raw`(?:\s*(${UNIT_WORDS})(?![\p{L}]))?`;
const UNIT_OF = { gm: "g", gram: "g", grams: "g", kilogram: "kg", kilograms: "kg", litre: "l", litres: "l", liter: "l", liters: "l", rupee: "rs", rupees: "rs", "₹": "rs",
  minute: "min", minutes: "min", hour: "h", hours: "h", degree: "°c", degrees: "°c" };
const unitOf = (u) => (u ? UNIT_OF[u.toLowerCase()] ?? u.toLowerCase() : null);
/** Units the claim reads in one measure: +/- all the same (or none); ×/÷ a plain number with at most one measured side. */
function unitsAgree(o, ua, ub, uc) {
  if (o === "+" || o === "-") return ua === ub && (uc == null || ua == null || uc === ua);
  if (ua && ub) return false;
  const u = ua ?? ub;
  return uc == null || uc === u;
}
const OPS = { "+": "+", plus: "+", jama: "+", "-": "-", "−": "-", minus: "-", "×": "*", x: "*", "*": "*", times: "*", into: "*", guna: "*", "÷": "/", divided: "/" };
// "A + B = C", "A × B = C", "A plus B is C", "A times B equals C"
// A is never the fraction part of a mixed number ("2 1/4 - 1/4"), nor a measure's second part ("1 kg 300 g + 200 g"); C is
// never the whole part of one ("3/4 × 2 = 1 1/2") nor followed by a second measure part ("= 1 kg 500 g")
// nor one link of a chain ("4 + 4 + 4 = 12", "10 × 2 × 7 = 140", "40 + 9 = 50 − 1", "3 × 4 = 4 × 3", "7 + 8 is 1 more")
// nor a scaled part ("half of 3 × 4 = 6"), nor a part of "2,000" ("000 + 50"); C is never a quotient with a remainder ("17 ÷ 5
// = 3 remainder 2"), a place-value count ("= 2 tens"), or a blank to fill ("is 92 ___")
const NOT_AFTER = String.raw`(?<![\d/.,^:]|\d\s|\d\s?\p{L}{1,9}\s|[+\-−×x*÷=(^]\s?|\d\s?:\s?|(?:plus|minus|times|into|aur|of|ka|ki|ke)\s)`;
const NOT_PART = String.raw`(?![\d/\p{L}²³^%:…]|[.,]\d|\.\.)(?!\s*\d+\s*(?:\/|by)\s*\d)(?!\s+\d)(?!\s*(?:[+\-−×x*÷?_):%²³^]|followed|zeros?|shunya|(?:more|less|than|times|kam|zyada|jyada|guna|se|remainder|rem|r|shesh|baaki|bachta|bacha|left|with|ones?|tens?|hundreds?|thousands?|lakhs?|dahai|ikai|sau|hazaar|paaya|paya|mila|likha|bola|kaha|socha)(?![\p{L}])))`;
// a claim someone ELSE made, or a question about one, is not hers: "Says 37 + 2 = 57", "Bholu says 14 − 6 = 12. Check his
// answer.", "Writes 3 − 5 = 2", "kya 7 + 5 = 13 hai?" (an error to find is a teaching move, never a slip)
const REPORTED = /(?<![\p{L}])(?:says?|said|saying|writes?|wrote|thinks?|thought|believes?|claims?|got|gets|answered|answers|answer|calculated|calculates|worked out|hisaab|lagaaya|lagaya|nikala|nikaala|kehta|kehti|kaha|kehte|bola|boli|bolta|bolti|likha|likhta|likhti|likhe|socha|sochta|sochti|maanta|maanti|like|jaise|galti|mistake|wrong|galat|check|kya|is it|did|does|if)(?![\p{L}])[^.!?।]*$/iu;
// an error-finding move anywhere in the line ("Find the mistake", "Is that right?", "Galti dhoondo", "Kya yeh sahi hai?"),
// or the claim inside quotes, is the same: someone else's working, put up to be checked
const CHECK_MOVE = /(?:find the (?:mistake|error)|spot the (?:mistake|error)|is (?:that|this|it) (?:right|correct)|galti|kya (?:yeh|ye|woh|wo) sahi|sahi hai\s*\?|trust|bharosa|check (?:it|this|his|her))/iu;
const quotedAt = (t, i) => ((t.slice(0, i).replace(/(?<=\p{L})['’](?=\p{L})/gu, "").match(/['"“”‘’]/g) ?? []).length % 2) === 1;
const reportedAt = (t, i) => CHECK_MOVE.test(t) || quotedAt(t, i) || REPORTED.test(t.slice(Math.max(0, i - 60), i)) || /^[^.!?।]*\?/u.test(t.slice(i));
const EQN = new RegExp(String.raw`${NOT_AFTER}(${NUM})${UNIT}\s*(\+|plus|jama|(?<=\s)-(?=\s)|−|minus|×|x|\*|times|into|guna|÷|divided\s+by)\s*(${NUM})${UNIT}\s*(?:=|equals|is|hota\s+hai|hai|barabar)\s*(${NUM})${UNIT}${NOT_PART}`, "giu");
// "A ko B se multiply / guna / divide / bhaag karne par C (milta / aata / hota) hai"
const KO_SE = new RegExp(String.raw`${NOT_AFTER}(${NUM})${UNIT}\s+ko\s+(${NUM})${UNIT}\s+se\s+(multiply|guna|divide|bhaag|bhag)\s+(?:karne|karo|karke|karenge|kiya)\s*(?:par|pe|se|toh|to)?\s*(${NUM})${UNIT}${NOT_PART}`, "giu");

/** PURE. The first false arithmetic claim in her words, or null. */
export function arithmeticSlip(text) {
  const t = String(text ?? "");
  // groups: EQN a(1) ua(2) op(3) b(4) ub(5) c(6) uc(7); KO_SE a(1) ua(2) b(3) ub(4) verb(5) c(6) uc(7)
  for (const m of t.matchAll(EQN)) {
    if (reportedAt(t, m.index)) continue;
    const a = num(m[1]), b = num(m[4]), c = num(m[6]);
    const o = OPS[m[3].toLowerCase().replace(/\s+by$/, "")] ?? null;
    if (!unitsAgree(o, unitOf(m[2]), unitOf(m[5]), unitOf(m[7]))) continue;
    const v = op(a, o, b);
    if (v && c && !eq(v, c)) return { claim: m[0].trim().slice(0, 80), value: fmt(v) };
  }
  for (const m of t.matchAll(KO_SE)) {
    if (reportedAt(t, m.index)) continue;
    const a = num(m[1]), b = num(m[3]), c = num(m[6]);
    const o = /multiply|guna/i.test(m[5]) ? "*" : "/";
    if (!unitsAgree(o, unitOf(m[2]), unitOf(m[4]), unitOf(m[7]))) continue;
    const v = op(a, o, b);
    if (v && c && !eq(v, c)) return { claim: m[0].trim().slice(0, 80), value: fmt(v) };
  }
  return null;
}
const fmt = (r) => (r.d === 1 ? String(r.n) : `${r.n}/${r.d}`);

// her own closed sum at the end of the last line: "Total grams batao: 2000 + 50 = ___?", "2000 + 50 kitna hoga?"
const ASKED = new RegExp(String.raw`(${NUM})${UNIT}\s*(\+|plus|-|−|minus|×|x|\*|times|÷)\s*(${NUM})${UNIT}\s*(?:=\s*_{2,}|=\s*\?|kitna\s+(?:hoga|hai|hua)|kitne\s+(?:honge|hain)|is\s+what|equals\s+what)[^.!?।]*[?？]?\s*$`, "iu");
/**
 * PURE. Her last line ended on a closed sum of her own and the child answered with a bare number: is it right?
 * @returns {"correct"|"incorrect"|null}
 */
export function selfPosedVerdict(asked, said) {
  const m = String(asked ?? "").trim().match(ASKED);
  if (!m) return null;
  const s = String(said ?? "").trim().replace(/\s*(?:g|gm|grams?|kg|cm|m|ml|l|rs|₹|rupees?)\.?$/i, "");
  const got = num(s);
  if (!got) return null;
  // groups: a(1) ua(2) op(3) b(4) ub(5)
  if (!unitsAgree(OPS[m[3].toLowerCase()] ?? null, unitOf(m[2]), unitOf(m[5]), null)) return null;
  const v = op(num(m[1]), OPS[m[3].toLowerCase()] ?? null, num(m[4]));
  if (!v) return null;
  return eq(v, got) ? "correct" : "incorrect";
}
