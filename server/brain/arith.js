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
const UNIT = String.raw`(?:\s*(?:g|gm|grams?|kg|kilograms?|cm|mm|m|km|ml|l|litres?|liters?|rs|₹|rupees?|paise|minutes?|min|hours?|°c|degrees?))?`;
const OPS = { "+": "+", plus: "+", jama: "+", "-": "-", "−": "-", minus: "-", "×": "*", x: "*", "*": "*", times: "*", into: "*", guna: "*", "÷": "/", divided: "/" };
// "A + B = C", "A × B = C", "A plus B is C", "A times B equals C"
const EQN = new RegExp(String.raw`(${NUM})${UNIT}\s*(\+|plus|jama|-|−|minus|×|x|\*|times|into|guna|÷|divided\s+by)\s*(${NUM})${UNIT}\s*(?:=|equals|is|hota\s+hai|hai|barabar)\s*(${NUM})${UNIT}(?![\d/])`, "giu");
// "A ko B se multiply / guna / divide / bhaag karne par C (milta / aata / hota) hai"
const KO_SE = new RegExp(String.raw`(${NUM})${UNIT}\s+ko\s+(${NUM})${UNIT}\s+se\s+(multiply|guna|divide|bhaag|bhag)\s+(?:karne|karo|karke|karenge|kiya)\s*(?:par|pe|se|toh|to)?\s*(${NUM})${UNIT}`, "giu");

/** PURE. The first false arithmetic claim in her words, or null. */
export function arithmeticSlip(text) {
  const t = String(text ?? "");
  for (const m of t.matchAll(EQN)) {
    const a = num(m[1]), b = num(m[3]), c = num(m[4]);
    const o = OPS[m[2].toLowerCase().replace(/\s+by$/, "")] ?? null;
    const v = op(a, o, b);
    if (v && c && !eq(v, c)) return { claim: m[0].trim().slice(0, 80), value: fmt(v) };
  }
  for (const m of t.matchAll(KO_SE)) {
    const a = num(m[1]), b = num(m[2]), c = num(m[4]);
    const o = /multiply|guna/i.test(m[3]) ? "*" : "/";
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
  const v = op(num(m[1]), OPS[m[2].toLowerCase()] ?? null, num(m[3]));
  if (!v) return null;
  return eq(v, got) ? "correct" : "incorrect";
}
