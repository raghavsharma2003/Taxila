// The safety-register predicate (HUMAN-VOICE §5.10, B0; HV-3). A predicate, not an instruction: when it is true the
// delivery layer is bypassed (calm 0.3, slow, 300 ms between sentences, no filler, no non-verbal, no marker but [calm],
// helpline digits read one by one by spoken.js). True when:
//   - the Brain says so (moment.safety: a safeguard move, a distress classification, an incident), or
//   - the reply carries a helpline number (Childline 1098, Tele-MANAS 14416: floor.js HELPLINES), or
//   - the reply answers an identity question ("not a person / insaan nahi": the never-deny-AI ANSWER is said plainly).
//     A self-introduction that merely names her an AI teacher (the first-meeting greeting) is not one: the first live
//     run flattened a greeting into the safety register on "AI teacher" alone (w2g-identity-predicate-narrowed).
import { HELPLINES } from "../../compiler/floor.js";

const NUMS = HELPLINES.map((h) => String(h.number));
const IDENTITY = /(?:\bnot a (?:real )?(?:person|human)\b|\b(?:insaan|insan|human|person|real teacher) nahi(?:n)?\b|इंसान नहीं|\bcomputer program hoon\b)/i;

/** @param {{ safety?: boolean } | null} moment @param {string} reply */
export function safetyRegister(moment, reply) {
  if (moment?.safety) return true;
  const t = String(reply ?? "");
  const digits = t.replace(/[\s-]/g, "");
  if (NUMS.some((n) => digits.includes(n))) return true;
  return IDENTITY.test(t);
}
