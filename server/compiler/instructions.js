// A lesson state → its compiled instructions: the one place both routes (start, turn, realtime token) and the
// tests build compile()'s input, so the voice lane's branches can never again be left out of one caller.
import { compile, BudgetError } from "./compile.js";
import { CHARACTERS } from "./characters/index.js";
import { getTopic } from "../content/curriculum.js";
import { describe, branchesFor, skipItem } from "../director/state.js";

/**
 * One compile() for both lanes. The voice lane also gets the branches for the reply now being answered
 * (director/state.js branchesFor): its appended-last check is what the realtime model does on that reply,
 * and without them the check fell back to "nothing new; a short warm close" on every voice turn.
 */
export function instructionsFor(state, kit, lane = state.mode === "text" ? "text" : "voice") {
  return compile({
    character: CHARACTERS[state.ctx.teacherId], brief: state.brief, lessonState: state, move: state.lastMove,
    ...describe(state, kit), ...(lane === "voice" ? { branches: branchesFor(state, kit) } : {}),
    topic: getTopic(state.topicId), language: state.ctx.lang, lane,
  });
}

/**
 * Instructions for a director step. A question whose pinned text cannot be compiled (BudgetError) is
 * skipped once (state.js skipItem) and the next step is compiled instead, so a content defect costs one
 * question rather than a 500 in the middle of a child's lesson. A second failure throws.
 * @param {ReturnType<typeof import("../director/state.js").step>} r  the step (its state complete for compile)
 * @returns {{ r: typeof r, instructions: string, skipped?: string }}
 */
export function instructionsAfter(r, kit, now) {
  try {
    return { r, instructions: instructionsFor(r.state, kit) };
  } catch (e) {
    const itemId = r.move?.itemId;
    const next = e instanceof BudgetError && itemId ? skipItem(r.state, kit, itemId, now) : null;
    if (!next) throw e;
    console.warn(`[lesson] item ${itemId} does not fit the prompt budget; skipped (${e.message})`);
    return { r: next, instructions: instructionsFor(next.state, kit), skipped: itemId };
  }
}
