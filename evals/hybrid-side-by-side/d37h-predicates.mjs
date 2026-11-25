// d37 builder H (RULING-H item 15, main's ruling after the second whole read). Registered in dry-predicates.mjs after d37g; GATED
// (tests/r8-d37-054h.test.mjs pins it on made rows, both sides).
//   tryFirstNotAlone  a reply to a try-first ("mujhe khud try karne do", "ruko, main khud karti hoon", "pehle main try karun?" …) that says
//                     anything after the go-ahead ("Haan, pehle tum try karo."): the child asked to be left to try, and is told to go ahead
//                     and nothing more — never a short ask, an invitation, the question or help after it. Her turn before does not matter.
//                     A reply that is no go-ahead at all (help, the key) is flagged too; a safety turn or a goodbye is not read.
//                     g/dry2: 21 rows; a/dry0: 6 rows (the six older ones).
// The check's OWN lists, written out here and not imported from the walk (server/conversation/methods.js try_first, brain/say.js
// TRY_FIRST), so that a gap in one does not pass both.
const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
/** What a try-first is: the child asking to try it alone first (as said; Roman Hindi, Hinglish or English). */
const TRY_FIRST_SAID = [
  /(?<![\p{L}])(?:mujhe|muje|mujhko)\s+(?:khud|pehle)\s+(?:try|kar(?:ne|na))\s+(?:karne\s+)?do(?![\p{L}])/iu,
  /(?<![\p{L}])khud\s+try\s+kar(?:ne\s+do|ungi|unga|ti\s+hoon|ta\s+hoon|ke\s+dekh(?:ti|ta|ungi|unga))(?![\p{L}])/iu,
  /(?<![\p{L}])main\s+khud\s+(?:kar(?:ti|ta)\s+hoon|kar(?:ungi|unga|lungi|lunga)|try\s+kar(?:ti|ta|ungi|unga))(?![\p{L}])/iu,
  /(?<![\p{L}])pehle\s+main\s+(?:try|khud)\s*(?:kar(?:un|oon|ungi|unga|ti\s+hoon|ta\s+hoon))?(?![\p{L}])/iu,
  /(?<![\p{L}])try\s+karne\s+do(?![\p{L}])/iu,
  /(?<![\p{L}])(?:let\s+me\s+try|i\s+want\s+to\s+try|i(?:'ll|\s+will)\s+try\s+(?:it\s+)?(?:myself|first)|can\s+i\s+try\s+(?:it\s+)?(?:first|myself))(?![\p{L}])/iu,
];
export const isTryFirst = (t) => TRY_FIRST_SAID.some((re) => re.test(norm(t)));
/** The go-ahead line, each form with its own end (a full stop, or the old dash). */
const GO_AHEAD = ["Haan, pehle tum try karo", "Theek hai, khud karke dekho", "Bilkul, pehle tumhari koshish", "Sure, you try first", "Okay, have a go yourself",
  "Go ahead, your try first"];
/** The go-ahead a text starts with and what follows it: { goAhead, rest } | null. */
export function goAheadOf(t) {
  const s = norm(t), l = s.toLowerCase();
  for (const g of GO_AHEAD) {
    if (!l.startsWith(g.toLowerCase())) continue;
    const rest = s.slice(g.length).replace(/^\s*[.!—–-]\s*/, "").trim();
    return { goAhead: g, rest };
  }
  return null;
}
const ENDS = (r) => ["safeguard", "goodbye"].includes(String(r?.move ?? "")) || (r?.seams ?? []).some((x) => ["goodbye", "stopLine", "tiredBye", "safety"].includes(x.right));

/** RULING-H item 15's one reading change: a turn that is exactly the go-ahead answering a try-first is not "a turn with no question" for a gated
 *  check that would otherwise demand a question or an invitation of it (named where it is read: endsOnQuestion, stepTryFirst). */
export const goAheadAloneAt = (L, r, i) => r?.who === "teacher" && i > 0 && L.rows?.[i - 1]?.who === "child" && isTryFirst(L.rows[i - 1].text) && goAheadOf(r.text)?.rest === "";

export const D37H_PREDICATES = {
  tryFirstNotAlone(L, r, i) {
    if (r.who !== "teacher" || i < 1) return null;
    const kid = L.rows?.[i - 1];
    if (kid?.who !== "child" || !isTryFirst(kid.text) || ENDS(r)) return null;
    const g = goAheadOf(r.text);
    if (!g) return `"${norm(kid.text)}" answered with no go-ahead: "${norm(r.text).slice(0, 80)}"`;
    return g.rest ? `"${norm(kid.text)}" answered with the go-ahead and more: "${g.rest.slice(0, 80)}"` : null;
  },
};
