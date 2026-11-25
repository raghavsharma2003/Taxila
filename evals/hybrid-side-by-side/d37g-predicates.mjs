// d37 builder G (RULING-G, main's ruling after the last read before the paid run). Registered in dry-predicates.mjs after d37d; GATED
// (tests/r8-d37-054g.test.mjs pins it on made rows, both sides).
//   plainNoUnhelped  RULING-G item 2: a plain no ("nahi", "nahi samjha", "no" …) said to a comprehension check-in — her turn before ends on
//                    one of the check-in forms (brain/say.js BEAT_ASK, WORKED_ASK: "Yahan tak theek hai?", "Ab tak samajh aaya?", …) —
//                    answered by a turn with no help (no `help`, `helpSpent` or `key` seam, no help wording on the page): the plain no is
//                    "I did not understand", as "samajh nahi aaya" is there. A stop, a goodbye, a wrap or a break and a safety turn are
//                    excepted, as built; and the second no running, after her help ended on the check-in again, which goes on (the
//                    ruling: "at a bridge: the bridge's easier wording once, then the same check-in; a second goes on") on the go-on line
//                    (afterKeyGoOn) or the "nothing easier" line (helpSpent). close/dry1: stuck c5-ch02-t01 62, stuck c5-ch02-t03 56, stuck c4-ch01-t02 62, stuck c6-ch06-t01 60,
//                   steering c6-ch07-t03 48, steering c4-ch05-t01 18.
import { BEAT_ASK, WORKED_ASK } from "../../server/brain/say.js";

const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const CHECKINS = new Set([...BEAT_ASK.hinglish, ...BEAT_ASK.english, ...WORKED_ASK.hinglish, ...WORKED_ASK.english].map((x) => norm(x).toLowerCase()));
/** The check-in her turn ends on (its last sentence, one of the forms), or null. */
export const endsOnCheckin = (t) => { const last = norm(t).split(/(?<=[.!?])\s+/).at(-1) ?? ""; return CHECKINS.has(last.toLowerCase()) ? last : null; };
/** A plain no, said alone (the child's line as said). */
export const PLAIN_NO_LINE = /^(?:nahi|nahin|nahi\s+(?:samjha|samjhi|samjhe|samajh\s+aaya)|no|nope|na)[\s.!,]*$/iu;
const HELP_SEAMS = new Set(["help", "helpSpent", "key"]);
const HELP_PARTS = new Set(["simpler", "whyAlt", "alt"]);
const ENDS = (r) => ["wrap", "break", "safeguard", "goodbye"].includes(String(r?.move ?? "")) || (r?.seams ?? []).some((x) => ["goodbye", "stopLine", "wrapAsk", "tiredBye", "safety"].includes(x.right));

export const D37G_PREDICATES = {
  plainNoUnhelped(L, r, i) {
    if (r.who !== "teacher" || i < 2) return null;
    const kid = L.rows?.[i - 1], her = L.rows?.[i - 2];
    if (kid?.who !== "child" || her?.who !== "teacher" || !PLAIN_NO_LINE.test(norm(kid.text))) return null;
    const ck = endsOnCheckin(her.text);
    if (!ck || ENDS(r)) return null;
    const helped = (r.seams ?? []).some((x) => HELP_SEAMS.has(x.right)) || (r.pageParts ?? []).some((p) => HELP_PARTS.has(p.part));
    const second = (her.seams ?? []).some((x) => x.right === "help") && (r.seams ?? []).some((x) => ["afterKeyGoOn", "helpSpent"].includes(x.right));
    if (second) return null;
    return helped ? null : `"${norm(kid.text)}" to "${ck}" answered with no help (${(r.seams ?? []).map((x) => x.right).join(" > ")})`;
  },
};
