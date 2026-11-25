// to-brain 054 B (docs/patches/to-brain/054-director36-the-turns-shape-walk-only.md, B.5; main's ruling on question 3): a wait says the
// question. Registered in dry-predicates.mjs after d37a; both gated (tests/r8-d37-054b.test.mjs pins each on made rows).
//   waitNoQuestion      three of her turns at one question after a try-first or a bare yes (the wait: her turns whose child line was
//                       "Haan, pehle tum try karo."'s cue or a bare yes — cell column try_first or yes — at the question her turn before
//                       was at), none of the three saying the question (any form the script writes for it) or help. A side-topic's turn in
//                       the wait is passed over: it neither restarts nor advances the wait (052 B4). director36 c4 steady 28 to 48.
//   waitSecondNotReask  the wait's second turn does not end on the question's own `reask`.
// And B.4's re-pins, by name, for exactly the turns main's ruling on question 3 names (read as before everywhere else):
//   questionThreeRunning  (049 B4, d34c's reading) the wait's re-ask is no turn of a run: the run counts from the turn after it
//   stepToldEarly         (d30, gated) the cap's turn at a wait — a step told on the fifth hearing after a try-first or a bare yes — is allowed
// And main's second ruling on cause B (round d37, RULING-B2), by name:
//   cardWholeAfterTryOrYes  (053 B2, gated) still flags any full form of the question on the wait's first turn (her turn before said the
//                       question itself) and the card or step said whole as first written on ANY wait turn; from the wait's second turn on
//                       (her turn before was the short ask, the invitation, or an earlier turn of this same wait) the question's `reask`
//                       alone and a help turn ending on the question are allowed
import { atQuestionOf, endsOnYourTurn, endsOnAnswerFirst, reaskOf, closingQuestion, questionObjectAt } from "../../server/director/question-run.js";
import { asideTurn, helpTurn } from "./d34b-predicates.mjs";
import { D34C_PREDICATES } from "./d34c-predicates.mjs";
import { D30_PREDICATES } from "./d30-predicates.mjs";
import { D35A_PREDICATES } from "./d35a-predicates.mjs";

const low = (t) => String(t ?? "").replace(/\s+/g, " ").trim().toLowerCase();
const SLOT = "zzslotzz";
const qKey = (t) => low(String(t ?? "").replace(/\{\w+\}/g, ` ${SLOT} `)).replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
const sentencesOf = (t) => String(t ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?।])\s+/).filter(Boolean);
/** A wait turn's cue: the child's line before it read try-first or a bare yes. */
const waitCue = (r) => ["try_first", "yes"].includes(String(r?.cell?.column ?? ""));
/** Seams that end a question: its key or its told step (the cap, or help spent). */
const ENDS = new Set(["key", "workedStep"]);
const seamsOf = (r) => (r?.seams ?? []).map((x) => x.right);
const prevTeacher = (L, i) => { for (let j = i - 1; j >= 0; j--) if (L.rows[j].who === "teacher") return j; return -1; };
/** Whether a teacher text stands for a question without saying it (a short ask, an invitation, a pointed invitation). */
const standsFor = (script, t) => atQuestionOf(script, t) === "?short" || endsOnYourTurn(script, t) || endsOnAnswerFirst(script, t);

/** The wait whose turns end at row i: { P, turns } — P the question's path (the last her turns said before the wait), turns the wait's
 *  teacher rows in order (side-topic turns passed over) — or null where row i is no wait turn. */
export function waitAt(L, i, script) {
  const r = L.rows[i];
  if (!script || r?.who !== "teacher" || !waitCue(r)) return null;
  const turns = [i];
  let j = prevTeacher(L, i);
  for (; j >= 0; j = prevTeacher(L, j)) {
    const y = L.rows[j];
    if (waitCue(y) && !seamsOf(y).some((k) => ENDS.has(k))) { turns.unshift(j); continue; }
    if (asideTurn(y) && !waitCue(y)) continue;
    break;
  }
  // (the question: the last her turns said at or before the turn before the wait — a short ask or an invitation stands for it)
  let P = null;
  for (let k = j; k >= 0; k = prevTeacher(L, k)) {
    const t = L.rows[k].text, a = atQuestionOf(script, t);
    if (a && a !== "?short") { P = a; break; }
    if (!(standsFor(script, t) || asideTurn(L.rows[k]))) break;
  }
  if (!P) return null;
  // (a wait turn at another question ends the wait before it: the wait is at one question)
  let from = 0;
  turns.forEach((n, m) => { const a = atQuestionOf(script, L.rows[n].text); if (a && a !== "?short" && a !== P) from = m + 1; });
  const at = turns.slice(from);
  return at.length && at.at(-1) === i ? { P, turns: at } : null;
}
/** Whether row i is the wait's re-ask: the wait's second turn, ending on the question's own `reask`. */
const waitReaskAt = (L, i, ctx) => { const w = waitAt(L, i, ctx?.script); return !!w && w.turns.length === 2 && D37B_PREDICATES.waitSecondNotReask(L, L.rows[i], i, ctx) === null; };
/** Whether a text ends on the question's own `reask` (its closing question, {slots} matching any words). */
function endsOnReask(script, P, text, lang = "hinglish") {
  const reask = reaskOf(script, P, lang);
  if (!reask) return false;
  const want = qKey(closingQuestion(reask) ?? sentencesOf(reask).at(-1) ?? "");
  const got = qKey(closingQuestion(text) ?? sentencesOf(text).at(-1) ?? "");
  const re = new RegExp(`^${want.split(SLOT).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\p{L}\\p{N}/ ]+?")}$`, "u");
  return !!want && re.test(got);
}
/** Whether a text says the card or step whole as first written: every sentence of the question's `prompt` (hi or en), in order, where the
 *  prompt is more than its closing question (a one-sentence prompt is the question itself: a help turn may end on it). */
