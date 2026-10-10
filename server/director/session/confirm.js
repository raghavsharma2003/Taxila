// The GRADED CONFIRM probe (TUTOR-MODEL §2.2 t ≈ 5 s, §2.3 point 4-5): "show me one thing ma'am did", which confirms the
// mapping, places the child inside the chapter and grades a warm-up item, all in one turn. The item is a VERIFIED kit item of
// the skill the child's words point at; the reply is graded in code against its key (classify.js classifyFast, the existing
// exact / numeric / option path). When code cannot decide, the caller runs the existing classify() closed-label read against
// the same target (a model classifies against the verified key; it never grades on its own opinion). PURE.

import { classifyFast } from "../classify.js";
import { tokens } from "../../lesson/purpose.js";

/** Item kinds that make a fair "show me what your teacher did" (a recall or a first practice, never a why or a teach-back). */
const CONFIRM_KINDS = ["retrieval", "practice", "translate_rep", "near_transfer", "predict"];

/** The kit skill the child's words point at (title overlap), else the first skill in teaching order. */
export function skillFor(kit, text) {
  const skills = kit?.skills ?? [];
  if (!skills.length) return null;
  const q = new Set(tokens(text).filter((w) => w.length >= 3));
  let best = null, bestScore = 0;
  for (const s of skills) {
    const score = tokens(s.title).filter((w) => q.has(w)).length;
    if (score > bestScore) { best = s; bestScore = score; }
  }
  return best ?? skills[0];
}

/**
 * PURE. The confirm item for a topic's kit: the easiest verified recall / practice item of the skill the child named (else
 * of the first skill), never one the child has already done today. null when the kit has none.
 */
export function confirmItem(kit, { text = "", skillId = null, doneIds = [] } = {}) {
  const items = (kit?.items ?? []).filter((i) => i && i.answer != null && String(i.answer).trim() && CONFIRM_KINDS.includes(i.kind)
    && i.verified?.agrees !== false && !doneIds.includes(i.id) && !i.diagnostic);
  if (!items.length) return null;
  const skill = skillId ? kit.skills.find((s) => s.id === skillId) : skillFor(kit, text);
  const order = (i) => CONFIRM_KINDS.indexOf(i.kind) * 10 + (i.difficulty ?? 2);
  const pool = items.filter((i) => i.skillId === skill?.id);
  return [...(pool.length ? pool : items)].sort((a, b) => order(a) - order(b) || (a.id < b.id ? -1 : 1))[0] ?? null;
}

/** A "no, not that one" to the mapping (never an answer): she asks which one instead of grading. */
const REJECT = /^(?:(?:nahi|nahin|nhi|no|nope|na)[\s,!.]+)?(?:(?:woh|wo|ye|yeh|that|this)\s+(?:nahi|nahin|nhi|not)|(?:nahi|nahin|nhi|no)[\s,]+(?:woh|wo|ye|yeh)?\s*(?:nahi|nahin)?\s*(?:tha|thi|padhaya|kiya)|not\s+that(?:\s+one)?|wrong\s+(?:topic|chapter|one)|dusra\s+(?:tha|wala|chapter|topic)|kuch\s+aur\s+(?:tha|padhaya))[\s.!?]*$|^(?:nahi|nahin|nhi|no|nope)[\s.!?]*$/i;
export const rejectsMapping = (text) => REJECT.test(String(text ?? "").toLowerCase().trim());

/**
 * PURE. The child's reply to the confirm probe, graded against the item's verified key in code.
 * @returns {{ outcome: "correct"|"incorrect"|"partial"|"no_evidence"|null, needsModel: boolean, target: object, safety: boolean, rejected: boolean }}
 *   outcome null + needsModel: the caller runs classify() with `target` (closed label against the key).
 */
export function gradeConfirm(item, text) {
  const target = { mode: "item", item, key: item.answer, also: item.acceptable ?? [], ideas: [], misconceptions: [], options: item.options };
  if (rejectsMapping(text)) return { outcome: "no_evidence", needsModel: false, target, safety: false, rejected: true };
  const fast = classifyFast({ target, childText: text, typed: true });
  const safety = !!fast.flags?.distress;
  if (safety) return { outcome: "no_evidence", needsModel: false, target, safety, rejected: false };
  if (fast.result?.outcome) {
    const o = fast.result.outcome;
    return { outcome: o === "correct" ? "correct" : o === "partial" ? "partial" : o === "no_evidence" ? "no_evidence" : "incorrect", needsModel: false, target, safety, rejected: false };
  }
  return { outcome: null, needsModel: true, target, safety, rejected: false };
}
