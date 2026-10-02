// The protégé is held in CODE (COMPREHENSION-ENGINE.md §4.4): its misconception is frozen until a correction is
// graded caught_fixed (R-CATCH) with a reason graded present (R-EXP). The LLM only voices the character from shapes;
// it cannot "get it" sycophantically (AlgoBo). The character is openly pretend and a planted error is always resolved
// in the same exchange (honesty rule) — `mustResolve` tells the Director to close it before moving on.
import { outcomeName } from "../../learner/kt/outcomes.js";

/** @returns {{ characterId: string, skillId: string, heldMisconception: string|null, phase: 'confused'|'asked_why'|'corrected'|'returned', correctedBy?: string, mustResolve: boolean }} */
export const newProtege = ({ characterId, skillId, heldMisconception = null }) =>
  ({ characterId, skillId, heldMisconception, phase: "confused", mustResolve: !!heldMisconception });

/**
 * One graded child turn to the protégé. `catchEv` = the probe.errorspot event (R-CATCH), `reasonLabel` = the R-EXP
 * label on the child's reason ('present' | 'partial' | 'absent' | 'contradicted' | 'NA').
 */
export function protegeStep(st, { catchEv, reasonLabel, evId }) {
  if (st.phase === "corrected" || st.phase === "returned") return st;
  const caught = catchEv && outcomeName(catchEv.cls, catchEv.outcome) === "caught_fixed";
  if (caught && reasonLabel === "present") return { ...st, phase: "corrected", correctedBy: evId, mustResolve: false };
  return { ...st, phase: "asked_why", mustResolve: !!st.heldMisconception };
}

/** The teacher resolved the planted error openly (the child did not): the honesty rule is met, the belief is unchanged. */
export const teacherResolves = (st) => ({ ...st, mustResolve: false });
/** A different character "who missed the lesson" arrives days later (C34). */
export const protegeReturn = (st, characterId) => ({ ...st, characterId, phase: "returned", mustResolve: false });
