// The comprehension engine's per-lesson session seam (BUILD-PLAN §2, W1 seam commit). OWNED BY W1-C.
//
// server/routes/lesson.js is a hot file (W1-A owns it); the comprehension engine reaches the lesson ONLY through
// these two functions, whose call sites the W0 seam commit placed. Both are no-ops until W1-C fills them, so the seam
// commit changed no behaviour.

/**
 * @typedef {{
 *   attempts?: { skillId: string, armId: string, repClass?: string, representationId?: string, outcome: string, at: string }[],
 *   repFluency?: Record<string, number>,
 *   posteriors?: Record<string, { a: number, b: number }>,
 * }} ReteachCtx   the selectReteach inputs read from the child's record (comprehension/reteach.js §5.3)
 *
 * @typedef {{ reteach: ReteachCtx | null }} SessionContext
 */

/** The empty context: what the caller uses when this seam returns nothing or throws. */
export const EMPTY_SESSION_CONTEXT = Object.freeze({ reteach: null });

/**
 * Read what this child's record says the lesson must know at start (W1-C #5: reteach_attempts, rep_fluency,
 * arm_posteriors). Called once in POST /api/lesson/start, in parallel with the learner fold. A non-null `reteach` is
 * pinned into the lesson state as `state.ctx.reteach` and reaches selectReteach as attempts / repFluency /
 * posteriors (director/state.js engineReteach). Keep it small: it is stored in the lesson row's state JSON.
 * The caller catches a rejection and uses EMPTY_SESSION_CONTEXT.
 * @param {string} _childId
 * @param {{ skillIds?: string[], now?: number }} [_opts]
 * @returns {Promise<SessionContext>}
 */
export async function loadSessionContext(_childId, _opts = {}) {
  return EMPTY_SESSION_CONTEXT;
}

/**
 * Wait, at most `maxMs`, for the blind verdicts of last turn's held events (W1-C #2, held-verdict settle). Called in
 * POST /api/lesson/turn just before the carried events are read (carriedFrom → settledGrade), with the held event
 * ids. Resolves when every id has settled or the time is up; never rejects (the caller also catches). After it
 * resolves the caller reads verdicts with comprehension/later.js settledGrade, so a filler that settles verdicts
 * from the DB must make them visible there.
 * @param {string[]} _eventIds  empty when nothing is held (resolve at once)
 * @param {number} [_maxMs]
 * @returns {Promise<void>}
 */
export async function awaitSettled(_eventIds, _maxMs = 600) {}
