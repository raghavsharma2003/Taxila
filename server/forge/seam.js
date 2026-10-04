// The Forge seam into the live lesson (BUILD-PLAN §2, W1 seam commit). OWNED BY W1-B.
//
// server/routes/lesson.js is a hot file (W1-A owns it); Forge reaches the lesson ONLY through these functions, whose
// call sites the W0 seam commit placed. Every function is a no-op until W1-B fills it, so the seam commit changed no
// behaviour. Contract for the filler:
//   - never throw into the lesson (catch inside; a Forge failure is a miss, never a lesson error);
//   - never block the start response: prefetchLessonFills is called fire-and-forget AFTER the lesson row landed;
//   - never trust a frame's `correct` (grading stays on the server, against the verified key).

/**
 * @typedef {{ id: string, class_level: number, language_pref?: string }} SeamChild
 */

export const forgeSeam = {
  /**
   * A hosted woven sub-step (comprehension/weave.js onTopicPlanned → hosted[0]) goes to the item generator: a kit
   * isomorph or a Forge ModuleRequest with want.subSkill. Until one exists the entry stays hosted and expires into a
   * C31 callback (the pre-seam behaviour, unchanged). Called synchronously in POST /api/lesson/start; return value
   * is ignored.
   * @param {object | null} _hosted  the weave entry, or null when nothing was hosted
   * @returns {void}
   */
  wovenSubStep: (_hosted) => undefined,

  /**
   * Warm the Forge G1 fills this lesson is likely to need (W1-B #5). Called once per started lesson, after the
   * lesson's transaction committed, NOT awaited. The returned promise (if any) is caught by the caller.
   * @param {{ child: SeamChild, lessonId: string, topicId: string, kit: object, lang: string, band: string, mode: string }} _args
   * @returns {Promise<void> | void}
   */
  prefetchLessonFills: (_args) => undefined,
};
