// d37 builder G (RULING-G, main's ruling after the last read before the paid run). Registered in dry-predicates.mjs after d37d; GATED
// (tests/r8-d37-054g.test.mjs pins it on made rows, both sides).
//   plainNoUnhelped  RULING-G item 2: a plain no ("nahi", "nahi samjha", "no" …) said to a comprehension check-in — her turn before ends on
//                    one of the check-in forms (brain/say.js BEAT_ASK, WORKED_ASK: "Yahan tak theek hai?", "Ab tak samajh aaya?", …) —
//                    answered by a turn with no help (no `help` or `key` seam, no simpler/whyAlt part: d37 RULING-G item 13), or at a
//                    bridge's check-in by help that does not end on that check-in: the plain no is "I did not understand", as "samajh
//                    nahi aaya" is there. Only a stop (a goodbye) and a safety turn are excepted; and the second no running, after her help ended on the check-in again, which goes on (the
//                    ruling: "at a bridge: the bridge's easier wording once, then the same check-in; a second goes on") on the go-on line
//                    (afterKeyGoOn) or the "nothing easier" line (helpSpent). close/dry1: stuck c5-ch02-t01 62, stuck c5-ch02-t03 56, stuck c4-ch01-t02 62, stuck c6-ch06-t01 60,
//                   steering c6-ch07-t03 48, steering c4-ch05-t01 18.
import { BEAT_ASK, WORKED_ASK } from "../../server/brain/say.js";

const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const CHECKINS = new Set([...BEAT_ASK.hinglish, ...BEAT_ASK.english, ...WORKED_ASK.hinglish, ...WORKED_ASK.english].map((x) => norm(x).toLowerCase()));
/** The check-in her turn ends on (its last sentence, one of the forms), or null. */
export const endsOnCheckin = (t) => { const last = norm(t).split(/(?<=[.!?])\s+/).at(-1) ?? ""; return CHECKINS.has(last.toLowerCase()) ? last : null; };
/** A plain no, said alone (the child's line as said). d37 RULING-G item 13 (pr7 step 3): the check's OWN list, written out here and not
 *  imported from the walk (state.js PLAIN_NO), so that a gap in one does not pass both — the no words, "… samjha" and its forms, and a no
 *  with an address word. Never "nai" (ambiguous). */
const NO_WORDS = ["nahi", "nahin", "nhi", "no", "nope", "na"];
const NO_SAMJHA = ["nahi", "nahin", "nhi"].flatMap((n) => ["samjha", "samjhi", "samjhe", "samajh aaya"].map((v) => `${n} ${v}`));
const NO_ADDRESS = ["didi", "ma'am", "maam", "mam", "miss", "teacher"];
const PLAIN_NOS = new Set([...NO_WORDS, ...NO_SAMJHA].flatMap((n) => [n, ...NO_ADDRESS.map((a) => `${n} ${a}`)]));
const noKey = (t) => norm(t).toLowerCase().replace(/[.!,]+/g, " ").replace(/\s+/g, " ").trim();
export const isPlainNo = (t) => PLAIN_NOS.has(noKey(t));
/** Help at a FIRST no: a `help` seam or a told key, or a simpler / whyAlt part (never `alt`, the card's other wording, nor `helpSpent`). */
const HELP_SEAMS = new Set(["help", "key"]);
const HELP_PARTS = new Set(["simpler", "whyAlt"]);
/** The ruling excepts only a stop or a safety turn (not a wrap, not a break). */
const ENDS = (r) => ["safeguard", "goodbye"].includes(String(r?.move ?? "")) || (r?.seams ?? []).some((x) => ["goodbye", "stopLine", "tiredBye", "safety"].includes(x.right));
/** A bridge turn of hers (its seam or its part). */
const bridgeTurn = (r) => (r?.seams ?? []).some((x) => x.right === "bridge") || (r?.pageParts ?? []).some((p) => p.part === "bridge");

export const D37G_PREDICATES = {
  plainNoUnhelped(L, r, i) {
    if (r.who !== "teacher" || i < 2) return null;
    const kid = L.rows?.[i - 1], her = L.rows?.[i - 2];
    if (kid?.who !== "child" || her?.who !== "teacher" || !isPlainNo(kid.text)) return null;
    const ck = endsOnCheckin(her.text);
    if (!ck || ENDS(r)) return null;
    // (the second no running: her turn before was help given to a plain no at that same check-in — the child's line before it a plain no, her
    // turn before that ending on a check-in (the check-in said again takes another of its forms: the walk's fresh-form rule) — and this turn
    // goes on, on the go-on line or the "nothing easier" line)
    const kid0 = L.rows?.[i - 3], her0 = L.rows?.[i - 4];
    const second = (her.seams ?? []).some((x) => x.right === "help") && kid0?.who === "child" && isPlainNo(kid0.text) && her0?.who === "teacher" && !!endsOnCheckin(her0.text) && !!ck
      && (r.seams ?? []).some((x) => ["afterKeyGoOn", "helpSpent"].includes(x.right));
    if (second) return null;
    const why = (w) => `"${norm(kid.text)}" to "${ck}" answered with ${w} (${(r.seams ?? []).map((x) => x.right).join(" > ")})`;
    const helped = (r.seams ?? []).some((x) => HELP_SEAMS.has(x.right)) || (r.pageParts ?? []).some((p) => HELP_PARTS.has(p.part));
    if (!helped) return why("no help");
    // (at a bridge's check-in: the bridge's easier wording, then the same check-in — in another of its forms, by the fresh-form rule)
    if (bridgeTurn(her) && !endsOnCheckin(r.text)) return why("help that does not end on the check-in again");
    return null;
  },
};
