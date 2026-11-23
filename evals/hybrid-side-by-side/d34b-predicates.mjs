// to-brain 051 C4 to C6 (docs/patches/to-brain/051-director33-screen-stays-answer-boards-named-miss-cap.md, decision dc-r8-director33): the
// predicates Brain B adds, each pinned on its director33 rows (tests/r8-director33-051b.test.mjs, replayed with that run's own script snapshot)
// before it reads the dry matrix.
//   questionThreeRunning  C4 (widens d32's): a question ends three of her turns running by what the child hears — the card, its reask, its
//                         hindi form, a short ask, a picture turn, an aside reply that returns to it; a request to hear it or a Hindi request
//                         is no exemption. The third ends on the invitation; a turn that parks an aside or replies to one, or has no help in
//                         it, ends on the question (and counts)
//   yourTurnNotThird      C4 (widens d32's): the invitation only where her two turns before were at one question by that count
//   inviteAfterPark       C4: the invitation in a turn that parks an aside or replies to one
//   inviteNoHelp          C4: the invitation in a turn with no help in it
//   shortAskNoAnswer      C4: a short ask in a turn whose help did not follow an answer (a clarify, a give-up, a request with no answer)
//   hindiNoFormNoLine     C5: a language request at a card with no `hindi` form, at a script with `joints.easierWords`, and none of its forms
//                         said
import { atQuestionOf, endsOnYourTurn, endsOnShortAsk, runOfTwo } from "../../server/director/question-run.js";

const low = (t) => String(t ?? "").replace(/\s+/g, " ").trim().toLowerCase();
const qKey = (t) => low(t).replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
/** Seam kinds that are help: a hint or another wording, a picture's caption, a remediation, the noPicture or nothing-easier line, a Hindi
 *  form said for a language request (the switch line before it). */
const HELP_SEAMS = new Set(["help", "caption", "remediation", "simpler", "noPicture", "helpSpent", "hindiSwitch", "easierWords"]);
/** Seam kinds of a turn that parks an aside or replies to one. */
const ASIDE_SEAMS = new Set(["park", "aiQuestion", "aiReply", "asideReply", "return"]);
const seamsOf = (r) => (r?.seams ?? []).map((x) => x.right);
/** Whether a teacher row parks an aside or replies to one (its seams, or the walk's column). */
export const asideTurn = (r) => seamsOf(r).some((k) => ASIDE_SEAMS.has(k)) || ["aside", "aside_reply"].includes(String(r?.cell?.column ?? ""));
/** Whether a teacher row has help in it. */
export const helpTurn = (r) => seamsOf(r).some((k) => HELP_SEAMS.has(k)) || String(r?.cell?.column ?? "") === "picture";
/** Whether a teacher row ends on the invitation (joints.yourTurn), by its words or its seam. */
const invites = (script, r) => endsOnYourTurn(script, r?.text) || seamsOf(r).at(-1) === "yourTurn";
/** The question a teacher row is at by C4's count: its path, "?short" for a short ask (the pending question's), or null. */
const atOf = (script, r) => (invites(script, r) ? null : atQuestionOf(script, r?.text));
/** The run of her turns at one question ending at row i (C4's count): { n, path } — an invitation or a turn at no question ends it. */
export function runAt(L, i, script) {
  const a = atOf(script, L.rows[i]);
  if (!a) return { n: 0, path: null };
  let path = a === "?short" ? null : a, n = 1;
  for (let j = i - 1; j >= 0; j--) {
    const y = L.rows[j];
    if (y.who !== "teacher") continue;
    const b = atOf(script, y);
    if (!b) break;
    if (b !== "?short") { if (path && b !== path) break; path = b; }
    n++;
  }
  return { n, path };
}
/** The child's row before a teacher row. */
const childBefore = (L, i) => { for (let j = i - 1; j >= 0; j--) if (L.rows[j].who === "child") return L.rows[j]; return null; };
/** Whether the child's row reads an answer (right or wrong). */
const ANSWER_READS = /^(?:correct|incorrect|misconception|partial|right|wrong)/;
const answered = (c) => !!c && (["right", "miss", "partial"].includes(String(c.intent ?? "")) || ANSWER_READS.test(String(c.read ?? "")));

