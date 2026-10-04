// The Director's move as a kernel proposal (BUILD-PLAN W2-C #8; TEACHER-BRAIN TB1/TB5, §10; shared/brain.ts Proposal).
// step() returns this BESIDE its move: nothing reads it until W2-E's kernel.arbitrate (BR1) consumes it, and it never
// enters the lesson state, so replay stays byte-equal (tests/w2c-director.test.mjs pins it). Pure.
//
// Authority (TB5): a safeguard move is the safety floor (source "safety", mandatory: no proposal outranks it); the child's
// own stop is RELEASE (mandatory: nobody holds a child at goodbye); everything else is Director pedagogy, which ranks
// below teacher-owned repair and above comprehension probes, rapport, vibe and Studio novelty.

/** Authority ranks (lower outranks), TEACHER-BRAIN §10.1. Only the ranks the Director's moves can carry. */
export const AUTHORITY = Object.freeze({ safety: 0, release: 1, plan: 6, repair: 7, director: 8, comprehension: 9 });
/** Priority = 100 − 10 × rank (+ urgency 0-9): higher wins inside the kernel's sort. */
const priorityOf = (rank, urgency = 0) => 100 - 10 * rank + Math.max(0, Math.min(9, urgency));

const PROBE_WEIGHT_OF = { probe: 1, practice: 1, retrieval: 1, teachback: 1.5 };

/**
 * @param {{ kind: string, itemId?: string, skillId?: string, probe?: string, hintLevel?: number }} move
 * @param {{ stopping?: boolean, ui?: any, guidance?: { level?: string, reason?: string } | null, purpose?: string, testWeight?: number }} [o]
 * @returns {import("../../shared/brain").Proposal}
 */
export function directorProposal(move, o = {}) {
  const kind = move?.kind ?? "repair";
  const safety = kind === "safeguard";
  const release = kind === "wrap" && !!o.stopping;
  const repair = kind === "repair";
  const comprehension = kind === "probe";
  const source = safety ? "safety" : comprehension ? "comprehension" : "director";
  const rank = safety ? AUTHORITY.safety : release ? AUTHORITY.release : repair ? AUTHORITY.repair : comprehension ? AUTHORITY.comprehension : AUTHORITY.director;
  const reason = [`move.${kind}`];
  if (o.guidance?.level && ["hook", "explain", "worked_example", "practice"].includes(kind)) reason.push(`guidance.${o.guidance.level}`);
  if (o.purpose && o.purpose !== "lesson") reason.push(`purpose.${o.purpose}`);
  if (move?.hintLevel) reason.push(`ladder.rung${move.hintLevel}`);
  // attention: one new thing on screen (TEACHER-BRAIN §10 budget): choices, an activity or a new board
  const attention = o.ui?.chips?.length || o.ui?.tray === "module" || o.ui?.tray === "studio" ? 1 : 0;
  return {
    source, kind: "move",
    payload: { move: { ...move }, ...(o.ui?.ask?.itemId ? { askItemId: o.ui.ask.itemId } : {}) },
    priority: priorityOf(rank, safety ? 9 : release ? 9 : 0),
    costs: { latencyMs: 0, attention, testWeight: o.testWeight ?? PROBE_WEIGHT_OF[kind] ?? 0, novelty: 0, usd: 0 },
    ...(safety || release ? { mandatory: true } : {}),
    reason,
  };
}
