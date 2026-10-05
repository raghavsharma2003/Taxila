// The safety-register predicate (HUMAN-VOICE §5.10, B0; HV-3). A predicate, not an instruction: when it is true the
// delivery layer is bypassed (calm 0.3, slow, 300 ms between sentences, no filler, no non-verbal, no marker but [calm],
// helpline digits read one by one by spoken.js). True when:
//   - the Brain says so (moment.safety: a safeguard move, a distress classification, an incident), or
//   - the reply carries a helpline number (Childline 1098, Tele-MANAS 14416: floor.js HELPLINES), or
//   - the reply answers an identity question ("not a person / insaan nahi": the never-deny-AI ANSWER is said plainly).
//     A self-introduction that merely names her an AI teacher (the first-meeting greeting) is not one: the first live
//     run flattened a greeting into the safety register on "AI teacher" alone (w2g-identity-predicate-narrowed).
import { HELPLINES } from "../../compiler/floor.js";
import { mentionsHelpline } from "../spoken.js";

const NUMS = HELPLINES.map((h) => String(h.number));
const IDENTITY = /(?:\bnot a (?:real )?(?:person|human)\b|\b(?:insaan|insan|human|person|real teacher) nahi(?:n)?\b|इंसान नहीं|\bcomputer program hoon\b)/i;
// The plain positive answer ("Haan, main AI hoon.", "I'm an AI.", "मैं AI हूँ") is the never-deny-AI answer too (fixer
// 2026-10-05, w2g-identity-positive-forms); "main AI teacher hoon" (the greeting) stays out.
const NOT_ROLE = "(?!\\s+(?:teacher|tutor|didi|bhaiya|wali|wala)\\b)";
const IDENTITY_YES = new RegExp([
  `\\b(?:haan|han|ha|yes|ji)[,!. ]+main (?:ek )?AI\\b${NOT_ROLE}`,
  `\\bmain (?:ek )?AI hoon\\b`,
  `\\bI(?:'m| am) (?:an |just an )?AI\\b${NOT_ROLE}`,
  "मैं (?:एक )?(?:AI|एआई) (?:हूँ|हूं)",
].join("|"), "i");

/** @param {{ safety?: boolean } | null} moment @param {string} reply */
export function safetyRegister(moment, reply) {
  if (moment?.safety) return true;
  const t = String(reply ?? "");
  const digits = t.replace(/[\s\-–]/g, ""); // not "." : the decimal 10.98 is maths, not Childline
  if (NUMS.some((n) => digits.includes(n)) || mentionsHelpline(t)) return true; // mentionsHelpline: 1.0.9.8 and friends
  return IDENTITY.test(t) || IDENTITY_YES.test(t);
}