export const D34B_PREDICATES = {
  /** to-brain 051 C4: a question ends at most two of her turns running by what the child hears (the wider count: d32's read only the forms
   *  ending "?" and let a Hindi turn and a request to hear it out). director33: c6 stuck 66; c4-ch01 steady 8, 10; c5-t01 offtopic 26, 28,
   *  stuck 38, 50; c5-t03 offtopic 26, 28, stuck 8; c4 offtopic 34, steering 10, 12, stuck 18; c4-ch06 stuck 8, 18, 42, offtopic 44;
   *  c5-t02 stuck 48; c6-ch07-t03 stuck 74. Gated. */
  questionThreeRunning(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx?.script) return null;
    // (the turns that rightly end on the question: one that parks an aside or replies to one, one with no help in it — they count)
    if (asideTurn(r) || !helpTurn(r)) return null;
    const { n, path } = runAt(L, i, ctx.script);
    return n >= 3 ? `the question ${path ?? "(a short ask)"} ends ${n} of her turns running` : null;
  },
  /** to-brain 051 C4: the invitation only on a turn whose two turns before were at one question by the wider count. Gated. */
  yourTurnNotThird(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx?.script || !invites(ctx.script, r)) return null;
    const two = [];
    for (let j = i - 1; j >= 0 && two.length < 2; j--) if (L.rows[j].who === "teacher") two.unshift(L.rows[j]);
    return two.length === 2 && runOfTwo(ctx.script, two.map((x) => (invites(ctx.script, x) ? "" : x.text))) ? null
      : "a turn ends on the invitation (joints.yourTurn) where her two turns before did not end on one question";
  },
  /** to-brain 051 C4: the invitation is never said in a turn that parks an aside or replies to one (director33 c5-t02 offtopic 18; c6
   *  offtopic 18; c4-ch01 offtopic 14). Gated. */
  inviteAfterPark(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx?.script || !invites(ctx.script, r)) return null;
    return asideTurn(r) ? `the invitation in a turn that ${seamsOf(r).includes("park") ? "parks an aside" : "replies to an aside"}` : null;
  },
  /** to-brain 051 C4: the invitation is never said in a turn with no help in it (director33 c4-ch01 steady 30). Gated. */
  inviteNoHelp(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx?.script || !invites(ctx.script, r) || asideTurn(r)) return null;
    return helpTurn(r) ? null : `the invitation in a turn with no help in it (${seamsOf(r).join(", ")})`;
  },
  /** to-brain 051 C4: a short ask ("Ab phir se socho, jawab kya hoga?") only after help that followed an answer — after a clarify or a give-up
   *  with no answer, the question itself (director33 c5-t01 offtopic 24). Gated. */
  shortAskNoAnswer(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx?.script || !endsOnShortAsk(ctx.script, r.text)) return null;
    const c = childBefore(L, i);
    return answered(c) ? null : `a short ask after "${String(c?.text ?? "").slice(0, 30)}" (${String(c?.intent ?? c?.read ?? "?")}), no answer`;
  },
  /** to-brain 051 C5: a language request at a card with no `hindi` form opens with one form of the script's `joints.easierWords` — read only
   *  where the script has them (none does yet: 0). Gated. */
  hindiNoFormNoLine(L, r, i, ctx) {
    const forms = (ctx?.script?.joints?.easierWords ?? []).flatMap((f) => [f?.hi ?? (typeof f === "string" ? f : null), f?.en]).filter(Boolean).map(qKey);
    if (r.who !== "teacher" || !forms.length) return null;
    const c = childBefore(L, i);
    if (String(c?.intent ?? "") !== "hindi" && String(r.cell?.column ?? "") !== "hindi") return null;
    if (seamsOf(r).includes("hindiSwitch")) return null;
    const t = qKey(r.text);
    return forms.some((f) => f && t.includes(f)) ? null : "a language request at a card with no Hindi form, and no easierWords line";
  },
};
