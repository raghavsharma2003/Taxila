// dc-r8-director26 (docs/patches/to-brain/040): the predicates written for director26's faults. Each was run over the director26 rows
// the judges named for it and reads non-zero there (tests/r8-director26-predicates.test.mjs) before it is gated at 0 on the dry matrix.
// Merged into dry-predicates.mjs's PREDICATES. Pure.
import { FALLBACK } from "../../server/brain/say.js";
import { toAap } from "../../server/director/register.js";
import { sentencesOf, normSentence } from "../../server/director/help.js";

const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const formsOf = (fs) => (fs ?? []).flatMap((f) => [f?.hi, f?.en, typeof f === "string" ? f : null]).filter(Boolean);

/** B2: the lesson's stop menu is the authored line and nothing else: the script's `joints.checkinStop`, else code's checkinStop. */
function stopLines(script) {
  const own = formsOf(script?.joints?.checkinStop);
  const code = [FALLBACK.hinglish.checkinStop, FALLBACK.english.checkinStop, toAap(FALLBACK.hinglish.checkinStop)];
  return new Set([...own, ...code, ...own.map((x) => toAap(x))].map((x) => normSentence(norm(x))));
}
export const D26_PREDICATES = {
  /** B2 (c4 stuck 68; c5-t01 stuck 74; c6 stuck 72, steering 50): a child who says she wants to stop gets the authored stop line —
   *  never a menu the model wrote (buttons named, the teacher's gender wrong). */
  stopAuthored(L, r, i, ctx) {
    if (!ctx.script || String(r.cell?.column ?? "") !== "stop" || String(r.move?.kind ?? r.move ?? "") !== "break") return null;
    return stopLines(ctx.script).has(normSentence(norm(r.text))) ? null : `the stop turn is not the authored line: "${norm(r.text).slice(0, 70)}"`;
  },
};