function saysWholeAsWritten(script, P, text) {
  const pr = questionObjectAt(script, P)?.prompt;
  const T = qKey(text);
  return [pr?.hi, pr?.en, typeof pr === "string" ? pr : null].filter((x) => typeof x === "string" && x.trim()).some((f) => {
    const s = sentencesOf(f).map(qKey).filter(Boolean);
    if (s.length < 2) return false;
    const re = new RegExp(s.map((k) => k.split(SLOT).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\p{L}\\p{N}/ ]+?")).join(" (?:.* )?"), "u");
    return re.test(T);
  });
}
/** Whether a teacher row says the question (any form the script writes for it) or help. */
const saysOrHelps = (script, r, P) => atQuestionOf(script, r.text) === P || helpTurn(r);

export const D37B_PREDICATES = {
  /** B.5: three of her turns at one question after a try-first or a bare yes, none saying the question or help. Gated. */
  waitNoQuestion(L, r, i, ctx) {
    const w = waitAt(L, i, ctx?.script);
    if (!w || w.turns.length < 3) return null;
    const last3 = w.turns.slice(-3);
    return last3.some((n) => saysOrHelps(ctx.script, L.rows[n], w.P)) ? null
      : `three turns of a wait at ${w.P} (rows ${last3.join(", ")}) and none says the question or help`;
  },
  /** B.5: the wait's second turn ends on the question's own `reask`. Gated. */
  waitSecondNotReask(L, r, i, ctx) {
    const w = waitAt(L, i, ctx?.script);
    if (!w || w.turns.length !== 2) return null;
    const lang = ctx?.lang === "english" ? "english" : "hinglish";
    if (!reaskOf(ctx.script, w.P, lang)) return null;
    return endsOnReask(ctx.script, w.P, r.text, lang) ? null : `the wait's second turn at ${w.P} does not end on its reask: "${sentencesOf(r.text).at(-1) ?? ""}"`;
  },
  /** B.4 (main's ruling on question 3): 049 B4's count with the wait's re-ask exempt — the re-ask overrides the third-turn invitation, so it
   *  is no turn of a run: a run that holds it is counted from the turn after it. Gated, as d34c's. */
  questionThreeRunning(L, r, i, ctx) {
    const was = D34C_PREDICATES.questionThreeRunning(L, r, i, ctx);
    if (!was) return was;
    const m = /ends (\d+) of her turns running/.exec(was);
    const n = m ? Number(m[1]) : 3;
    const her = [];
    for (let j = i; j >= 0 && her.length < n; j--) if (L.rows[j].who === "teacher") her.push(j);
    const k = her.findIndex((j) => waitReaskAt(L, j, ctx));
    return k < 0 || k >= 3 ? was : null;
  },
  /** B.4 (main's ruling on question 3): d30's stepToldEarly, with the cap's turn at a wait allowed — the step told on its fifth hearing (the
   *  record's heardCap) after a try-first or a bare yes. Gated, as d30's. */
  stepToldEarly(L, r, i, ctx) {
    if (r.who === "teacher" && r.heardCap && waitCue(r) && r.stepAnswer?.told) return null;
    return D30_PREDICATES.stepToldEarly(L, r, i, ctx);
  },
  /** Main's second ruling on cause B, item 1 (053 B2 re-pinned by name): the first wait turn (her turn before said the question itself) says
   *  no full form of the question, and no wait turn says the card or step whole as first written; from the wait's second turn on (her turn
   *  before was the short ask, the invitation, or an earlier turn of this same wait) the question's `reask` alone and a help turn ending on
   *  the question are allowed. Gated, as d35a's. */
  cardWholeAfterTryOrYes(L, r, i, ctx) {
    const was = D35A_PREDICATES.cardWholeAfterTryOrYes(L, r, i, ctx);
    if (!was) return was;
    const script = ctx.script, P = atQuestionOf(script, r.text);
    if (saysWholeAsWritten(script, P, r.text)) return was;
    const w = waitAt(L, i, script);
    const second = standsFor(script, ctx.prevT?.text) || (!!w && w.P === P && w.turns.length >= 2);
    if (!second) return was;
    return helpTurn(r) || endsOnReask(script, P, r.text, ctx?.lang === "english" ? "english" : "hinglish") ? null : was;
  },
};
