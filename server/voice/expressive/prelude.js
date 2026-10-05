// The uptake prelude's screen (TEACHER-BRAIN §5.4 L3; fixer 2026-10-05, w2g-prelude-token-closed-class). The prelude
// says the child's own word back in the teacher's voice BEFORE the reply, and it never passes the reply guard. So a
// token is spoken only when it is from a closed class AND clean:
//   - closed class: a number of 1-4 digits (optionally a simple decimal or fraction: 3.5, 3/4), a spoken number word
//     (signals/text.js NUMBER_WORDS: "baarah", "twelve", "बारह"), a term from the spoken lexicon, or a word of the
//     caller's answer vocabulary (the active item's accepted answers / kit terms, when the caller has them);
//   - clean: no never-rule hit (director/safety.js neverRuleHits) and no direct identifier (containsPii: phone, email,
//     …), and never the child's or a guardian's name.
// A profanity, an insult, a name or the digits of a phone number the child volunteers is therefore never echoed.
// Pure; flag-off with the prelude itself (TAXILA_UPTAKE_PRELUDE=1, HV-16).
import { isNumberToken, norm } from "../../signals/text.js";
import { TERMS } from "../spoken-lexicon.js";
import { neverRuleHits, containsPii } from "../../director/safety.js";

const NUMERIC = /^\d{1,4}(?:[./]\d{1,4})?$/;

/**
 * @param {string} token
 * @param {{ names?: string[], vocab?: string[] }} [o] names: the child's and guardians' names; vocab: closed answer words
 * @returns {boolean}
 */
export function preludeTokenOk(token, { names = [], vocab = [] } = {}) {
  const t = String(token ?? "").trim();
  if (!t || t.length > 24) return false;
  const n = norm(t);
  const closed = /\d/.test(t) ? NUMERIC.test(t) : isNumberToken(n) || Object.hasOwn(TERMS, t) || vocab.some((v) => norm(v) === n);
  if (!closed) return false;
  if (names.some((x) => String(x ?? "").trim().length >= 2 && norm(String(x).trim()) === n)) return false;
  if (containsPii(t, { names: names.filter(Boolean) })) return false;
  if (neverRuleHits(t).length) return false;
  return true;
}
