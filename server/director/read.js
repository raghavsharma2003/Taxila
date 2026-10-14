// Covert comprehension, per turn (round 5, stream 4A; owner 2026-10-14: "the understood-or-not concept, the human part").
// ONE read of a child's turn: understood | partly | not, the misconception it shows (if any), and why. It is computed
// from what the turn already decided — the classifier's outcome against the VERIFIED key (classify.js; a model never
// grades: its labels are mapped onto the key in code) and the turn's own words — and it is what the Director acts on
// (state.js: re-explain a different way on `not`, a light check on a claimed `partly`, move on on `understood`).
//
//   understood  the key (or a two-rater "complete" form of it), any language
//   partly      a two-rater "partial" form, the right answer for a wrong reason, or a claim of understanding with no
//               evidence ("haan haan samajh gaya", "ok"): never accepted as understood — it gets a light check
//   not         a wrong answer (with the misconception it shows, when one does), "pata nahi", silence or an empty turn
//   null        the turn is not about understanding (a request, a question of their own, off-topic chat)
//
// Evaluated against blind labels built from verified keys and predicates: evals/comprehension-r5 (README there). PURE.
import { bareAck } from "../conversation/lexicon.js";
import { childAsks } from "./say.js";

/** "I understood" claims, beyond the bare acks lexicon.js knows (Roman and Devanagari). */
const CLAIM = /^(?:(?:haan|ha+n|ji|ok(?:ay)?|achha|accha|acha|theek|thik|yes|yeah|hmm+|हाँ|हां|जी|ठीक|अच्छा)[\s,!.]*)*(?:(?:haan|ha+n|ji|yes)?\s*)?(?:samajh|samjh|samaj|smajh|समझ)\s*(?:gaya|gayi|gyi|gya|aa\s*gaya|aaya|aya|liya|li|गया|गई|गयी|आया|आ\s*गया|लिया)(?:\s+(?:hai|hoon|hu|main|मैं|है|हूँ))?[\s,!.]*(?:(?:haan|ha+n|ji|yes|sir|ma'?am|didi|हाँ|हां|जी)[\s,!.]*)*$|^(?:(?:yes|yeah|ok(?:ay)?|haan)[\s,!.]*)?(?:i\s+)?(?:got\s+it|understood|understand|get\s+it|makes\s+sense)(?:\s+(?:it|now|ma'?am|sir|didi))?[\s!.]*$/iu;
/** "pata nahi" / "I don't know", both scripts. */
const DONT_KNOW = /^(?:(?:mujhe|mereko|mere\s+ko|मुझे|मेरे\s+को)\s+)?(?:pata\s+nahi|pta\s+nhi|pata\s+nahin|nahi\s+pata|malum\s+nahi|maloom\s+nahi|nahi\s+aata|i\s+(?:don'?t|do\s+not)\s+know|no\s+idea|पता\s+नहीं|नहीं\s+पता|मालूम\s+नहीं|नहीं\s+आता)(?:\s+(?:hai|yaar|didi|sir|है|यार))?[\s!.?]*$/iu;

/** An explicit "I understood" ("haan haan samajh gaya", "got it"), not a bare yes/ok. */
export const claimsToUnderstand = (text) => CLAIM.test(String(text ?? "").trim());
/** Is this turn only a claim of understanding (or a bare yes/ok) — no evidence either way? */
export const claimsUnderstanding = (text) => {
  const t = String(text ?? "").trim();
  return !!t && (CLAIM.test(t) || bareAck(t));
};

/**
 * @param {{ outcome?: string, misconceptionId?: string, reasonMisconceptionId?: string, request?: unknown, flags?: { dontKnow?: boolean, offTopic?: boolean } } | null} cls
 * @param {{ childText?: string, target?: { mode?: string } | null }} o
 * @returns {{ read: "understood" | "partly" | "not" | null, misconceptionId?: string, basis: string }}
 */
export function comprehensionRead(cls, { childText = "", target = null } = {}) {
  const t = String(childText ?? "").trim();
  if (!t) return { read: "not", basis: "silence" };
  const o = cls?.outcome ?? "no_evidence";
  if (o === "correct") return cls?.reasonMisconceptionId ? { read: "partly", misconceptionId: cls.reasonMisconceptionId, basis: "right_answer_wrong_reason" } : { read: "understood", basis: "key" };
  if (o === "partial") return { read: "partly", basis: "partial_key" };
  if (o === "misconception") return { read: "not", ...(cls?.misconceptionId ? { misconceptionId: cls.misconceptionId } : {}), basis: "misconception" };
  if (o === "incorrect") return { read: "not", ...(cls?.misconceptionId ? { misconceptionId: cls.misconceptionId } : {}), basis: "wrong" };
  // no evidence: what the words themselves say
  if (cls?.flags?.dontKnow || DONT_KNOW.test(t)) return { read: "not", basis: "dont_know" };
  if (claimsUnderstanding(t)) return { read: "partly", basis: "claim_unverified" };
  if (cls?.request || childAsks(t)) return { read: null, basis: cls?.request ? "request" : "own_question" };
  // off-topic words in answer to a question on the table are an answer that misses (another item's key, an unrelated
  // fact): not understood. Off-topic chat with no question asked is not about understanding.
  if (cls?.flags?.offTopic) return target?.mode === "item" ? { read: "not", basis: "off_answer" } : { read: null, basis: "off_topic" };
  return { read: "not", basis: "no_evidence" };
}
