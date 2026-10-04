// The safety-register predicate (HUMAN-VOICE §5.10, B0; HV-3). A predicate, not an instruction: when it is true the
// delivery layer is bypassed (calm 0.3, slow, 300 ms between sentences, no filler, no non-verbal, no marker but [calm],
// helpline digits read one by one by spoken.js). True when:
//   - the Brain says so (moment.safety: a safeguard move, a distress classification, an incident), or
//   - the reply carries a helpline number (Childline 1098, Tele-MANAS 14416: floor.js HELPLINES), or
//   - the reply answers an identity question (she says she is an AI: the never-deny-AI answer is said plainly).
import { HELPLINES } from "../../compiler/floor.js";

const NUMS = HELPLINES.map((h) => String(h.number));
const IDENTITY = /\b(?:i am an ai|i'm an ai|main (?:ek )?ai hoon|main ek computer program|an ai teacher|ai teacher hoon|मैं (?:एक )?ai हूँ)\b/i;

/** @param {{ safety?: boolean } | null} moment @param {string} reply */
export function safetyRegister(moment, reply) {
  if (moment?.safety) return true;
  const t = String(reply ?? "");
  const digits = t.replace(/[\s-]/g, "");
  if (NUMS.some((n) => digits.includes(n))) return true;
  return IDENTITY.test(t);
}
