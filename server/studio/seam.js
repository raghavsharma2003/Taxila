// The Studio seam into the live lesson (BUILD-PLAN §4, W2 seam commit). OWNED BY W2-H; call sites owned by W2-E.
//
// server/routes/lesson.js is a hot file (W2-E owns it, and BR1 moves the turn to server/brain/turn.js keeping these
// call sites). Studio reaches the lesson ONLY through these three functions. Contract, binding on the owner:
//   - never throw into the lesson (catch inside; a Studio failure is a fallback rung, never a lesson error);
//   - prefetch is fire-and-forget AFTER the lesson row landed: it never delays the start response;
//   - statusFacts is synchronous and in-memory (no network, no DB): it sits on the turn's critical path, ≤ 1 ms;
//   - the reply may refer only to what statusFacts reports as revealed / in use (`onScreen`), never to a build in
//     flight (LIVE-STUDIO §4.3, screenHasTargets);
//   - nothing here ever carries the child id to a model (LIVE-STUDIO §5.4); `child` is for budgets and bond rules.
//
// Until W2-H fills it every function is a no-op: prefetch does nothing, statusFacts returns null (the turn is
// byte-identical to the pre-seam turn), onReveal does nothing.

/**
 * @typedef {{
 *   lessonId: string, child: { id: string, class_level: number, language_pref?: string },
 *   topicId: string, kit: object, band: string, mode: "voice" | "cascade" | "text",
 *   purpose: "lesson" | "practice" | "doubt",
 *   skillIds: string[], activeMisconceptionIds: string[],
 *   reteach: unknown | null,
 *   bond: import("../../shared/relational").BondSnapshot | null,
 * }} StudioLessonCtx
 */

export const studioSeam = {
  /**
   * Lesson-start prefetch (W2 rule for intents, BUILD-PLAN W2-H): the plan's skills, the kit's diagnostic
   * misconceptions for them and this child's open re-teach rows → library lookups and live builds with 3-6 min lead.
   * At bond stage `meeting` (bond.stage) and under "Only ready-made ones", only promoted builds (TEACHER-BRAIN §6.3).
   * @param {StudioLessonCtx} _ctx
   * @returns {Promise<void> | void}
   */
  prefetch(_ctx) {},

  /**
   * The Studio state of this lesson for the turn's facts row, read from memory.
   * @param {string} _lessonId
   * @returns {import("../../shared/studio").StudioTurnView | null} null = nothing on screen or in flight (no change)
   */
  statusFacts(_lessonId) { return null; },

  /**
   * The turn revealed (or retired) a piece: record the mount, push the SSE status. Called AFTER the turn committed.
   * @param {{ lessonId: string, childId: string, turn: number, studio: import("../../shared/brain").TurnStudio }} _ev
   * @returns {Promise<void> | void}
   */
  onReveal(_ev) {},
};

