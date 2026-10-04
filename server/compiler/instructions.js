// A lesson state → its compiled instructions: the one place both routes (start, turn, realtime token) and the
// tests build compile()'s input, so the voice lane's branches can never again be left out of one caller.
import { compile, BudgetError } from "./compile.js";
import { characterForState } from "./characters/index.js";
import { getTopic } from "../content/curriculum.js";
import { describe, branchesFor, skipItem } from "../director/state.js";
import { briefViewFor } from "../learner/briefView.js";

/**
 * One compile() for both lanes. The voice lane also gets the branches for the reply now being answered
 * (director/state.js branchesFor): its appended-last check is what the realtime model does on that reply,
 * and without them the check fell back to "nothing new; a short warm close" on every voice turn.
 */
export function instructionsFor(state, kit, lane = state.mode === "voice" || !state.mode ? "voice" : "text") {
  const input = {
    // the pinned character under its pinned name (child-names-teacher)
    // the CHILD-BRIEF v2 view (learner/briefView.js, W2-C #1), built from the state so every lane and the realtime
    // token compile the same brief
    character: characterForState(state), brief: state.brief, briefView: briefViewFor(state, kit) ?? undefined, lessonState: state, move: state.lastMove,
    ...describe(state, kit), ...(lane === "voice" ? { branches: branchesFor(state, kit) } : {}),
    topic: getTopic(state.topicId), language: state.ctx.lang, lane,
  };
  try {
    return compile(input);
  } catch (e) {
    // A voice turn with no question on the table whose branches do not fit the appended-last section: compile it with
    // the plain close-out check instead (no item to skip, so a throw here would be a lesson 500). The director's next
    // step still decides; only the realtime model's pre-loaded "if they say X" note is lost for that one reply.
    if (!(e instanceof BudgetError) || lane !== "voice" || !input.branches || input.lessonState?.lastMove?.itemId) throw e;
    console.warn(`[lesson] voice branches over the budget on a ${input.move?.kind} turn; compiled without them (${e.message.slice(0, 80)})`);
    return compile({ ...input, branches: null });
  }
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
